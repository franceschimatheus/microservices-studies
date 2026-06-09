package main

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"
)

type Config struct {
	AuthDBURL       string
	RestaurantDBURL string
	OrderDBURL      string
	AnalyticsDBURL  string
	RedisAddr       string
	OpenSearchURL   string
	GatewayURL      string
	Port            string
}

func main() {
	cfg := Config{
		AuthDBURL:       os.Getenv("AUTH_DB_URL"),
		RestaurantDBURL: os.Getenv("RESTAURANT_DB_URL"),
		OrderDBURL:      os.Getenv("ORDER_DB_URL"),
		AnalyticsDBURL:  os.Getenv("ANALYTICS_DB_URL"),
		RedisAddr:       os.Getenv("REDIS_ADDR"),
		OpenSearchURL:   os.Getenv("OPENSEARCH_URL"),
		GatewayURL:      os.Getenv("GATEWAY_URL"),
		Port:            os.Getenv("PORT"),
	}

	if cfg.Port == "" {
		cfg.Port = "8090"
	}

	http.HandleFunc("/reset", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		log.Println("Received system reset request...")
		err := performReset(cfg)
		if err != nil {
			log.Printf("Reset failed: %v", err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}

		log.Println("System reset completed successfully.")
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"message": "System reset and seeded successfully"})
	})

	log.Printf("Bootstrap service starting on port %s...", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, nil); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

