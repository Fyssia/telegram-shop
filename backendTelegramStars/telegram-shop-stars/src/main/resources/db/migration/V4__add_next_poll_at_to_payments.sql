ALTER TABLE payments
    ADD COLUMN next_poll_at TIMESTAMPTZ;

CREATE INDEX idx_payments_provider_status_next_poll_at
    ON payments (provider, status, next_poll_at);
