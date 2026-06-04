package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"inventory/internal/domain"
)

type HTTPHandler struct {
	service domain.InventoryService
}

func NewHTTPHandler(service domain.InventoryService) *HTTPHandler {
	return &HTTPHandler{
		service: service,
	}
}

func (h *HTTPHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /inventory/", h.getStock)
}

func (h *HTTPHandler) enableCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

func (h *HTTPHandler) getStock(w http.ResponseWriter, r *http.Request) {
	h.enableCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Extract product ID from URL path (e.g. /inventory/prod_laptop)
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 3 || parts[2] == "" {
		http.Error(w, "missing product ID", http.StatusBadRequest)
		return
	}
	productID := parts[2]

	stock, err := h.service.CheckStock(r.Context(), productID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"product_id": productID,
		"stock":      stock,
	})
}
