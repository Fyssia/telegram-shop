package com.example.telegram_shop_stars.service.balance;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "balance")
public class BalanceApiProperties {

    private String localApiUrl = "http://127.0.0.1:8080/api/balance";
    private int connectTimeoutMs = 5_000;
    private int readTimeoutMs = 30_000;
    private int maxAttempts = 2;
    private int retryBackoffMs = 250;
    private int reservationMaxRetries = 20;
    private long unpaidReservationTtlMs = 900_000;
    private int cleanupBatchSize = 200;

    public String getLocalApiUrl() {
        return localApiUrl;
    }

    public void setLocalApiUrl(String localApiUrl) {
        this.localApiUrl = localApiUrl;
    }

    public int getConnectTimeoutMs() {
        return connectTimeoutMs;
    }

    public void setConnectTimeoutMs(int connectTimeoutMs) {
        this.connectTimeoutMs = connectTimeoutMs;
    }

    public int getReadTimeoutMs() {
        return readTimeoutMs;
    }

    public void setReadTimeoutMs(int readTimeoutMs) {
        this.readTimeoutMs = readTimeoutMs;
    }

    public int getMaxAttempts() {
        return maxAttempts;
    }

    public void setMaxAttempts(int maxAttempts) {
        this.maxAttempts = maxAttempts;
    }

    public int getRetryBackoffMs() {
        return retryBackoffMs;
    }

    public void setRetryBackoffMs(int retryBackoffMs) {
        this.retryBackoffMs = retryBackoffMs;
    }

    public int getReservationMaxRetries() {
        return reservationMaxRetries;
    }

    public void setReservationMaxRetries(int reservationMaxRetries) {
        this.reservationMaxRetries = reservationMaxRetries;
    }

    public long getUnpaidReservationTtlMs() {
        return unpaidReservationTtlMs;
    }

    public void setUnpaidReservationTtlMs(long unpaidReservationTtlMs) {
        this.unpaidReservationTtlMs = unpaidReservationTtlMs;
    }

    public int getCleanupBatchSize() {
        return cleanupBatchSize;
    }

    public void setCleanupBatchSize(int cleanupBatchSize) {
        this.cleanupBatchSize = cleanupBatchSize;
    }
}
