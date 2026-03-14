CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE order_status AS ENUM (
    'created',
    'pending_payment',
    'paid',
    'processing',
    'fulfilled',
    'cancelled',
    'refunded',
    'failed',
    'expired'
);

CREATE TYPE order_source AS ENUM (
    'web',
    'telegram_bot',
    'admin',
    'api'
);

CREATE TYPE payment_status AS ENUM (
    'created',
    'pending',
    'authorized',
    'captured',
    'succeeded',
    'failed',
    'cancelled',
    'expired',
    'refunded',
    'partially_refunded'
);

CREATE TYPE referral_commission_status AS ENUM (
    'pending',
    'approved',
    'payable',
    'paid',
    'cancelled'
);

CREATE TYPE referral_commission_base AS ENUM (
    'profit',
    'order_total'
);

CREATE TYPE referral_payout_status AS ENUM (
    'pending',
    'processing',
    'paid',
    'failed',
    'cancelled'
);

CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    telegram_user_id BIGINT NOT NULL UNIQUE,
    telegram_username VARCHAR(64),
    first_name VARCHAR(128),
    last_name VARCHAR(128),
    language_code VARCHAR(10),
    referral_code VARCHAR(32) UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT customers_telegram_username_not_blank_chk CHECK (
        telegram_username IS NULL OR BTRIM(telegram_username) <> ''
    ),
    CONSTRAINT customers_referral_code_not_blank_chk CHECK (
        referral_code IS NULL OR BTRIM(referral_code) <> ''
    )
);

CREATE TABLE star_packages (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(128) NOT NULL,
    stars_amount INTEGER NOT NULL,
    price_amount NUMERIC(14, 2) NOT NULL,
    currency CHAR(3) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 1000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT star_packages_stars_amount_chk CHECK (stars_amount > 0),
    CONSTRAINT star_packages_price_amount_chk CHECK (price_amount > 0),
    CONSTRAINT star_packages_currency_upper_chk CHECK (currency = UPPER(currency))
);

CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    public_id UUID NOT NULL DEFAULT gen_random_uuid(),
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    star_package_id BIGINT REFERENCES star_packages(id) ON DELETE SET NULL,
    status order_status NOT NULL DEFAULT 'created',
    source order_source NOT NULL DEFAULT 'web',
    idempotency_key VARCHAR(128),
    stars_amount INTEGER NOT NULL,
    unit_price_amount NUMERIC(14, 2) NOT NULL,
    subtotal_amount NUMERIC(14, 2) NOT NULL,
    discount_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(14, 2) NOT NULL,
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

CREATE TABLE order_status_history (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    old_status order_status,
    new_status order_status NOT NULL,
    change_reason VARCHAR(255),
    changed_by VARCHAR(64) NOT NULL DEFAULT 'system',
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_payment_id VARCHAR(128) NOT NULL,
    payment_method VARCHAR(64),
    status payment_status NOT NULL DEFAULT 'created',
    amount NUMERIC(14, 2) NOT NULL,
    fee_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    net_amount NUMERIC(14, 2),
    currency CHAR(3) NOT NULL,
    failure_code VARCHAR(64),
    failure_message TEXT,
    request_payload JSONB,
    response_payload JSONB,
    expires_at TIMESTAMPTZ,
    authorized_at TIMESTAMPTZ,
    captured_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT payments_provider_payment_unq UNIQUE (provider, provider_payment_id),
    CONSTRAINT payments_amount_chk CHECK (amount >= 0),
    CONSTRAINT payments_fee_amount_chk CHECK (fee_amount >= 0),
    CONSTRAINT payments_net_amount_chk CHECK (net_amount IS NULL OR net_amount >= 0),
    CONSTRAINT payments_currency_upper_chk CHECK (currency = UPPER(currency))
);

CREATE TABLE payment_events (
    id BIGSERIAL PRIMARY KEY,
    payment_id BIGINT REFERENCES payments(id) ON DELETE SET NULL,
    provider VARCHAR(50) NOT NULL,
    provider_event_id VARCHAR(128) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_payload JSONB NOT NULL,
    is_processed BOOLEAN NOT NULL DEFAULT FALSE,
    processing_error TEXT,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    CONSTRAINT payment_events_provider_event_unq UNIQUE (provider, provider_event_id)
);

CREATE TABLE referral_relationships (
    id BIGSERIAL PRIMARY KEY,
    referrer_customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    referred_customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    referral_code_used VARCHAR(32),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT referral_relationships_referred_unq UNIQUE (referred_customer_id),
    CONSTRAINT referral_relationships_identity_unq UNIQUE (id, referrer_customer_id, referred_customer_id),
    CONSTRAINT referral_relationships_pair_unq UNIQUE (referrer_customer_id, referred_customer_id),
    CONSTRAINT referral_relationships_not_self_chk CHECK (referrer_customer_id <> referred_customer_id)
);

