package com.example.telegram_shop_stars.service.tonwallet;

import com.example.telegram_shop_stars.dto.TonWalletPollResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "tonwallet", name = "enabled", havingValue = "true")
public class TonWalletPollingScheduler {

    private static final Logger log = LoggerFactory.getLogger(TonWalletPollingScheduler.class);

    private final TonWalletPaymentService paymentService;

    public TonWalletPollingScheduler(TonWalletPaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @Scheduled(fixedDelayString = "${tonwallet.poll-delay-ms:5000}")
    public void pollPendingPayments() {
        try {
            TonWalletPollResponse result = paymentService.pollPendingPayments();
            if (result.checkedPayments() > 0) {
                log.debug(
                        "TON wallet polling checked={}, matched={}, updated={}",
                        result.checkedPayments(),
                        result.matchedPayments(),
                        result.updatedRows()
                );
            }
        } catch (Exception ex) {
            log.error("TON wallet polling failed", ex);
        }
    }
}
