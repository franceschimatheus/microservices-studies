# Shared RabbitMQ Package

Wraps RabbitMQ broker connections, channel management, consumer subscription loops, and transactional event publishing.

## Features

* **Topic Exchanges**: Automates declarations and routing binding configurations for standard exchange topologies.
* **Auto-Reconnect Loop**: Implements connection health-checks and auto-recovery for subscribers when connection to RabbitMQ drops.
* **Outbox Publisher Engine**: Provides standard helpers for background workers to fetch rows from Postgres `outbox` tables, deserialize them, publish them to RabbitMQ, and mark them completed.
