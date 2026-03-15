package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

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
	"github.com/axiora/backend/modules/procurement"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/compress"
	"github.com/gofiber/fiber/v2/middleware/cors"
	fiberlogger "github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
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
	_ = auditSvc // used by middleware and handlers

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
	analyticsHandler := analytics.NewHandler(db)

	// ── Middleware factories ───────────────────────────────
	requireAuth := middleware.RequireAuth(authSvc)
	requireOrg := middleware.RequireOrganization(orgSvc)
	requirePerm := func(perm string) fiber.Handler {
		return middleware.RequirePermission(rbacSvc, perm)
	}

	// ── Fiber app ─────────────────────────────────────────
	app := fiber.New(fiber.Config{
		AppName: cfg.AppName,
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{"error": err.Error()})
		},
	})

	app.Use(recover.New())
	app.Use(compress.New())
	app.Use(fiberlogger.New(fiberlogger.Config{
		Format: "${time} | ${status} | ${latency} | ${ip} | ${method} ${path}\n",
	}))
	app.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.FrontendURL,
		AllowMethods:     "GET,POST,PUT,PATCH,DELETE,OPTIONS",
		AllowHeaders:     "Content-Type,Authorization,X-Organization-Id",
		AllowCredentials: true,
	}))

	// ── Health ────────────────────────────────────────────
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "service": cfg.AppName})
	})

	// ── API v1 ────────────────────────────────────────────
	v1 := app.Group("/api/v1")

	// Auth (public)
	authGroup := v1.Group("/auth")
	authGroup.Post("/signup", authHandler.Signup)
	authGroup.Post("/login", authHandler.Login)
	authGroup.Post("/refresh", authHandler.Refresh)
	authGroup.Post("/logout", requireAuth, authHandler.Logout)
	authGroup.Get("/me", requireAuth, authHandler.Me)

	// Organizations
	orgGroup := v1.Group("/organizations", requireAuth)
	orgGroup.Get("/", orgHandler.List)
	orgGroup.Post("/", orgHandler.Create)
	orgGroup.Get("/:id", orgHandler.Get)
	orgGroup.Get("/:id/members", orgHandler.ListMembers)
	orgGroup.Delete("/:id/members/:userId", requireOrg, requirePerm("admin.manage"), orgHandler.RemoveMember)

	// Roles & Permissions (org-scoped)
	roleGroup := v1.Group("/roles", requireAuth, requireOrg)
	roleGroup.Get("/", rbacHandler.ListRoles)
	roleGroup.Post("/", requirePerm("admin.manage"), rbacHandler.CreateRole)
	roleGroup.Put("/:id", requirePerm("admin.manage"), rbacHandler.UpdateRole)
	roleGroup.Delete("/:id", requirePerm("admin.manage"), rbacHandler.DeleteRole)
	roleGroup.Post("/:id/permissions", requirePerm("admin.manage"), rbacHandler.AssignPermission)

	v1.Get("/permissions", requireAuth, requireOrg, rbacHandler.ListPermissions)
	v1.Post("/users/:id/roles", requireAuth, requireOrg, requirePerm("admin.manage"), rbacHandler.AssignRoleToUser)

	// Modules
	modGroup := v1.Group("/modules", requireAuth, requireOrg)
	modGroup.Get("/", moduleHandler.List)
	modGroup.Post("/:id/enable", requirePerm("admin.manage"), moduleHandler.Enable)
	modGroup.Post("/:id/disable", requirePerm("admin.manage"), moduleHandler.Disable)

	// ── ERP Modules (all require org + specific permission) ──
	crmGroup := v1.Group("/crm", requireAuth, requireOrg, requirePerm("crm.read"))
	crmmod.RegisterRoutes(crmGroup, crmHandler)

	accGroup := v1.Group("/accounting", requireAuth, requireOrg, requirePerm("accounting.read"))
	accounting.RegisterRoutes(accGroup, accountingHandler)

	billGroup := v1.Group("/billing", requireAuth, requireOrg, requirePerm("billing.read"))
	billing.RegisterRoutes(billGroup, billingHandler)

	invGroup := v1.Group("/inventory", requireAuth, requireOrg, requirePerm("inventory.read"))
	inventory.RegisterRoutes(invGroup, inventoryHandler)

	hrGroup := v1.Group("/hr", requireAuth, requireOrg, requirePerm("hr.read"))
	hr.RegisterRoutes(hrGroup, hrHandler)

	procGroup := v1.Group("/procurement", requireAuth, requireOrg, requirePerm("procurement.read"))
	procurement.RegisterRoutes(procGroup, procurementHandler)

	marchesGroup := v1.Group("/marches", requireAuth, requireOrg, requirePerm("procurement.read"))
	marches.RegisterRoutes(marchesGroup, marchesHandler)

	analyticsGroup := v1.Group("/analytics", requireAuth, requireOrg, requirePerm("analytics.read"))
	analytics.RegisterRoutes(analyticsGroup, analyticsHandler)

	// ── Start ─────────────────────────────────────────────
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	go func() {
		addr := fmt.Sprintf(":%s", cfg.Port)
		log.Printf("✓ Axiora API listening on %s [%s]", addr, cfg.AppEnv)
		if err := app.Listen(addr); err != nil {
			log.Fatalf("server error: %v", err)
		}
	}()

	<-quit
	log.Println("Shutting down...")
	_ = app.Shutdown()
}
