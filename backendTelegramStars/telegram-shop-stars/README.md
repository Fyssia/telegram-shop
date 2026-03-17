# Quack Stars (Backend)

## Production Checklist

1. Copy `.env.example` to your deployment secret store.
   Local runs may also use a `.env` file in the backend project root because Spring imports `optional:file:.env[.properties]`.
2. Set required secrets:
   - `CRYPTOBOT_TESTNET_TOKEN`
   - `TON_WALLET_RECIPIENT_ADDRESS`
   - `TON_WALLET_TONCENTER_API_KEY`
   - `TG_TDLIB_API_ID`
   - `TG_TDLIB_API_HASH`
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
- Phone number can be set with `TG_TDLIB_PHONE_NUMBER` or `TDLIB_PHONE_NUMBER`.
- By default, TDLib is reserved for premium checks only because `TG_TDLIB_ENABLED_FOR_PUBLIC_CHECKS=false`.

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
