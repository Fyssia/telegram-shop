package com.example.telegram_shop_stars.dto;

public record CryptoBotCreateInvoiceResponse(
        long orderId,
        long invoiceId,
        String invoiceHash,
        String invoiceStatus,
        String paymentStatus,
        String orderStatus,
        String botInvoiceUrl,
        String miniAppInvoiceUrl,
        String webAppInvoiceUrl
) {
}
