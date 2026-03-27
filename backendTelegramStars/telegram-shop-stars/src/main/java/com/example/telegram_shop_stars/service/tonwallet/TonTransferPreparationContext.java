package com.example.telegram_shop_stars.service.tonwallet;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

record TonTransferPreparationContext(
        boolean alreadyPrepared,
        TonCheckoutMethod checkoutMethod,
        String senderAddress,
        TonWalletChain chain,
        String recipientAddress,
        String assetId,
        String assetTicker,
        BigDecimal assetAmount,
        String assetAmountBaseUnits,
        Long queryId,
        OffsetDateTime expiresAt,
        String commentToSender,
        String commentToRecipient
) {
    static TonTransferPreparationContext preparedMarker() {
        return new TonTransferPreparationContext(
                true,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );
    }

    static TonTransferPreparationContext pending(TonCheckoutMethod checkoutMethod,
                                                 String senderAddress,
                                                 TonWalletChain chain,
                                                 String recipientAddress,
                                                 String assetId,
                                                 String assetTicker,
                                                 BigDecimal assetAmount,
                                                 String assetAmountBaseUnits,
                                                 Long queryId,
                                                 OffsetDateTime expiresAt,
                                                 String commentToSender,
                                                 String commentToRecipient) {
        return new TonTransferPreparationContext(
                false,
                checkoutMethod,
                senderAddress,
                chain,
                recipientAddress,
                assetId,
                assetTicker,
                assetAmount,
                assetAmountBaseUnits,
                queryId,
                expiresAt,
                commentToSender,
                commentToRecipient
        );
    }
}
