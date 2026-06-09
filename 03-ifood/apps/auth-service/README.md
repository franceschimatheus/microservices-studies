# Auth Service

The `auth-service` is responsible for user registration, authentication, and token validation across the platform.

## Technologies Used

* **Language**: Go (Golang)
* **Database**: PostgreSQL (User credentials)
* **Communication Protocol**: gRPC (gRPC Server)
* **Security & Tokens**: JWT (JSON Web Tokens), `golang.org/x/crypto/bcrypt` (Password hashing)

## Architectural & Reliability Patterns

* **Clean Architecture**: Structured with `domain`, `repository`, `service`, and `handler` layers.
* **Database Isolations**: Owns the PostgreSQL user database. Access from other services is strictly mediated via gRPC.
* **Graceful Shutdown**: Handled cleanly in the bootstrap wrapper `internal/app` to shut down the database pool and gRPC listeners.
* **Reset Endpoint**: Supports admin-restricted database state resets.
