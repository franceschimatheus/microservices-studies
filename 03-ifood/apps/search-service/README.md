# Search Service

The `search-service` provides fast fuzzy searching of restaurants and menu items.

## Technologies Used

* **Language**: Go (Golang)
* **Search Engine / Database**: OpenSearch (Document store and indexes)
* **Communication Protocols**: 
  * gRPC (gRPC Server) for searching
  * RabbitMQ (Message Consumer) for syncing projections
* **Events Consumed**:
  * `restaurant.created`, `menu.updated` (from `restaurants.exchange`)

## Architectural & Reliability Patterns

* **CQRS (Read/Write Projections)**: Writes occur in the `restaurant-service` (via Postgres). The `search-service` consumes events asynchronously and builds read-optimized search indices in OpenSearch in real-time.
* **Resilient Index Initialization**: Safe bootstrap logic checks if index mappings exist in OpenSearch at startup, dynamically creating them if missing.
