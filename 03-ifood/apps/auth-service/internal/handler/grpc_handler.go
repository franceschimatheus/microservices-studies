package handler

import (
	"context"
	"errors"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"auth-service/internal/domain"
	pb "auth-service/pb"
)

type GrpcAuthHandler struct {
	pb.UnimplementedAuthServiceServer
	authService domain.AuthService
}

func NewGrpcAuthHandler(authService domain.AuthService) *GrpcAuthHandler {
	return &GrpcAuthHandler{authService: authService}
}

func (h *GrpcAuthHandler) SignUp(ctx context.Context, req *pb.SignUpRequest) (*pb.SignUpResponse, error) {
	user, err := h.authService.SignUp(ctx, req.GetEmail(), req.GetPassword(), req.GetRole())
	if err != nil {
		if errors.Is(err, domain.ErrUserAlreadyExists) {
			return nil, status.Error(codes.AlreadyExists, "email already registered")
		}
		return nil, status.Errorf(codes.InvalidArgument, "sign up failed: %v", err)
	}

	return &pb.SignUpResponse{
		UserId: user.ID,
		Email:  user.Email,
		Role:   user.Role,
	}, nil
}

func (h *GrpcAuthHandler) SignIn(ctx context.Context, req *pb.SignInRequest) (*pb.SignInResponse, error) {
	token, user, err := h.authService.SignIn(ctx, req.GetEmail(), req.GetPassword())
	if err != nil {
		if errors.Is(err, domain.ErrInvalidCredentials) {
			return nil, status.Error(codes.Unauthenticated, "invalid email or password")
		}
		return nil, status.Errorf(codes.Internal, "sign in failed: %v", err)
	}

	return &pb.SignInResponse{
		Token:  token,
		UserId: user.ID,
		Email:  user.Email,
		Role:   user.Role,
	}, nil
}

func (h *GrpcAuthHandler) ValidateToken(ctx context.Context, req *pb.ValidateTokenRequest) (*pb.ValidateTokenResponse, error) {
	user, valid := h.authService.ValidateToken(ctx, req.GetToken())
	if !valid {
		return &pb.ValidateTokenResponse{Valid: false}, nil
	}

	return &pb.ValidateTokenResponse{
		Valid:  true,
		UserId: user.ID,
		Email:  user.Email,
		Role:   user.Role,
	}, nil
}
