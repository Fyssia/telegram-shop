package com.example.telegram_shop_stars.service.cryptobot;

import com.example.telegram_shop_stars.dto.CryptoBotPollResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "cryptobot.testnet", name = "enabled", havingValue = "true")
public class CryptoBotPollingScheduler {

    private static final Logger log = LoggerFactory.getLogger(CryptoBotPollingScheduler.class);

    private final CryptoBotPaymentService paymentService;

    public CryptoBotPollingScheduler(CryptoBotPaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @Scheduled(fixedDelayString = "${cryptobot.testnet.poll-delay-ms:5000}")
    public void pollPendingInvoices() {
        try {
            CryptoBotPollResponse result = paymentService.pollPendingPayments();
            if (result.checkedPayments() > 0) {
                log.debug(
                        "CryptoBot polling checked={}, fetched={}, updated={}, missing={}",
                        result.checkedPayments(),
                        result.invoicesReturnedByProvider(),
                        result.updatedRows(),
                        result.invoicesMissingInProviderResponse()
                );
            }
        } catch (Exception ex) {
            log.error("CryptoBot polling failed", ex);
        }
    }
}
