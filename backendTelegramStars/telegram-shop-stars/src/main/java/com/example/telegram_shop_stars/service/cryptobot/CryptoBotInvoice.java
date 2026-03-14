package com.example.telegram_shop_stars.service.cryptobot;

import tools.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Locale;

public record CryptoBotInvoice(
        long invoiceId,
        String hash,
        String status,
        String currencyType,
        String asset,
        String fiat,
        BigDecimal amount,
        Instant expirationDate,
        Instant paidAt,
        String botInvoiceUrl,
        String miniAppInvoiceUrl,
        String webAppInvoiceUrl,
        JsonNode raw
) {
    public String normalizedStatus() {
        return status == null ? "" : status.trim().toLowerCase(Locale.ROOT);
    }

    public String resolvedCurrencyCode() {
        if ("fiat".equalsIgnoreCase(currencyType)) {
            return fiat == null ? null : fiat.trim().toUpperCase(Locale.ROOT);
        }
        return asset == null ? null : asset.trim().toUpperCase(Locale.ROOT);
    }
}
