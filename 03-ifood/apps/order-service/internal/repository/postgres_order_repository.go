package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"order-service/internal/domain"
)

type PostgresOrderRepository struct {
	db *pgxpool.Pool
}

func NewPostgresOrderRepository(db *pgxpool.Pool) *PostgresOrderRepository {
	return &PostgresOrderRepository{db: db}
}

func (r *PostgresOrderRepository) Create(ctx context.Context, order *domain.Order, events ...domain.OutboxEvent) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	if order.ID == "" {
		return errors.New("order ID is required")
	}
	order.Status = "PENDING"
	order.CreatedAt = time.Now()
	order.UpdatedAt = time.Now()

	orderQuery := `INSERT INTO orders (id, user_id, restaurant_id, total_price, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`
	_, err = tx.Exec(ctx, orderQuery, order.ID, order.UserID, order.RestaurantID, order.TotalPrice, order.Status, order.CreatedAt, order.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to insert order: %w", err)
	}

	itemQuery := `INSERT INTO order_items (id, order_id, menu_item_id, name, price, quantity)
		VALUES ($1, $2, $3, $4, $5, $6)`
	for i := range order.Items {
		item := &order.Items[i]
		item.ID = uuid.New().String()
		item.OrderID = order.ID
		_, err = tx.Exec(ctx, itemQuery, item.ID, item.OrderID, item.MenuItemID, item.Name, item.Price, item.Quantity)
		if err != nil {
			return fmt.Errorf("failed to insert order item: %w", err)
		}
	}

	// Insert outbox events
	outboxQuery := `INSERT INTO outbox (id, exchange, routing_key, payload, status, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)`
	for _, event := range events {
		eventID := uuid.New()
		_, err = tx.Exec(ctx, outboxQuery, eventID, event.Exchange, event.RoutingKey, event.Payload, "PENDING", time.Now())
		if err != nil {
			return fmt.Errorf("failed to insert outbox event: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

func (r *PostgresOrderRepository) GetByID(ctx context.Context, id string) (*domain.Order, error) {
	orderQuery := `SELECT id, user_id, restaurant_id, total_price, status, created_at, updated_at FROM orders WHERE id = $1`
	var order domain.Order
	err := r.db.QueryRow(ctx, orderQuery, id).Scan(
		&order.ID, &order.UserID, &order.RestaurantID, &order.TotalPrice, &order.Status, &order.CreatedAt, &order.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("order not found")
		}
		return nil, err
	}

	itemsQuery := `SELECT id, order_id, menu_item_id, name, price, quantity FROM order_items WHERE order_id = $1`
	rows, err := r.db.Query(ctx, itemsQuery, id)
	if err != nil {
		return nil, fmt.Errorf("failed to query order items: %w", err)
	}
	defer rows.Close()

	var items []domain.OrderItem
	for rows.Next() {
		var item domain.OrderItem
		err := rows.Scan(&item.ID, &item.OrderID, &item.MenuItemID, &item.Name, &item.Price, &item.Quantity)
		if err != nil {
			return nil, fmt.Errorf("failed to scan order item: %w", err)
		}
		items = append(items, item)
	}
	order.Items = items

	return &order, nil
}

func (r *PostgresOrderRepository) ListByUserID(ctx context.Context, userID string) ([]*domain.Order, error) {
	orderQuery := `SELECT id, user_id, restaurant_id, total_price, status, created_at, updated_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC`
	rows, err := r.db.Query(ctx, orderQuery, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query orders: %w", err)
	}
	defer rows.Close()

	var orders []*domain.Order
	for rows.Next() {
		var order domain.Order
		err := rows.Scan(
			&order.ID, &order.UserID, &order.RestaurantID, &order.TotalPrice, &order.Status, &order.CreatedAt, &order.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan order: %w", err)
		}
		orders = append(orders, &order)
	}

	for _, order := range orders {
		itemsQuery := `SELECT id, order_id, menu_item_id, name, price, quantity FROM order_items WHERE order_id = $1`
		rowsItems, err := r.db.Query(ctx, itemsQuery, order.ID)
		if err != nil {
			return nil, fmt.Errorf("failed to query items for order %s: %w", order.ID, err)
		}
		var items []domain.OrderItem
		for rowsItems.Next() {
			var item domain.OrderItem
			err := rowsItems.Scan(&item.ID, &item.OrderID, &item.MenuItemID, &item.Name, &item.Price, &item.Quantity)
			if err != nil {
				rowsItems.Close()
				return nil, fmt.Errorf("failed to scan order item: %w", err)
			}
			items = append(items, item)
		}
		rowsItems.Close()
		order.Items = items
	}

	return orders, nil
}

func (r *PostgresOrderRepository) UpdateStatus(ctx context.Context, id string, status string, events ...domain.OutboxEvent) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	query := `UPDATE orders SET status = $1, updated_at = $2 WHERE id = $3`
	tag, err := tx.Exec(ctx, query, status, time.Now(), id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("order not found")
	}

	// Insert outbox events
	outboxQuery := `INSERT INTO outbox (id, exchange, routing_key, payload, status, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)`
	for _, event := range events {
		eventID := uuid.New()
		_, err = tx.Exec(ctx, outboxQuery, eventID, event.Exchange, event.RoutingKey, event.Payload, "PENDING", time.Now())
		if err != nil {
			return fmt.Errorf("failed to insert outbox event: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}
