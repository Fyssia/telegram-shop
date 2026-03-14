package com.example.telegram_shop_stars.entity;

public enum PaymentStatus {
    created,
    pending,
    authorized,
    captured,
    succeeded,
    failed,
    cancelled,
    expired,
    refunded,
    partially_refunded
}
