package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"auth-service/internal/domain"
)

type AuthServiceImpl struct {
	repo      domain.UserRepository
	jwtSecret []byte
}

type Claims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func NewAuthServiceImpl(repo domain.UserRepository, jwtSecret []byte) *AuthServiceImpl {
	return &AuthServiceImpl{
		repo:      repo,
		jwtSecret: jwtSecret,
	}
}

func (s *AuthServiceImpl) SignUp(ctx context.Context, email, password, role string) (*domain.User, error) {
	if len(password) < 8 {
		return nil, errors.New("password must be at least 8 characters long")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	user := &domain.User{
		Email:        email,
		PasswordHash: string(hashedPassword),
		Role:         role,
	}

	err = s.repo.Create(ctx, user)
	if err != nil {
		return nil, err
	}

	return user, nil
}

func (s *AuthServiceImpl) SignIn(ctx context.Context, email, password string) (string, *domain.User, error) {
	user, err := s.repo.GetByEmail(ctx, email)
	if err != nil {
		return "", nil, domain.ErrInvalidCredentials
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	if err != nil {
		return "", nil, domain.ErrInvalidCredentials
	}

	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		UserID: user.ID,
		Email:  user.Email,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(s.jwtSecret)
	if err != nil {
		return "", nil, fmt.Errorf("failed to sign token: %w", err)
	}

	return tokenString, user, nil
}

func (s *AuthServiceImpl) ValidateToken(ctx context.Context, tokenStr string) (*domain.User, bool) {
	if tokenStr == "" {
		return nil, false
	}

	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return s.jwtSecret, nil
	})

	if err != nil || !token.Valid {
		return nil, false
	}

	return &domain.User{
		ID:    claims.UserID,
		Email: claims.Email,
		Role:  claims.Role,
	}, true
}
