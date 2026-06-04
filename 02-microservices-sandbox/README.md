# Go Microservices Sandbox

Welcome to the Go Microservices Sandbox! This project is a hands-on learning environment designed to study **Scalable Systems, System Design, and Microservice Architectures** in Go.

---

## 🏗️ Architecture & Scenario

We are building a realistic, distributed **E-Commerce Order Processing System** composed of four microservices:

1. **Order Service** (HTTP API):
   - Exposes HTTP endpoints for customers to place and view orders.
   - Orchestrates the order flow and database-per-service records in PostgreSQL.
2. **Inventory Service** (gRPC):
   - Manages stock levels and executes stock reservations.
   - Uses Redis to cache frequently accessed items and PostgreSQL as its main database.
3. **Payment Service** (gRPC & AMQP):
   - Processes payments asynchronously or synchronously.
   - Can simulate payment gateway delays and failures to test system resiliency.
4. **Notification Service** (AMQP):
   - Consumes order success/failure events from RabbitMQ and simulates sending emails.

---

## 🗺️ Step-by-Step Roadmap

### 📦 Stage 1: Service Communication
- **Synchronous Communication**: 
  - Connect the **Order Service** to the **Inventory Service** via **gRPC** for stock check and reservation logic.
- **Asynchronous Communication**: 
  - Publish `OrderCreated`, `PaymentProcessed`, and `StockReserved` events to **RabbitMQ**.
  - Have the **Payment Service** and **Notification Service** subscribe to these events.

### 💾 Stage 2: Distributed Data & Transactions
- **Database-per-Service**: Ensure strict isolation where services only access their own PostgreSQL databases (`order_db` and `inventory_db`).
- **Saga Pattern (Distributed Transactions)**: Implement a Saga Orchestrator in the Order Service to coordinate:
  1. Creating an Order (Pending status).
  2. Reserving Stock (Inventory Service).
  3. Processing Payment (Payment Service).
  4. Marking Order as Completed (or executing **compensating transactions** to cancel the order and release stock if payment fails).
- **Caching**: Use **Redis** in the Inventory Service for read-through caching of item stock.

### 🔍 Stage 3: Observability
- **Structured Logging**: Standardize logs across services using structured JSON formats via Zap or Zerolog.
- **Distributed Tracing**: Set up **OpenTelemetry** and **Jaeger** to trace user requests through HTTP/JSON -> gRPC calls -> RabbitMQ messaging -> Consumer processing.
- **Metrics**: Expose service health and latency metrics to **Prometheus** and visualize them in **Grafana**.

### 🛡️ Stage 4: Resiliency & Scaling
- **Circuit Breakers**: Implement circuit breaking on gRPC clients using libraries like `gobreaker` to prevent cascading failures if the Inventory Service is slow/down.
- **Rate Limiting**: Protect the Order Service from spikes in load using token-bucket rate limiters (`golang.org/x/time/rate`).
- **Load Balancing**: Set up a local API gateway or load balancer to distribute requests.

---

## 📂 Project Structure: Handler-Service-Repository

Each microservice follows a clean **Handler-Service-Repository** layered architecture:

```
services/<service-name>/
├── go.mod
├── cmd/
│   └── server/
│       └── main.go       # Wire up Repository -> Service -> Handler and start the app
└── internal/
    ├── domain/           # Models, entities, and repository/service interfaces (business domain)
    ├── handler/          # Transport handlers (HTTP routes, gRPC servers, AMQP subscribers)
    ├── repository/       # Data access layers (PostgreSQL queries, Redis keys)
    └── service/          # Core business rules, validation, and third-party orchestration
```

### Purpose of Layers:
- **Domain**: Declares interfaces and core structs, establishing a clear contract for other layers. Contains zero dependency on databases or external protocols.
- **Repository**: Implements domain database interfaces. Translates SQL or Redis commands into domain models.
- **Service**: Executes the core domain logic. Contains the transaction orchestration (e.g. Sagas) and coordinates repositories or external APIs.
- **Handler**: Exposes the service to the network. Deserializes HTTP JSON, runs gRPC servers, or reads events from queues, passes arguments to the service, and formats the output.

---

## 🛠️ Infrastructure Setup

The sandbox includes a pre-configured Docker Compose file starting:
- **Order Database** (PostgreSQL on port `5431`)
- **Inventory Database** (PostgreSQL on port `5432`)
- **Redis Cache** (on port `6379`)
- **RabbitMQ Message Broker** (port `5672`, Management UI at [http://localhost:15672](http://localhost:15672))

To spin up the infrastructure:
```bash
task up
```
*(Runs docker compose for the sandbox. Make sure to run `task down` to stop them.)*
