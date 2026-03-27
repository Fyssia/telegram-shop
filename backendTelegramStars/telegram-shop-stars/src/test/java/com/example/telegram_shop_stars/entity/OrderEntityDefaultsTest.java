package com.example.telegram_shop_stars.entity;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class OrderEntityDefaultsTest {

    @Test
    void shouldInitializeBalanceDefaultsForNewOrders() {
        OrderEntity order = new OrderEntity();

        assertThat(order.getBalanceReservationStatus()).isEqualTo(BalanceReservationStatus.none);
        assertThat(order.getBalanceReservedAmount()).isEqualByComparingTo(new BigDecimal("0.000"));
        assertThat(order.getFulfillmentAttempts()).isZero();
    }

    @Test
    void shouldRestoreBalanceDefaultsBeforePersist() {
        OrderEntity order = new OrderEntity();
        order.setBalanceReservationStatus(null);
        order.setBalanceReservedAmount(null);
        order.setFulfillmentAttempts(null);

        order.applyDefaults();

        assertThat(order.getBalanceReservationStatus()).isEqualTo(BalanceReservationStatus.none);
        assertThat(order.getBalanceReservedAmount()).isEqualByComparingTo(new BigDecimal("0.000"));
        assertThat(order.getFulfillmentAttempts()).isZero();
    }
}
