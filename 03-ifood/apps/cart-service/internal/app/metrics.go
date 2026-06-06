package app

import (
	"github.com/redis/go-redis/v9"
	"prometheus"
)

func registerRedisMetrics(rdb *redis.Client, cacheName string) {
	prometheus.RegisterRedisMetrics(cacheName, func() (total, idle, stale uint32, hits, misses, timeouts uint64) {
		stats := rdb.PoolStats()
		return stats.TotalConns, stats.IdleConns, stats.StaleConns, uint64(stats.Hits), uint64(stats.Misses), uint64(stats.Timeouts)
	})
}
