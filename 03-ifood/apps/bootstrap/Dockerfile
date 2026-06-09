FROM golang:1.26-alpine AS builder

WORKDIR /app

# Copy go.work and modules
COPY go.work ./
COPY apps/bootstrap/ ./apps/bootstrap/
COPY infra/logger/ ./infra/logger/
COPY infra/observability/ ./infra/observability/
COPY infra/prometheus/ ./infra/prometheus/

# Build service
WORKDIR /app/apps/bootstrap
RUN CGO_ENABLED=0 GOOS=linux GOWORK=off go build -o /bootstrap main.go

# Final stage
FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /bootstrap /bootstrap
EXPOSE 8090
ENTRYPOINT ["/bootstrap"]
