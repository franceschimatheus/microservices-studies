# Study 01: Distributed Message Queues in Go (RabbitMQ)

This project is a hands-on sandbox for studying **Distributed Message Queues** and **Microservice Architectures** in Go. It demonstrates how independent services can communicate asynchronously using **RabbitMQ** as an external message broker.

---

## Architecture & Concepts Covered

```mermaid
flowchart LR
    P[Go Producer] -- "Publish JSON Task (Persistent)" --> EX["RabbitMQ Default Exchange"]
    EX -- Routing Key --> Q["task_queue (Durable)"]
    Q -- "Fair Dispatch (Prefetch = 1)" --> C1[Go Consumer 1]
    Q -- "Fair Dispatch (Prefetch = 1)" --> C2[Go Consumer 2]
```

### 1. Message & Queue Durability
- **Durable Queue**: The `task_queue` is declared with `durable: true`. This ensures that the queue definition survives a RabbitMQ broker restart.
- **Persistent Messages**: The producer publishes tasks with `DeliveryMode: amqp091.Persistent`. This tells RabbitMQ to write messages to disk, guaranteeing they are not lost if the broker crashes before they are processed.

### 2. Manual Acknowledgments (ACKs)
- Instead of using `autoAck = true` (where RabbitMQ considers a message processed as soon as it is sent to the client), we set `autoAck = false`.
- The consumer only acknowledges the message (`msg.Ack(false)`) **after** the simulated work has successfully completed.
- If a consumer crashes mid-job, the unacknowledged message remains in the broker and is automatically re-queued and delivered to another active consumer.

### 3. Fair Dispatch & Competing Consumers (QoS Prefetch)
- We set Quality of Service (`ch.Qos(1, 0, false)`) to restrict the **prefetch count to 1**.
- Without this, RabbitMQ would distribute messages evenly to all consumers in a round-robin fashion when they arrive, regardless of how busy each worker is.
- Setting prefetch to `1` ensures RabbitMQ only gives **one** message to a consumer at a time, dispatching the next one only when the consumer has finished and ACKed the current message. This distributes the workload dynamically based on worker speed.

---

## Project Structure

- `flake.nix`: Root Nix shell configuration providing `go`, `go-task`, `gopls`, `golangci-lint`, etc.
- `Taskfile.yml`: Root task runner automation configuration.
- `01-distributed-queues/docker-compose.yml`: Launches RabbitMQ with the Management Web UI.
- `01-distributed-queues/producer/`: A Go service that streams simulated work tasks as JSON. Supports concurrency and delay flags.
- `01-distributed-queues/consumer/`: A Go service that consumes tasks, simulates execution time, and manually acknowledges them. Tracks throughput metrics.

---

## Nix & Go-Task Developer Environment

We use a **Nix DevShell** and **Go Task** runner to standardize the workspace. To use it:

1. Open your terminal at the project root.
2. Enter the development shell:
   ```bash
   nix develop
   ```
3. List available tasks:
   ```bash
   task
   ```

### Task Commands
- **`task up`**: Spin up the local RabbitMQ broker in the background.
- **`task down`**: Tear down the RabbitMQ broker.
- **`task producer`**: Run the Go task producer (standard 2s delay).
- **`task consumer`**: Run a Go consumer instance (standard simulated sleep).
- **`task consumer-fast`**: Run a silent, zero-latency consumer for benchmarking queue and connection throughput.
- **`task stress`**: Runs the producer with 5 concurrent routines, publishing 5000 tasks with a 1ms delay between them.

---

## Step-by-Step Execution Guide

### Step 1: Start the Infrastructure
Inside your Nix dev shell at the root, run:
```bash
task up
```
Verify it is running:
- Open your browser and go to: **[http://localhost:15672](http://localhost:15672)**
- Log in with credentials: `guest` / `guest`.

---

### Step 2: Run the Consumer
In a terminal inside the dev shell, start a consumer worker:
```bash
task consumer
```
The consumer will connect and block, waiting for messages to arrive.

---

### Step 3: Run the Producer
In a separate terminal inside the dev shell, start the producer:
```bash
task producer
```
The producer will start publishing a simulated task every 2 seconds:
```text
Connecting to RabbitMQ at amqp://guest:guest@localhost:5672/...
Queue 'task_queue' is ready. Starting task publisher...
Published successfully: task-1 (Simulated processing time: 1138ms)
```

In the consumer terminal, you will see the tasks being received, processed, and acknowledged:
```text
[►] Received task task-1: 'Simulated heavy workload job #1'
[⚙] Processing task-1 for 1138ms...
[✔] Completed task task-1.
```

---

## Stress Testing & Performance Benchmarking

To study broker and service throughput limits, we can run stress tests:

1. In terminal 1 (inside `nix develop`), start the high-performance consumer:
   ```bash
   task consumer-fast
   ```
   *This starts the consumer with `-verbose=false -simulate-work=false`. It silences per-task printing and acknowledges messages instantly, bypassing processing and console write overhead.*

2. In terminal 2 (inside `nix develop`), run the stress test:
   ```bash
   task stress
   ```
   *This launches 5 concurrent publisher goroutines to queue up 5000 tasks at high speed (1ms delay).*

3. Monitor the consumer terminal (terminal 1). Every 5 seconds, it will log the current processing throughput:
   ```text
   [Metrics] Processed 1842 tasks in last 5s (Recent: 368.4/s, Cumulative Avg: 368.4/s, Total: 1842)
   [Metrics] Processed 2158 tasks in last 5s (Recent: 431.6/s, Cumulative Avg: 400.0/s, Total: 4000)
   ```

You can open a 3rd terminal, run another `task consumer-fast`, and observe how the task load is split, and how the overall cumulative throughput numbers scale up!

---

### Step 4: Scale and Test Competing Consumers (Parallelism)
To see RabbitMQ's fair dispatching in action:
1. Open a **third** terminal, enter the Nix dev shell (`nix develop`), and start a **second consumer**:
   ```bash
   task consumer
   ```
2. Observe how the workload is shared between the two consumers.
3. Because the simulated processing time for each task is randomized (between 500ms and 3000ms), you will see that a consumer processing a short task will complete it and quickly take another one, while the other consumer remains busy with its longer task. This demonstrates dynamic load balancing (prefetch limit).

---

### Step 5: Test Resiliency & Chaos (Worker Crash)
To verify that messages are never lost during worker failures:
1. Keep the producer running.
2. Start a consumer and let it start processing a task.
3. **Kill the consumer process** (press `Ctrl+C` in its terminal) while it is printing `[⚙] Processing task-...`.
4. Observe the console:
   - Thanks to the graceful shutdown logic, the consumer will catch the SIGINT, NACK the active message, and tell RabbitMQ to requeue it.
   - If you kill the consumer abruptly (e.g. `kill -9`), RabbitMQ will detect that the socket connection closed and will automatically requeue the message.
5. Spin up the consumer again (`task consumer`). You will see that the exact task that was interrupted is received again and completed successfully.
