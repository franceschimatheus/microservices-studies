package repository

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"

	"github.com/opensearch-project/opensearch-go"
	"github.com/opensearch-project/opensearch-go/opensearchapi"
	"search-service/internal/domain"
)

type OpenSearchRepository struct {
	client *opensearch.Client
}

func NewOpenSearchRepository(client *opensearch.Client) *OpenSearchRepository {
	return &OpenSearchRepository{client: client}
}

func (r *OpenSearchRepository) InitIndices(ctx context.Context) error {
	for _, index := range []string{"restaurants", "menu_items"} {
		req := opensearchapi.IndicesExistsRequest{
			Index: []string{index},
		}
		res, err := req.Do(ctx, r.client)
		if err != nil {
			return err
		}
		
		status := res.StatusCode
		res.Body.Close()

		if status == 404 {
			createReq := opensearchapi.IndicesCreateRequest{
				Index: index,
			}
			cRes, err := createReq.Do(ctx, r.client)
			if err != nil {
				return err
			}
			cRes.Body.Close()
			slog.Info("Created OpenSearch index", "index", index)
		}
	}
	return nil
}

func (r *OpenSearchRepository) IndexRestaurant(ctx context.Context, doc *domain.RestaurantDocument) error {
	var buf bytes.Buffer
	if err := json.NewEncoder(&buf).Encode(doc); err != nil {
		return err
	}

	req := opensearchapi.IndexRequest{
		Index:      "restaurants",
		DocumentID: doc.ID,
		Body:       &buf,
		Refresh:    "true",
	}

	res, err := req.Do(ctx, r.client)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.IsError() {
		bodyBytes, _ := io.ReadAll(res.Body)
		return fmt.Errorf("failed to index restaurant: %s", string(bodyBytes))
	}

	return nil
}

func (r *OpenSearchRepository) IndexMenuItem(ctx context.Context, doc *domain.MenuItemDocument) error {
	var buf bytes.Buffer
	if err := json.NewEncoder(&buf).Encode(doc); err != nil {
		return err
	}

	req := opensearchapi.IndexRequest{
		Index:      "menu_items",
		DocumentID: doc.ID,
		Body:       &buf,
		Refresh:    "true",
	}

	res, err := req.Do(ctx, r.client)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.IsError() {
		bodyBytes, _ := io.ReadAll(res.Body)
		return fmt.Errorf("failed to index menu item: %s", string(bodyBytes))
	}

	return nil
}

func (r *OpenSearchRepository) DeleteMenuItem(ctx context.Context, id string) error {
	req := opensearchapi.DeleteRequest{
		Index:      "menu_items",
		DocumentID: id,
		Refresh:    "true",
	}

	res, err := req.Do(ctx, r.client)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.IsError() && res.StatusCode != 404 {
		bodyBytes, _ := io.ReadAll(res.Body)
		return fmt.Errorf("failed to delete menu item: %s", string(bodyBytes))
	}

	return nil
}

func (r *OpenSearchRepository) DeleteRestaurant(ctx context.Context, id string) error {
	req := opensearchapi.DeleteRequest{
		Index:      "restaurants",
		DocumentID: id,
		Refresh:    "true",
	}

	res, err := req.Do(ctx, r.client)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.IsError() && res.StatusCode != 404 {
		bodyBytes, _ := io.ReadAll(res.Body)
		return fmt.Errorf("failed to delete restaurant: %s", string(bodyBytes))
	}

	return nil
}

func (r *OpenSearchRepository) SearchRestaurants(ctx context.Context, query string) ([]*domain.RestaurantDocument, error) {
	var queryJSON map[string]any
	if query == "" {
		queryJSON = map[string]any{
			"query": map[string]any{
				"match_all": map[string]any{},
			},
		}
	} else {
		queryJSON = map[string]any{
			"query": map[string]any{
				"multi_match": map[string]any{
					"query":  query,
					"type":   "bool_prefix",
					"fields": []string{"name^3", "description^2", "address"},
				},
			},
		}
	}

	var buf bytes.Buffer
	if err := json.NewEncoder(&buf).Encode(queryJSON); err != nil {
		return nil, err
	}

	req := opensearchapi.SearchRequest{
		Index: []string{"restaurants"},
		Body:  &buf,
	}

	res, err := req.Do(ctx, r.client)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	if res.IsError() {
		bodyBytes, _ := io.ReadAll(res.Body)
		return nil, fmt.Errorf("failed search: %s", string(bodyBytes))
	}

	var response struct {
		Hits struct {
			Hits []struct {
				Source domain.RestaurantDocument `json:"_source"`
			} `json:"hits"`
		} `json:"hits"`
	}

	if err := json.NewDecoder(res.Body).Decode(&response); err != nil {
		return nil, err
	}

	results := make([]*domain.RestaurantDocument, 0, len(response.Hits.Hits))
	for _, hit := range response.Hits.Hits {
		doc := hit.Source
		results = append(results, &doc)
	}

	return results, nil
}

func (r *OpenSearchRepository) SearchMenuItems(ctx context.Context, query string) ([]*domain.MenuItemDocument, error) {
	var queryJSON map[string]any
	if query == "" {
		queryJSON = map[string]any{
			"query": map[string]any{
				"match_all": map[string]any{},
			},
		}
	} else {
		queryJSON = map[string]any{
			"query": map[string]any{
				"multi_match": map[string]any{
					"query":  query,
					"type":   "bool_prefix",
					"fields": []string{"name^3", "description^2"},
				},
			},
		}
	}

	var buf bytes.Buffer
	if err := json.NewEncoder(&buf).Encode(queryJSON); err != nil {
		return nil, err
	}

	req := opensearchapi.SearchRequest{
		Index: []string{"menu_items"},
		Body:  &buf,
	}

	res, err := req.Do(ctx, r.client)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	if res.IsError() {
		bodyBytes, _ := io.ReadAll(res.Body)
		return nil, fmt.Errorf("failed search: %s", string(bodyBytes))
	}

	var response struct {
		Hits struct {
			Hits []struct {
				Source domain.MenuItemDocument `json:"_source"`
			} `json:"hits"`
		} `json:"hits"`
	}

	if err := json.NewDecoder(res.Body).Decode(&response); err != nil {
		return nil, err
	}

	results := make([]*domain.MenuItemDocument, 0, len(response.Hits.Hits))
	for _, hit := range response.Hits.Hits {
		doc := hit.Source
		results = append(results, &doc)
	}

	return results, nil
}
