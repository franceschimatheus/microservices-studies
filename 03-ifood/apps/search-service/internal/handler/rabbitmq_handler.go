package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"

	"search-service/internal/domain"
	"search-service/internal/service"
)

type RabbitMQHandler struct {
	searchService service.SearchService
}

func NewRabbitMQHandler(searchService service.SearchService) *RabbitMQHandler {
	return &RabbitMQHandler{searchService: searchService}
}

func (h *RabbitMQHandler) HandleRestaurantEvent(ctx context.Context, body []byte) error {
	tr := otel.Tracer("search-service")
	ctx, span := tr.Start(ctx, "search-service.HandleRestaurantEvent")
	defer span.End()

	var event struct {
		Action     string                    `json:"action"`
		Restaurant domain.RestaurantDocument `json:"restaurant"`
	}

	if err := json.Unmarshal(body, &event); err != nil {
		return fmt.Errorf("failed to unmarshal restaurant event: %w", err)
	}

	span.SetAttributes(
		attribute.String("event.action", event.Action),
		attribute.String("restaurant.id", event.Restaurant.ID),
		attribute.String("restaurant.name", event.Restaurant.Name),
	)

	slog.InfoContext(ctx, "Consuming restaurant event", "action", event.Action, "restaurant_id", event.Restaurant.ID)

	switch event.Action {
	case "create", "update":
		return h.searchService.IndexRestaurant(ctx, &event.Restaurant)
	case "delete":
		return h.searchService.DeleteRestaurant(ctx, event.Restaurant.ID)
	default:
		slog.WarnContext(ctx, "Unknown restaurant event action", "action", event.Action)
		return nil
	}
}

func (h *RabbitMQHandler) HandleMenuEvent(ctx context.Context, body []byte) error {
	tr := otel.Tracer("search-service")
	ctx, span := tr.Start(ctx, "search-service.HandleMenuEvent")
	defer span.End()

	var event struct {
		Action   string                  `json:"action"`
		MenuItem domain.MenuItemDocument `json:"menu_item"`
	}

	if err := json.Unmarshal(body, &event); err != nil {
		return fmt.Errorf("failed to unmarshal menu event: %w", err)
	}

	span.SetAttributes(
		attribute.String("event.action", event.Action),
		attribute.String("menu_item.id", event.MenuItem.ID),
		attribute.String("menu_item.name", event.MenuItem.Name),
	)

	slog.InfoContext(ctx, "Consuming menu event", "action", event.Action, "item_id", event.MenuItem.ID)

	switch event.Action {
	case "upsert":
		return h.searchService.IndexMenuItem(ctx, &event.MenuItem)
	case "delete":
		return h.searchService.DeleteMenuItem(ctx, event.MenuItem.ID)
	default:
		slog.WarnContext(ctx, "Unknown menu event action", "action", event.Action)
		return nil
	}
}
