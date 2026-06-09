# Shared Infrastructure

This directory contains the configurations, shared Go libraries, and definitions for the platform's databases, message broker, and observability stack.

## Directory Structure

* **`logger/`**: Shared Go package for structured JSON logging using Go's standard `log/slog` library.
* **`observability/`**: Shared Go package wrapping OpenTelemetry tracer initialization and client/server gRPC trace propagation middlewares.
* **`prometheus/`**: Shared Go package providing standardized HTTP metrics collection endpoints and middleware wrappers.
* **`rabbitmq/`**: Shared Go package wrapping RabbitMQ connection pools, channel pools, exchange declarations, queue bindings, and outbox publisher utilities.
* **`otel-collector/`**: OpenTelemetry Collector configuration to receive traces/metrics and forward them to backends.
* **`grafana/`**: Datasources and pre-configured dashboard JSON models.
* **`jaeger/`**: Configuration files for distributed tracing dashboards.
* **`loki/`**: Log aggregation and ingestion settings.

## System Topology & Ports

The local docker-compose environment exposes the following telemetry and control dashboards:

* **Grafana**: `http://localhost:3001` (Dashboards, Logs, Metrics)
* **Jaeger**: `http://localhost:16686` (Distributed Tracing UI)
* **RabbitMQ**: `http://localhost:15672` (Management Console)
* **Prometheus**: `http://localhost:9090` (Raw time-series queries)
* **Redis Insight**: `http://localhost:5540` (Cache browser)
* **OpenSearch Dashboards**: `http://localhost:5601` (Search index GUI)