func performReset(cfg Config) error {
	ctx := context.Background()

	// 1. Reset Redis
	log.Println("Resetting Redis...")
	rdb := redis.NewClient(&redis.Options{Addr: cfg.RedisAddr})
	defer rdb.Close()
	if err := rdb.FlushAll(ctx).Err(); err != nil {
		log.Printf("Warning: Redis flush failed: %v", err)
	}

	// 2. Reset Postgres Databases
	dbs := []struct {
		name string
		url  string
		sql  string
	}{
		{
			name: "auth",
			url:  cfg.AuthDBURL,
			sql:  "TRUNCATE TABLE users CASCADE;",
		},
		{
			name: "restaurant",
			url:  cfg.RestaurantDBURL,
			sql:  "TRUNCATE TABLE menu_items, categories, restaurants CASCADE;",
		},
		{
			name: "order",
			url:  cfg.OrderDBURL,
			sql:  "TRUNCATE TABLE order_items, orders CASCADE;",
		},
		{
			name: "analytics",
			url:  cfg.AnalyticsDBURL,
			sql:  "TRUNCATE TABLE raw_events, orders_refined, payments_refined, deliveries_refined CASCADE;",
		},
	}

	for _, dbInfo := range dbs {
		log.Printf("Truncating %s database...", dbInfo.name)
		db, err := sql.Open("postgres", dbInfo.url)
		if err != nil {
			return fmt.Errorf("failed to open %s db: %w", dbInfo.name, err)
		}
		defer db.Close()

		if _, err := db.ExecContext(ctx, dbInfo.sql); err != nil {
			return fmt.Errorf("failed to truncate %s db: %w", dbInfo.name, err)
		}
	}

	// 3. Reset OpenSearch Indexes
	log.Println("Clearing OpenSearch indexes...")
	indexes := []string{"restaurants", "menus"}
	client := &http.Client{Timeout: 5 * time.Second}
	for _, idx := range indexes {
		req, _ := http.NewRequest(http.MethodDelete, fmt.Sprintf("%s/%s", cfg.OpenSearchURL, idx), nil)
		resp, err := client.Do(req)
		if err != nil {
			log.Printf("Warning: Failed to delete OpenSearch index %s: %v", idx, err)
		} else {
			resp.Body.Close()
			log.Printf("Deleted OpenSearch index %s (Status: %s)", idx, resp.Status)
		}
	}

	// Wait for services to pick up index deletion / migrations if needed
	time.Sleep(1 * time.Second)

	// 4. Seed Data via Gateway HTTP REST API
	log.Println("Seeding Admin user...")
	// Signup Admin
	signupPayload := map[string]string{
		"email":    "admin@email.com",
		"password": "123123123",
		"role":     "admin",
	}
	signupJSON, _ := json.Marshal(signupPayload)
	resp, err := client.Post(cfg.GatewayURL+"/auth/signup", "application/json", bytes.NewBuffer(signupJSON))
	if err != nil {
		return fmt.Errorf("failed to signup admin: %w", err)
	}
	resp.Body.Close()

	// Signin to get Cookie/Token
	log.Println("Logging in as Admin...")
	signinPayload := map[string]string{
		"email":    "admin@email.com",
		"password": "123123123",
	}
	signinJSON, _ := json.Marshal(signinPayload)
	req, _ := http.NewRequest(http.MethodPost, cfg.GatewayURL+"/auth/signin", bytes.NewBuffer(signinJSON))
	req.Header.Set("Content-Type", "application/json")
	resp, err = client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to signin admin: %w", err)
	}
	defer resp.Body.Close()

	// Capture Set-Cookie headers
	cookies := resp.Cookies()
	var authCookie *http.Cookie
	for _, cookie := range cookies {
		if cookie.Name == "session" || cookie.Name == "token" {
			authCookie = cookie
			break
		}
	}

	// 5. Create default restaurants
	restaurantsToSeed := []struct {
		Name        string
		Description string
		Address     string
		Categories  []struct {
			Name  string
			Items []struct {
				Name        string
				Description string
				Price       float64
			}
		}
	}{
		{
			Name:        "Classic Burger Joint 🍔",
			Description: "Gourmet handmade burgers, crispy fries, and refreshing milkshakes.",
			Address:     "123 Main St, Food City",
			Categories: []struct {
				Name  string
				Items []struct {
					Name        string
					Description string
					Price       float64
				}
			}{
				{
					Name: "Burgers",
					Items: []struct {
						Name        string
						Description string
						Price       float64
					}{
						{Name: "Cheeseburger Deluxe", Description: "Black angus beef, cheddar, special sauce", Price: 12.99},
						{Name: "Bacon BBQ Burger", Description: "Crispy bacon, onion rings, hickory BBQ sauce", Price: 14.50},
					},
				},
				{
					Name: "Sides",
					Items: []struct {
						Name        string
						Description string
						Price       float64
					}{
						{Name: "Truffle Fries", Description: "Golden fries tossed in truffle oil and parmesan", Price: 5.99},
					},
				},
			},
		},
		{
			Name:        "Sakura Sushi Bar 🍣",
			Description: "Fresh sashimi, signature maki rolls, and traditional hot ramen.",
			Address:     "456 Blossom Ave, Sushi Town",
			Categories: []struct {
				Name  string
				Items []struct {
					Name        string
					Description string
					Price       float64
				}
			}{
				{
					Name: "Sushi Combos",
					Items: []struct {
						Name        string
						Description string
						Price       float64
					}{
						{Name: "Salmon Lover Combo", Description: "10pcs of salmon nigiri, maki and sashimi", Price: 24.99},
						{Name: "Spicy Tuna Roll", Description: "Tuna, spicy mayo, green onions, sesame", Price: 8.50},
					},
				},
			},
		},
	}

	for _, rest := range restaurantsToSeed {
		log.Printf("Seeding restaurant: %s", rest.Name)

		// Create Restaurant
		restPayload := map[string]string{
			"name":        rest.Name,
			"description": rest.Description,
			"address":     rest.Address,
		}
		restJSON, _ := json.Marshal(restPayload)
		req, _ = http.NewRequest(http.MethodPost, cfg.GatewayURL+"/restaurants", bytes.NewBuffer(restJSON))
		req.Header.Set("Content-Type", "application/json")
		if authCookie != nil {
			req.AddCookie(authCookie)
		}
		resp, err = client.Do(req)
		if err != nil {
			return fmt.Errorf("failed to create restaurant %s: %w", rest.Name, err)
		}
		
		bodyBytes, _ := io.ReadAll(resp.Body)
		resp.Body.Close()

		var createdRest struct {
			ID string `json:"id"`
		}
		if err := json.Unmarshal(bodyBytes, &createdRest); err != nil {
			return fmt.Errorf("failed to parse created restaurant: %w", err)
		}

		if createdRest.ID == "" {
			return fmt.Errorf("created restaurant ID is empty. Response: %s", string(bodyBytes))
		}

		// Create Categories and Items
		for _, cat := range rest.Categories {
			catPayload := map[string]string{
				"name": cat.Name,
			}
			catJSON, _ := json.Marshal(catPayload)
			req, _ = http.NewRequest(http.MethodPost, fmt.Sprintf("%s/restaurants/%s/categories", cfg.GatewayURL, createdRest.ID), bytes.NewBuffer(catJSON))
			req.Header.Set("Content-Type", "application/json")
			if authCookie != nil {
				req.AddCookie(authCookie)
			}
			resp, err = client.Do(req)
			if err != nil {
				return fmt.Errorf("failed to create category %s: %w", cat.Name, err)
			}
			
			bodyBytes, _ = io.ReadAll(resp.Body)
			resp.Body.Close()

			var createdCat struct {
				ID string `json:"id"`
			}
			json.Unmarshal(bodyBytes, &createdCat)

			if createdCat.ID == "" {
				return fmt.Errorf("created category ID is empty. Response: %s", string(bodyBytes))
			}

			for _, item := range cat.Items {
				itemPayload := map[string]interface{}{
					"category_id": createdCat.ID,
					"name":        item.Name,
					"description": item.Description,
					"price":       item.Price,
				}
				itemJSON, _ := json.Marshal(itemPayload)
				req, _ = http.NewRequest(http.MethodPost, cfg.GatewayURL+"/menu-items", bytes.NewBuffer(itemJSON))
				req.Header.Set("Content-Type", "application/json")
				if authCookie != nil {
					req.AddCookie(authCookie)
				}
				resp, err = client.Do(req)
				if err != nil {
					return fmt.Errorf("failed to create menu item %s: %w", item.Name, err)
				}
				resp.Body.Close()
			}
		}
	}

	return nil
}
