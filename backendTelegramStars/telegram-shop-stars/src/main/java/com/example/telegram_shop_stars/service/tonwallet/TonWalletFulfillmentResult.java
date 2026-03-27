package com.example.telegram_shop_stars.service.tonwallet;

record TonWalletFulfillmentResult(
        int fulfilledCount,
        int failedCount
) {
    static TonWalletFulfillmentResult empty() {
        return new TonWalletFulfillmentResult(0, 0);
    }
}
