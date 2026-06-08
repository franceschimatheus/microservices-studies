CREATE TABLE IF NOT EXISTS processed_events (
    id VARCHAR(255) PRIMARY KEY,
    handler_name VARCHAR(255) NOT NULL,
    processed_at TIMESTAMP NOT NULL DEFAULT NOW()
);
