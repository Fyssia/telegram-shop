package com.example.telegram_shop_stars.service.tonwallet;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.math.BigDecimal;

@ConfigurationProperties(prefix = "tonwallet")
public class TonWalletProperties {

    private boolean enabled = false;
    private String providerName = "ton_wallet";
    private String recipientAddress = "";
    private String network = "-239";
    private String defaultChain = "";
    private String mainnetRecipientAddress = "";
    private String testnetRecipientAddress = "";
    private String usdtMainnetMasterAddress = "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs";
    private String usdtTestnetMasterAddress = "";
    private String tonPayMainnetBaseUrl = "https://pay.ton.org";
    private String tonPayTestnetBaseUrl = "https://dev.pay.ton.org";
    private String tonPayApiKey = "";
    private BigDecimal usdPerTon = new BigDecimal("3.00");
    private int paymentWindowSeconds = 900;
    private int amountNonceMaxNano = 999_999;
    private int pollDelayMs = 5_000;
    private int pollBatchSize = 100;
    private int connectTimeoutMs = 5_000;
    private int readTimeoutMs = 10_000;
    private int blockchainCheckIntervalMs = 15_000;
    private int blockchainFailureRetryDelayMs = 60_000;
    private boolean devAutoPayEnabled = false;

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

    public String getDefaultChain() {
        return defaultChain;
    }

    public void setDefaultChain(String defaultChain) {
        this.defaultChain = defaultChain;
    }

    public String getMainnetRecipientAddress() {
        return mainnetRecipientAddress;
    }

    public void setMainnetRecipientAddress(String mainnetRecipientAddress) {
        this.mainnetRecipientAddress = mainnetRecipientAddress;
    }

    public String getTestnetRecipientAddress() {
        return testnetRecipientAddress;
    }

    public void setTestnetRecipientAddress(String testnetRecipientAddress) {
        this.testnetRecipientAddress = testnetRecipientAddress;
    }

    public String getUsdtMainnetMasterAddress() {
        return usdtMainnetMasterAddress;
    }

    public void setUsdtMainnetMasterAddress(String usdtMainnetMasterAddress) {
        this.usdtMainnetMasterAddress = usdtMainnetMasterAddress;
    }

    public String getUsdtTestnetMasterAddress() {
        return usdtTestnetMasterAddress;
    }

    public void setUsdtTestnetMasterAddress(String usdtTestnetMasterAddress) {
        this.usdtTestnetMasterAddress = usdtTestnetMasterAddress;
    }

    public String getTonPayMainnetBaseUrl() {
        return tonPayMainnetBaseUrl;
    }

    public void setTonPayMainnetBaseUrl(String tonPayMainnetBaseUrl) {
        this.tonPayMainnetBaseUrl = tonPayMainnetBaseUrl;
    }

    public String getTonPayTestnetBaseUrl() {
        return tonPayTestnetBaseUrl;
    }

    public void setTonPayTestnetBaseUrl(String tonPayTestnetBaseUrl) {
        this.tonPayTestnetBaseUrl = tonPayTestnetBaseUrl;
    }

    public String getTonPayApiKey() {
        return tonPayApiKey;
    }

    public void setTonPayApiKey(String tonPayApiKey) {
        this.tonPayApiKey = tonPayApiKey;
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

    public int getBlockchainCheckIntervalMs() {
        return blockchainCheckIntervalMs;
    }

    public void setBlockchainCheckIntervalMs(int blockchainCheckIntervalMs) {
        this.blockchainCheckIntervalMs = blockchainCheckIntervalMs;
    }

    public int getBlockchainFailureRetryDelayMs() {
        return blockchainFailureRetryDelayMs;
    }

    public void setBlockchainFailureRetryDelayMs(int blockchainFailureRetryDelayMs) {
        this.blockchainFailureRetryDelayMs = blockchainFailureRetryDelayMs;
    }

    public boolean isDevAutoPayEnabled() {
        return devAutoPayEnabled;
    }

    public void setDevAutoPayEnabled(boolean devAutoPayEnabled) {
        this.devAutoPayEnabled = devAutoPayEnabled;
    }
}
