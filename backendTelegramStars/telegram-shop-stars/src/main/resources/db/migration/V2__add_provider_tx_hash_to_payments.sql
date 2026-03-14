ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS provider_tx_hash VARCHAR(128);

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_provider_tx_hash
    ON payments (provider, provider_tx_hash)
    WHERE provider_tx_hash IS NOT NULL;
