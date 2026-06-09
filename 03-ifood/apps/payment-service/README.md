# Payment Service

The `payment-service` processes order transactions, coordinating with external payment mocks.

## Technologies Used

* **Language**: Go (Golang)
* **Database**: PostgreSQL (Payments, Outbox)
* **Communication Protocols**: 
  * RabbitMQ (Message Consumer & Producer)
* **Events & Routing Keys**:
  * Consumed: `order.created` (from `orders.exchange`)
  * Published: `payment.completed`, `payment.failed` (on `payments.exchange`)
  * DLQ Exchange: `payments.dlq.exchange`

## Architectural & Reliability Patterns

* **Idempotency**: Before processing any transaction, the service checks if a payment record with the incoming `order_id` already exists in the Postgres database. Duplicate `order.created` messages are safely discarded without re-processing charges.
* **Retries & Dead Letter Queue (DLQ)**: Failed payment consumptions (e.g. database network failures) are retried with backoff. If failures persist, the message is routed to the DLQ exchange to prevent blocking other transactions.
* **Transactional Outbox Pattern**: Payment status modifications and event emissions are kept transactionally atomic using the local DB outbox table.
