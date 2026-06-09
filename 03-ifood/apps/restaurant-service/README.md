# Restaurant Service

The `restaurant-service` manages restaurants, menu categories, and items, controlling availability and details.

## Technologies Used

* **Language**: Go (Golang)
* **Database**: PostgreSQL (Restaurants and menus)
* **Communication Protocols**: 
  * gRPC (gRPC Server) for synchronous calls
  * RabbitMQ (Message Producer) for asynchronous events
* **Events & Routing Keys**:
  * Exchange: `restaurants.exchange` (Topic)
  * Event Types: `restaurant.created`, `menu.updated`

## Architectural & Reliability Patterns

* **Transactional Outbox Pattern**: Ensures event publishing reliability. Restaurant and menu changes are written to the database alongside an event record in an `outbox` table in a single local database transaction. A background worker periodically polls the outbox and publishes pending events to RabbitMQ, guaranteeing at-least-once delivery even during broker outages.
* **Database Isolation**: Owns its database. Schema changes are version-controlled via migrations.
