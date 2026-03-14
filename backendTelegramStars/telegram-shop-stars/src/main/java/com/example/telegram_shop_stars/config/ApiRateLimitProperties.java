package com.example.telegram_shop_stars.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.rate-limit")
public class ApiRateLimitProperties {

    private boolean enabled = true;
    private int invoicePerMinute = 20;
    private int usernameCheckPerMinute = 120;
    private int bucketTtlMinutes = 60;
    private int maxBuckets = 50_000;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public int getInvoicePerMinute() {
        return invoicePerMinute;
    }

    public void setInvoicePerMinute(int invoicePerMinute) {
        this.invoicePerMinute = invoicePerMinute;
    }

    public int getUsernameCheckPerMinute() {
        return usernameCheckPerMinute;
    }

    public void setUsernameCheckPerMinute(int usernameCheckPerMinute) {
        this.usernameCheckPerMinute = usernameCheckPerMinute;
    }

    public int getBucketTtlMinutes() {
        return bucketTtlMinutes;
    }

    public void setBucketTtlMinutes(int bucketTtlMinutes) {
        this.bucketTtlMinutes = bucketTtlMinutes;
    }

    public int getMaxBuckets() {
        return maxBuckets;
    }

    public void setMaxBuckets(int maxBuckets) {
        this.maxBuckets = maxBuckets;
    }
}
