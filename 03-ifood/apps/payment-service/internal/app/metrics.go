package app

import (
	"github.com/jackc/pgx/v5/pgxpool"
	"prometheus"
)

func registerDBMetrics(pool *pgxpool.Pool, dbName string) {
	prometheus.RegisterDBMetrics(dbName, func() (active, idle, max, total int32) {
		stats := pool.Stat()
		return stats.AcquiredConns(), stats.IdleConns(), stats.MaxConns(), stats.TotalConns()
	})
}
