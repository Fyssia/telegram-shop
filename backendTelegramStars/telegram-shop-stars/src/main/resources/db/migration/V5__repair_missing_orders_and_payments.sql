CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    public_id UUID NOT NULL DEFAULT gen_random_uuid(),
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    star_package_id BIGINT REFERENCES star_packages(id) ON DELETE SET NULL,
    status order_status NOT NULL DEFAULT 'created',
    source order_source NOT NULL DEFAULT 'web',
    idempotency_key VARCHAR(128),
    stars_amount INTEGER NOT NULL,
    unit_price_amount NUMERIC(14, 4) NOT NULL,
    subtotal_amount NUMERIC(14, 3) NOT NULL,
    discount_amount NUMERIC(14, 3) NOT NULL DEFAULT 0,
    total_amount NUMERIC(14, 3) NOT NULL,
    currency CHAR(3) NOT NULL,
    external_reference VARCHAR(128),
    customer_comment TEXT,
    paid_at TIMESTAMPTZ,
    fulfilled_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT orders_public_id_unq UNIQUE (public_id),
    CONSTRAINT orders_stars_amount_chk CHECK (stars_amount > 0),
    CONSTRAINT orders_unit_price_amount_chk CHECK (unit_price_amount >= 0),
    CONSTRAINT orders_subtotal_amount_chk CHECK (subtotal_amount >= 0),
    CONSTRAINT orders_discount_amount_chk CHECK (discount_amount >= 0),
    CONSTRAINT orders_total_amount_chk CHECK (total_amount >= 0),
    CONSTRAINT orders_total_math_chk CHECK (total_amount = subtotal_amount - discount_amount),
    CONSTRAINT orders_currency_upper_chk CHECK (currency = UPPER(currency))
);

CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_payment_id VARCHAR(128) NOT NULL,
    provider_tx_hash VARCHAR(128),
    payment_method VARCHAR(64),
    status payment_status NOT NULL DEFAULT 'created',
    amount NUMERIC(14, 3) NOT NULL,
    fee_amount NUMERIC(14, 3) NOT NULL DEFAULT 0,
    net_amount NUMERIC(14, 3),
    currency CHAR(3) NOT NULL,
    failure_code VARCHAR(64),
    failure_message TEXT,
    request_payload JSONB,
    response_payload JSONB,
    expires_at TIMESTAMPTZ,
    authorized_at TIMESTAMPTZ,
    captured_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    next_poll_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT payments_provider_payment_unq UNIQUE (provider, provider_payment_id),
    CONSTRAINT payments_amount_chk CHECK (amount >= 0),
    CONSTRAINT payments_fee_amount_chk CHECK (fee_amount >= 0),
    CONSTRAINT payments_net_amount_chk CHECK (net_amount IS NULL OR net_amount >= 0),
    CONSTRAINT payments_currency_upper_chk CHECK (currency = UPPER(currency))
);

ALTER TABLE IF EXISTS orders
    ALTER COLUMN unit_price_amount TYPE NUMERIC(14, 4),
    ALTER COLUMN subtotal_amount TYPE NUMERIC(14, 3),
    ALTER COLUMN discount_amount TYPE NUMERIC(14, 3),
    ALTER COLUMN total_amount TYPE NUMERIC(14, 3);

ALTER TABLE IF EXISTS payments
    ALTER COLUMN amount TYPE NUMERIC(14, 3),
    ALTER COLUMN fee_amount TYPE NUMERIC(14, 3),
    ALTER COLUMN net_amount TYPE NUMERIC(14, 3);

ALTER TABLE IF EXISTS payments
    ADD COLUMN IF NOT EXISTS provider_tx_hash VARCHAR(128),
    ADD COLUMN IF NOT EXISTS next_poll_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_customer_idempotency_key
    ON orders (customer_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_customer_status
    ON orders (customer_id, status);

CREATE INDEX IF NOT EXISTS idx_orders_status_created_at
    ON orders (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_order_status
    ON payments (order_id, status);

CREATE INDEX IF NOT EXISTS idx_payments_provider
    ON payments (provider);

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_provider_tx_hash
    ON payments (provider, provider_tx_hash)
    WHERE provider_tx_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_provider_status_next_poll_at
    ON payments (provider, status, next_poll_at);

DO $$
BEGIN
    IF to_regclass('public.orders') IS NOT NULL
        AND NOT EXISTS (
            SELECT 1
            FROM pg_trigger
            WHERE tgname = 'trg_orders_set_updated_at'
              AND tgrelid = 'public.orders'::regclass
        ) THEN
        CREATE TRIGGER trg_orders_set_updated_at
            BEFORE UPDATE ON orders
            FOR EACH ROW
        EXECUTE FUNCTION set_updated_at_timestamp();
    END IF;
END
$$;

DO $$
BEGIN
    IF to_regclass('public.payments') IS NOT NULL
        AND NOT EXISTS (
            SELECT 1
            FROM pg_trigger
            WHERE tgname = 'trg_payments_set_updated_at'
              AND tgrelid = 'public.payments'::regclass
        ) THEN
        CREATE TRIGGER trg_payments_set_updated_at
            BEFORE UPDATE ON payments
            FOR EACH ROW
        EXECUTE FUNCTION set_updated_at_timestamp();
    END IF;
END
$$;

DO $$
BEGIN
    IF to_regclass('public.order_status_history') IS NOT NULL
        AND to_regclass('public.orders') IS NOT NULL
        AND NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'order_status_history_order_id_fkey'
              AND conrelid = 'public.order_status_history'::regclass
        ) THEN
        ALTER TABLE order_status_history
            ADD CONSTRAINT order_status_history_order_id_fkey
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE NOT VALID;
    END IF;
END
$$;

DO $$
BEGIN
    IF to_regclass('public.payments') IS NOT NULL
        AND to_regclass('public.orders') IS NOT NULL
        AND NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'payments_order_id_fkey'
              AND conrelid = 'public.payments'::regclass
        ) THEN
        ALTER TABLE payments
            ADD CONSTRAINT payments_order_id_fkey
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE NOT VALID;
    END IF;
END
$$;

DO $$
BEGIN
    IF to_regclass('public.payment_events') IS NOT NULL
        AND to_regclass('public.payments') IS NOT NULL
        AND NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'payment_events_payment_id_fkey'
              AND conrelid = 'public.payment_events'::regclass
        ) THEN
        ALTER TABLE payment_events
            ADD CONSTRAINT payment_events_payment_id_fkey
            FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL NOT VALID;
    END IF;
END
$$;

DO $$
BEGIN
    IF to_regclass('public.referral_commissions') IS NOT NULL
        AND to_regclass('public.orders') IS NOT NULL
        AND NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'referral_commissions_order_id_fkey'
              AND conrelid = 'public.referral_commissions'::regclass
        ) THEN
        ALTER TABLE referral_commissions
            ADD CONSTRAINT referral_commissions_order_id_fkey
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE NOT VALID;
    END IF;
END
$$;
