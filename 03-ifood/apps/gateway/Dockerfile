FROM golang:1.26-alpine AS builder

WORKDIR /app

# Copy go.work and modules
COPY go.work ./
COPY apps/auth-service/ ./apps/auth-service/
COPY apps/restaurant-service/ ./apps/restaurant-service/
COPY apps/cart-service/ ./apps/cart-service/
COPY apps/order-service/ ./apps/order-service/
COPY apps/gateway/ ./apps/gateway/
COPY infra/logger/ ./infra/logger/
COPY infra/observability/ ./infra/observability/
COPY infra/prometheus/ ./infra/prometheus/

# Build service
WORKDIR /app/apps/gateway
RUN CGO_ENABLED=0 GOOS=linux GOWORK=off go build -o /gateway cmd/server/main.go

# Final stage
FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /gateway /gateway
EXPOSE 8080
ENTRYPOINT ["/gateway"]
