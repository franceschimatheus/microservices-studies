# iFood Clone — Distributed Systems Study Project

## Goals

Build a realistic food delivery platform focused on learning:

- Microservices architecture
- Event-driven systems
- gRPC
- RabbitMQ
- Distributed tracing
- Observability
- Idempotency
- DLQs
- Outbox pattern
- Polyglot persistence
- Docker Compose infrastructure
- Stateless containerized services

---

# High-Level Architecture

```text
Next.js Client
        |
Next.js Admin
        |
     Gateway
        |
 -----------------------------
 |      |       |      |     |
Auth  Order  Restaurant Cart Search
        |
     RabbitMQ
        |
 ----------------------------------------
 |         |          |         |        |
Payment Notification Delivery Analytics SearchIndexer
```

---

# Tech Stack

| Concern | Technology |
|---|---|
| Frontend | Next.js |
| Backend | Go |
| HTTP API | Fiber |
| Internal RPC | gRPC |
| Event Broker | RabbitMQ |
| Databases | PostgreSQL |
| Cache/Ephemeral State | Redis |
| Search | OpenSearch |
| Metrics | Prometheus |
| Dashboards | Grafana |
| Tracing | Jaeger |
| Logs | Loki |
| Containers | Docker Compose |
| Contracts | Protobuf |
| Migrations | golang-migrate |
| Dev Environment | Nix |

---

# Monorepo Structure

```text
/apps
  /web (Unified Next.js UI)
  /gateway
  /auth-service
  /restaurant-service
  /cart-service
  /order-service
  /payment-service
  /notification-service
  /delivery-service
  /search-service
  /analytics-service

/infra
  /logger
  /observability
  /prometheus
  /grafana
  /loki

/docs
```

---

# Communication Model

## External Communication

```text
Frontend
→ REST
→ Gateway
```

## Internal Synchronous Communication

```text
Gateway
→ gRPC services
```

## Internal Asynchronous Communication

```text
RabbitMQ exchanges
```

Using:

- topic exchanges
- routing keys
- pub/sub style events

---

# RabbitMQ Topology

## Exchanges

```text
orders.exchange
payments.exchange
delivery.exchange
notifications.exchange
restaurants.exchange
search.exchange
```

## Routing Keys

```text
order.created
order.cancelled
payment.completed
payment.failed
delivery.assigned
delivery.completed
restaurant.updated
```

---

# Core Services

---

# Gateway Service

Responsibilities:

- REST entrypoint
- JWT validation
- request tracing
- correlation IDs
- rate limiting
- gRPC aggregation
- OpenTelemetry propagation

Rules:

- NO business logic
- Stateless only

---

# Auth Service

Owns:

```text
users
roles
sessions
refresh_tokens
```

Roles:

- customer
- admin
- restaurant_owner
- delivery_driver

Communication:

- REST externally
- gRPC internally

Database:

```text
auth_db
```

---

# Restaurant Service

Owns:

```text
restaurants
menus
menu_items
categories
```

Publishes:

```text
restaurant.created
restaurant.updated
menu.updated
```

Database:

```text
restaurant_db
```

---

# Cart Service

Uses Redis.

Owns:

```text
cart:{userId}
```

Features:

- add item
- remove item
- TTL expiration
- snapshot totals

Purpose:

- ephemeral state management
- session-like distributed state

---

# Order Service

Core business domain.

Owns:

```text
orders
order_items
order_status_history
```

States:

```text
PENDING
AWAITING_PAYMENT
PAID
PREPARING
ON_DELIVERY
DELIVERED
CANCELLED
```

Publishes:

```text
order.created
order.confirmed
order.cancelled
order.completed
```

Consumes:

```text
payment.completed
payment.failed
```

Database:

```text
order_db
```

---

# Payment Service

Consumes:

```text
order.created
```

Simulates:

- latency
- failures
- retries
- timeouts

Publishes:

```text
payment.completed
payment.failed
```

Features:

- idempotency
- retry workers
- DLQs

Database:

```text
payment_db
```

---

# Delivery Service

Consumes:

```text
payment.completed
```

Simulates workflow:

```text
PREPARING
→ READY
→ ON_DELIVERY
→ DELIVERED
```

Publishes:

```text
delivery.updated
delivery.completed
```

Purpose:

- event-driven workflows
- async lifecycle simulation

---

# Notification Service

Consumes:

```text
payment.completed
order.updated
delivery.completed
```

Simulates:

- email
- websocket pushes
- SMS

Characteristics:

- fully async
- no direct frontend communication

---

# Search Service

Uses OpenSearch.

Consumes:

```text
restaurant.updated
menu.updated
```

Maintains:

- denormalized search indexes
- projections

Purpose:

- CQRS-like read models
- eventual consistency

---

# Analytics Service

