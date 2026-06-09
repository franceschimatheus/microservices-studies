# Shared Prometheus Package

Wraps Prometheus metric collectors, HTTP endpoint registrations, and database connection pool stats collectors.

## Features

* **Standardized `/metrics` Server**: Starts a dedicated HTTP metrics server on individual microservice ports.
* **Middlewares**: Captures HTTP response times, request counts, and response status codes.
* **DB Connection Pool Scraping**: Exposes active/idle connections, wait times, and total queries for both Postgres (`pgxpool`) and Redis client pools.
