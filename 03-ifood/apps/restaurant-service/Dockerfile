FROM golang:1.26-alpine AS builder

WORKDIR /app

# Copy go.work and modules
COPY go.work ./
COPY apps/restaurant-service/ ./apps/restaurant-service/
COPY infra/logger/ ./infra/logger/
COPY infra/observability/ ./infra/observability/
COPY infra/prometheus/ ./infra/prometheus/

# Build service
WORKDIR /app/apps/restaurant-service
RUN CGO_ENABLED=0 GOOS=linux GOWORK=off go build -o /restaurant-service cmd/server/main.go

# Final stage
FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /restaurant-service /restaurant-service
EXPOSE 50052
ENTRYPOINT ["/restaurant-service"]
