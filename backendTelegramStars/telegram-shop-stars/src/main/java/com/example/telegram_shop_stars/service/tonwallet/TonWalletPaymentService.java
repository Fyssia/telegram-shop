package com.example.telegram_shop_stars.service.tonwallet;

import com.example.telegram_shop_stars.dto.TonWalletCreateOrderRequest;
import com.example.telegram_shop_stars.dto.TonWalletOrderResponse;
import com.example.telegram_shop_stars.dto.TonWalletPollResponse;
import com.example.telegram_shop_stars.entity.OrderEntity;
import com.example.telegram_shop_stars.entity.OrderStatus;
import com.example.telegram_shop_stars.entity.PaymentEntity;
import com.example.telegram_shop_stars.entity.PaymentStatus;
import com.example.telegram_shop_stars.error.ApiProblemException;
import com.example.telegram_shop_stars.repository.OrderRepository;
import com.example.telegram_shop_stars.repository.PaymentRepository;
import com.example.telegram_shop_stars.service.pricing.OrderPricing;
import com.example.telegram_shop_stars.service.tonwallet.TonPayApiClient.TonPayApiException;
import com.example.telegram_shop_stars.service.tonwallet.TonPayApiClient.TonPayTransfer;
import com.example.telegram_shop_stars.service.tonwallet.TonPayApiClient.TonPayTransferStatus;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

@Service
public class TonWalletPaymentService {

    private static final Logger log = LoggerFactory.getLogger(TonWalletPaymentService.class);
    private static final String FULFILLMENT_GIFT_PREMIUM = OrderPricing.FULFILLMENT_GIFT_PREMIUM;
    private static final String PAYMENT_PROVIDER_UNAVAILABLE_CODE = "PAYMENT_PROVIDER_UNAVAILABLE";

    private static final Set<PaymentStatus> POLLABLE_PAYMENT_STATUSES = Set.of(
            PaymentStatus.created,
            PaymentStatus.pending,
            PaymentStatus.authorized
    );

    private static final Set<PaymentStatus> TERMINAL_PAYMENT_STATUSES = Set.of(
            PaymentStatus.succeeded,
            PaymentStatus.failed,
            PaymentStatus.cancelled,
            PaymentStatus.expired,
            PaymentStatus.refunded,
            PaymentStatus.partially_refunded
    );

    private static final Set<OrderStatus> TERMINAL_ORDER_STATUSES = Set.of(
            OrderStatus.fulfilled,
            OrderStatus.cancelled,
            OrderStatus.refunded,
            OrderStatus.failed,
            OrderStatus.expired
    );

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final TonWalletProperties properties;
    private final TonPayApiClient tonPayApiClient;
    private final TonWalletOrderService orderService;
    private final TransactionTemplate txTemplate;
    private final SecureRandom secureRandom = new SecureRandom();
    private final Counter createRequests;
    private final Counter createSuccess;
    private final Counter createFailure;
    private final Counter paymentMatched;
    private final Counter fulfillmentSuccess;
    private final Counter fulfillmentFailure;

    public TonWalletPaymentService(OrderRepository orderRepository,
                                   PaymentRepository paymentRepository,
                                   TonWalletProperties properties,
                                   TonPayApiClient tonPayApiClient,
                                   TonWalletOrderService orderService,
                                   PlatformTransactionManager transactionManager,
                                   MeterRegistry meterRegistry) {
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.properties = properties;
        this.tonPayApiClient = tonPayApiClient;
        this.orderService = orderService;
        this.txTemplate = new TransactionTemplate(transactionManager);
        this.createRequests = meterRegistry.counter("tonwallet.order.create.requests");
        this.createSuccess = meterRegistry.counter("tonwallet.order.create.success");
        this.createFailure = meterRegistry.counter("tonwallet.order.create.failure");
        this.paymentMatched = meterRegistry.counter("tonwallet.payment.matched");
        this.fulfillmentSuccess = meterRegistry.counter("tonwallet.fulfillment.success");
        this.fulfillmentFailure = meterRegistry.counter("tonwallet.fulfillment.failure");
    }

