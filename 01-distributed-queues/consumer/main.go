package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"os/signal"
	"sync"
	"sync/atomic"
	"syscall"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

// Task represents the work payload sent from RabbitMQ.
type Task struct {
	ID          string    `json:"id"`
	Description string    `json:"description"`
	DurationMs  int       `json:"duration_ms"` // simulated processing time
	Timestamp   time.Time `json:"timestamp"`
}

func main() {
	// Define command-line flags
	verboseFlag := flag.Bool("verbose", true, "Print details for every single task (disable for high performance)")
	simulateWorkFlag := flag.Bool("simulate-work", true, "Simulate heavy processing time by sleeping")
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

	// 4. Declare the same durable queue
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

	// 5. Set Quality of Service (QoS) Prefetch Count
	err = ch.Qos(
		1,     // prefetch count
		0,     // prefetch size
		false, // global
	)
	if err != nil {
		log.Fatalf("Failed to set QoS prefetch: %v", err)
	}

	// 6. Generate a unique consumer tag
	consumerTag := fmt.Sprintf("consumer-%d", os.Getpid())

	// 7. Register consumer with autoAck = false
	msgs, err := ch.Consume(
		q.Name,      // queue
		consumerTag, // consumer tag (unique)
		false,       // autoAck: FALSE
		false,       // exclusive
		false,       // noLocal
		false,       // noWait
		nil,         // args
	)
	if err != nil {
		log.Fatalf("Failed to register consumer: %v", err)
	}

	log.Printf("Consumer registered with tag '%s'. Waiting for tasks (SimulateWork: %v, Verbose: %v)...",
		consumerTag, *simulateWorkFlag, *verboseFlag)

	// 8. Setup Graceful Shutdown coordination
	var wg sync.WaitGroup
	shutdownChan := make(chan struct{})
	var processedCount uint64

	// Handle SIGINT and SIGTERM
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	// 9. Throughput Metrics Reporter Goroutine
	go func() {
		ticker := time.NewTicker(5 * time.Second)
		defer ticker.Stop()
		var lastCount uint64
		startTime := time.Now()

		for {
			select {
			case <-shutdownChan:
				return
			case <-ticker.C:
				currentCount := atomic.LoadUint64(&processedCount)
				diff := currentCount - lastCount
				elapsed := time.Since(startTime).Seconds()
				avgThroughput := float64(currentCount) / elapsed
				recentThroughput := float64(diff) / 5.0

				log.Printf("[Metrics] Processed %d tasks in last 5s (Recent: %.1f/s, Cumulative Avg: %.1f/s, Total: %d)",
					diff, recentThroughput, avgThroughput, currentCount)
				lastCount = currentCount
			}
		}
	}()

	// 10. Message processing loop
	go func() {
		for d := range msgs {
			wg.Add(1)

			func(msg amqp.Delivery) {
				defer wg.Done()

				var task Task
				if err := json.Unmarshal(msg.Body, &task); err != nil {
					log.Printf("Failed to parse task JSON: %v. Rejecting message.", err)
					if rejectErr := msg.Reject(false); rejectErr != nil {
						log.Printf("Failed to reject bad message: %v", rejectErr)
					}
					return
				}

				if *verboseFlag {
					latency := time.Since(task.Timestamp)
					log.Printf("[►] Received task %s: '%s' (Queue latency: %v)", task.ID, task.Description, latency.Round(time.Millisecond))
					if *simulateWorkFlag {
						log.Printf("[⚙] Processing %s for %dms...", task.ID, task.DurationMs)
					}
				}

				// Simulated processing
				if *simulateWorkFlag {
					select {
					case <-time.After(time.Duration(task.DurationMs) * time.Millisecond):
						// Work completed
					case <-shutdownChan:
						log.Printf("[✘] Interrupted while processing %s. Requeuing task...", task.ID)
						if nackErr := msg.Nack(false, true); nackErr != nil {
							log.Printf("Failed to NACK message %s: %v", task.ID, nackErr)
						}
						return
					}
				}

				// Acknowledge completed work
				if ackErr := msg.Ack(false); ackErr != nil {
					log.Printf("Failed to ACK message %s: %v", task.ID, ackErr)
				} else {
					atomic.AddUint64(&processedCount, 1)
					if *verboseFlag {
						log.Printf("[✔] Completed task %s.", task.ID)
					}
				}
			}(d)
		}
		log.Println("Consumer delivery channel closed.")
	}()

	// Block until a signal is received
	sig := <-sigChan
	log.Printf("Received signal %v. Initiating graceful shutdown...", sig)

	// Close the shutdown channel to signal any active workers
	close(shutdownChan)

	// Cancel the consumer subscription to stop receiving new messages from RabbitMQ.
	// This must be done while the channel is still open (before main returns and defer ch.Close() runs).
	log.Printf("Canceling consumer subscription '%s'...", consumerTag)
	if err := ch.Cancel(consumerTag, false); err != nil {
		log.Printf("Error canceling consumer: %v", err)
	}

	log.Println("Waiting for active tasks to finish...")
	wg.Wait()
	log.Println("All active tasks completed. Exiting consumer.")
}
