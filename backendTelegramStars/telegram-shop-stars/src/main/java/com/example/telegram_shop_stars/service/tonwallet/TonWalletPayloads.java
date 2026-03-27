package com.example.telegram_shop_stars.service.tonwallet;

import com.example.telegram_shop_stars.service.tonwallet.TonPayApiClient.TonPayTransfer;
import com.example.telegram_shop_stars.service.tonwallet.TonPayApiClient.TonPayTransferStatus;

import java.util.LinkedHashMap;
import java.util.Map;

final class TonWalletPayloads {

    private TonWalletPayloads() {
    }

    static Map<String, Object> buildPendingPaymentRequestPayload(String providerName,
                                                                 TonCheckoutMethod checkoutMethod,
                                                                 String senderAddress) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("paymentMethod", checkoutMethod.apiValue());
        payload.put("senderAddress", senderAddress);
        payload.put("provider", providerName);
        return payload;
    }

    static Map<String, Object> buildPreparedPaymentRequestPayload(TonTransferPreparationContext context) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("paymentMethod", context.checkoutMethod().apiValue());
        payload.put("senderAddress", context.senderAddress());
        payload.put("chain", context.chain().apiValue());
        payload.put("network", context.chain().tonConnectNetwork());
        payload.put("asset", context.assetId());
        payload.put("assetTicker", context.assetTicker());
        payload.put("assetAmount", context.assetAmount().toPlainString());
        payload.put("assetAmountBaseUnits", context.assetAmountBaseUnits());
        payload.put("recipientAddress", context.recipientAddress());
        if (context.queryId() != null) {
            payload.put("queryId", context.queryId());
        }
        putIfNotBlank(payload, "commentToSender", context.commentToSender());
        putIfNotBlank(payload, "commentToRecipient", context.commentToRecipient());
        return payload;
    }

    static Map<String, Object> buildPreparedPaymentResponsePayload(TonTransferPreparationContext context,
                                                                   TonPayTransfer transfer) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("paymentMethod", context.checkoutMethod().apiValue());
        payload.put("chain", context.chain().apiValue());
        payload.put("network", context.chain().tonConnectNetwork());
        payload.put("asset", context.assetId());
        payload.put("assetTicker", context.assetTicker());
        payload.put("assetAmount", context.assetAmount().toPlainString());
        payload.put("assetAmountBaseUnits", context.assetAmountBaseUnits());
        payload.put("recipientAddress", context.recipientAddress());
        payload.put("validUntil", context.expiresAt().toEpochSecond());
        payload.put("tonPayReference", transfer.reference());
        payload.put("bodyBase64Hash", transfer.bodyBase64Hash());
        payload.put("transferAddress", transfer.message().address());
        payload.put("transferAmount", transfer.message().amount());
        putIfNotBlank(payload, "transferPayload", transfer.message().payload());
        return payload;
    }

    static Map<String, Object> mergeCompletedTransferPayload(Map<String, Object> existingPayload,
                                                             TonPayTransferStatus transferStatus,
                                                             String providerTxHash) {
        Map<String, Object> merged = new LinkedHashMap<>();
        if (existingPayload != null) {
            merged.putAll(existingPayload);
        }
        if (transferStatus.reference() != null) {
            merged.put("tonPayReference", transferStatus.reference());
        }
        if (providerTxHash != null) {
            merged.put("providerTxHash", providerTxHash);
        }
        putIfNotBlank(merged, "completedTransferStatus", transferStatus.status());
        putIfNotBlank(merged, "completedAt", transferStatus.date());
        putIfNotBlank(merged, "completedSenderAddress", transferStatus.senderAddress());
        putIfNotBlank(merged, "completedRecipientAddress", transferStatus.recipientAddress());
        putIfNotBlank(merged, "completedAsset", transferStatus.asset());
        putIfNotBlank(merged, "completedAssetTicker", transferStatus.assetTicker());
        putIfNotBlank(merged, "completedAmount", transferStatus.amount());
        putIfNotBlank(merged, "completedRawAmount", transferStatus.rawAmount());
        putIfNotBlank(merged, "completedErrorMessage", transferStatus.errorMessage());
        if (transferStatus.errorCode() != null) {
            merged.put("completedErrorCode", transferStatus.errorCode());
        }
        return merged;
    }

    static String readString(Map<String, Object> payload, String key) {
        if (payload == null || key == null) {
            return null;
        }
        Object value = payload.get(key);
        if (value == null) {
            return null;
        }
        if (value instanceof String stringValue) {
            return normalizeOptionalText(stringValue);
        }
        return normalizeOptionalText(String.valueOf(value));
    }

    static Long readLong(Map<String, Object> payload, String key) {
        if (payload == null || key == null) {
            return null;
        }
        Object value = payload.get(key);
        if (value instanceof Number number) {
            return number.longValue();
        }
        if (value instanceof String stringValue) {
            String normalized = normalizeOptionalText(stringValue);
            if (normalized == null) {
                return null;
            }
            try {
                return Long.parseLong(normalized);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private static void putIfNotBlank(Map<String, Object> payload, String key, String value) {
        if (payload == null || key == null) {
            return;
        }
        String normalized = normalizeOptionalText(value);
        if (normalized != null) {
            payload.put(key, normalized);
        }
    }

    private static String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