Consumes ALL events.

Tracks:

- KPIs
- counters
- business metrics
- operational metrics

Database:

```text
analytics_db
```

Possible future DB:

```text
ClickHouse
```

---

# Database Ownership Rules

Each service owns its own database.

NEVER:

```text
Service A reads Service B database directly
```

Communication MUST happen through:

- gRPC
- events

---

# Protobuf Strategy

Use protobuf for:

- gRPC contracts
- event payload schemas

Example:

```text
/packages/protobuf/events/order.proto
```

Generate:

- Go contracts
- TypeScript contracts

---

# Observability Stack

## OpenTelemetry

Every request propagates:

```text
trace_id
span_id
correlation_id
```

Across:

- HTTP
- gRPC
- RabbitMQ headers

---

# Metrics

Expose:

```text
/metrics
```

Use Prometheus.

Track:

- request duration
- queue lag
- retry counts
- DLQ counts
- payment failures

---

# Distributed Tracing

Use Jaeger.

Expected trace example:

```text
Frontend
→ Gateway
→ Order Service
→ RabbitMQ
→ Payment Service
→ Notification Service
```

---

# Logging

Structured JSON logs only.

Include:

- trace IDs
- request IDs
- service names

Aggregation:

```text
Loki → Grafana
```

---

# Reliability Patterns

## Idempotency

Queues can redeliver messages.

Payment processing MUST survive duplicate deliveries.

---

# Dead Letter Queues

Example:

```text
payment.failed.dlq
```

---

# Retry Policies

Use exponential backoff.

---

# Correlation IDs

Track workflows across services.

---

# Outbox Pattern

Prevent:

```text
DB write succeeds
BUT
event publish fails
```

---

# Docker Compose Infrastructure

```text
gateway
client-web
admin-web

auth-service
restaurant-service
cart-service
order-service
payment-service
delivery-service
notification-service
search-service
analytics-service

postgres-auth
postgres-restaurant
postgres-order
postgres-payment
postgres-analytics

redis

rabbitmq

opensearch

prometheus
grafana
jaeger
loki
```

---

# Development Phases

## Phase 1 — Core Infrastructure

- [x] Monorepo structure setup
- [x] Docker Compose orchestration (Postgres, Redis, RabbitMQ)
- [x] Nix development environment configurations per service
- [x] Protobuf & gRPC code generation contracts
- [x] Gateway service (Fiber HTTP router, CORS rules, reverse proxy)
- [x] Auth service (Go clean architecture, Postgres repository, migrations)
- [x] Next.js Unified Web app (App Router, Tailwind, Hook Form, Zod)

---

## Phase 2 — Domain Core

- [x] restaurant service
- [x] cart service
- [x] order service

---

## Phase 3 — Event Architecture

- [x] RabbitMQ exchanges
- [x] payment consumers
- [ ] notification consumers
- [ ] delivery workers

---

## Phase 4 — Reliability

- retries
- DLQs
- idempotency
- outbox pattern

---

## Phase 5 — Observability

- [x] tracing (OpenTelemetry + Jaeger integration)
- [x] metrics (Prometheus scraping on Gateway, Auth, Restaurant, Order, and Cart services with Postgres/Redis connection pool stats)
- [x] dashboards (Grafana with Loki, Jaeger, and Prometheus datasources)
- [x] log aggregation (Loki + Promtail container log shipping)

*Note: Completed for gateway, auth-service, restaurant-service, order-service, cart-service, and web dashboards.*

---

## Phase 6 — Search + Analytics

- OpenSearch projections
- analytics consumers
- admin operational dashboards

---

# Architectural Principles

- Stateless immutable containers
- Event choreography over orchestration
- Independent service ownership
- Async-first workflows
- Shared contracts through protobuf
- Distributed tracing everywhere
- Structured logging only
- Strong observability from day one

---

# Project Focus

Optimize for:

```text
quality of distributed systems design
```

NOT:

```text
number of services
```

---

# Codebase Guidelines

Every microservice in this monorepo must adhere to the following architecture principles:

1. **Clean Architecture Folder Structure**: Keep a clean structure utilizing:
   - `domain/`: Entities, core business logic, and interface definitions.
   - `repository/`: Data source access implementations (e.g., PostgreSQL, Redis).
   - `service/`: Use cases and business logic implementations.
   - `handler/`: Transport/API layer (e.g., REST controllers, gRPC handlers).
2. **Environment Configuration**: Always parse environment variables in a dedicated config file/package (e.g., `internal/config`) rather than fetching them directly in `main.go`.
3. **App Wrapper Component**: Build an `App` struct (e.g., in `internal/app`) to handle bootstrap, service wiring, dependencies, listeners, and graceful shutdown cleanly. Avoid putting extensive setup/wiring logic inside `main.go`.