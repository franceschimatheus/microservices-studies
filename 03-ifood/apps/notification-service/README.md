# Notification Service

The `notification-service` sends order status updates to users (simulated via Redis/Logs).

## Technologies Used

* **Language**: Go (Golang)
* **Database**: Redis (Notification logs and deduplication cache)
* **Communication Protocols**: 
  * RabbitMQ (Message Consumer)
* **Events Consumed**:
  * `order.created` (from `orders.exchange`)
  * `payment.completed`, `payment.failed` (from `payments.exchange`)
  * `delivery.assigned`, `delivery.completed` (from `delivery.exchange`)

## Architectural & Reliability Patterns

* **Idempotency (Deduplication)**: Uses Redis with short key expirations to store processed event IDs. If a duplicate event is delivered from RabbitMQ, it is ignored before notifications are re-sent.
* **Non-Blocking Processing**: Implements decoupled workers to process notifications asynchronously.
