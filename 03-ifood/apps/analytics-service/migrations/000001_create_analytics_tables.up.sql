-- Bronze Layer (Raw Data Lake Store)
CREATE TABLE IF NOT EXISTS raw_events (
    id UUID PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_raw_events_processed ON raw_events(processed);

-- Silver Layer (Refined / Normalized Tables)
CREATE TABLE IF NOT EXISTS orders_refined (
    order_id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments_refined (
    payment_id UUID PRIMARY KEY,
    order_id UUID NOT NULL,
    user_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deliveries_refined (
    order_id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL,
    assigned_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Gold Layer (KPI / Aggregation Views)
CREATE OR REPLACE VIEW kpi_orders_summary AS
SELECT
    COUNT(*) AS total_orders,
    COALESCE(SUM(total_price) FILTER (WHERE status = 'DELIVERED'), 0.00) AS total_revenue,
    COUNT(*) FILTER (WHERE status = 'DELIVERED') AS total_delivered_orders,
    COUNT(*) FILTER (WHERE status = 'CANCELLED') AS total_cancelled_orders
FROM orders_refined;

CREATE OR REPLACE VIEW kpi_payment_success_rate AS
SELECT
    COUNT(*) FILTER (WHERE status = 'COMPLETED') AS successful_payments,
    COUNT(*) FILTER (WHERE status = 'FAILED') AS failed_payments,
    CASE
        WHEN COUNT(*) = 0 THEN 0.0
        ELSE (COUNT(*) FILTER (WHERE status = 'COMPLETED')::numeric / COUNT(*)::numeric) * 100.0
    END AS success_rate
FROM payments_refined;

CREATE OR REPLACE VIEW kpi_delivery_performance AS
SELECT
    COUNT(*) AS total_deliveries,
    COUNT(*) FILTER (WHERE completed_at IS NOT NULL) AS completed_deliveries,
    COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - assigned_at))) FILTER (WHERE completed_at IS NOT NULL AND assigned_at IS NOT NULL), 0.0) AS avg_delivery_seconds
FROM deliveries_refined;
