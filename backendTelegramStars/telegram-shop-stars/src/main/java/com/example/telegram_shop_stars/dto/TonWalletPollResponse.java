package com.example.telegram_shop_stars.dto;

public record TonWalletPollResponse(
        int checkedPayments,
        int matchedPayments,
        int updatedRows
) {
}
