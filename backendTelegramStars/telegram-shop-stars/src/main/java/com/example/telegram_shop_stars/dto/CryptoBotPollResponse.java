package com.example.telegram_shop_stars.dto;

public record CryptoBotPollResponse(
        int checkedPayments,
        int invoicesReturnedByProvider,
        int updatedRows,
        int invoicesMissingInProviderResponse
) {
}
