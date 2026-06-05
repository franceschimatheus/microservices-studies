package domain

import (
	"context"
	"errors"
	"time"
)

var (
	ErrUserAlreadyExists = errors.New("user already exists")
	ErrInvalidCredentials = errors.New("invalid email or password")
)

type User struct {
	ID           string
	Email        string
	PasswordHash string
	Role         string
	CreatedAt    time.Time
}

type UserRepository interface {
	Create(ctx context.Context, user *User) error
	GetByEmail(ctx context.Context, email string) (*User, error)
}

type AuthService interface {
	SignUp(ctx context.Context, email, password, role string) (*User, error)
	SignIn(ctx context.Context, email, password string) (string, *User, error)
	ValidateToken(ctx context.Context, token string) (*User, bool)
}
