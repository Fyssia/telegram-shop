package com.example.telegram_shop_stars.service.pricing;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class OrderPricingTest {

    @Test
    void shouldUseOnePointSixFiveCentsPerStar() {
        assertThat(OrderPricing.expectedTotalAmountUsd(OrderPricing.FULFILLMENT_BUY_STARS, 100))
                .isEqualByComparingTo(new BigDecimal("1.65"));
    }

    @Test
    void shouldRoundTotalAmountToTwoDecimals() {
        assertThat(OrderPricing.expectedTotalAmountUsd(OrderPricing.FULFILLMENT_BUY_STARS, 50))
                .isEqualByComparingTo(new BigDecimal("0.83"));
    }

    @Test
    void shouldKeepUnitPricePrecisionAtFourDecimalsForStars() {
        assertThat(OrderPricing.resolveUnitPriceAmount(OrderPricing.FULFILLMENT_BUY_STARS, 50))
                .isEqualByComparingTo(new BigDecimal("0.0165"));
    }
}
