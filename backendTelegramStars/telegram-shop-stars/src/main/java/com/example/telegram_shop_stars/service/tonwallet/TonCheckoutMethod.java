package com.example.telegram_shop_stars.service.tonwallet;

import com.example.telegram_shop_stars.error.ApiProblemException;
import org.springframework.http.HttpStatus;

import java.util.Locale;

enum TonCheckoutMethod {
    DEFAULT_TON("ton_wallet"),
    TON("ton"),
    USDT_TON("usdt_ton"),
    TON_DEV("ton_dev");

    private static final String TON_ASSET_ID = "TON";
    private static final String PAYMENT_PROVIDER_UNAVAILABLE_CODE = "PAYMENT_PROVIDER_UNAVAILABLE";

    private final String apiValue;

    TonCheckoutMethod(String apiValue) {
        this.apiValue = apiValue;
    }

    String apiValue() {
        return apiValue;
    }

    static TonCheckoutMethod fromApiValue(String raw) {
        String normalized = normalize(raw);
        if (normalized == null) {
            return DEFAULT_TON;
        }
        return switch (normalized) {
            case "ton_wallet" -> DEFAULT_TON;
            case "ton" -> TON;
            case "usdt_ton" -> USDT_TON;
            case "ton_dev" -> TON_DEV;
            default -> null;
        };
    }

    TonWalletChain resolveChain(TonWalletProperties properties) {
        return switch (this) {
            case DEFAULT_TON -> TonWalletChain.resolveDefault(properties.getDefaultChain(), properties.getNetwork());
            case TON, USDT_TON -> TonWalletChain.MAINNET;
            case TON_DEV -> TonWalletChain.TESTNET;
        };
    }

    boolean usesJetton() {
        return this == USDT_TON;
    }

    int assetScale() {
        return usesJetton() ? 6 : 9;
    }

    String assetTicker() {
        return usesJetton() ? "USDT" : "TON";
    }

    String resolveAssetId(TonWalletProperties properties, TonWalletChain chain) {
        if (!usesJetton()) {
            return TON_ASSET_ID;
        }

        String configured = chain == TonWalletChain.TESTNET
                ? properties.getUsdtTestnetMasterAddress()
                : properties.getUsdtMainnetMasterAddress();
        if (configured == null || configured.isBlank()) {
            throw new ApiProblemException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    PAYMENT_PROVIDER_UNAVAILABLE_CODE,
                    "TON wallet USDT asset is not configured for " + chain.apiValue()
            );
        }
        return configured.trim();
    }

    private static String normalize(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return normalized.isEmpty() ? null : normalized;
    }
}
