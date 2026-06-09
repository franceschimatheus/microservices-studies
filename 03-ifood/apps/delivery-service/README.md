# Delivery Service

The `delivery-service` assigns couriers to successfully paid orders and tracks transit states.

## Technologies Used

* **Language**: Go (Golang)
* **Database**: PostgreSQL (Deliveries)
* **Communication Protocols**: 
  * RabbitMQ (Message Consumer & Producer)
* **Events & Routing Keys**:
  * Consumed: `payment.completed` (from `payments.exchange`)
  * Published: `delivery.assigned`, `delivery.completed`, `delivery.updated` (on `delivery.exchange`)

## Architectural & Reliability Patterns

* **Idempotency**: Protects against duplicate payment completion triggers by executing an upsert check on the local `deliveries` table.
* **Transactional Outbox Pattern**: Publishes routing state events reliably via a local Postgres outbox queue.
* **Status Updates**: Simulates delivery latency transitions (`ON_DELIVERY` $\rightarrow$ `DELIVERED`).
