package com.example.telegram_shop_stars.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record TonWalletCreateOrderRequest(
        Long orderId,

        @Size(max = 64)
        String username,

        @Min(1)
        Integer starsAmount,

        @Size(max = 32)
        String fulfillmentMethod,

        @DecimalMin(value = "0.01", inclusive = true)
        @Digits(integer = 12, fraction = 3)
        BigDecimal amount,

        @Size(max = 32)
        String paymentMethod,

        @Size(max = 128)
        String senderAddress
) {
}
