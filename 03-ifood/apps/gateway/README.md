# API Gateway

The `gateway` is the single entry point for all frontend client interactions.

## Technologies Used

* **Language**: Go (Golang)
* **Web Framework**: Fiber (Fast HTTP Router)
* **Communication Protocol**: gRPC (gRPC Clients) connecting to internal microservices
* **Distributed Tracing**: OpenTelemetry instrumentation with context propagation

## Architectural & Reliability Patterns

* **Reverse Proxy / Orchestrator**: Translates HTTP REST client queries into internal gRPC calls.
* **CORS Rules**: Enforces strict domain access policies (allowing Next.js `credentials: 'include'`).
* **Trace Context Propagation**: Extracts trace details from incoming HTTP requests and injects them into outgoing gRPC metadata, enabling Jaeger to trace complete request lifecycles.
* **Authentication Middleware**: Verifies session cookies on restricted routes (like `/admin/*` endpoints).
