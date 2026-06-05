package repository

import (
	"context"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"

	"auth-service/internal/domain"
)

type PostgresUserRepository struct {
	db *pgxpool.Pool
}

func NewPostgresUserRepository(db *pgxpool.Pool) *PostgresUserRepository {
	return &PostgresUserRepository{db: db}
}

func (r *PostgresUserRepository) Create(ctx context.Context, user *domain.User) error {
	// Parameterized query to prevent SQL Injection
	query := `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, created_at`
	err := r.db.QueryRow(ctx, query, user.Email, user.PasswordHash, user.Role).Scan(&user.ID, &user.CreatedAt)
	if err != nil {
		if strings.Contains(err.Error(), "unique constraint") || strings.Contains(err.Error(), "duplicate key") {
			return domain.ErrUserAlreadyExists
		}
		return err
	}
	return nil
}

func (r *PostgresUserRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	query := `SELECT id, email, password_hash, role, created_at FROM users WHERE email = $1`
	user := &domain.User{}
	err := r.db.QueryRow(ctx, query, email).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.Role, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return user, nil
}
