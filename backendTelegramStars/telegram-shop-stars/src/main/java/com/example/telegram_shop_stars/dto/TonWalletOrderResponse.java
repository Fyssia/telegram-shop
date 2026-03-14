package com.example.telegram_shop_stars.dto;

public record TonWalletOrderResponse(
        long orderId,
        String paymentReference,
        String paymentStatus,
        String orderStatus,
        String recipientAddress,
        String amountTon,
        String amountNano,
        long validUntil,
        String network
) {
}
