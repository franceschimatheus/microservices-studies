package main

import (
	"log"
	"net"
	"net/http"
	"os"

	"google.golang.org/grpc"
	"inventory/internal/handler"
	"inventory/pkg/pb"
	"inventory/internal/repository"
	"inventory/internal/service"
)

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}

func main() {
	// Initialize layers
	repo := repository.NewPostgresRepository()
	svc := service.NewInventoryService(repo)
	hdl := handler.NewGRPCHandler(svc)

	addr := getEnv("BIND_ADDR", "127.0.0.1:8082")
	httpAddr := getEnv("HTTP_BIND_ADDR", "127.0.0.1:8086")

	// Listen on TCP port
	lis, err := net.Listen("tcp", addr)
	if err != nil {
		log.Fatalf("failed to listen on %s: %v", addr, err)
	}

	// Create gRPC server
	grpcServer := grpc.NewServer()
	pb.RegisterInventoryServiceServer(grpcServer, hdl)

	// Setup HTTP server for REST endpoints
	httpMux := http.NewServeMux()
	httpHdl := handler.NewHTTPHandler(svc)
	httpHdl.RegisterRoutes(httpMux)

	log.Printf("Inventory Service (gRPC) starting on %s...", addr)
	go func() {
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatalf("failed to serve gRPC: %v", err)
		}
	}()

	log.Printf("Inventory Service (HTTP) starting on %s...", httpAddr)
	if err := http.ListenAndServe(httpAddr, httpMux); err != nil {
		log.Fatalf("failed to serve HTTP: %v", err)
	}
}