CREATE TABLE referral_commissions (
    id BIGSERIAL PRIMARY KEY,
    referral_relationship_id BIGINT NOT NULL REFERENCES referral_relationships(id) ON DELETE RESTRICT,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    referrer_customer_id BIGINT NOT NULL,
    referred_customer_id BIGINT NOT NULL,
    commission_base referral_commission_base NOT NULL DEFAULT 'profit',
    commission_rate NUMERIC(5, 2) NOT NULL,
    order_total_amount NUMERIC(14, 2) NOT NULL,
    cost_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    profit_amount NUMERIC(14, 2) NOT NULL,
    commission_base_amount NUMERIC(14, 2) NOT NULL,
    commission_amount NUMERIC(14, 2) NOT NULL,
    currency CHAR(3) NOT NULL,
    status referral_commission_status NOT NULL DEFAULT 'pending',
    approved_at TIMESTAMPTZ,
    payable_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT referral_commissions_order_unq UNIQUE (order_id),
    CONSTRAINT referral_commissions_relationship_match_fk
        FOREIGN KEY (referral_relationship_id, referrer_customer_id, referred_customer_id)
        REFERENCES referral_relationships (id, referrer_customer_id, referred_customer_id)
        ON DELETE RESTRICT,
    CONSTRAINT referral_commissions_not_self_chk CHECK (referrer_customer_id <> referred_customer_id),
    CONSTRAINT referral_commissions_rate_chk CHECK (commission_rate >= 0 AND commission_rate <= 100),
    CONSTRAINT referral_commissions_order_total_amount_chk CHECK (order_total_amount >= 0),
    CONSTRAINT referral_commissions_cost_amount_chk CHECK (cost_amount >= 0),
    CONSTRAINT referral_commissions_profit_amount_chk CHECK (profit_amount >= 0),
    CONSTRAINT referral_commissions_cost_lte_total_chk CHECK (cost_amount <= order_total_amount),
    CONSTRAINT referral_commissions_base_amount_chk CHECK (commission_base_amount >= 0),
    CONSTRAINT referral_commissions_base_lte_total_chk CHECK (commission_base_amount <= order_total_amount),
    CONSTRAINT referral_commissions_base_consistency_chk CHECK (
        (commission_base = 'profit' AND commission_base_amount = profit_amount) OR
        (commission_base = 'order_total' AND commission_base_amount = order_total_amount)
    ),
    CONSTRAINT referral_commissions_amount_chk CHECK (commission_amount >= 0),
    CONSTRAINT referral_commissions_currency_upper_chk CHECK (currency = UPPER(currency))
);

CREATE TABLE referral_payouts (
    id BIGSERIAL PRIMARY KEY,
    referrer_customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    amount NUMERIC(14, 2) NOT NULL,
    currency CHAR(3) NOT NULL,
    status referral_payout_status NOT NULL DEFAULT 'pending',
    payout_provider VARCHAR(50),
    payout_reference VARCHAR(128),
    details JSONB,
    processed_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT referral_payouts_amount_chk CHECK (amount > 0),
    CONSTRAINT referral_payouts_currency_upper_chk CHECK (currency = UPPER(currency))
);

CREATE TABLE referral_payout_items (
    id BIGSERIAL PRIMARY KEY,
    payout_id BIGINT NOT NULL REFERENCES referral_payouts(id) ON DELETE CASCADE,
    commission_id BIGINT NOT NULL REFERENCES referral_commissions(id) ON DELETE RESTRICT,
    amount NUMERIC(14, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT referral_payout_items_commission_unq UNIQUE (commission_id),
    CONSTRAINT referral_payout_items_amount_chk CHECK (amount > 0)
);

CREATE TABLE referral_program_settings (
    id SMALLINT PRIMARY KEY DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    commission_base referral_commission_base NOT NULL DEFAULT 'profit',
    default_commission_rate NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
    hold_period_days INTEGER NOT NULL DEFAULT 14,
    min_order_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT referral_program_settings_singleton_chk CHECK (id = 1),
    CONSTRAINT referral_program_settings_default_rate_chk CHECK (
        default_commission_rate >= 0 AND default_commission_rate <= 100
    ),
    CONSTRAINT referral_program_settings_hold_days_chk CHECK (hold_period_days >= 0),
    CONSTRAINT referral_program_settings_min_order_chk CHECK (min_order_amount >= 0)
);

INSERT INTO referral_program_settings (id)
VALUES (1);

CREATE UNIQUE INDEX uq_orders_customer_idempotency_key
    ON orders (customer_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

CREATE INDEX idx_orders_customer_status
    ON orders (customer_id, status);

CREATE INDEX idx_orders_status_created_at
    ON orders (status, created_at DESC);

CREATE INDEX idx_order_status_history_order_created_at
    ON order_status_history (order_id, created_at DESC);

CREATE INDEX idx_payments_order_status
    ON payments (order_id, status);

CREATE INDEX idx_payments_provider
    ON payments (provider);

CREATE INDEX idx_payment_events_processed_received
    ON payment_events (is_processed, received_at);

CREATE INDEX idx_referral_relationships_referrer
    ON referral_relationships (referrer_customer_id);

CREATE INDEX idx_referral_commissions_relationship
    ON referral_commissions (referral_relationship_id);

CREATE INDEX idx_referral_commissions_referrer_status
    ON referral_commissions (referrer_customer_id, status);

CREATE INDEX idx_referral_commissions_status_created_at
    ON referral_commissions (status, created_at DESC);

CREATE INDEX idx_referral_payouts_referrer_status
    ON referral_payouts (referrer_customer_id, status);

CREATE INDEX idx_referral_payout_items_payout
    ON referral_payout_items (payout_id);

CREATE INDEX idx_payment_events_payment
    ON payment_events (payment_id);

CREATE TRIGGER trg_customers_set_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER trg_star_packages_set_updated_at
    BEFORE UPDATE ON star_packages
    FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER trg_orders_set_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER trg_payments_set_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER trg_referral_commissions_set_updated_at
    BEFORE UPDATE ON referral_commissions
    FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER trg_referral_payouts_set_updated_at
    BEFORE UPDATE ON referral_payouts
    FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER trg_referral_program_settings_set_updated_at
    BEFORE UPDATE ON referral_program_settings
    FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();
