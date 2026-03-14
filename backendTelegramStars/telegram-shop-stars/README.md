# telegram-shop-stars (Backend)

## Production Checklist

1. Copy `.env.example` to your deployment secret store.
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
