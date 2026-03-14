package com.example.telegram_shop_stars.entity;

public enum OrderStatus {
    created,
    pending_payment,
    paid,
    processing,
    fulfilled,
    cancelled,
    refunded,
    failed,
    expired
}
