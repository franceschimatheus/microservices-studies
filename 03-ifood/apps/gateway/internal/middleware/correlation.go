package middleware

import (
	"time"

	"github.com/gofiber/fiber/v2"
)

func CorrelationID() fiber.Handler {
	return func(c *fiber.Ctx) error {
		correlationID := c.Get("X-Correlation-ID")
		if correlationID == "" {
			// Generate a simple timestamp + random suffix correlation ID
			correlationID = time.Now().Format("20060102150405") + "-rand"
		}
		c.Locals("correlation_id", correlationID)
		c.Set("X-Correlation-ID", correlationID)
		return c.Next()
	}
}
