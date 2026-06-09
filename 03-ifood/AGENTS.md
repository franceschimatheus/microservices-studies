# AI Agent Instructions & Guidelines for iFood Clone

Welcome! This repository is a distributed systems study project simulating a food delivery platform. As an AI coding assistant, you must strictly adhere to the project's architectural principles and coding guidelines.

---

## 1. Monorepo Structure & Conventions

Every Go microservice in `/apps` must follow the Clean Architecture pattern:

- **`domain/`**: Contains entities, core business logic, and interface definitions.
- **`repository/`**: Contains data source access implementations (e.g., PostgreSQL, Redis, OpenSearch).
- **`service/`**: Contains use cases and business logic implementations.
- **`handler/`**: Contains the transport/API layer (e.g., REST controllers, gRPC handlers).

### Bootstrap & Configuration Rules
1. **No direct `os.Getenv` in `main.go`**: Always parse environment variables in a dedicated configuration file/package (e.g., `internal/config`) using a struct and proper validation.
2. **App Wrapper Component**: Build an `App` struct (e.g., in `internal/app`) to handle bootstrap, service wiring, dependency injection, listeners, and graceful shutdown cleanly. Keep `main.go` minimal.

---

## 2. Database Ownership & Communication Rules

- **Strict DB Isolation**: Each microservice owns its own database.
- **NO Shared Databases**: Service A must **NEVER** read or write to Service B's database directly.
- **Communication Channels**:
  - **Synchronous**: Internal communication between services must use **gRPC** (defined in Protobuf contracts).
  - **Asynchronous**: Event-driven communication must use **RabbitMQ** (using topic exchanges and routing keys).

---

## 3. Technology Stack

- **Backend**: Go (using Fiber for REST, standard `grpc` for internal RPC)
- **Frontend**: Next.js (located in `/apps/web`)
- **Event Broker**: RabbitMQ
- **Databases**: PostgreSQL (Auth, Restaurant, Order, Payment, Analytics), Redis (Cart, Notifications caching)
- **Search**: OpenSearch
- **Observability**: Prometheus (Metrics), Jaeger (Tracing), Loki (Logs), Grafana (Dashboards)
- **Dev Environment**: Nix (using `nix develop` or `nix-shell` to lock toolchain versions)
- **Deployment**: Docker Compose

---

## Nix Development Environment

- **Toolchain Consistency**: This project uses **Nix** (`flake.nix`) to manage toolchains (Go compiler, protobuf compiler, golang-migrate, task, etc.).
- **Usage**: Agents and developers should run inside the Nix shell (`nix develop` or `nix-shell`) to ensure environment parity and avoid host compiler version conflicts.

---

## 4. Current Goal: Phase 6 — Search + Analytics

We are currently working on **Phase 6 — Search + Analytics**. The task is to structure the data pipeline, databases, KPIs, and dashboards:

### Tasks:
1. **Analytics Consumer**: Create an `analytics-service` that consumes all microservice events from RabbitMQ (e.g., `order.created`, `order.cancelled`, `payment.completed`, `payment.failed`, `delivery.completed`).
2. **Database Schema**: Store event logs and metrics in `postgres-analytics`.
3. **KPIs & Metrics**:
   - Total Orders & Revenue
   - Order Status distribution (delivered vs. cancelled)
   - Payment Success rate
   - Delivery latency/times
4. **Dashboards**: Build operational dashboards/visualizations (Grafana or in the Next.js Admin panel).
