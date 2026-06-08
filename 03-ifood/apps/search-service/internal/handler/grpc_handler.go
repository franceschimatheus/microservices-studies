package handler

import (
	"context"

	"search-service/internal/service"
	pb "search-service/pb"
)

type GrpcSearchHandler struct {
	pb.UnimplementedSearchServiceServer
	searchService service.SearchService
}

func NewGrpcSearchHandler(searchService service.SearchService) *GrpcSearchHandler {
	return &GrpcSearchHandler{searchService: searchService}
}

func (h *GrpcSearchHandler) SearchRestaurants(ctx context.Context, req *pb.SearchRequest) (*pb.SearchRestaurantsResponse, error) {
	docs, err := h.searchService.SearchRestaurants(ctx, req.Query)
	if err != nil {
		return nil, err
	}

	restaurants := make([]*pb.RestaurantDocument, 0, len(docs))
	for _, doc := range docs {
		restaurants = append(restaurants, &pb.RestaurantDocument{
			Id:          doc.ID,
			Name:        doc.Name,
			Description: doc.Description,
			Address:     doc.Address,
		})
	}

	return &pb.SearchRestaurantsResponse{Restaurants: restaurants}, nil
}

func (h *GrpcSearchHandler) SearchMenus(ctx context.Context, req *pb.SearchRequest) (*pb.SearchMenusResponse, error) {
	docs, err := h.searchService.SearchMenus(ctx, req.Query)
	if err != nil {
		return nil, err
	}

	items := make([]*pb.MenuDocument, 0, len(docs))
	for _, doc := range docs {
		items = append(items, &pb.MenuDocument{
			Id:           doc.ID,
			RestaurantId: doc.RestaurantID,
			CategoryId:   doc.CategoryID,
			Name:         doc.Name,
			Description:  doc.Description,
			Price:        doc.Price,
			Available:    doc.Available,
		})
	}

	return &pb.SearchMenusResponse{Items: items}, nil
}
