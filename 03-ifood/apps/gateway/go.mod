module gateway

go 1.26.3

require (
	analytics-service v0.0.0-00010101000000-000000000000
	auth-service v0.0.0-00010101000000-000000000000
	cart-service v0.0.0-00010101000000-000000000000
	github.com/gofiber/fiber/v2 v2.52.4
	github.com/prometheus/client_golang v1.23.2
	github.com/redis/go-redis/v9 v9.20.1
	go.opentelemetry.io/otel v1.44.0
	go.opentelemetry.io/otel/trace v1.44.0
	google.golang.org/grpc v1.81.1
	logger v0.0.0-00010101000000-000000000000
	observability v0.0.0-00010101000000-000000000000
	order-service v0.0.0-00010101000000-000000000000
	prometheus v0.0.0-00010101000000-000000000000
	restaurant-service v0.0.0-00010101000000-000000000000
	search-service v0.0.0-00010101000000-000000000000
)

require (
	github.com/andybalholm/brotli v1.0.5 // indirect
	github.com/beorn7/perks v1.0.1 // indirect
	github.com/cenkalti/backoff/v4 v4.3.0 // indirect
	github.com/cespare/xxhash/v2 v2.3.0 // indirect
	github.com/go-logr/logr v1.4.3 // indirect
	github.com/go-logr/stdr v1.2.2 // indirect
	github.com/google/uuid v1.6.0 // indirect
	github.com/grpc-ecosystem/grpc-gateway/v2 v2.27.2 // indirect
	github.com/klauspost/compress v1.18.0 // indirect
	github.com/mattn/go-colorable v0.1.13 // indirect
	github.com/mattn/go-isatty v0.0.20 // indirect
	github.com/mattn/go-runewidth v0.0.15 // indirect
	github.com/munnerz/goautoneg v0.0.0-20191010083416-a7dc8b61c822 // indirect
	github.com/prometheus/client_model v0.6.2 // indirect
	github.com/prometheus/common v0.66.1 // indirect
	github.com/prometheus/procfs v0.16.1 // indirect
	github.com/rabbitmq/amqp091-go v1.11.0 // indirect
	github.com/rivo/uniseg v0.2.0 // indirect
	github.com/valyala/bytebufferpool v1.0.0 // indirect
	github.com/valyala/fasthttp v1.51.0 // indirect
	github.com/valyala/tcplisten v1.0.0 // indirect
	go.opentelemetry.io/auto/sdk v1.2.1 // indirect
	go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc v0.59.0 // indirect
	go.opentelemetry.io/otel/exporters/otlp/otlptrace v1.34.0 // indirect
	go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc v1.34.0 // indirect
	go.opentelemetry.io/otel/metric v1.44.0 // indirect
	go.opentelemetry.io/otel/sdk v1.43.0 // indirect
	go.opentelemetry.io/proto/otlp v1.9.0 // indirect
	go.uber.org/atomic v1.11.0 // indirect
	go.yaml.in/yaml/v2 v2.4.2 // indirect
	golang.org/x/net v0.51.0 // indirect
	golang.org/x/sys v0.42.0 // indirect
	golang.org/x/text v0.34.0 // indirect
	google.golang.org/genproto/googleapis/api v0.0.0-20260226221140-a57be14db171 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20260226221140-a57be14db171 // indirect
	google.golang.org/protobuf v1.36.11 // indirect
)

replace (
	analytics-service => ../analytics-service
	auth-service => ../auth-service
	cart-service => ../cart-service
	logger => ../../infra/logger
	observability => ../../infra/observability
	order-service => ../order-service
	prometheus => ../../infra/prometheus
	restaurant-service => ../restaurant-service
	search-service => ../search-service
)
