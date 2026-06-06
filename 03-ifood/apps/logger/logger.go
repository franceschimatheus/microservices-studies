package logger

import (
	"context"
	"io"
	"log/slog"
	"os"

	"go.opentelemetry.io/otel/trace"
)

type contextKey string

const CorrelationIDKey contextKey = "correlation_id"

// ContextWithCorrelationID returns a new context with the correlation ID.
func ContextWithCorrelationID(ctx context.Context, correlationID string) context.Context {
	return context.WithValue(ctx, CorrelationIDKey, correlationID)
}

// TraceHandler is a slog.Handler that extracts trace_id, span_id and correlation_id from context.
type TraceHandler struct {
	slog.Handler
	serviceName string
}

func NewTraceHandler(h slog.Handler, serviceName string) *TraceHandler {
	return &TraceHandler{
		Handler:     h,
		serviceName: serviceName,
	}
}

func (h *TraceHandler) Handle(ctx context.Context, r slog.Record) error {
	// Add service name
	r.AddAttrs(slog.String("service", h.serviceName))

	// Extract OTel trace/span IDs
	spanContext := trace.SpanContextFromContext(ctx)
	if spanContext.IsValid() {
		r.AddAttrs(
			slog.String("trace_id", spanContext.TraceID().String()),
			slog.String("span_id", spanContext.SpanID().String()),
		)
	}

	// Extract correlation ID
	if corrID, ok := ctx.Value(CorrelationIDKey).(string); ok {
		r.AddAttrs(slog.String("correlation_id", corrID))
	} else if corrID, ok := ctx.Value(string(CorrelationIDKey)).(string); ok {
		r.AddAttrs(slog.String("correlation_id", corrID))
	}

	return h.Handler.Handle(ctx, r)
}

// InitLogger initializes the global slog logger with JSON formatting and trace propagation.
func InitLogger(serviceName string, w io.Writer) *slog.Logger {
	if w == nil {
		w = os.Stdout
	}
	jsonHandler := slog.NewJSONHandler(w, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})
	traceHandler := NewTraceHandler(jsonHandler, serviceName)
	logger := slog.New(traceHandler)
	slog.SetDefault(logger)
	return logger
}
