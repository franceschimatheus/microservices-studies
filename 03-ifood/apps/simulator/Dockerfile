FROM golang:1.26-alpine AS builder

WORKDIR /app

COPY apps/simulator/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -o /simulator .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /simulator /simulator
ENTRYPOINT ["/simulator"]
