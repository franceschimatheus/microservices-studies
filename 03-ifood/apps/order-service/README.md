# Order Service

The `order-service` manages the lifecycle of orders, driving checkout workflows and updating status.

## Technologies Used

* **Language**: Go (Golang)
* **Database**: PostgreSQL (Orders, items)
* **Communication Protocols**: 
  * gRPC (gRPC Server) for synchronous calls
  * RabbitMQ (Message Producer) for asynchronous events
* **Events & Routing Keys**:
  * Exchange: `orders.exchange` (Topic)
  * Event Types: `order.created`, `order.updated`

## Architectural & Reliability Patterns

* **Transactional Outbox Pattern**: Order records and status changes are written to the database along with outbox events in a single transaction. The background worker publishes these events to RabbitMQ to guarantee at-least-once delivery.
* **State Machine Verification**: Enforces valid state transitions for order statuses (e.g., `PENDING` $\rightarrow$ `PAID` $\rightarrow$ `ON_DELIVERY` $\rightarrow$ `DELIVERED`).
