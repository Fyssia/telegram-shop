package com.example.telegram_shop_stars.controller;

import com.example.telegram_shop_stars.dto.TonWalletCreateOrderRequest;
import com.example.telegram_shop_stars.dto.TonWalletOrderResponse;
import com.example.telegram_shop_stars.service.tonwallet.TonWalletPaymentService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments/ton-wallet")
public class TonWalletPaymentController {

    private final TonWalletPaymentService paymentService;

    public TonWalletPaymentController(TonWalletPaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/orders")
    public TonWalletOrderResponse createOrGetOrder(
            @Valid @RequestBody TonWalletCreateOrderRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey
    ) {
        return paymentService.createOrGetOrder(request, idempotencyKey);
    }
}
