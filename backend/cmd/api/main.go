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

	"github.com/axiora/backend/internal/auth"
	"github.com/axiora/backend/internal/audit"
	"github.com/axiora/backend/internal/config"
	"github.com/axiora/backend/internal/database"
	"github.com/axiora/backend/internal/module"
	"github.com/axiora/backend/internal/organization"
	"github.com/axiora/backend/internal/rbac"
	"github.com/axiora/backend/middleware"
	"github.com/axiora/backend/modules/accounting"
	"github.com/axiora/backend/modules/analytics"
	"github.com/axiora/backend/modules/billing"
	crmmod "github.com/axiora/backend/modules/crm"
	"github.com/axiora/backend/modules/hr"
	"github.com/axiora/backend/modules/inventory"
	"github.com/axiora/backend/modules/marches"
	"github.com/axiora/backend/modules/nomenclature"
	"github.com/axiora/backend/modules/procurement"
	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
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
	authHandler := auth.NewHandler(authSvc)
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
	nomenclatureHandler := nomenclature.NewHandler(db)
	analyticsHandler := analytics.NewHandler(db)

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
	nomenclature.RegisterRoutes(v1.Group("/nomenclature", requireAuth, requireOrg, requirePerm("procurement.read")), nomenclatureHandler)

	// ── Start ─────────────────────────────────────────────
	srv := &http.Server{
		Addr:    fmt.Sprintf(":%s", cfg.Port),
		Handler: r,
	}

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Printf("✓ Axiora API listening on :%s [%s]", cfg.Port, cfg.AppEnv)
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
