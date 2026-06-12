# AI Agent Instructions & Guidelines for iFood Clone

Welcome! This repository is a distributed systems study project simulating a food delivery platform. As an AI coding assistant, you must strictly adhere to the project's architectural principles and coding guidelines.

---

## 1. Monorepo Structure & Conventions

Every Go microservice in `/apps` must follow the Clean Architecture pattern:

- **`domain/`**: Contains entities, core business logic, and interface definitions.
- **`repository/`**: Contains data source access implementations (e.g., PostgreSQL, Redis, OpenSearch).
- **`service/`**: Contains use cases and business logic implementations.
- **`handler/`**: Contains the transport/API layer (e.g., REST controllers, gRPC handlers).

### Bootstrap & Configuration Rules
1. **No direct `os.Getenv` in `main.go`**: Always parse environment variables in a dedicated configuration file/package (e.g., `internal/config`) using a struct and proper validation.
2. **App Wrapper Component**: Build an `App` struct (e.g., in `internal/app`) to handle bootstrap, service wiring, dependency injection, listeners, and graceful shutdown cleanly. Keep `main.go` minimal.

---

## 2. Database Ownership & Communication Rules

- **Strict DB Isolation**: Each microservice owns its own database.
- **NO Shared Databases**: Service A must **NEVER** read or write to Service B's database directly.
- **Communication Channels**:
  - **Synchronous**: Internal communication between services must use **gRPC** (defined in Protobuf contracts).
  - **Asynchronous**: Event-driven communication must use **RabbitMQ** (using topic exchanges and routing keys).

---

## 3. Technology Stack

- **Backend**: Go (using Fiber for REST, standard `grpc` for internal RPC)
- **Frontend**: Next.js (located in `/apps/web`)
- **Event Broker**: RabbitMQ
- **Databases**: PostgreSQL (Auth, Restaurant, Order, Payment, Analytics), Redis (Cart, Notifications caching)
- **Search**: OpenSearch
- **Observability**: Prometheus (Metrics), Jaeger (Tracing), Loki (Logs), Grafana (Dashboards)
- **Dev Environment**: Nix (using `nix develop` or `nix-shell` to lock toolchain versions)
- **Deployment**: Docker Compose

---

## Nix Development Environment

- **Toolchain Consistency**: This project uses **Nix** (`flake.nix`) to manage toolchains (Go compiler, protobuf compiler, golang-migrate, task, etc.).
- **Usage**: Agents and developers should run inside the Nix shell (`nix develop` or `nix-shell`) to ensure environment parity and avoid host compiler version conflicts.
- **Frontend Isolation**: The frontend in `apps/web` has its own isolated Nix environment (`flake.nix`). When working on frontend tools (like running `pnpm lint`), you must first navigate to the web directory (`cd apps/web`) and start its specific shell (`nix develop`).

---

## 4. Current Goal: Phase 6 — Search + Analytics

We are currently working on **Phase 6 — Search + Analytics**. The task is to structure the data pipeline, databases, KPIs, and dashboards:

### Tasks:
1. **Analytics Consumer**: Create an `analytics-service` that consumes all microservice events from RabbitMQ (e.g., `order.created`, `order.cancelled`, `payment.completed`, `payment.failed`, `delivery.completed`).
2. **Database Schema**: Store event logs and metrics in `postgres-analytics`.
3. **KPIs & Metrics**:
- Total Orders & Revenue
   - Order Status distribution (delivered vs. cancelled)
   - Payment Success rate
   - Delivery latency/times
4. **Dashboards**: Build operational dashboards/visualizations (Grafana or in the Next.js Admin panel).

---

## 5. Next.js Frontend Development Guidelines (`/apps/web`)

To maintain clean architecture, strong typing, and visual usability on the Next.js frontend:

### 1. Package Manager & Shell
- Always use **`pnpm`** inside the `apps/web` specific Nix development environment (`cd apps/web && nix develop --command pnpm <cmd>`). Do not use `npm` or `yarn`.

### 2. Feature-based Folder Structure
Code must be organized by domain inside `src/features/[feature-name]/`:
- **`queries/`**: Dedicated subfolder containing TanStack Query custom query and mutation hooks.
  - **Rule**: Create exactly **one file per query/mutation hook** to prevent bloated file compilation (e.g., `useCartQuery.ts`, `useAddToCartMutation.ts`).
- **`schemas/`**: Zod verification schemas and TypeScript types.
- **`components/`**: UI components specific to the feature.
- **`store/`**: Zustand stores for client-only global state.

### 3. Zod Schema Conventions & Validation
- **Inheritance**: Form schemas must extend, pick, or omit from their sibling base domain schemas rather than duplicating properties manually.
- **API Validation**: Always run Zod schema `.parse(...)` on API responses inside your query and mutation hooks to guarantee runtime type-safety before returning data.

### 4. Mutation Parameter Separation
- For mutations modifying existing resources (requiring an ID and a body payload), separate the parameters explicitly inside the payload object:
  ```typescript
  mutationFn: async ({ id, data }: { id: string; data: FormType }) => { ... }
  ```

### 5. Separation of State Managers
- **Server State**: Managed exclusively via **TanStack Query** (`useQuery` and `useMutation`). Always incorporate cache invalidations and optimistic updates where responsive feedback is required (e.g., shopping cart actions).
- **Client State**: Managed via **Zustand** stores for global UI variables (e.g., drawer toggles, active modes) or session states.

### 6. Decoupled Customer Pages
- Design the customer flow using clean page routing rather than bloated single-page dashboards:
  - `/customer` (browse homepage, search bar, categories)
  - `/customer/restaurants/[id]` (dedicated restaurant page organizing items by category)
  - `/customer/profile` (profile settings and "My Orders" listing with real-time updates)

