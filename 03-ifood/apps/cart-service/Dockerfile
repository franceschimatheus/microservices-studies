FROM golang:1.26-alpine AS builder

WORKDIR /app

# Copy go.work and modules
COPY go.work ./
COPY apps/cart-service/ ./apps/cart-service/
COPY apps/logger/ ./apps/logger/
COPY apps/observability/ ./apps/observability/

# Build service
WORKDIR /app/apps/cart-service
RUN CGO_ENABLED=0 GOOS=linux GOWORK=off go build -o /cart-service cmd/server/main.go

# Final stage
FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /cart-service /cart-service
EXPOSE 50053
ENTRYPOINT ["/cart-service"]
