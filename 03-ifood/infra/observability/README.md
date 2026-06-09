# Shared Observability Package

Provides the core OpenTelemetry setup, distributed tracing context propagation, and gRPC client/server interceptors.

## Features

* **OTel Tracer**: Initializes the OpenTelemetry trace provider and configures exporters to forward spans to the OTel Collector.
* **gRPC Interceptors**:
  * **Trace Context Propagation**: Automatically extracts and injects trace headers across RPC boundaries, ensuring requests are traced end-to-end.
  * **OTel gRPC Metrics**: Generates standard RPC latency, throughput, and error metrics.
