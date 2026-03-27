CREATE TABLE service_balance_state (
    id SMALLINT PRIMARY KEY,
    reserved_amount NUMERIC(14, 3) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT service_balance_state_singleton_chk CHECK (id = 1),
    CONSTRAINT service_balance_state_reserved_amount_chk CHECK (reserved_amount >= 0)
);

INSERT INTO service_balance_state (id, reserved_amount)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

CREATE TRIGGER trg_service_balance_state_set_updated_at
    BEFORE UPDATE ON service_balance_state
    FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

ALTER TABLE orders
    ADD COLUMN balance_reservation_status VARCHAR(16) NOT NULL DEFAULT 'none',
    ADD COLUMN balance_reserved_amount NUMERIC(14, 3) NOT NULL DEFAULT 0,
    ADD COLUMN balance_reserved_at TIMESTAMPTZ,
    ADD COLUMN balance_released_at TIMESTAMPTZ,
    ADD COLUMN balance_consumed_at TIMESTAMPTZ,
    ADD COLUMN fulfillment_attempts INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN next_fulfillment_attempt_at TIMESTAMPTZ;

ALTER TABLE orders
    ADD CONSTRAINT orders_balance_reservation_status_chk CHECK (
        balance_reservation_status IN ('none', 'reserved', 'released', 'consumed')
    ),
    ADD CONSTRAINT orders_balance_reserved_amount_chk CHECK (balance_reserved_amount >= 0),
    ADD CONSTRAINT orders_fulfillment_attempts_chk CHECK (fulfillment_attempts >= 0);

UPDATE orders
SET balance_reservation_status = CASE
        WHEN status IN ('created', 'pending_payment', 'paid', 'processing') THEN 'reserved'
        WHEN status = 'fulfilled' THEN 'consumed'
        WHEN status IN ('cancelled', 'failed', 'expired', 'refunded') THEN 'released'
        ELSE 'none'
    END,
    balance_reserved_amount = CASE
        WHEN status IN ('created', 'pending_payment', 'paid', 'processing', 'fulfilled', 'cancelled', 'failed', 'expired', 'refunded')
            THEN total_amount
        ELSE 0
    END,
    balance_reserved_at = CASE
        WHEN status IN ('created', 'pending_payment', 'paid', 'processing', 'fulfilled', 'cancelled', 'failed', 'expired', 'refunded')
            THEN created_at
        ELSE NULL
    END,
    balance_consumed_at = CASE
        WHEN status = 'fulfilled' THEN COALESCE(fulfilled_at, updated_at, created_at)
        ELSE NULL
    END,
    balance_released_at = CASE
        WHEN status = 'cancelled' THEN COALESCE(cancelled_at, updated_at, created_at)
        WHEN status = 'failed' THEN COALESCE(failed_at, updated_at, created_at)
        WHEN status = 'expired' THEN COALESCE(updated_at, created_at)
        WHEN status = 'refunded' THEN COALESCE(updated_at, created_at)
        ELSE NULL
    END,
    fulfillment_attempts = 0,
    next_fulfillment_attempt_at = NULL;

UPDATE service_balance_state
SET reserved_amount = COALESCE(
    (
        SELECT SUM(balance_reserved_amount)
        FROM orders
        WHERE balance_reservation_status = 'reserved'
    ),
    0
)
WHERE id = 1;

CREATE INDEX idx_orders_status_next_fulfillment_attempt_at
    ON orders (status, next_fulfillment_attempt_at, id);
