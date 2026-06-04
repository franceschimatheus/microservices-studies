FROM golang:1.25-alpine AS builder

WORKDIR /app

# Copy the workspace configurations
COPY go.work go.work.sum ./

# Copy all internal Go modules
COPY services/ services/

# Accept the service name as a build parameter
ARG SERVICE_NAME
RUN CGO_ENABLED=0 GOOS=linux go build -o /server services/${SERVICE_NAME}/cmd/server/main.go

# Minimal production image
FROM alpine:3.19
RUN apk --no-cache add ca-certificates

# Copy the compiled binary
COPY --from=builder /server /server

ENTRYPOINT ["/server"]
