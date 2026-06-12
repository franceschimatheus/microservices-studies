package handler

import (
	"bufio"
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/redis/go-redis/v9"
)

type AdminHandler struct {
	redisClient *redis.Client
}

func NewAdminHandler(redisClient *redis.Client) *AdminHandler {
	return &AdminHandler{
		redisClient: redisClient,
	}
}

func (h *AdminHandler) StreamSystemLogs(c *fiber.Ctx) error {
	c.Set("Content-Type", "text/event-stream")
	c.Set("Cache-Control", "no-cache")
	c.Set("Connection", "keep-alive")
	c.Set("X-Accel-Buffering", "no")

	c.Context().SetBodyStreamWriter(func(w *bufio.Writer) {
		slog.Info("Admin SSE connection opened for system logs")

		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()

		channel := "admin:logs"
		pubsub := h.redisClient.Subscribe(ctx, channel)
		defer pubsub.Close()

		// Send initial keep-alive comment
		_, _ = fmt.Fprintf(w, ": ok\n\n")
		_ = w.Flush()

		ch := pubsub.Channel()
		ticker := time.NewTicker(10 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case msg, ok := <-ch:
				if !ok {
					return
				}
				_, err := fmt.Fprintf(w, "data: %s\n\n", msg.Payload)
				if err != nil {
					slog.Info("Admin SSE connection write error (client closed)", "error", err)
					return
				}
				if err = w.Flush(); err != nil {
					return
				}
			case <-ticker.C:
				_, err := fmt.Fprintf(w, ": keep-alive\n\n")
				if err != nil {
					slog.Info("Admin SSE connection keep-alive write error", "error", err)
					return
				}
				if err = w.Flush(); err != nil {
					return
				}
			}
		}
	})

	return nil
}
