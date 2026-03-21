package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
	"github.com/stratt/backend/internal/audit"
	"github.com/stratt/backend/internal/auth"
	"github.com/stratt/backend/internal/config"
	"github.com/stratt/backend/internal/database"
	"github.com/stratt/backend/internal/module"
	"github.com/stratt/backend/internal/organization"
	"github.com/stratt/backend/internal/rbac"
	"github.com/stratt/backend/middleware"
	"github.com/stratt/backend/modules/accounting"
	"github.com/stratt/backend/modules/analytics"
	"github.com/stratt/backend/modules/billing"
	"github.com/stratt/backend/modules/boamp"
	"github.com/stratt/backend/modules/chatbot"
	crmmod "github.com/stratt/backend/modules/crm"
	"github.com/stratt/backend/modules/decp"
	"github.com/stratt/backend/modules/hr"
	"github.com/stratt/backend/modules/inventory"
	"github.com/stratt/backend/modules/marches"
	"github.com/stratt/backend/modules/nomenclature"
	"github.com/stratt/backend/modules/procurement"
	"github.com/stratt/backend/modules/share"
	"github.com/stratt/backend/modules/sirene"
)

func main() {
	// ── Config ────────────────────────────────────────────
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config error: %v", err)
	}

	// ── Database ──────────────────────────────────────────
	db, err := database.Connect(cfg.DatabaseURL, cfg.IsProduction())
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}

	if err := database.AutoMigrate(db); err != nil {
		log.Fatalf("migration failed: %v", err)
	}

	_, err = database.ConnectRedis(cfg.RedisURL)
	if err != nil {
		log.Printf("⚠ Redis connection failed (jobs disabled): %v", err)
	}

	// ── Services ──────────────────────────────────────────
	authRepo := auth.NewRepository(db)
	authSvc := auth.NewService(authRepo, cfg)

	orgRepo := organization.NewRepository(db)
	orgSvc := organization.NewService(orgRepo)

	rbacRepo := rbac.NewRepository(db)
	rbacSvc := rbac.NewService(rbacRepo)

	auditSvc := audit.NewService(db)
	_ = auditSvc

	// ── Handlers ──────────────────────────────────────────
	authHandler := auth.NewHandler(authSvc, cfg)
	orgHandler := organization.NewHandler(orgSvc)
	rbacHandler := rbac.NewHandler(rbacSvc)
	moduleHandler := module.NewHandler(db)

	crmHandler := crmmod.NewHandler(crmmod.NewRepository(db))
	accountingHandler := accounting.NewHandler(db)
	billingHandler := billing.NewHandler(db)
	inventoryHandler := inventory.NewHandler(db)
	hrHandler := hr.NewHandler(db)
	procurementHandler := procurement.NewHandler(db)
	marchesHandler := marches.NewHandler(db)
	decpHandler := decp.NewHandler(db)
	boampHandler := boamp.NewHandler(db)
	nomenclatureHandler := nomenclature.NewHandler(db)
	analyticsHandler := analytics.NewHandler(db)
	sireneHandler := sirene.NewHandler(db, cfg.InseeToken)
	chatbotHandler := chatbot.NewHandler(db, cfg.AnthropicKey)
	shareHandler := share.NewHandler(db, cfg)

	// ── Middleware factories ───────────────────────────────
	requireAuth := middleware.RequireAuth(authSvc)
	requireOrg := middleware.RequireOrganization(orgSvc)
	requirePerm := func(perm string) gin.HandlerFunc {
		return middleware.RequirePermission(rbacSvc, perm)
	}

	// ── Gin app ───────────────────────────────────────────
	if cfg.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(gin.Logger())
	r.Use(gzip.Gzip(gzip.DefaultCompression))
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{cfg.FrontendURL},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Authorization", "X-Organization-Id"},
		AllowCredentials: true,
	}))

	// ── Health ────────────────────────────────────────────
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": cfg.AppName})
	})

	// ── API v1 ────────────────────────────────────────────
	v1 := r.Group("/api/v1")

	// Auth (public)
	authGroup := v1.Group("/auth")
	authGroup.POST("/signup", authHandler.Signup)
	authGroup.POST("/login", authHandler.Login)
	authGroup.POST("/refresh", authHandler.Refresh)
	authGroup.POST("/logout", requireAuth, authHandler.Logout)
	authGroup.GET("/me", requireAuth, authHandler.Me)

	// Organizations
	orgGroup := v1.Group("/organizations", requireAuth)
	orgGroup.GET("", orgHandler.List)
	orgGroup.POST("", orgHandler.Create)
	orgGroup.GET("/:id", orgHandler.Get)
	orgGroup.GET("/:id/members", orgHandler.ListMembers)
	orgGroup.GET("/:id/my-role", orgHandler.GetMyRole)
	orgGroup.DELETE("/:id/members/:userId", requireOrg, requirePerm("admin.manage"), orgHandler.RemoveMember)

	// Roles & Permissions (org-scoped)
	roleGroup := v1.Group("/roles", requireAuth, requireOrg)
	roleGroup.GET("", rbacHandler.ListRoles)
	roleGroup.POST("", requirePerm("admin.manage"), rbacHandler.CreateRole)
	roleGroup.PUT("/:id", requirePerm("admin.manage"), rbacHandler.UpdateRole)
	roleGroup.DELETE("/:id", requirePerm("admin.manage"), rbacHandler.DeleteRole)
	roleGroup.POST("/:id/permissions", requirePerm("admin.manage"), rbacHandler.AssignPermission)

	v1.GET("/permissions", requireAuth, requireOrg, rbacHandler.ListPermissions)
	v1.POST("/users/:id/roles", requireAuth, requireOrg, requirePerm("admin.manage"), rbacHandler.AssignRoleToUser)

	// Modules
	modGroup := v1.Group("/modules", requireAuth, requireOrg)
	modGroup.GET("", moduleHandler.List)
	modGroup.POST("/:id/enable", requirePerm("admin.manage"), moduleHandler.Enable)
	modGroup.POST("/:id/disable", requirePerm("admin.manage"), moduleHandler.Disable)

	// ── ERP Modules ───────────────────────────────────────
	crmmod.RegisterRoutes(v1.Group("/crm", requireAuth, requireOrg, requirePerm("crm.read")), crmHandler)
	accounting.RegisterRoutes(v1.Group("/accounting", requireAuth, requireOrg, requirePerm("accounting.read")), accountingHandler)
	billing.RegisterRoutes(v1.Group("/billing", requireAuth, requireOrg, requirePerm("billing.read")), billingHandler)
	inventory.RegisterRoutes(v1.Group("/inventory", requireAuth, requireOrg, requirePerm("inventory.read")), inventoryHandler)
	hr.RegisterRoutes(v1.Group("/hr", requireAuth, requireOrg, requirePerm("hr.read")), hrHandler)
	procurement.RegisterRoutes(v1.Group("/procurement", requireAuth, requireOrg, requirePerm("procurement.read")), procurementHandler)
	analytics.RegisterRoutes(v1.Group("/analytics", requireAuth, requireOrg, requirePerm("analytics.read")), analyticsHandler)
	marches.RegisterRoutes(v1.Group("/marches", requireAuth, requireOrg, requirePerm("procurement.read")), marchesHandler)
	decp.RegisterRoutes(v1.Group("/decp", requireAuth, requireOrg, requirePerm("procurement.read")), decpHandler)
	boamp.RegisterRoutes(v1.Group("/boamp", requireAuth, requireOrg, requirePerm("procurement.read")), boampHandler)
	nomenclature.RegisterRoutes(v1.Group("/nomenclature", requireAuth, requireOrg, requirePerm("procurement.read")), nomenclatureHandler)
	sirene.RegisterRoutes(v1.Group("/sirene", requireAuth, requireOrg, requirePerm("procurement.read")), sireneHandler)
	chatbot.RegisterRoutes(v1.Group("/chatbot", requireAuth, requireOrg, requirePerm("procurement.read")), chatbotHandler)

	// Share links (authenticated creation, public consumption)
	share.RegisterRoutes(v1.Group("/share", requireAuth, requireOrg), shareHandler)

	// ── Public routes (no auth) ────────────────────────────
	public := r.Group("/api/public")
	chatbot.RegisterPublicRoutes(public.Group("/chatbot"), chatbotHandler)
	share.RegisterPublicRoutes(public.Group("/share"), shareHandler)

	// ── Start ─────────────────────────────────────────────
	srv := &http.Server{
		Addr:    fmt.Sprintf(":%s", cfg.Port),
		Handler: r,
	}

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Printf("✓ STRATT API listening on :%s [%s]", cfg.Port, cfg.AppEnv)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	<-quit
	log.Println("Shutting down...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = srv.Shutdown(ctx)
}
