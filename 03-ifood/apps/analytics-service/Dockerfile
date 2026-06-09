FROM golang:1.26-alpine AS builder

WORKDIR /app

# Copy go.work and modules
COPY go.work ./
COPY apps/analytics-service/ ./apps/analytics-service/
COPY infra/logger/ ./infra/logger/
COPY infra/observability/ ./infra/observability/
COPY infra/prometheus/ ./infra/prometheus/
COPY infra/rabbitmq/ ./infra/rabbitmq/

# Build service
WORKDIR /app/apps/analytics-service
RUN CGO_ENABLED=0 GOOS=linux GOWORK=off go build -o /analytics-service cmd/server/main.go

# Final stage
FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /analytics-service /analytics-service
EXPOSE 50057
ENTRYPOINT ["/analytics-service"]
