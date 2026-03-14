package com.example.telegram_shop_stars.service.fragment;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "fragment")
public class FragmentApiProperties {

    private boolean enabled = true;
    private String localApiUrl = "http://127.0.0.1:8080/api";
    private int connectTimeoutMs = 10_000;
    private int readTimeoutMs = 180_000;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

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
}
