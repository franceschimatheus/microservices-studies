package repository

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"restaurant-service/internal/domain"
)

type PostgresRestaurantRepository struct {
	db *pgxpool.Pool
}

func NewPostgresRestaurantRepository(db *pgxpool.Pool) *PostgresRestaurantRepository {
	return &PostgresRestaurantRepository{db: db}
}

func (r *PostgresRestaurantRepository) Create(ctx context.Context, rest *domain.Restaurant) error {
	query := `INSERT INTO restaurants (name, description, address) VALUES ($1, $2, $3) RETURNING id, created_at`
	err := r.db.QueryRow(ctx, query, rest.Name, rest.Description, rest.Address).Scan(&rest.ID, &rest.CreatedAt)
	if err != nil {
		return err
	}
	return nil
}

func (r *PostgresRestaurantRepository) Update(ctx context.Context, rest *domain.Restaurant) error {
	query := `UPDATE restaurants SET name = $1, description = $2, address = $3 WHERE id = $4`
	cmd, err := r.db.Exec(ctx, query, rest.Name, rest.Description, rest.Address, rest.ID)
	if err != nil {
		return err
	}
	if cmd.RowsAffected() == 0 {
		return domain.ErrRestaurantNotFound
	}
	return nil
}

func (r *PostgresRestaurantRepository) GetByID(ctx context.Context, id string) (*domain.Restaurant, error) {
	query := `SELECT id, name, description, address, created_at FROM restaurants WHERE id = $1`
	rest := &domain.Restaurant{}
	err := r.db.QueryRow(ctx, query, id).Scan(&rest.ID, &rest.Name, &rest.Description, &rest.Address, &rest.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrRestaurantNotFound
		}
		return nil, err
	}
	return rest, nil
}

func (r *PostgresRestaurantRepository) List(ctx context.Context) ([]*domain.Restaurant, error) {
	query := `SELECT id, name, description, address, created_at FROM restaurants ORDER BY name`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var restaurants []*domain.Restaurant
	for rows.Next() {
		rest := &domain.Restaurant{}
		err := rows.Scan(&rest.ID, &rest.Name, &rest.Description, &rest.Address, &rest.CreatedAt)
		if err != nil {
			return nil, err
		}
		restaurants = append(restaurants, rest)
	}
	return restaurants, nil
}

func (r *PostgresRestaurantRepository) CreateCategory(ctx context.Context, cat *domain.Category) error {
	query := `INSERT INTO categories (restaurant_id, name) VALUES ($1, $2) RETURNING id`
	err := r.db.QueryRow(ctx, query, cat.RestaurantID, cat.Name).Scan(&cat.ID)
	if err != nil {
		return err
	}
	return nil
}

func (r *PostgresRestaurantRepository) ListCategories(ctx context.Context, restaurantID string) ([]*domain.Category, error) {
	query := `SELECT id, restaurant_id, name FROM categories WHERE restaurant_id = $1 ORDER BY name`
	rows, err := r.db.Query(ctx, query, restaurantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []*domain.Category
	for rows.Next() {
		cat := &domain.Category{}
		err := rows.Scan(&cat.ID, &cat.RestaurantID, &cat.Name)
		if err != nil {
			return nil, err
		}
		categories = append(categories, cat)
	}
	return categories, nil
}

func (r *PostgresRestaurantRepository) GetCategoryByID(ctx context.Context, id string) (*domain.Category, error) {
	query := `SELECT id, restaurant_id, name FROM categories WHERE id = $1`
	cat := &domain.Category{}
	err := r.db.QueryRow(ctx, query, id).Scan(&cat.ID, &cat.RestaurantID, &cat.Name)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrCategoryNotFound
		}
		return nil, err
	}
	return cat, nil
}

func (r *PostgresRestaurantRepository) CreateMenuItem(ctx context.Context, item *domain.MenuItem) error {
	query := `INSERT INTO menu_items (category_id, name, description, price, available) VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at`
	err := r.db.QueryRow(ctx, query, item.CategoryID, item.Name, item.Description, item.Price, item.Available).Scan(&item.ID, &item.CreatedAt)
	if err != nil {
		return err
	}
	return nil
}

func (r *PostgresRestaurantRepository) UpdateMenuItem(ctx context.Context, item *domain.MenuItem) error {
	query := `UPDATE menu_items SET name = $1, description = $2, price = $3, available = $4 WHERE id = $5`
	cmd, err := r.db.Exec(ctx, query, item.Name, item.Description, item.Price, item.Available, item.ID)
	if err != nil {
		return err
	}
	if cmd.RowsAffected() == 0 {
		return domain.ErrMenuItemNotFound
	}
	return nil
}

func (r *PostgresRestaurantRepository) DeleteMenuItem(ctx context.Context, id string) error {
	query := `DELETE FROM menu_items WHERE id = $1`
	cmd, err := r.db.Exec(ctx, query, id)
	if err != nil {
		return err
	}
	if cmd.RowsAffected() == 0 {
		return domain.ErrMenuItemNotFound
	}
	return nil
}

func (r *PostgresRestaurantRepository) GetMenuItemByID(ctx context.Context, id string) (*domain.MenuItem, error) {
	query := `SELECT id, category_id, name, description, price, available, created_at FROM menu_items WHERE id = $1`
	item := &domain.MenuItem{}
	err := r.db.QueryRow(ctx, query, id).Scan(&item.ID, &item.CategoryID, &item.Name, &item.Description, &item.Price, &item.Available, &item.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrMenuItemNotFound
		}
		return nil, err
	}
	return item, nil
}

func (r *PostgresRestaurantRepository) GetMenu(ctx context.Context, restaurantID string) ([]*domain.MenuItem, error) {
	query := `
		SELECT mi.id, mi.category_id, mi.name, mi.description, mi.price, mi.available, mi.created_at 
		FROM menu_items mi
		JOIN categories c ON mi.category_id = c.id
		WHERE c.restaurant_id = $1
		ORDER BY c.name, mi.name`
	rows, err := r.db.Query(ctx, query, restaurantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []*domain.MenuItem
	for rows.Next() {
		item := &domain.MenuItem{}
		err := rows.Scan(&item.ID, &item.CategoryID, &item.Name, &item.Description, &item.Price, &item.Available, &item.CreatedAt)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, nil
}
