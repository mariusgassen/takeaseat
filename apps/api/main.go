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

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/takeaseat/takeaseat/apps/api/internal/config"
	"github.com/takeaseat/takeaseat/apps/api/internal/db"
	"github.com/takeaseat/takeaseat/apps/api/internal/handler"
	"github.com/takeaseat/takeaseat/apps/api/internal/migrate"
	"github.com/takeaseat/takeaseat/apps/api/internal/middleware"
	"github.com/takeaseat/takeaseat/apps/api/internal/problems"
	"github.com/takeaseat/takeaseat/apps/api/internal/redis"
)

func main() {
	log.SetOutput(os.Stdout)

	cfg := config.Load()
	if err := cfg.Validate(); err != nil {
		log.Fatalf("config: %v", err)
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, cfg.PostgresURL)
	if err != nil {
		log.Fatalf("postgres pool: %v", err)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("postgres ping: %v", err)
	}
	log.Println("postgres: connected")

	if err := migrate.Run(pool); err != nil {
		log.Printf("migrations: skipping (%v)", err)
	} else {
		log.Println("migrations: complete")
	}

	queries := db.New(pool)

	var redisClient *redis.Client
	if cfg.RedisURL != "" {
		var rErr error
		redisClient, rErr = redis.New(cfg.RedisURL)
		if rErr != nil {
			log.Printf("redis: not connected (%v)", rErr)
			redisClient = nil
		} else {
			defer redisClient.Close()
		}
	}

	zitadelValidator := middleware.NewZitadelValidator(cfg.ZitadelIssuerURL)

	router := chi.NewRouter()
	router.Use(middleware.RequestLogger)

	router.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		handler.RenderProblem(w, r, &problems.Detail{
			Type:   "https://takeaseat.ai/problems/health",
			Title:  "OK",
			Status: http.StatusOK,
		})
	})

	router.Group(func(r chi.Router) {
		r.Use(middleware.Auth(zitadelValidator.Validate))
		r.Use(middleware.NewTenantDB(pool).Wrap)

		r.Get("/api/v1/me", func(w http.ResponseWriter, r *http.Request) {
			claims := middleware.GetClaims(r)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			fmt.Fprintf(w, `{"user_id":"%s","tenant_id":"%s","role":"%s"}`, claims.Subject, claims.TenantID, claims.Role)
		})

		r.Route("/api/v1/resources", func(r chi.Router) {
			r.Get("/", handler.FilterResources(queries))
			r.Post("/", handler.CreateResource(queries))
			r.Get("/{id}", handler.GetResource(queries))
			r.Get("/{id}/availability", handler.GetResourceAvailability(queries))
			r.Put("/{id}", handler.UpdateResource(queries))
			r.Delete("/{id}", handler.DeleteResource(queries))
			r.Get("/availability/stream", handler.StreamAvailabilityWithClient(redisClient))
		})

		r.Route("/api/v1/reservations", func(r chi.Router) {
			r.Get("/", handler.ListReservations(queries))
			r.Post("/", handler.CreateReservation(queries, redisClient))
			r.Get("/{id}", handler.GetReservation(queries))
			r.Post("/{id}/check-in", handler.CheckIn(queries, redisClient))
			r.Post("/{id}/check-out", handler.CheckOut(queries, redisClient))
			r.Patch("/{id}/status", handler.UpdateReservationStatus(queries, redisClient))
			r.Delete("/{id}", handler.DeleteReservation(queries, redisClient))
		})

		r.Route("/api/v1/recurring-series", func(r chi.Router) {
			r.Get("/", handler.ListMyRecurringSeries(queries))
			r.Post("/", handler.CreateRecurringSeries(queries, redisClient))
			r.Get("/{id}", handler.GetRecurringSeries(queries))
			r.Delete("/{id}", handler.DeleteRecurringSeries(queries, redisClient))
		})

		r.Route("/api/v1/users", func(r chi.Router) {
			r.Get("/", handler.ListUsers(queries))
			r.Post("/", handler.CreateUser(queries))
			r.Get("/{id}", handler.GetUser(queries))
			r.Patch("/{id}", handler.UpdateUser(queries))
			r.Delete("/{id}", handler.DeleteUser(queries))
		})

		r.Group(func(r chi.Router) {
			r.Use(middleware.RequireAdmin)

			r.Route("/api/v1/tenants", func(r chi.Router) {
				r.Get("/{id}", handler.GetTenant(queries))
				r.Patch("/{id}", handler.UpdateTenant(queries))
			})

			r.Route("/api/v1/sso-providers", func(r chi.Router) {
				r.Get("/", handler.ListSsoProviders(queries))
				r.Post("/", handler.CreateSsoProvider(queries))
				r.Delete("/{id}", handler.DeleteSsoProvider(queries))
			})
		})
	})

	addr := ":" + cfg.Port
	srv := &http.Server{
		Addr:    addr,
		Handler: router,
	}

	go func() {
		log.Printf("api: listening on %s", addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("api: shutting down")

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("shutdown: %v", err)
	}
	log.Println("api: stopped")
}