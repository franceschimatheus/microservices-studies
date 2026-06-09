# Bootstrap Service

The `bootstrap-service` is a development and testing utility for resetting the system database cluster state.

## Technologies Used

* **Language**: Go (Golang)
* **Databases**: Postgres SQL client, Redis client, OpenSearch HTTP endpoints
* **Seeding Protocol**: Gateway REST client calls

## Architectural & Reliability Patterns

* **Wipe Engine**: Runs database-level cascades to truncate tables on all Postgres nodes, flushes Redis caches, and deletes OpenSearch indexes.
* **REST API Seeder**: Rather than executing raw SQL to write seeded restaurants and menus (which would bypass RabbitMQ and OpenSearch indexes), the service logs in as admin and calls the Gateway's REST endpoints. This forces all microservices to execute their natural workflows, keeping search and analytics perfectly in sync.
