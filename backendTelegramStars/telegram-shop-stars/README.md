# Quack Stars (Backend)

## Production Checklist

1. Copy `.env.example` to your deployment secret store.
   Local runs may also use a `.env` file in the backend project root because Spring imports `optional:file:.env[.properties]`.
2. Set required secrets:
   - `CRYPTOBOT_TESTNET_TOKEN`
   - `TON_WALLET_RECIPIENT_ADDRESS`
   - `TON_WALLET_TONPAY_API_KEY` if your TON Pay environment requires it
   - `TG_TDLIB_API_ID`
   - `TG_TDLIB_API_HASH`
   - `TG_TDLIB_PHONE_NUMBER`
   - `SPRING_DATASOURCE_*`
3. Keep payment providers disabled until secrets/config are ready:
   - `CRYPTOBOT_TESTNET_ENABLED=false`
   - `TON_WALLET_ENABLED=false`

## Public Endpoints

- `POST /api/payments/cryptobot/testnet/invoices`
- `POST /api/payments/ton-wallet/orders`
- `POST /api/tg/username/check`
- `GET /actuator/health`
- `GET /actuator/info`

### `POST /api/tg/username/check`

Supports optional premium validation for Telegram Premium gifting:

- Request: `{ "username": "recipient", "checkPremium": true }`
- Response includes `isPremium` for `status=USER` when premium check is requested.
- If premium status cannot be verified, response status is `PREMIUM_CHECK_UNAVAILABLE`.

Both payment endpoints also enforce premium eligibility server-side for `giftPremium` orders.

### TDLib Premium Check

- Premium validation uses TDLib credentials from `TG_TDLIB_API_ID` / `TG_TDLIB_API_HASH`.
- As a fallback, the app also accepts `TELEGRAM_API_ID` / `TELEGRAM_API_HASH` and `API_ID` / `API_HASH`.
- Phone number must be configured with `TG_TDLIB_PHONE_NUMBER` or `TDLIB_PHONE_NUMBER`; console login fallback is disabled for server safety.
- By default, TDLib is reserved for premium checks only because `TG_TDLIB_ENABLED_FOR_PUBLIC_CHECKS=false`.

### TON Wallet Flow

- TON wallet payments are prepared and reconciled through TON Pay.
- `TON_WALLET_DEFAULT_CHAIN`, `TON_WALLET_MAINNET_RECIPIENT_ADDRESS`, `TON_WALLET_TESTNET_RECIPIENT_ADDRESS`,
  `TON_WALLET_USDT_MAINNET_MASTER_ADDRESS`, `TON_WALLET_USDT_TESTNET_MASTER_ADDRESS`,
  `TON_WALLET_TONPAY_MAINNET_BASE_URL`, `TON_WALLET_TONPAY_TESTNET_BASE_URL`, and `TON_WALLET_TONPAY_API_KEY`
  control the chain-specific runtime.
- `TON_WALLET_DEV_AUTO_PAY_ENABLED=true` enables the `ton_dev` checkout method to auto-mark payments as paid and
  immediately trigger fulfillment. Keep it disabled outside local development.
- Legacy Toncenter settings are no longer used by the payment flow.

All other endpoints are denied by default in security config.

## Rate Limits

Per-IP limits are enabled for public POST APIs:

- `POST /api/payments/cryptobot/testnet/invoices`
- `POST /api/payments/ton-wallet/orders`
- `POST /api/tg/username/check`

Tune via:

- `APP_RATE_LIMIT_INVOICE_PER_MINUTE`
- `APP_RATE_LIMIT_USERNAME_CHECK_PER_MINUTE`
- `APP_RATE_LIMIT_BUCKET_TTL_MINUTES`
- `APP_RATE_LIMIT_MAX_BUCKETS`

## Metrics

Prometheus endpoint is exposed by Spring Actuator settings (`/actuator/prometheus`) but still protected by application security.
If scraping is needed, allow it explicitly at the edge/internal network.
