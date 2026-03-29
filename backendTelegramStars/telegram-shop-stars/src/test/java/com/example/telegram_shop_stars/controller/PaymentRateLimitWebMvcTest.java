package com.example.telegram_shop_stars.controller;

import com.example.telegram_shop_stars.dto.CryptoBotCreateInvoiceResponse;
import com.example.telegram_shop_stars.dto.TonWalletOrderResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PaymentRateLimitWebMvcTest extends PaymentApiStandaloneTestSupport {

    @Test
    void shouldRateLimitRepeatedCryptoBotInvoiceRequestsPerClientIp() throws Exception {
        StubCryptoBotPaymentService cryptoBotPaymentService = new StubCryptoBotPaymentService();
        StubTonWalletPaymentService tonWalletPaymentService = new StubTonWalletPaymentService();
        MockMvc mockMvc = buildMockMvc(cryptoBotPaymentService, tonWalletPaymentService, 1);
        cryptoBotPaymentService.createInvoiceResponse = new CryptoBotCreateInvoiceResponse(
                1L,
                2L,
                "hash",
                "active",
                "pending",
                "pending_payment",
                null,
                null,
                null
        );

        String body = """
                {
                  "username": "fyssia",
                  "starsAmount": 100,
                  "fulfillmentMethod": "buyStars",
                  "currencyType": "fiat",
                  "amount": 1.65,
                  "fiat": "USD",
                  "expiresIn": 300
                }
                """;

        mockMvc.perform(post("/api/payments/cryptobot/testnet/invoices")
                        .header("X-Forwarded-For", "203.0.113.10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/payments/cryptobot/testnet/invoices")
                        .header("X-Forwarded-For", "203.0.113.10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"));

        assertThat(cryptoBotPaymentService.createInvoiceCalls).isEqualTo(1);
    }

    @Test
    void shouldRateLimitRepeatedTonWalletOrderRequestsPerClientIp() throws Exception {
        StubCryptoBotPaymentService cryptoBotPaymentService = new StubCryptoBotPaymentService();
        StubTonWalletPaymentService tonWalletPaymentService = new StubTonWalletPaymentService();
        MockMvc mockMvc = buildMockMvc(cryptoBotPaymentService, tonWalletPaymentService, 1);
        tonWalletPaymentService.createOrGetOrderResponse = new TonWalletOrderResponse(
                1L,
                "tw-1-1",
                "pending",
                "pending_payment",
                "ton",
                "TON",
                "0.4",
                "400000000",
                "UQCrecipient",
                "400000000",
                null,
                "UQCrecipient",
                1_800_000_000L,
                "-239"
        );

        String body = """
                {
                  "username": "fyssia",
                  "starsAmount": 100,
                  "fulfillmentMethod": "buyStars",
                  "amount": 1.65,
                  "paymentMethod": "ton",
                  "senderAddress": "UQAjJzUBr5..."
                }
                """;

        mockMvc.perform(post("/api/payments/ton-wallet/orders")
                        .header("X-Forwarded-For", "203.0.113.11")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/payments/ton-wallet/orders")
                        .header("X-Forwarded-For", "203.0.113.11")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"));

        assertThat(tonWalletPaymentService.createOrGetOrderCalls).isEqualTo(1);
    }
}
