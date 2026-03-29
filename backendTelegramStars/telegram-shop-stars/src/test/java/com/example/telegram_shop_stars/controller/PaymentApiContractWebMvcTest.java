package com.example.telegram_shop_stars.controller;

import com.example.telegram_shop_stars.config.ApiRateLimitFilter;
import com.example.telegram_shop_stars.dto.CryptoBotCreateInvoiceResponse;
import com.example.telegram_shop_stars.dto.TonWalletOrderResponse;
import com.example.telegram_shop_stars.error.ApiProblemException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PaymentApiContractWebMvcTest extends PaymentApiStandaloneTestSupport {

    @Test
    void shouldCreateCryptoBotInvoiceWithoutAuthentication() throws Exception {
        StubCryptoBotPaymentService cryptoBotPaymentService = new StubCryptoBotPaymentService();
        StubTonWalletPaymentService tonWalletPaymentService = new StubTonWalletPaymentService();
        MockMvc mockMvc = buildMockMvc(cryptoBotPaymentService, tonWalletPaymentService, 20);

        CryptoBotCreateInvoiceResponse response = new CryptoBotCreateInvoiceResponse(
                101L,
                202L,
                "hash-1",
                "active",
                "pending",
                "pending_payment",
                "https://t.me/CryptoTestnetBot?start=invoice",
                "https://t.me/CryptoTestnetBot/app?startapp=invoice",
                "https://testnet-pay.crypt.bot/invoice"
        );
        cryptoBotPaymentService.createInvoiceResponse = response;

        mockMvc.perform(post("/api/payments/cryptobot/testnet/invoices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Idempotency-Key", "idem-crypto-1")
                        .content("""
                                {
                                  "username": "fyssia",
                                  "starsAmount": 100,
                                  "fulfillmentMethod": "buyStars",
                                  "currencyType": "fiat",
                                  "amount": 1.65,
                                  "fiat": "USD",
                                  "expiresIn": 300
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(header().exists("X-RateLimit-Remaining"))
                .andExpect(jsonPath("$.orderId").value(101))
                .andExpect(jsonPath("$.invoiceId").value(202))
                .andExpect(jsonPath("$.invoiceHash").value("hash-1"))
                .andExpect(jsonPath("$.paymentStatus").value("pending"));

        assertThat(cryptoBotPaymentService.createInvoiceCalls).isEqualTo(1);
        assertThat(cryptoBotPaymentService.lastIdempotencyKey).isEqualTo("idem-crypto-1");
        assertThat(cryptoBotPaymentService.lastRequest).isNotNull();
        assertThat(cryptoBotPaymentService.lastRequest.username()).isEqualTo("fyssia");
        assertThat(cryptoBotPaymentService.lastRequest.starsAmount()).isEqualTo(100);
        assertThat(cryptoBotPaymentService.lastRequest.fulfillmentMethod()).isEqualTo("buyStars");
        assertThat(cryptoBotPaymentService.lastRequest.currencyType()).isEqualTo("fiat");
        assertThat(cryptoBotPaymentService.lastRequest.amount()).isEqualByComparingTo(new BigDecimal("1.65"));
        assertThat(cryptoBotPaymentService.lastRequest.fiat()).isEqualTo("USD");
        assertThat(cryptoBotPaymentService.lastRequest.expiresIn()).isEqualTo(300);
    }

    @Test
    void shouldCreateTonWalletOrderWithoutAuthentication() throws Exception {
        StubCryptoBotPaymentService cryptoBotPaymentService = new StubCryptoBotPaymentService();
        StubTonWalletPaymentService tonWalletPaymentService = new StubTonWalletPaymentService();
        MockMvc mockMvc = buildMockMvc(cryptoBotPaymentService, tonWalletPaymentService, 20);

        TonWalletOrderResponse response = new TonWalletOrderResponse(
                301L,
                "tw-301-1",
                "pending",
                "pending_payment",
                "ton",
                "TON",
                "0.400000000",
                "400000000",
                "UQCrecipient",
                "400000000",
                "te6ccgECDAEAAQEA",
                "UQCrecipient",
                1_800_000_000L,
                "-239"
        );
        tonWalletPaymentService.createOrGetOrderResponse = response;

        mockMvc.perform(post("/api/payments/ton-wallet/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Idempotency-Key", "idem-ton-1")
                        .content("""
                                {
                                  "username": "fyssia",
                                  "starsAmount": 100,
                                  "fulfillmentMethod": "buyStars",
                                  "amount": 1.65,
                                  "paymentMethod": "ton",
                                  "senderAddress": "UQAjJzUBr5..."
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.orderId").value(301))
                .andExpect(jsonPath("$.paymentReference").value("tw-301-1"))
                .andExpect(jsonPath("$.paymentMethod").value("ton"))
                .andExpect(jsonPath("$.network").value("-239"));

        assertThat(tonWalletPaymentService.createOrGetOrderCalls).isEqualTo(1);
        assertThat(tonWalletPaymentService.lastIdempotencyKey).isEqualTo("idem-ton-1");
        assertThat(tonWalletPaymentService.lastRequest).isNotNull();
        assertThat(tonWalletPaymentService.lastRequest.username()).isEqualTo("fyssia");
        assertThat(tonWalletPaymentService.lastRequest.starsAmount()).isEqualTo(100);
        assertThat(tonWalletPaymentService.lastRequest.fulfillmentMethod()).isEqualTo("buyStars");
        assertThat(tonWalletPaymentService.lastRequest.amount()).isEqualByComparingTo(new BigDecimal("1.65"));
        assertThat(tonWalletPaymentService.lastRequest.paymentMethod()).isEqualTo("ton");
        assertThat(tonWalletPaymentService.lastRequest.senderAddress()).isEqualTo("UQAjJzUBr5...");
    }

    @Test
    void shouldRejectInvalidCryptoBotPayloadBeforeCallingService() throws Exception {
        StubCryptoBotPaymentService cryptoBotPaymentService = new StubCryptoBotPaymentService();
        StubTonWalletPaymentService tonWalletPaymentService = new StubTonWalletPaymentService();
        MockMvc mockMvc = buildMockMvc(cryptoBotPaymentService, tonWalletPaymentService, 20);

        mockMvc.perform(post("/api/payments/cryptobot/testnet/invoices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "fyssia",
                                  "starsAmount": 100,
                                  "fulfillmentMethod": "buyStars",
                                  "amount": 1.65
                                }
                                """))
                .andExpect(status().isBadRequest());

        assertThat(cryptoBotPaymentService.createInvoiceCalls).isZero();
    }

    @Test
    void shouldReturnProblemDetailsWhenTonWalletServiceFails() throws Exception {
        StubCryptoBotPaymentService cryptoBotPaymentService = new StubCryptoBotPaymentService();
        StubTonWalletPaymentService tonWalletPaymentService = new StubTonWalletPaymentService();
        MockMvc mockMvc = buildMockMvc(cryptoBotPaymentService, tonWalletPaymentService, 20);
        tonWalletPaymentService.createOrGetOrderException = new ApiProblemException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "PAYMENT_PROVIDER_UNAVAILABLE",
                "TON Pay is unavailable"
        );

        mockMvc.perform(post("/api/payments/ton-wallet/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Idempotency-Key", "idem-ton-fail")
                        .content("""
                                {
                                  "username": "fyssia",
                                  "starsAmount": 100,
                                  "fulfillmentMethod": "buyStars",
                                  "amount": 1.65,
                                  "paymentMethod": "ton",
                                  "senderAddress": "UQAjJzUBr5..."
                                }
                                """))
                .andExpect(status().isServiceUnavailable())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.code").value("PAYMENT_PROVIDER_UNAVAILABLE"))
                .andExpect(jsonPath("$.detail").value("Internal server error"))
                .andExpect(jsonPath("$.path").value("/api/payments/ton-wallet/orders"));

        assertThat(tonWalletPaymentService.createOrGetOrderCalls).isEqualTo(1);
    }
}
