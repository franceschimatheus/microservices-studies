package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"math/rand"
	"os"
	"os/signal"
	"sync"
	"sync/atomic"
	"syscall"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

// Task represents the work payload sent to RabbitMQ.
type Task struct {
	ID          string    `json:"id"`
	Description string    `json:"description"`
	DurationMs  int       `json:"duration_ms"` // simulated processing time
	Timestamp   time.Time `json:"timestamp"`
}

func main() {
	// Define command-line flags
	countFlag := flag.Int("count", 0, "Total number of tasks to publish (0 for infinite)")
	delayFlag := flag.Duration("delay", 2*time.Second, "Delay between tasks (e.g. 2s, 10ms, 0s)")
	concurrencyFlag := flag.Int("concurrency", 1, "Number of concurrent publishing goroutines")
	flag.Parse()

	// 1. Get RabbitMQ URL from environment or fallback to local default
	rabbitURL := os.Getenv("RABBITMQ_URL")
	if rabbitURL == "" {
		rabbitURL = "amqp://guest:guest@localhost:5672/"
	}

	log.Printf("Connecting to RabbitMQ at %s...", rabbitURL)

	// 2. Establish connection to the broker
	var conn *amqp.Connection
	var err error
	for i := 1; i <= 5; i++ {
		conn, err = amqp.Dial(rabbitURL)
		if err == nil {
			break
		}
		log.Printf("Failed to connect (attempt %d/5): %v. Retrying in 2s...", i, err)
		time.Sleep(2 * time.Second)
	}
	if err != nil {
		log.Fatalf("Could not connect to RabbitMQ: %v", err)
	}
	defer func() {
		log.Println("Closing RabbitMQ connection...")
		conn.Close()
	}()

	// 3. Open a channel
	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("Failed to open a channel: %v", err)
	}
	defer func() {
		log.Println("Closing RabbitMQ channel...")
		ch.Close()
	}()

	// 4. Declare a durable queue
	queueName := "task_queue"
	q, err := ch.QueueDeclare(
		queueName, // name
		true,      // durable (survives broker restart)
		false,     // delete when unused
		false,     // exclusive (used by only one connection)
		false,     // no-wait
		nil,       // arguments
	)
	if err != nil {
		log.Fatalf("Failed to declare a queue: %v", err)
	}

	log.Printf("Queue '%s' is ready. Starting %d publisher(s) with delay %v (Target count: %d)...",
		q.Name, *concurrencyFlag, *delayFlag, *countFlag)

	// 5. Setup context for graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Capture interrupt signals to stop publishing gracefully
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
	go func() {
		sig := <-sigChan
		log.Printf("Received signal %v. Initiating graceful shutdown...", sig)
		cancel()
	}()

	// Initialize random seed
	rand.Seed(time.Now().UnixNano())

	var publishedCount uint64
	var wg sync.WaitGroup

	// Start concurrent publisher goroutines
	for w := 1; w <= *concurrencyFlag; w++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			localTaskCounter := 1

			for {
				select {
				case <-ctx.Done():
					return
				default:
					// Check if we reached the target count (if count is configured)
					currentTotal := atomic.LoadUint64(&publishedCount)
					if *countFlag > 0 && currentTotal >= uint64(*countFlag) {
						return
					}

					// Generate a simulated task
					taskDuration := rand.Intn(25) + 5 // random duration between 500ms and 3000ms
					taskID := fmt.Sprintf("task-w%d-%d", workerID, localTaskCounter)
					task := Task{
						ID:          taskID,
						Description: fmt.Sprintf("Simulated heavy workload job %s", taskID),
						DurationMs:  taskDuration,
						Timestamp:   time.Now(),
					}

					body, err := json.Marshal(task)
					if err != nil {
						log.Printf("[Worker %d] Failed to marshal task JSON: %v", workerID, err)
						continue
					}

					// Publish message with persistent delivery mode
					err = ch.PublishWithContext(
						ctx,
						"",     // exchange
						q.Name, // routing key
						false,  // mandatory
						false,  // immediate
						amqp.Publishing{
							DeliveryMode: amqp.Persistent,
							ContentType:  "application/json",
							Body:         body,
						},
					)
					if err != nil {
						log.Printf("[Worker %d] Failed to publish task %s: %v", workerID, taskID, err)
					} else {
						newTotal := atomic.AddUint64(&publishedCount, 1)
						localTaskCounter++

						// Log batch updates for high throughput, or log everything if delay is long
						if *delayFlag >= 50*time.Millisecond {
							log.Printf("[Worker %d] Published: %s (Duration: %dms, Total: %d)",
								workerID, taskID, task.DurationMs, newTotal)
						} else if newTotal%500 == 0 || newTotal == uint64(*countFlag) {
							log.Printf("[Batch] Successfully published %d tasks so far...", newTotal)
						}
					}

					// Apply delay
					if *delayFlag > 0 {
						select {
						case <-ctx.Done():
							return
						case <-time.After(*delayFlag):
						}
					}
				}
			}
		}(w)
	}

	wg.Wait()
	log.Printf("Publishing complete. Total tasks published: %d", atomic.LoadUint64(&publishedCount))
}
