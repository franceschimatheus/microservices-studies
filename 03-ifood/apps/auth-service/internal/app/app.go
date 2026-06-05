package app

import (
	"context"
	"fmt"
	"log"
	"net"
	"time"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/jackc/pgx/v5/pgxpool"
	"google.golang.org/grpc"

	"auth-service/internal/config"
	"auth-service/internal/handler"
	"auth-service/internal/repository"
	"auth-service/internal/service"
	"auth-service/migrations"
	pb "auth-service/pb"
)

type App struct {
	cfg        *config.Config
	db         *pgxpool.Pool
	gRPCServer *grpc.Server
}

func New(cfg *config.Config) (*App, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	pgxConfig, err := pgxpool.ParseConfig(cfg.DBDSN)
	if err != nil {
		return nil, fmt.Errorf("failed to parse DB DSN: %w", err)
	}

	pool, err := pgxpool.NewWithConfig(ctx, pgxConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	// Wait for database connection to be ready
	var errPing error
	for i := 0; i < 10; i++ {
		errPing = pool.Ping(ctx)
		if errPing == nil {
			break
		}
		log.Printf("Waiting for database connection... %v", errPing)
		time.Sleep(2 * time.Second)
	}
	if errPing != nil {
		return nil, fmt.Errorf("could not connect to database: %w", errPing)
	}

	return &App{
		cfg: cfg,
		db:  pool,
	}, nil
}

func (a *App) runMigrations() error {
	d, err := iofs.New(migrations.FS, ".")
	if err != nil {
		return fmt.Errorf("failed to create iofs source: %w", err)
	}

	m, err := migrate.NewWithSourceInstance("iofs", d, a.cfg.DBDSN)
	if err != nil {
		return fmt.Errorf("failed to initialize migrate: %w", err)
	}
	defer m.Close()

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	log.Println("Migrations executed successfully")
	return nil
}

func (a *App) Run() error {
	// 1. Run Migrations
	if err := a.runMigrations(); err != nil {
		return fmt.Errorf("migration failure: %w", err)
	}

	// 2. Setup gRPC Listener
	lis, err := net.Listen("tcp", a.cfg.BindAddr)
	if err != nil {
		return fmt.Errorf("failed to listen on %s: %w", a.cfg.BindAddr, err)
	}

	// 3. Wire Component Layer (Clean Architecture)
	userRepo := repository.NewPostgresUserRepository(a.db)
	authServ := service.NewAuthServiceImpl(userRepo, []byte(a.cfg.JWTSecret))
	grpcHandler := handler.NewGrpcAuthHandler(authServ)

	a.gRPCServer = grpc.NewServer()
	pb.RegisterAuthServiceServer(a.gRPCServer, grpcHandler)

	log.Printf("Auth Service is running on %s", a.cfg.BindAddr)
	return a.gRPCServer.Serve(lis)
}

func (a *App) Close() {
	if a.gRPCServer != nil {
		a.gRPCServer.GracefulStop()
	}
	if a.db != nil {
		a.db.Close()
	}
}
