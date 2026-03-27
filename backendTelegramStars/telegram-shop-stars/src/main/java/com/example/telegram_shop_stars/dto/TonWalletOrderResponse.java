package com.example.telegram_shop_stars.dto;

public record TonWalletOrderResponse(
        long orderId,
        String paymentReference,
        String paymentStatus,
        String orderStatus,
        String paymentMethod,
        String asset,
        String assetAmount,
        String assetAmountBaseUnits,
        String transferAddress,
        String transferAmount,
        String transferPayload,
        String recipientAddress,
        long validUntil,
        String network
) {
}
