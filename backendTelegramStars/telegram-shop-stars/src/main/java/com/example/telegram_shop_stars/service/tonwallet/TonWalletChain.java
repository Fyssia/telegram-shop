package com.example.telegram_shop_stars.service.tonwallet;

import java.util.Locale;

public enum TonWalletChain {
    MAINNET("mainnet", "-239"),
    TESTNET("testnet", "-3");

    private final String apiValue;
    private final String tonConnectNetwork;

    TonWalletChain(String apiValue, String tonConnectNetwork) {
        this.apiValue = apiValue;
        this.tonConnectNetwork = tonConnectNetwork;
    }

    public String apiValue() {
        return apiValue;
    }

    public String tonConnectNetwork() {
        return tonConnectNetwork;
    }

    public static TonWalletChain fromValue(String value) {
        String normalized = normalize(value);
        if ("mainnet".equals(normalized) || "-239".equals(normalized)) {
            return MAINNET;
        }
        if ("testnet".equals(normalized) || "-3".equals(normalized)) {
            return TESTNET;
        }
        return null;
    }

    public static TonWalletChain resolveDefault(String configuredDefaultChain, String legacyNetwork) {
        TonWalletChain configured = fromValue(configuredDefaultChain);
        if (configured != null) {
            return configured;
        }

        TonWalletChain legacy = fromValue(legacyNetwork);
        return legacy == null ? MAINNET : legacy;
    }

    private static String normalize(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }
}
