package middleware

import (
	"context"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/propagation"
	semconv "go.opentelemetry.io/otel/semconv/v1.4.0"
	"go.opentelemetry.io/otel/trace"

	"logger"
)

var (
	httpRequestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Total number of HTTP requests.",
		},
		[]string{"path", "method", "status"},
	)
	httpRequestDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "Duration of HTTP requests in seconds.",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"path", "method", "status"},
	)
)

// TracingAndMetrics returns a Fiber middleware for OTel tracing and Prometheus metrics.
func TracingAndMetrics(serviceName string) fiber.Handler {
	tracer := otel.Tracer(serviceName)

	return func(c *fiber.Ctx) error {
		start := time.Now()
		path := c.Route().Path
		if path == "" {
			path = c.Path()
		}
		// Skip metrics/tracing for observability endpoints
		if path == "/metrics" {
			return c.Next()
		}

		// Convert Fiber headers map to a format propagation expects
		headers := make(map[string]string)
		c.Request().Header.VisitAll(func(key, value []byte) {
			headers[string(key)] = string(value)
		})

		// Extract trace context from incoming HTTP headers
		ctx := otel.GetTextMapPropagator().Extract(c.UserContext(), propagation.MapCarrier(headers))

		// Start span
		ctx, span := tracer.Start(ctx, c.Method()+" "+path,
			trace.WithSpanKind(trace.SpanKindServer),
			trace.WithAttributes(
				semconv.HTTPMethodKey.String(c.Method()),
				semconv.HTTPRouteKey.String(path),
				semconv.HTTPURLKey.String(c.OriginalURL()),
			),
		)
		defer span.End()

		// Inject correlation_id to context if present in Locals
		if corrID, ok := c.Locals("correlation_id").(string); ok {
			span.SetAttributes(attribute.String("correlation_id", corrID))
			ctx = context.WithValue(ctx, logger.CorrelationIDKey, corrID)
		}

		// Update user context for next handlers
		c.SetUserContext(ctx)

		// Execute request
		err := c.Next()

		// Record status and metrics
		status := c.Response().StatusCode()
		if err != nil {
			if e, ok := err.(*fiber.Error); ok {
				status = e.Code
			} else {
				status = 500
			}
			span.RecordError(err)
			span.SetStatus(codes.Error, err.Error())
		}

		span.SetAttributes(semconv.HTTPStatusCodeKey.Int(status))

		duration := time.Since(start).Seconds()
		statusStr := strconv.Itoa(status)

		httpRequestsTotal.WithLabelValues(path, c.Method(), statusStr).Inc()
		httpRequestDuration.WithLabelValues(path, c.Method(), statusStr).Observe(duration)

		return err
	}
}
