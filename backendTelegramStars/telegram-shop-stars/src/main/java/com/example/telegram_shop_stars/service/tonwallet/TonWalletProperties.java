package com.example.telegram_shop_stars.service.tonwallet;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.math.BigDecimal;

@ConfigurationProperties(prefix = "tonwallet")
public class TonWalletProperties {

    private boolean enabled = false;
    private String providerName = "ton_wallet";
    private String recipientAddress = "";
    private String network = "-239";
    private BigDecimal usdPerTon = new BigDecimal("3.00");
    private int paymentWindowSeconds = 900;
    private int amountNonceMaxNano = 999_999;
    private int pollDelayMs = 5_000;
    private int pollBatchSize = 100;
    private String toncenterBaseUrl = "https://toncenter.com/api/v2";
    private String toncenterApiKey = "";
    private int toncenterTxLimit = 50;
    private int connectTimeoutMs = 5_000;
    private int readTimeoutMs = 10_000;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getProviderName() {
        return providerName;
    }

    public void setProviderName(String providerName) {
        this.providerName = providerName;
    }

    public String getRecipientAddress() {
        return recipientAddress;
    }

    public void setRecipientAddress(String recipientAddress) {
        this.recipientAddress = recipientAddress;
    }

    public String getNetwork() {
        return network;
    }

    public void setNetwork(String network) {
        this.network = network;
    }

    public BigDecimal getUsdPerTon() {
        return usdPerTon;
    }

    public void setUsdPerTon(BigDecimal usdPerTon) {
        this.usdPerTon = usdPerTon;
    }

    public int getPaymentWindowSeconds() {
        return paymentWindowSeconds;
    }

    public void setPaymentWindowSeconds(int paymentWindowSeconds) {
        this.paymentWindowSeconds = paymentWindowSeconds;
    }

    public int getAmountNonceMaxNano() {
        return amountNonceMaxNano;
    }

    public void setAmountNonceMaxNano(int amountNonceMaxNano) {
        this.amountNonceMaxNano = amountNonceMaxNano;
    }

    public int getPollDelayMs() {
        return pollDelayMs;
    }

    public void setPollDelayMs(int pollDelayMs) {
        this.pollDelayMs = pollDelayMs;
    }

    public int getPollBatchSize() {
        return pollBatchSize;
    }

    public void setPollBatchSize(int pollBatchSize) {
        this.pollBatchSize = pollBatchSize;
    }

    public String getToncenterBaseUrl() {
        return toncenterBaseUrl;
    }

    public void setToncenterBaseUrl(String toncenterBaseUrl) {
        this.toncenterBaseUrl = toncenterBaseUrl;
    }

    public String getToncenterApiKey() {
        return toncenterApiKey;
    }

    public void setToncenterApiKey(String toncenterApiKey) {
        this.toncenterApiKey = toncenterApiKey;
    }

    public int getToncenterTxLimit() {
        return toncenterTxLimit;
    }

    public void setToncenterTxLimit(int toncenterTxLimit) {
        this.toncenterTxLimit = toncenterTxLimit;
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
