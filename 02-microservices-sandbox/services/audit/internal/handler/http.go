package handler

import (
	"encoding/json"
	"net/http"

	"audit/internal/domain"
)

type HTTPHandler struct {
	service domain.AuditService
}

func NewHTTPHandler(service domain.AuditService) *HTTPHandler {
	return &HTTPHandler{
		service: service,
	}
}

func (h *HTTPHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /logs", h.getLogs)
	mux.HandleFunc("GET /metrics", h.getMetrics)
}

func (h *HTTPHandler) enableCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

func (h *HTTPHandler) getLogs(w http.ResponseWriter, r *http.Request) {
	h.enableCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	events := h.service.GetEvents(r.Context())
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(events)
}

func (h *HTTPHandler) getMetrics(w http.ResponseWriter, r *http.Request) {
	h.enableCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	metrics := h.service.GetMetrics(r.Context())
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(metrics)
}
