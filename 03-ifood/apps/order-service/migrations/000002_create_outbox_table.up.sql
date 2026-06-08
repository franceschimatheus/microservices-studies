CREATE TABLE IF NOT EXISTS outbox (
    id UUID PRIMARY KEY,
    exchange VARCHAR(255) NOT NULL,
    routing_key VARCHAR(255) NOT NULL,
    payload BYTEA NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_outbox_status ON outbox(status) WHERE status = 'PENDING';
