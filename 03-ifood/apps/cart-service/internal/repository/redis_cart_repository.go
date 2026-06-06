package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"

	"cart-service/internal/domain"
)

type RedisCartRepository struct {
	client *redis.Client
	ttl    time.Duration
}

func NewRedisCartRepository(client *redis.Client, ttl time.Duration) *RedisCartRepository {
	return &RedisCartRepository{
		client: client,
		ttl:    ttl,
	}
}

func (r *RedisCartRepository) Get(ctx context.Context, userID string) (*domain.Cart, error) {
	key := fmt.Sprintf("cart:%s", userID)
	val, err := r.client.Get(ctx, key).Result()
	if errors.Is(err, redis.Nil) {
		return &domain.Cart{
			UserID:     userID,
			Items:      []*domain.CartItem{},
			TotalPrice: 0,
		}, nil
	} else if err != nil {
		return nil, fmt.Errorf("failed to get cart from redis: %w", err)
	}

	var cart domain.Cart
	if err := json.Unmarshal([]byte(val), &cart); err != nil {
		return nil, fmt.Errorf("failed to unmarshal cart data: %w", err)
	}

	return &cart, nil
}

func (r *RedisCartRepository) Save(ctx context.Context, cart *domain.Cart) error {
	key := fmt.Sprintf("cart:%s", cart.UserID)
	data, err := json.Marshal(cart)
	if err != nil {
		return fmt.Errorf("failed to marshal cart data: %w", err)
	}

	if err := r.client.Set(ctx, key, data, r.ttl).Err(); err != nil {
		return fmt.Errorf("failed to save cart to redis: %w", err)
	}

	return nil
}

func (r *RedisCartRepository) Delete(ctx context.Context, userID string) error {
	key := fmt.Sprintf("cart:%s", userID)
	if err := r.client.Del(ctx, key).Err(); err != nil {
		return fmt.Errorf("failed to delete cart from redis: %w", err)
	}
	return nil
}
