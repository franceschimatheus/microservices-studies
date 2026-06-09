# Cart Service

The `cart-service` manages active customer shopping carts before checkout.

## Technologies Used

* **Language**: Go (Golang)
* **Database**: Redis (Key-value cache store)
* **Communication Protocol**: gRPC (gRPC Server)

## Architectural & Reliability Patterns

* **High-Throughput Caching**: Utilizes Redis for sub-millisecond cart read and write operations.
* **Session Validation**: Integrates with the Auth Service client to validate users before reading/editing carts.
* **Auto-Expiration**: Configures Redis TTLs on carts to release memory automatically for idle users.
