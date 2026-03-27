package com.example.telegram_shop_stars.service.pricing;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

public final class OrderPricing {

    public static final String FULFILLMENT_BUY_STARS = "buyStars";
    public static final String FULFILLMENT_GIFT_PREMIUM = "giftPremium";
    public static final int STARS_MIN_AMOUNT = 50;
    public static final int STARS_MAX_AMOUNT = 25_000;
    public static final int STARS_STEP = 50;
    public static final int MONEY_SCALE = 3;
    public static final int UNIT_PRICE_SCALE = 4;

    private static final BigDecimal STARS_UNIT_PRICE_USD = new BigDecimal("0.016");
    private static final Map<Integer, BigDecimal> PREMIUM_MONTH_PRICES_USD = Map.of(
            3, new BigDecimal("12.99"),
            6, new BigDecimal("23.99"),
            12, new BigDecimal("42.99")
    );

    private OrderPricing() {
    }

    public static void validateQuantity(String fulfillmentMethod, int quantity) {
        if (FULFILLMENT_GIFT_PREMIUM.equals(fulfillmentMethod)) {
            if (!PREMIUM_MONTH_PRICES_USD.containsKey(quantity)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "For giftPremium, starsAmount must be one of 3, 6, 12 (premium months)"
                );
            }
            return;
        }

        if (quantity < STARS_MIN_AMOUNT || quantity > STARS_MAX_AMOUNT || quantity % STARS_STEP != 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "For buyStars, starsAmount must be between 50 and 25,000 in steps of 50"
            );
        }
    }

    public static BigDecimal expectedTotalAmountUsd(String fulfillmentMethod, int quantity) {
        if (FULFILLMENT_GIFT_PREMIUM.equals(fulfillmentMethod)) {
            BigDecimal premiumPrice = PREMIUM_MONTH_PRICES_USD.get(quantity);
            if (premiumPrice == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "For giftPremium, starsAmount must be one of 3, 6, 12 (premium months)"
                );
            }
            return normalizeMoney(premiumPrice);
        }

        return normalizeMoney(BigDecimal.valueOf(quantity).multiply(STARS_UNIT_PRICE_USD));
    }

    public static BigDecimal resolveUnitPriceAmount(String fulfillmentMethod, int quantity) {
        return expectedTotalAmountUsd(fulfillmentMethod, quantity).divide(
                BigDecimal.valueOf(quantity),
                UNIT_PRICE_SCALE,
                RoundingMode.HALF_UP
        );
    }

    public static BigDecimal normalizeMoney(BigDecimal amount) {
        return amount.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    public static BigDecimal zeroMoney() {
        return BigDecimal.ZERO.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }
}
