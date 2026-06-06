package main

import (
	"log"
	"math/rand"
	"net/http"
	"sync"
	"time"

	"simulator/internal/config"
)

func main() {
	cfg := config.Load()

	log.Printf("Starting simulator with %d concurrent users targeting gateway %s", cfg.ConcurrentUsers, cfg.GatewayURL)

	rand.Seed(time.Now().UnixNano())

	var wg sync.WaitGroup
	for i := 0; i < cfg.ConcurrentUsers; i++ {
		wg.Add(1)
		go func(userID int) {
			defer wg.Done()
			runUserSimulator(userID, cfg.GatewayURL)
		}(i)
	}
	wg.Wait()
}

func runUserSimulator(simID int, gatewayURL string) {
	log.Printf("[User-%d] Starting simulator session", simID)

	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	token, err := signUpAndSignIn(client, gatewayURL, simID)
	if err != nil {
		log.Printf("[User-%d] Authentication flow failed: %v", simID, err)
		return
	}

	// User main interaction loop
	for {
		// Wait a random duration between actions
		time.Sleep(time.Duration(3+rand.Intn(7)) * time.Second)

		simulateOrderFlow(client, gatewayURL, simID, token)

		// Longer break after checking out before the next cycle
		time.Sleep(time.Duration(10+rand.Intn(20)) * time.Second)
	}
}