    public TonWalletOrderResponse createOrGetOrder(TonWalletCreateOrderRequest request, String idempotencyKeyHeader) {
        requireTonWalletEnabled();

        boolean createRequest = request.orderId() == null;
        TonCheckoutMethod checkoutMethod = createRequest
                ? resolveCheckoutMethod(request.paymentMethod())
                : null;
        String senderAddress = createRequest
                ? normalizeSenderAddress(request.senderAddress())
                : null;
        if (createRequest) {
            createRequests.increment();
        }

        try {
            String normalizedIdempotencyKey = normalizeIdempotencyKey(idempotencyKeyHeader);
            long orderId = orderService.resolveOrCreateOrderId(request, normalizedIdempotencyKey);
            long paymentId;
            if (createRequest && checkoutMethod == TonCheckoutMethod.TON_DEV) {
                requireTonWalletDevAutoPayEnabled();
                paymentId = ensureActivePayment(orderId, checkoutMethod, senderAddress);
                autoConfirmDevPayment(paymentId);
                processPaidOrders();
            } else if (createRequest) {
                paymentId = ensureActivePayment(orderId, checkoutMethod, senderAddress);
                prepareTransferForCheckout(paymentId, checkoutMethod, senderAddress);
            } else {
                paymentId = resolveLatestPaymentId(orderId);
                reconcilePaymentById(paymentId);
            }

            TonWalletOrderResponse response = txTemplate.execute(status -> buildOrderResponse(paymentId));
            if (response == null) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to build TON payment response");
            }

            if (createRequest) {
                createSuccess.increment();
            }
            return response;
        } catch (RuntimeException ex) {
            if (createRequest) {
                createFailure.increment();
            }
            throw ex;
        }
    }

    private long resolveLatestPaymentId(long orderId) {
        List<PaymentEntity> payments = paymentRepository.findLatestByOrderIdAndProvider(
                orderId,
                properties.getProviderName(),
                PageRequest.of(0, 1)
        );
        if (payments.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No TON wallet payment found for order " + orderId);
        }
        return payments.get(0).getId();
    }

    private void autoConfirmDevPayment(long paymentId) {
        Boolean confirmed = txTemplate.execute(status -> {
            PaymentEntity payment = paymentRepository.findByIdForUpdate(paymentId).orElse(null);
            if (payment == null) {
                return false;
            }
            if (!Objects.equals(payment.getProvider(), properties.getProviderName())) {
                return false;
            }
            if (TERMINAL_PAYMENT_STATUSES.contains(payment.getStatus())) {
                return payment.getStatus() == PaymentStatus.succeeded;
            }

            OrderEntity order = payment.getOrder();
            if (order == null || TERMINAL_ORDER_STATUSES.contains(order.getStatus())) {
                return false;
            }

            OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
            payment.setPaymentMethod(TonCheckoutMethod.TON_DEV.apiValue());
            payment.setStatus(PaymentStatus.succeeded);
            payment.setCapturedAt(coalesce(payment.getCapturedAt(), now));
            payment.setFailureCode(null);
            payment.setFailureMessage(null);
            payment.setNextPollAt(null);
            paymentRepository.save(payment);

            orderService.updateOrderStatusIfNeeded(order, OrderStatus.paid, "ton wallet dev auto-pay confirmed");
            return true;
        });

        if (!Boolean.TRUE.equals(confirmed)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "TON DEV payment could not be confirmed");
        }
    }

    private void processPaidOrders() {
        TonWalletFulfillmentResult fulfillmentResult = orderService.fulfillPaidOrders();
        if (fulfillmentResult.fulfilledCount() > 0) {
            fulfillmentSuccess.increment(fulfillmentResult.fulfilledCount());
            log.info("TON wallet fulfillment succeeded for {} paid orders", fulfillmentResult.fulfilledCount());
        }
        if (fulfillmentResult.failedCount() > 0) {
            fulfillmentFailure.increment(fulfillmentResult.failedCount());
        }
    }

    public TonWalletPollResponse pollPendingPayments() {
        requireTonWalletEnabled();

        List<PaymentEntity> pendingPayments = paymentRepository.findForPolling(
                properties.getProviderName(),
                POLLABLE_PAYMENT_STATUSES,
                PageRequest.of(0, Math.max(1, properties.getPollBatchSize()))
        );

        int checked = 0;
        int matched = 0;
        int updated = 0;

        for (PaymentEntity payment : pendingPayments) {
            checked++;
            ReconcileOutcome outcome = reconcilePaymentById(payment.getId());
            if (outcome.matched()) {
                matched++;
            }
            if (outcome.updated()) {
                updated++;
            }
        }

        processPaidOrders();

        return new TonWalletPollResponse(checked, matched, updated);
    }

    private long ensureActivePayment(long orderId, TonCheckoutMethod checkoutMethod, String senderAddress) {
        Long paymentId = txTemplate.execute(status -> {
            OrderEntity order = orderRepository.findByIdForUpdate(orderId)
                    .orElseThrow(() -> notFoundOrder(orderId));

            List<PaymentEntity> payments = paymentRepository.findLatestByOrderIdAndProvider(
                    orderId,
                    properties.getProviderName(),
                    PageRequest.of(0, 10)
            );

            OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
            for (PaymentEntity existing : payments) {
                if (TERMINAL_PAYMENT_STATUSES.contains(existing.getStatus())) {
                    continue;
                }

                if (isPaymentWindowExpired(existing, now)) {
                    expirePayment(existing, order, "ton wallet payment expired before reuse");
                    continue;
                }

                if (matchesCheckoutIntent(existing, checkoutMethod, senderAddress)) {
                    return existing.getId();
                }

                if (order.getStatus() != OrderStatus.created && order.getStatus() != OrderStatus.pending_payment) {
                    return existing.getId();
                }

                existing.setStatus(PaymentStatus.cancelled);
                existing.setFailureCode("payment_replaced");
                existing.setFailureMessage("Replaced by a new TON wallet payment intent");
                existing.setNextPollAt(null);
                paymentRepository.save(existing);
            }

            if (order.getStatus() != OrderStatus.created && order.getStatus() != OrderStatus.pending_payment) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Order " + orderId + " cannot create a new TON payment in status " + order.getStatus().name()
                );
            }

            PaymentEntity payment = new PaymentEntity();
            payment.setOrder(order);
                payment.setProvider(properties.getProviderName());
                payment.setProviderPaymentId(generatePaymentReference(order.getId()));
                payment.setPaymentMethod(checkoutMethod.apiValue());
                payment.setStatus(PaymentStatus.pending);
                payment.setAmount(order.getTotalAmount());
                payment.setCurrency(order.getCurrency());
                payment.setRequestPayload(TonWalletPayloads.buildPendingPaymentRequestPayload(
                        properties.getProviderName(),
                        checkoutMethod,
                        senderAddress
                ));
                payment.setResponsePayload(null);
                payment.setExpiresAt(now.plusSeconds(Math.max(30, properties.getPaymentWindowSeconds())));
                payment.setNextPollAt(initialTonPayCheckAt());
                payment.setFailureCode(null);
                payment.setFailureMessage(null);
                PaymentEntity saved = paymentRepository.save(payment);

                orderService.updateOrderStatusIfNeeded(order, OrderStatus.pending_payment, "ton wallet payment created");
                return saved.getId();
            });

        if (paymentId == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not create TON wallet payment");
        }
        return paymentId;
    }

    private void prepareTransferForCheckout(long paymentId, TonCheckoutMethod checkoutMethod, String senderAddress) {
        TonTransferPreparationContext context = txTemplate.execute(
                status -> prepareTransferCreationContext(paymentId, checkoutMethod, senderAddress)
        );
        if (context == null || context.alreadyPrepared()) {
            return;
        }

        TonPayTransfer transfer;
        try {
            transfer = tonPayApiClient.createTransfer(
                    context.chain(),
                    context.assetAmount(),
                    context.assetId(),
                    context.recipientAddress(),
                    context.senderAddress(),
                    context.queryId(),
                    context.commentToSender(),
                    context.commentToRecipient()
            );
        } catch (TonPayApiException ex) {
            markTransferPreparationFailure(paymentId, ex);
            throw mapTonPayCreateError(ex);
        }

        txTemplate.executeWithoutResult(status -> persistPreparedTransfer(paymentId, context, transfer));
    }

    private TonTransferPreparationContext prepareTransferCreationContext(long paymentId,
                                                                        TonCheckoutMethod requestedMethod,
                                                                        String requestedSenderAddress) {
        PaymentEntity payment = paymentRepository.findByIdForUpdate(paymentId).orElse(null);
        if (payment == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "TON wallet payment " + paymentId + " not found");
        }
        if (!Objects.equals(payment.getProvider(), properties.getProviderName())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment " + paymentId + " does not belong to TON wallet provider");
        }
        if (TERMINAL_PAYMENT_STATUSES.contains(payment.getStatus())) {
            return null;
        }

        OrderEntity order = payment.getOrder();
        if (order == null || TERMINAL_ORDER_STATUSES.contains(order.getStatus())) {
            return null;
        }

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        if (isPaymentWindowExpired(payment, now)) {
            expirePayment(payment, order, "ton wallet payment expired before transfer preparation");
            return null;
        }

        if (hasPreparedTransfer(payment)) {
            payment.setNextPollAt(coalesce(payment.getNextPollAt(), initialTonPayCheckAt()));
            paymentRepository.save(payment);
            return TonTransferPreparationContext.preparedMarker();
        }

        TonCheckoutMethod checkoutMethod = requestedMethod != null
                ? requestedMethod
                : resolveStoredCheckoutMethod(payment.getPaymentMethod());
        if (checkoutMethod == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported TON wallet payment method");
        }

        String senderAddress = requestedSenderAddress;
        if (senderAddress == null || senderAddress.isBlank()) {
            senderAddress = extractSenderAddress(payment);
        }
        senderAddress = normalizeSenderAddress(senderAddress);

        TonWalletChain chain = checkoutMethod.resolveChain(properties);
        String recipientAddress = resolveRecipientAddress(chain);
        String assetId = checkoutMethod.resolveAssetId(properties, chain);
        String assetTicker = checkoutMethod.assetTicker();
        BigDecimal assetAmount = resolveAssetAmount(checkoutMethod, order.getTotalAmount());
        String assetAmountBaseUnits = toBaseUnits(assetAmount, checkoutMethod.assetScale());
        Long queryId = checkoutMethod.usesJetton() ? generateQueryId(paymentId) : null;
        OffsetDateTime expiresAt = now.plusSeconds(Math.max(30, properties.getPaymentWindowSeconds()));

        return TonTransferPreparationContext.pending(
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
                buildSenderComment(order),
                buildRecipientComment(order)
        );
    }

    private void persistPreparedTransfer(long paymentId,
                                         TonTransferPreparationContext context,
                                         TonPayTransfer transfer) {
        PaymentEntity payment = paymentRepository.findByIdForUpdate(paymentId).orElse(null);
        if (payment == null || TERMINAL_PAYMENT_STATUSES.contains(payment.getStatus())) {
            return;
        }

        OrderEntity order = payment.getOrder();
        if (order == null || TERMINAL_ORDER_STATUSES.contains(order.getStatus())) {
            return;
        }
        if (hasPreparedTransfer(payment)) {
            return;
        }

        payment.setPaymentMethod(context.checkoutMethod().apiValue());
        payment.setRequestPayload(TonWalletPayloads.buildPreparedPaymentRequestPayload(context));
        payment.setResponsePayload(TonWalletPayloads.buildPreparedPaymentResponsePayload(context, transfer));
        payment.setStatus(PaymentStatus.pending);
        payment.setExpiresAt(context.expiresAt());
        payment.setNextPollAt(initialTonPayCheckAt());
        payment.setFailureCode(null);
        payment.setFailureMessage(null);
        payment.setProviderTxHash(null);
        payment.setCapturedAt(null);
        paymentRepository.save(payment);

        orderService.updateOrderStatusIfNeeded(order, OrderStatus.pending_payment, "ton wallet transfer prepared");
    }

    private void markTransferPreparationFailure(long paymentId, TonPayApiException exception) {
        txTemplate.executeWithoutResult(status -> {
            PaymentEntity payment = paymentRepository.findByIdForUpdate(paymentId).orElse(null);
            if (payment == null || TERMINAL_PAYMENT_STATUSES.contains(payment.getStatus())) {
                return;
            }

            OrderEntity order = payment.getOrder();
            payment.setStatus(PaymentStatus.failed);
            payment.setFailureCode("transfer_prepare_failed");
            payment.setFailureMessage(compactReason(exception == null ? null : exception.getMessage(), 1_000));
            payment.setNextPollAt(null);
            paymentRepository.save(payment);

            if (order != null && !TERMINAL_ORDER_STATUSES.contains(order.getStatus())) {
                orderService.updateOrderStatusIfNeeded(
                        order,
                        OrderStatus.failed,
                        "ton wallet transfer preparation failed: " + compactReason(exception == null ? null : exception.getMessage(), 160)
                );
            }
        });
    }

    private ReconcileOutcome reconcilePaymentById(long paymentId) {
        PaymentCheckContext checkContext = txTemplate.execute(status -> preparePaymentCheck(paymentId));
        if (checkContext == null || !checkContext.needsRemoteCheck()) {
            return ReconcileOutcome.notChanged(false);
        }

        Optional<TonPayTransferStatus> transferStatus;
        try {
            transferStatus = tonPayApiClient.findTransfer(
                    checkContext.chain(),
                    checkContext.bodyBase64Hash(),
                    checkContext.tonPayReference()
            );
        } catch (TonPayApiException ex) {
            OffsetDateTime nextPollAt = txTemplate.execute(
                    status -> scheduleNextPaymentPoll(paymentId, providerFailureRetryAt(ex))
            );
            log.warn(
                    "TON Pay check failed for paymentId={} reference={}: {}. Payment remains pending and will be retried after {}.",
                    paymentId,
                    checkContext.paymentReference(),
                    ex.getMessage(),
                    nextPollAt == null ? "backoff window" : nextPollAt
            );
            return ReconcileOutcome.notChanged(false);
        }

        if (transferStatus.isEmpty()) {
            txTemplate.execute(status -> scheduleNextPaymentPoll(paymentId, nextBlockchainCheckAt()));
            return ReconcileOutcome.notChanged(false);
        }

        Boolean applied = txTemplate.execute(status -> applyCompletedTransferStatus(paymentId, transferStatus.get()));
        if (!Boolean.TRUE.equals(applied)) {
            return ReconcileOutcome.notChanged(false);
        }

        boolean matched = "success".equalsIgnoreCase(transferStatus.get().status());
        return ReconcileOutcome.updated(matched);
    }

    private PaymentCheckContext preparePaymentCheck(long paymentId) {
        PaymentEntity payment = paymentRepository.findByIdForUpdate(paymentId).orElse(null);
        if (payment == null) {
            return null;
        }
        if (!Objects.equals(payment.getProvider(), properties.getProviderName())) {
            return null;
        }
        if (TERMINAL_PAYMENT_STATUSES.contains(payment.getStatus())) {
            return null;
        }

        OrderEntity order = payment.getOrder();
        if (order == null || TERMINAL_ORDER_STATUSES.contains(order.getStatus())) {
            return null;
        }

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        if (isPaymentWindowExpired(payment, now)) {
            expirePayment(payment, order, "ton wallet payment window expired");
            return PaymentCheckContext.skip();
        }

        if (payment.getNextPollAt() != null && payment.getNextPollAt().isAfter(now)) {
            return PaymentCheckContext.skip();
        }

        Map<String, Object> responsePayload = payment.getResponsePayload();
        String tonPayReference = TonWalletPayloads.readString(responsePayload, "tonPayReference");
        String bodyBase64Hash = TonWalletPayloads.readString(responsePayload, "bodyBase64Hash");
        if ((tonPayReference == null || tonPayReference.isBlank())
                && (bodyBase64Hash == null || bodyBase64Hash.isBlank())) {
            markPaymentMissingTransferMetadata(payment, order);
            return PaymentCheckContext.skip();
        }

        TonWalletChain chain = TonWalletChain.fromValue(TonWalletPayloads.readString(responsePayload, "chain"));
        if (chain == null) {
            TonCheckoutMethod checkoutMethod = resolveStoredCheckoutMethod(payment.getPaymentMethod());
            chain = checkoutMethod == null
                    ? TonWalletChain.resolveDefault(properties.getDefaultChain(), properties.getNetwork())
                    : checkoutMethod.resolveChain(properties);
        }

        return PaymentCheckContext.forTonPayCheck(
                payment.getProviderPaymentId(),
                chain,
                tonPayReference,
                bodyBase64Hash
        );
    }

    private void markPaymentMissingTransferMetadata(PaymentEntity payment, OrderEntity order) {
        payment.setStatus(PaymentStatus.failed);
        payment.setFailureCode("transfer_metadata_missing");
        payment.setFailureMessage("TON wallet transfer metadata is missing");
        payment.setNextPollAt(null);
        paymentRepository.save(payment);
        orderService.updateOrderStatusIfNeeded(order, OrderStatus.failed, "ton wallet transfer metadata missing");
    }

    private OffsetDateTime scheduleNextPaymentPoll(long paymentId, OffsetDateTime nextPollAt) {
        if (nextPollAt == null) {
            return null;
        }

        PaymentEntity payment = paymentRepository.findByIdForUpdate(paymentId).orElse(null);
        if (payment == null) {
            return null;
        }
        if (!Objects.equals(payment.getProvider(), properties.getProviderName())) {
            return null;
        }
        if (TERMINAL_PAYMENT_STATUSES.contains(payment.getStatus())) {
            return null;
        }

        payment.setNextPollAt(nextPollAt);
        paymentRepository.save(payment);
        return nextPollAt;
    }

    private OffsetDateTime initialTonPayCheckAt() {
        return OffsetDateTime.now(ZoneOffset.UTC)
                .plus(Duration.ofMillis(Math.max(1_000, properties.getPollDelayMs())));
    }

    private OffsetDateTime nextBlockchainCheckAt() {
        return OffsetDateTime.now(ZoneOffset.UTC)
                .plus(Duration.ofMillis(Math.max(1_000, properties.getBlockchainCheckIntervalMs())));
    }

    private OffsetDateTime providerFailureRetryAt(TonPayApiException exception) {
        long delayMs = Math.max(1_000, properties.getBlockchainFailureRetryDelayMs());
        if (exception != null && exception.getFailureType() == TonPayApiClient.FailureType.RATE_LIMIT) {
            delayMs = Math.max(delayMs, 60_000L);
        }
        return OffsetDateTime.now(ZoneOffset.UTC).plus(Duration.ofMillis(delayMs));
    }

    private Boolean applyCompletedTransferStatus(long paymentId, TonPayTransferStatus transferStatus) {
        PaymentEntity payment = paymentRepository.findByIdForUpdate(paymentId).orElse(null);
        if (payment == null || TERMINAL_PAYMENT_STATUSES.contains(payment.getStatus())) {
            return false;
        }

        OrderEntity order = payment.getOrder();
        if (order == null || TERMINAL_ORDER_STATUSES.contains(order.getStatus())) {
            return false;
        }

        String txHash = normalizeOptionalText(transferStatus.txHash());
        if (txHash != null) {
            PaymentEntity duplicate = paymentRepository.findByProviderAndProviderTxHash(
                    properties.getProviderName(),
                    txHash
            ).orElse(null);
            if (duplicate != null && !Objects.equals(duplicate.getId(), payment.getId())) {
                log.warn(
                        "Ignoring duplicate TON Pay txHash={} for paymentId={} (already used by paymentId={})",
                        txHash,
                        paymentId,
                        duplicate.getId()
                );
                return false;
            }
        }

        payment.setResponsePayload(TonWalletPayloads.mergeCompletedTransferPayload(
                payment.getResponsePayload(),
                transferStatus,
                txHash
        ));
        payment.setProviderTxHash(txHash);
        payment.setNextPollAt(null);

        if ("success".equalsIgnoreCase(transferStatus.status())) {
            payment.setStatus(PaymentStatus.succeeded);
            payment.setCapturedAt(OffsetDateTime.now(ZoneOffset.UTC));
            payment.setFailureCode(null);
            payment.setFailureMessage(null);
            try {
                paymentRepository.save(payment);
            } catch (DataIntegrityViolationException ex) {
                log.warn(
                        "Failed to persist TON Pay match for paymentId={} (likely duplicate txHash={}): {}",
                        paymentId,
                        txHash,
                        ex.getMessage()
                );
                return false;
            }

            paymentMatched.increment();
            orderService.updateOrderStatusIfNeeded(order, OrderStatus.paid, "ton wallet payment confirmed");
            return true;
        }

        payment.setStatus(PaymentStatus.failed);
        payment.setCapturedAt(null);
        payment.setFailureCode(transferStatus.errorCode() == null
                ? "tonpay_failed"
                : "tonpay_failed_" + transferStatus.errorCode());
        payment.setFailureMessage(compactReason(
                coalesce(transferStatus.errorMessage(), "TON Pay reported failed transfer"),
                1_000
        ));
        paymentRepository.save(payment);
        orderService.updateOrderStatusIfNeeded(
                order,
                OrderStatus.failed,
                "ton wallet payment failed: " + compactReason(transferStatus.errorMessage(), 160)
        );
        return true;
    }

    private TonWalletOrderResponse buildOrderResponse(long paymentId) {
        PaymentEntity payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "TON wallet payment " + paymentId + " not found"));
        if (!Objects.equals(payment.getProvider(), properties.getProviderName())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment " + paymentId + " does not belong to TON wallet provider");
        }

        OrderEntity order = payment.getOrder();
        if (order == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order for TON wallet payment " + paymentId + " not found");
        }

        Map<String, Object> responsePayload = payment.getResponsePayload();
        TonCheckoutMethod checkoutMethod = resolveStoredCheckoutMethod(payment.getPaymentMethod());
        TonWalletChain chain = TonWalletChain.fromValue(TonWalletPayloads.readString(responsePayload, "chain"));
        if (chain == null) {
            chain = checkoutMethod == null
                    ? TonWalletChain.resolveDefault(properties.getDefaultChain(), properties.getNetwork())
                    : checkoutMethod.resolveChain(properties);
        }

        Long validUntil = TonWalletPayloads.readLong(responsePayload, "validUntil");
        if (validUntil == null) {
            validUntil = payment.getExpiresAt() == null ? null : payment.getExpiresAt().toEpochSecond();
        }

        return new TonWalletOrderResponse(
                order.getId(),
                payment.getProviderPaymentId(),
                payment.getStatus().name(),
                order.getStatus().name(),
                coalesce(TonWalletPayloads.readString(responsePayload, "paymentMethod"), payment.getPaymentMethod()),
                TonWalletPayloads.readString(responsePayload, "asset"),
                TonWalletPayloads.readString(responsePayload, "assetAmount"),
                TonWalletPayloads.readString(responsePayload, "assetAmountBaseUnits"),
                TonWalletPayloads.readString(responsePayload, "transferAddress"),
                TonWalletPayloads.readString(responsePayload, "transferAmount"),
                TonWalletPayloads.readString(responsePayload, "transferPayload"),
                TonWalletPayloads.readString(responsePayload, "recipientAddress"),
                validUntil == null ? 0 : validUntil,
                chain.tonConnectNetwork()
        );
    }

    private boolean matchesCheckoutIntent(PaymentEntity payment, TonCheckoutMethod checkoutMethod, String senderAddress) {
        TonCheckoutMethod existingMethod = resolveStoredCheckoutMethod(payment.getPaymentMethod());
        if (existingMethod == null || existingMethod != checkoutMethod) {
            return false;
        }
        return Objects.equals(extractSenderAddress(payment), senderAddress);
    }

    private boolean hasPreparedTransfer(PaymentEntity payment) {
        return TonWalletPayloads.readString(payment.getResponsePayload(), "tonPayReference") != null
                && TonWalletPayloads.readString(payment.getResponsePayload(), "transferAddress") != null
                && TonWalletPayloads.readString(payment.getResponsePayload(), "transferAmount") != null;
    }

    private void expirePayment(PaymentEntity payment, OrderEntity order, String reason) {
        payment.setStatus(PaymentStatus.expired);
        payment.setFailureCode("invoice_expired");
        payment.setFailureMessage("TON wallet payment window expired");
        payment.setNextPollAt(null);
        paymentRepository.save(payment);
        orderService.updateOrderStatusIfNeeded(order, OrderStatus.expired, reason);
    }

    private boolean isPaymentWindowExpired(PaymentEntity payment, OffsetDateTime now) {
        return payment.getExpiresAt() != null && now.isAfter(payment.getExpiresAt());
    }

    private String resolveRecipientAddress(TonWalletChain chain) {
        String chainSpecific = chain == TonWalletChain.MAINNET
                ? properties.getMainnetRecipientAddress()
                : properties.getTestnetRecipientAddress();
        if (chainSpecific != null && !chainSpecific.isBlank()) {
            return chainSpecific.trim();
        }

        String legacy = properties.getRecipientAddress();
        if (legacy != null && !legacy.isBlank()) {
            return legacy.trim();
        }

        throw new ApiProblemException(
                HttpStatus.SERVICE_UNAVAILABLE,
                PAYMENT_PROVIDER_UNAVAILABLE_CODE,
                "TON wallet recipient address is not configured for " + chain.apiValue()
        );
    }

    private BigDecimal resolveAssetAmount(TonCheckoutMethod checkoutMethod, BigDecimal orderTotalAmountUsd) {
        if (checkoutMethod.usesJetton()) {
            return orderTotalAmountUsd.setScale(checkoutMethod.assetScale(), RoundingMode.HALF_UP);
        }

        BigDecimal usdPerTon = properties.getUsdPerTon();
        if (usdPerTon == null || usdPerTon.signum() <= 0) {
            throw new ApiProblemException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    PAYMENT_PROVIDER_UNAVAILABLE_CODE,
                    "tonwallet.usd-per-ton must be > 0"
            );
        }
        return orderTotalAmountUsd.divide(usdPerTon, checkoutMethod.assetScale(), RoundingMode.UP);
    }

    private String toBaseUnits(BigDecimal amount, int decimals) {
        return amount.movePointRight(decimals)
                .setScale(0, RoundingMode.UNNECESSARY)
                .toBigIntegerExact()
                .toString();
    }

    private long generateQueryId(long paymentId) {
        long value = secureRandom.nextLong();
        if (value == Long.MIN_VALUE) {
            value = paymentId == 0 ? 1 : paymentId;
        }
        value = Math.abs(value);
        return value == 0 ? Math.max(1L, paymentId) : value;
    }

    private ApiProblemException mapTonPayCreateError(TonPayApiException exception) {
        String detail = compactReason(exception == null ? null : exception.getMessage(), 255);
        HttpStatus status = HttpStatus.BAD_GATEWAY;
        if (exception != null && exception.getFailureType() == TonPayApiClient.FailureType.RATE_LIMIT) {
            status = HttpStatus.TOO_MANY_REQUESTS;
        } else if (exception != null && exception.getFailureType() == TonPayApiClient.FailureType.UPSTREAM_UNAVAILABLE) {
            status = HttpStatus.SERVICE_UNAVAILABLE;
        }
        return new ApiProblemException(status, PAYMENT_PROVIDER_UNAVAILABLE_CODE, coalesce(detail, "TON Pay is unavailable"));
    }

    private TonCheckoutMethod resolveCheckoutMethod(String raw) {
        TonCheckoutMethod checkoutMethod = TonCheckoutMethod.fromApiValue(raw);
        if (checkoutMethod == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "paymentMethod must be one of 'ton', 'usdt_ton', 'ton_dev', 'ton_wallet'"
            );
        }
        return checkoutMethod;
    }

    private TonCheckoutMethod resolveStoredCheckoutMethod(String raw) {
        return TonCheckoutMethod.fromApiValue(raw);
    }

    private void requireTonWalletEnabled() {
        if (!properties.isEnabled()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "TON wallet integration is disabled (tonwallet.enabled=false)"
            );
        }
    }

    private void requireTonWalletDevAutoPayEnabled() {
        if (!properties.isDevAutoPayEnabled()) {
            throw new ApiProblemException(
                    HttpStatus.NOT_FOUND,
                    "TEST_PAYMENT_DISABLED",
                    "TON DEV auto-pay is disabled (tonwallet.dev-auto-pay-enabled=false)"
            );
        }
    }

    private String extractSenderAddress(PaymentEntity payment) {
        return normalizeOptionalText(TonWalletPayloads.readString(payment.getRequestPayload(), "senderAddress"));
    }

    private String buildSenderComment(OrderEntity order) {
        String orderType = FULFILLMENT_GIFT_PREMIUM.equals(order.getExternalReference())
                ? "Telegram Premium"
                : "Telegram Stars";
        return compactReason("QuackStars " + orderType + " order #" + order.getId(), 120);
    }

    private String buildRecipientComment(OrderEntity order) {
        return compactReason("Order #" + order.getId(), 64);
    }

    private String normalizeSenderAddress(String senderAddress) {
        String normalized = normalizeOptionalText(senderAddress);
        if (normalized == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "senderAddress is required for TON wallet payments");
        }
        if (normalized.length() > 128) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "senderAddress is too long (max 128)");
        }
        if (normalized.chars().anyMatch(Character::isWhitespace)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "senderAddress must not contain whitespace");
        }
        return normalized;
    }

    private static String normalizeIdempotencyKey(String raw) {
        if (raw == null) {
            return null;
        }
        String normalized = raw.trim();
        if (normalized.isEmpty()) {
            return null;
        }
        if (normalized.length() > 128) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Idempotency-Key is too long (max 128)");
        }
        return normalized;
    }

    private String generatePaymentReference(long orderId) {
        int nonceMax = Math.max(1, properties.getAmountNonceMaxNano());
        int nonce = secureRandom.nextInt(nonceMax) + 1;
        return "tw-" + orderId + "-" + nonce;
    }

    private static String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private static <T> T coalesce(T preferred, T fallback) {
        return preferred != null ? preferred : fallback;
    }

    private static String compactReason(String reason, int maxLength) {
        if (reason == null) {
            return null;
        }
        String compact = reason.replaceAll("\\s+", " ").trim();
        if (compact.isEmpty()) {
            return null;
        }
        if (compact.length() <= maxLength) {
            return compact;
        }
        if (maxLength <= 3) {
            return compact.substring(0, maxLength);
        }
        return compact.substring(0, maxLength - 3) + "...";
    }

    private static ResponseStatusException notFoundOrder(long orderId) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Order " + orderId + " not found");
    }

    private record PaymentCheckContext(
            boolean needsRemoteCheck,
            String paymentReference,
            TonWalletChain chain,
            String tonPayReference,
            String bodyBase64Hash
    ) {
        static PaymentCheckContext forTonPayCheck(String paymentReference,
                                                  TonWalletChain chain,
                                                  String tonPayReference,
                                                  String bodyBase64Hash) {
            return new PaymentCheckContext(true, paymentReference, chain, tonPayReference, bodyBase64Hash);
        }

        static PaymentCheckContext skip() {
            return new PaymentCheckContext(false, null, null, null, null);
        }
    }

    private record ReconcileOutcome(
            boolean updated,
            boolean matched
    ) {
        static ReconcileOutcome notChanged(boolean matched) {
            return new ReconcileOutcome(false, matched);
        }

        static ReconcileOutcome updated(boolean matched) {
            return new ReconcileOutcome(true, matched);
        }
    }

}
