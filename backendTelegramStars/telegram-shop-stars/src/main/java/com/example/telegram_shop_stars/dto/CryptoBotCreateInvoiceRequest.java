package com.example.telegram_shop_stars.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record CryptoBotCreateInvoiceRequest(
        Long orderId,

        @Size(max = 64)
        String username,

        @Min(1)
        Integer starsAmount,

        @Size(max = 32)
        String fulfillmentMethod,

        @NotBlank
        String currencyType,

        @NotNull
        @DecimalMin(value = "0.01", inclusive = true)
        @Digits(integer = 12, fraction = 3)
        BigDecimal amount,

        @Size(max = 16)
        String asset,

        @Size(max = 16)
        String fiat,

        @Size(max = 64)
        String acceptedAssets,

        @Size(max = 255)
        String description,

        @Size(max = 255)
        String payload,

        @Min(30)
        @Max(604800)
        Integer expiresIn
) {
}
