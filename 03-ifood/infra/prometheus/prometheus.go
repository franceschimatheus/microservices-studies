package prometheus

import (
	"net/http"

	prom "github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// MetricsHandler returns the HTTP handler for Prometheus metrics.
func MetricsHandler() http.Handler {
	return promhttp.Handler()
}

type PGXStatsFunc func() (active, idle, max, total int32)

type pgxPoolCollector struct {
	statsFn   PGXStatsFunc
	descInUse *prom.Desc
	descIdle  *prom.Desc
	descMax   *prom.Desc
	descTotal *prom.Desc
}

func newPGXPoolCollector(statsFn PGXStatsFunc, dbName string) *pgxPoolCollector {
	labels := prom.Labels{"db": dbName}
	return &pgxPoolCollector{
		statsFn: statsFn,
		descInUse: prom.NewDesc(
			"db_pool_active_connections",
			"The number of active connections in the pool.",
			nil, labels,
		),
		descIdle: prom.NewDesc(
			"db_pool_idle_connections",
			"The number of idle connections in the pool.",
			nil, labels,
		),
		descMax: prom.NewDesc(
			"db_pool_max_connections",
			"The maximum number of connections allowed in the pool.",
			nil, labels,
		),
		descTotal: prom.NewDesc(
			"db_pool_total_connections",
			"The total number of connections currently in the pool.",
			nil, labels,
		),
	}
}

func (c *pgxPoolCollector) Describe(ch chan<- *prom.Desc) {
	ch <- c.descInUse
	ch <- c.descIdle
	ch <- c.descMax
	ch <- c.descTotal
}

func (c *pgxPoolCollector) Collect(ch chan<- prom.Metric) {
	active, idle, max, total := c.statsFn()
	ch <- prom.MustNewConstMetric(c.descInUse, prom.GaugeValue, float64(active))
	ch <- prom.MustNewConstMetric(c.descIdle, prom.GaugeValue, float64(idle))
	ch <- prom.MustNewConstMetric(c.descMax, prom.GaugeValue, float64(max))
	ch <- prom.MustNewConstMetric(c.descTotal, prom.GaugeValue, float64(total))
}

func RegisterDBMetrics(dbName string, statsFn PGXStatsFunc) {
	prom.MustRegister(newPGXPoolCollector(statsFn, dbName))
}

type RedisStatsFunc func() (total, idle, stale uint32, hits, misses, timeouts uint64)

type redisPoolCollector struct {
	statsFn      RedisStatsFunc
	descTotal    *prom.Desc
	descIdle     *prom.Desc
	descStale    *prom.Desc
	descHits     *prom.Desc
	descMisses   *prom.Desc
	descTimeouts *prom.Desc
}

func newRedisPoolCollector(statsFn RedisStatsFunc, cacheName string) *redisPoolCollector {
	labels := prom.Labels{"cache": cacheName}
	return &redisPoolCollector{
		statsFn: statsFn,
		descTotal: prom.NewDesc(
			"redis_pool_total_connections",
			"Total number of connections in the Redis pool.",
			nil, labels,
		),
		descIdle: prom.NewDesc(
			"redis_pool_idle_connections",
			"Number of idle connections in the Redis pool.",
			nil, labels,
		),
		descStale: prom.NewDesc(
			"redis_pool_stale_connections",
			"Number of stale connections in the Redis pool.",
			nil, labels,
		),
		descHits: prom.NewDesc(
			"redis_pool_hits_total",
			"Number of times a connection was found in the pool.",
			nil, labels,
		),
		descMisses: prom.NewDesc(
			"redis_pool_misses_total",
			"Number of times a connection was not found in the pool.",
			nil, labels,
		),
		descTimeouts: prom.NewDesc(
			"redis_pool_timeouts_total",
			"Number of connection request timeouts.",
			nil, labels,
		),
	}
}

func (c *redisPoolCollector) Describe(ch chan<- *prom.Desc) {
	ch <- c.descTotal
	ch <- c.descIdle
	ch <- c.descStale
	ch <- c.descHits
	ch <- c.descMisses
	ch <- c.descTimeouts
}

func (c *redisPoolCollector) Collect(ch chan<- prom.Metric) {
	total, idle, stale, hits, misses, timeouts := c.statsFn()
	ch <- prom.MustNewConstMetric(c.descTotal, prom.GaugeValue, float64(total))
	ch <- prom.MustNewConstMetric(c.descIdle, prom.GaugeValue, float64(idle))
	ch <- prom.MustNewConstMetric(c.descStale, prom.GaugeValue, float64(stale))
	ch <- prom.MustNewConstMetric(c.descHits, prom.CounterValue, float64(hits))
	ch <- prom.MustNewConstMetric(c.descMisses, prom.CounterValue, float64(misses))
	ch <- prom.MustNewConstMetric(c.descTimeouts, prom.CounterValue, float64(timeouts))
}

func RegisterRedisMetrics(cacheName string, statsFn RedisStatsFunc) {
	prom.MustRegister(newRedisPoolCollector(statsFn, cacheName))
}
