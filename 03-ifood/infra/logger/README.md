# Shared Logger Package

A centralized utility wrapping Go's standard `log/slog` library to ensure consistent structured JSON logging across all backend microservices.

## Features

* **JSON Format**: Emits all logs in structured JSON format, enabling Loki / Promtail to easily parse and aggregate them.
* **Correlation ID Support**: Handles correlation ID contexts to trace logs originating from the same HTTP request/session.
* **Context Ingestion**: Integrates cleanly with standard context scopes (`slog.InfoContext`, `slog.ErrorContext`).
