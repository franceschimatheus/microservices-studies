package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"order/internal/domain"
)

type HTTPHandler struct {
	service domain.OrderService
}

func NewHTTPHandler(service domain.OrderService) *HTTPHandler {
	return &HTTPHandler{
		service: service,
	}
}

func (h *HTTPHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /orders", h.createOrder)
	mux.HandleFunc("GET /orders/", h.getOrder)
}

// jsonError writes a JSON-encoded error response so that all callers
// can rely on a consistent { "error": "..." } payload.
func jsonError(w http.ResponseWriter, message string, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": message})
}

func (h *HTTPHandler) createOrder(w http.ResponseWriter, r *http.Request) {
	var input domain.CreateOrderInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		jsonError(w, "invalid request body", http.StatusBadRequest)
		return
	}

	order, err := h.service.PlaceOrder(r.Context(), input)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(order)
}

func (h *HTTPHandler) getOrder(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 3 || parts[2] == "" {
		jsonError(w, "missing order ID", http.StatusBadRequest)
		return
	}
	id := parts[2]

	order, err := h.service.GetOrder(r.Context(), id)
	if err != nil {
		jsonError(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(order)
}
