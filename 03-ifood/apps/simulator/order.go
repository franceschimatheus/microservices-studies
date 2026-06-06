package main

import (
	"log"
	"math/rand"
	"net/http"
	"time"
)

type Restaurant struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

type MenuItem struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
}

func simulateOrderFlow(client *http.Client, gatewayURL string, simID int, token string) {
	// 3. List Restaurants
	var restaurants []Restaurant
	if err := getJSON(client, gatewayURL+"/restaurants", token, &restaurants); err != nil {
		log.Printf("[User-%d] Failed to list restaurants: %v", simID, err)
		return
	}

	if len(restaurants) == 0 {
		log.Printf("[User-%d] No restaurants found on platform", simID)
		return
	}

	// Select a random restaurant
	selectedRestaurant := restaurants[rand.Intn(len(restaurants))]
	log.Printf("[User-%d] Selected restaurant: %s", simID, selectedRestaurant.Name)

	// Generate mock menu items based on restaurant name
	menu := getMockMenu(selectedRestaurant.Name)

	// 4. Add 1 to 3 items to the cart
	itemsCount := 1 + rand.Intn(3)
	log.Printf("[User-%d] Adding %d items to cart...", simID, itemsCount)
	for j := 0; j < itemsCount; j++ {
		item := menu[rand.Intn(len(menu))]
		cartPayload := map[string]interface{}{
			"menu_item_id":  item.ID,
			"restaurant_id": selectedRestaurant.ID,
			"name":          item.Name,
			"price":         item.Price,
			"quantity":      1,
		}
		if err := postJSON(client, gatewayURL+"/cart/items", cartPayload, token, nil); err != nil {
			log.Printf("[User-%d] Failed to add item %s to cart: %v", simID, item.Name, err)
			break
		}
		time.Sleep(500 * time.Millisecond)
	}

	// 5. Checkout
	orderPayload := map[string]string{
		"restaurant_id": selectedRestaurant.ID,
	}
	if err := postJSON(client, gatewayURL+"/orders", orderPayload, token, nil); err != nil {
		log.Printf("[User-%d] Checkout order failed: %v", simID, err)
	} else {
		log.Printf("[User-%d] Placed order successfully at %s!", simID, selectedRestaurant.Name)
	}
}

func getMockMenu(restaurantName string) []MenuItem {
	isPizza := rand.Intn(2) == 0
	if isPizza {
		return []MenuItem{
			{ID: "p1", Name: "Margherita Pizza", Price: 12.99},
			{ID: "p2", Name: "Pepperoni Pizza", Price: 14.99},
			{ID: "p3", Name: "Garlic Parmesan Breadsticks", Price: 5.99},
			{ID: "p4", Name: "Tiramisu", Price: 6.99},
		}
	}
	return []MenuItem{
		{ID: "m1", Name: "Classic Cheeseburger", Price: 10.99},
		{ID: "m2", Name: "Crispy French Fries", Price: 3.99},
		{ID: "m3", Name: "Chocolate Milkshake", Price: 5.49},
	}
}
