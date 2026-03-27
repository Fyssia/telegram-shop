package com.example.telegram_shop_stars.controller;

import com.example.telegram_shop_stars.config.ApiRateLimitFilter;
import com.example.telegram_shop_stars.config.ApiRateLimitProperties;
import com.example.telegram_shop_stars.dto.CryptoBotCreateInvoiceRequest;
import com.example.telegram_shop_stars.dto.CryptoBotCreateInvoiceResponse;
import com.example.telegram_shop_stars.dto.TonWalletCreateOrderRequest;
import com.example.telegram_shop_stars.dto.TonWalletOrderResponse;
import com.example.telegram_shop_stars.service.cryptobot.CryptoBotPaymentService;
import com.example.telegram_shop_stars.service.cryptobot.CryptoBotTestnetProperties;
import com.example.telegram_shop_stars.service.tonwallet.TonWalletPaymentService;
import com.example.telegram_shop_stars.service.tonwallet.TonWalletProperties;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionException;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.SimpleTransactionStatus;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

abstract class PaymentApiStandaloneTestSupport {

    protected static MockMvc buildMockMvc(
            StubCryptoBotPaymentService cryptoBotPaymentService,
            StubTonWalletPaymentService tonWalletPaymentService,
            int invoicePerMinute
    ) {
        ApiRateLimitProperties properties = new ApiRateLimitProperties();
        properties.setEnabled(true);
        properties.setInvoicePerMinute(invoicePerMinute);
        properties.setUsernameCheckPerMinute(120);
        properties.setBucketTtlMinutes(60);
        properties.setMaxBuckets(1024);

        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        return MockMvcBuilders.standaloneSetup(
                        new CryptoBotPaymentController(cryptoBotPaymentService),
                        new TonWalletPaymentController(tonWalletPaymentService)
                )
                .setControllerAdvice(new ApiExceptionHandler())
                .setMessageConverters(new MappingJackson2HttpMessageConverter())
                .setValidator(validator)
                .addFilters(new ApiRateLimitFilter(properties))
                .build();
    }

    protected static final class StubCryptoBotPaymentService extends CryptoBotPaymentService {
        private static final SimpleMeterRegistry METER_REGISTRY = new SimpleMeterRegistry();
        private static final PlatformTransactionManager TX_MANAGER = new NoOpTransactionManager();

        int createInvoiceCalls;
        String lastIdempotencyKey;
        CryptoBotCreateInvoiceRequest lastRequest;
        RuntimeException createInvoiceException;
        CryptoBotCreateInvoiceResponse createInvoiceResponse;

        StubCryptoBotPaymentService() {
            super(
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    enabledCryptoBotProperties(),
                    TX_MANAGER,
                    METER_REGISTRY
            );
        }

        @Override
        public CryptoBotCreateInvoiceResponse createInvoice(CryptoBotCreateInvoiceRequest request, String idempotencyKeyHeader) {
            createInvoiceCalls++;
            lastRequest = request;
            lastIdempotencyKey = idempotencyKeyHeader;
            if (createInvoiceException != null) {
                throw createInvoiceException;
            }
            return createInvoiceResponse;
        }
    }

    protected static final class StubTonWalletPaymentService extends TonWalletPaymentService {
        private static final SimpleMeterRegistry METER_REGISTRY = new SimpleMeterRegistry();
        private static final PlatformTransactionManager TX_MANAGER = new NoOpTransactionManager();

        int createOrGetOrderCalls;
        String lastIdempotencyKey;
        TonWalletCreateOrderRequest lastRequest;
        RuntimeException createOrGetOrderException;
        TonWalletOrderResponse createOrGetOrderResponse;

        StubTonWalletPaymentService() {
            super(
                    null,
                    null,
                    enabledTonWalletProperties(),
                    null,
                    null,
                    TX_MANAGER,
                    METER_REGISTRY
            );
        }

        @Override
        public TonWalletOrderResponse createOrGetOrder(TonWalletCreateOrderRequest request, String idempotencyKeyHeader) {
            createOrGetOrderCalls++;
            lastRequest = request;
            lastIdempotencyKey = idempotencyKeyHeader;
            if (createOrGetOrderException != null) {
                throw createOrGetOrderException;
            }
            return createOrGetOrderResponse;
        }
    }

    private static CryptoBotTestnetProperties enabledCryptoBotProperties() {
        CryptoBotTestnetProperties properties = new CryptoBotTestnetProperties();
        properties.setEnabled(true);
        return properties;
    }

    private static TonWalletProperties enabledTonWalletProperties() {
        TonWalletProperties properties = new TonWalletProperties();
        properties.setEnabled(true);
        return properties;
    }

    private static final class NoOpTransactionManager implements PlatformTransactionManager {
        @Override
        public TransactionStatus getTransaction(TransactionDefinition definition) throws TransactionException {
            return new SimpleTransactionStatus();
        }

        @Override
        public void commit(TransactionStatus status) throws TransactionException {
            // no-op
        }

        @Override
        public void rollback(TransactionStatus status) throws TransactionException {
            // no-op
        }
    }
}
