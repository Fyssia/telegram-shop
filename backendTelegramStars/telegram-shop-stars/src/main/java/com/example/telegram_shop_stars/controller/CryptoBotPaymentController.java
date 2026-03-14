package com.example.telegram_shop_stars.controller;

import com.example.telegram_shop_stars.dto.CryptoBotCreateInvoiceRequest;
import com.example.telegram_shop_stars.dto.CryptoBotCreateInvoiceResponse;
import com.example.telegram_shop_stars.dto.CryptoBotPollResponse;
import com.example.telegram_shop_stars.service.cryptobot.CryptoBotPaymentService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments/cryptobot/testnet")
public class CryptoBotPaymentController {

    private final CryptoBotPaymentService paymentService;

    public CryptoBotPaymentController(CryptoBotPaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/invoices")
    public CryptoBotCreateInvoiceResponse createInvoice(
            @Valid @RequestBody CryptoBotCreateInvoiceRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey
    ) {
        return paymentService.createInvoice(request, idempotencyKey);
    }

    @PostMapping("/poll")
    public CryptoBotPollResponse pollNow() {
        return paymentService.pollPendingPayments();
    }
}
