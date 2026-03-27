ALTER TABLE star_packages
    ALTER COLUMN price_amount TYPE NUMERIC(14, 3);

ALTER TABLE orders
    ALTER COLUMN unit_price_amount TYPE NUMERIC(14, 4),
    ALTER COLUMN subtotal_amount TYPE NUMERIC(14, 3),
    ALTER COLUMN discount_amount TYPE NUMERIC(14, 3),
    ALTER COLUMN total_amount TYPE NUMERIC(14, 3);

ALTER TABLE payments
    ALTER COLUMN amount TYPE NUMERIC(14, 3),
    ALTER COLUMN fee_amount TYPE NUMERIC(14, 3),
    ALTER COLUMN net_amount TYPE NUMERIC(14, 3);

ALTER TABLE referral_commissions
    ALTER COLUMN order_total_amount TYPE NUMERIC(14, 3),
    ALTER COLUMN cost_amount TYPE NUMERIC(14, 3),
    ALTER COLUMN profit_amount TYPE NUMERIC(14, 3),
    ALTER COLUMN commission_base_amount TYPE NUMERIC(14, 3),
    ALTER COLUMN commission_amount TYPE NUMERIC(14, 3);

ALTER TABLE referral_payouts
    ALTER COLUMN amount TYPE NUMERIC(14, 3);

ALTER TABLE referral_payout_items
    ALTER COLUMN amount TYPE NUMERIC(14, 3);

ALTER TABLE referral_program_settings
    ALTER COLUMN min_order_amount TYPE NUMERIC(14, 3);
