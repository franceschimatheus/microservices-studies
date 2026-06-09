# Analytics Service

The `analytics-service` builds the platform data lake, exposing KPIs and system operational metrics.

## Technologies Used

* **Language**: Go (Golang)
* **Database**: PostgreSQL (Data Lake database `postgres-analytics`)
* **Communication Protocols**: 
  * gRPC (gRPC Server) for querying KPIs
  * RabbitMQ (Message Consumer) for event ingestion
* **Events Consumed**:
  * All transactional events (`order.created`, `order.updated`, `payment.completed`, `payment.failed`, `delivery.assigned`, `delivery.completed`, `delivery.updated`)

## Architectural & Reliability Patterns

* **Bronze-Silver-Gold Data Pipeline**:
  * **Bronze (Raw Ingestion)**: Events from RabbitMQ are stored as-is in the `raw_events` table (JSONB).
  * **Silver (Refined Layer)**: A background worker polls the unprocessed raw events every 5 seconds, parses the JSON, and upserts them into structured tables (`orders_refined`, `payments_refined`, `deliveries_refined`).
  * **Gold (KPI Views)**: Standard Postgres views (`kpi_orders_summary`, `kpi_payment_success_rate`, `kpi_delivery_performance`) aggregate the Silver tables for real-time reporting.
* **Deterministic Idempotency Key**: Uses incoming event IDs to discard duplicate events at the raw ingestion layer.
* **Format Protection**: Utilizes v3 UUID hashing on dirty event payloads to prevent SQL format injection syntax errors.
