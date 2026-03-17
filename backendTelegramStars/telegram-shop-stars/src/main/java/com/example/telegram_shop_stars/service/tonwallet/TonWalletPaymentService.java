package com.example.telegram_shop_stars.service.tonwallet;

import com.example.telegram_shop_stars.dto.TonWalletCreateOrderRequest;
import com.example.telegram_shop_stars.dto.TonWalletOrderResponse;
import com.example.telegram_shop_stars.dto.TonWalletPollResponse;
import com.example.telegram_shop_stars.entity.CustomerEntity;
import com.example.telegram_shop_stars.entity.OrderEntity;
import com.example.telegram_shop_stars.entity.OrderSource;
import com.example.telegram_shop_stars.entity.OrderStatus;
import com.example.telegram_shop_stars.entity.OrderStatusHistoryEntity;
import com.example.telegram_shop_stars.entity.PaymentEntity;
import com.example.telegram_shop_stars.entity.PaymentStatus;
import com.example.telegram_shop_stars.repository.CustomerRepository;
import com.example.telegram_shop_stars.repository.OrderRepository;
import com.example.telegram_shop_stars.repository.OrderStatusHistoryRepository;
import com.example.telegram_shop_stars.repository.PaymentRepository;
import com.example.telegram_shop_stars.service.TelegramUsernameService;
import com.example.telegram_shop_stars.service.fragment.FragmentApiClient;
import com.example.telegram_shop_stars.service.fragment.FragmentApiException;
import com.example.telegram_shop_stars.service.tonwallet.TonWalletBlockchainClient.TonWalletBlockchainException;
import com.example.telegram_shop_stars.service.tonwallet.TonWalletBlockchainClient.TonWalletIncomingTransfer;
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
import java.math.BigInteger;
import java.math.RoundingMode;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

@Service
public class TonWalletPaymentService {

    private static final Logger log = LoggerFactory.getLogger(TonWalletPaymentService.class);
    private static final java.util.regex.Pattern USERNAME_RE = java.util.regex.Pattern.compile("^[a-z0-9_]{5,32}$");
    private static final java.util.regex.Pattern PAYMENT_REFERENCE_RE = java.util.regex.Pattern.compile("^tw-(\\d+)-(\\d+)$");
    private static final String FULFILLMENT_BUY_STARS = "buyStars";
    private static final String FULFILLMENT_GIFT_PREMIUM = "giftPremium";
    private static final Set<Integer> PREMIUM_MONTH_OPTIONS = Set.of(3, 6, 12);
    private static final BigDecimal STARS_UNIT_PRICE_USD = new BigDecimal("0.018");
    private static final Map<Integer, BigDecimal> PREMIUM_MONTH_PRICES_USD = Map.of(
            3, new BigDecimal("12.99"),
            6, new BigDecimal("23.99"),
            12, new BigDecimal("42.99")
    );

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

    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final FragmentApiClient fragmentApiClient;
    private final TelegramUsernameService telegramUsernameService;
    private final TonWalletProperties properties;
    private final TonWalletBlockchainClient blockchainClient;
    private final TransactionTemplate txTemplate;
    private final SecureRandom secureRandom = new SecureRandom();
    private final Counter createRequests;
    private final Counter createSuccess;
    private final Counter createFailure;
    private final Counter paymentMatched;
    private final Counter fulfillmentSuccess;
    private final Counter fulfillmentFailure;

    public TonWalletPaymentService(CustomerRepository customerRepository,
                                   OrderRepository orderRepository,
                                   PaymentRepository paymentRepository,
                                   OrderStatusHistoryRepository orderStatusHistoryRepository,
                                   FragmentApiClient fragmentApiClient,
                                   TelegramUsernameService telegramUsernameService,
                                   TonWalletProperties properties,
                                   TonWalletBlockchainClient blockchainClient,
                                   PlatformTransactionManager transactionManager,
                                   MeterRegistry meterRegistry) {
        this.customerRepository = customerRepository;
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.orderStatusHistoryRepository = orderStatusHistoryRepository;
        this.fragmentApiClient = fragmentApiClient;
        this.telegramUsernameService = telegramUsernameService;
        this.properties = properties;
        this.blockchainClient = blockchainClient;
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
        createRequests.increment();

        String normalizedIdempotencyKey = normalizeIdempotencyKey(idempotencyKeyHeader);
        long orderId = resolveOrCreateOrderId(request, normalizedIdempotencyKey);
        long paymentId = ensureActivePayment(orderId);

        ReconcileOutcome reconcileOutcome = reconcilePaymentById(paymentId);
        if (reconcileOutcome.updated()) {
            paymentMatched.increment();
        }

        TonWalletOrderResponse response = txTemplate.execute(status -> buildOrderResponse(orderId));
        if (response == null) {
            createFailure.increment();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to build TON payment response");
        }

        createSuccess.increment();
        return response;
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

        int fulfilledOrders = fulfillPaidOrders();
        if (fulfilledOrders > 0) {
            log.info("TON wallet fulfillment succeeded for {} paid orders", fulfilledOrders);
        }

        return new TonWalletPollResponse(checked, matched, updated);
    }

    private long resolveOrCreateOrderId(TonWalletCreateOrderRequest request, String idempotencyKey) {
        Long providedOrderId = request.orderId();
        if (providedOrderId != null) {
            if (!orderRepository.existsById(providedOrderId)) {
                throw notFoundOrder(providedOrderId);
            }
            return providedOrderId;
        }

        String normalizedUsername = normalizeUsername(request.username());
        if (!USERNAME_RE.matcher(normalizedUsername).matches()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "username is required and must match ^[a-z0-9_]{5,32}$ when orderId is not provided"
            );
        }

        Integer starsAmount = request.starsAmount();
        if (starsAmount == null || starsAmount <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "starsAmount must be > 0 when orderId is not provided"
            );
        }

        String fulfillmentMethod = resolveFulfillmentMethod(request.fulfillmentMethod());
        if (FULFILLMENT_GIFT_PREMIUM.equals(fulfillmentMethod) && !PREMIUM_MONTH_OPTIONS.contains(starsAmount)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "For giftPremium, starsAmount must be one of 3, 6, 12 (premium months)"
            );
        }

        BigDecimal totalAmount = expectedTotalAmountUsd(fulfillmentMethod, starsAmount);
        BigDecimal requestedAmount = request.amount();
        if (requestedAmount == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "amount is required when orderId is not provided"
            );
        }

        BigDecimal normalizedRequestedAmount = requestedAmount.setScale(2, RoundingMode.HALF_UP);
        if (normalizedRequestedAmount.compareTo(totalAmount) != 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "amount does not match server-side price"
            );
        }

        BigDecimal unitPrice = totalAmount.divide(
                BigDecimal.valueOf(starsAmount),
                2,
                RoundingMode.HALF_UP
        );

        CustomerEntity customer = findOrCreateCustomer(normalizedUsername);
        if (idempotencyKey != null) {
            OrderEntity existingOrder = orderRepository.findByCustomerIdAndIdempotencyKey(customer.getId(), idempotencyKey)
                    .orElse(null);
            if (existingOrder != null) {
                return existingOrder.getId();
            }
        }
        if (FULFILLMENT_GIFT_PREMIUM.equals(fulfillmentMethod)) {
            telegramUsernameService.assertPremiumGiftAllowed(normalizedUsername);
        }

        OrderEntity order = new OrderEntity();
        order.setCustomer(customer);
        order.setStatus(OrderStatus.created);
        order.setSource(OrderSource.web);
        order.setIdempotencyKey(idempotencyKey);
        order.setStarsAmount(starsAmount);
        order.setUnitPriceAmount(unitPrice);
        order.setSubtotalAmount(totalAmount);
        order.setDiscountAmount(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        order.setTotalAmount(totalAmount);
        order.setCurrency("USD");
        order.setExternalReference(fulfillmentMethod);

        try {
            OrderEntity savedOrder = orderRepository.saveAndFlush(order);
            return savedOrder.getId();
        } catch (DataIntegrityViolationException ex) {
            if (idempotencyKey == null) {
                throw ex;
            }
            OrderEntity existingOrder = orderRepository.findByCustomerIdAndIdempotencyKey(customer.getId(), idempotencyKey)
                    .orElseThrow(() -> ex);
            return existingOrder.getId();
        }
    }

    private CustomerEntity findOrCreateCustomer(String normalizedUsername) {
        long syntheticTelegramUserId = syntheticTelegramUserId(normalizedUsername);

        CustomerEntity existing = customerRepository.findByTelegramUserId(syntheticTelegramUserId)
                .orElse(null);
        if (existing != null) {
            if (!Objects.equals(existing.getTelegramUsername(), normalizedUsername)) {
                existing.setTelegramUsername(normalizedUsername);
                return customerRepository.save(existing);
            }
            return existing;
        }

        CustomerEntity customer = new CustomerEntity();
        customer.setTelegramUserId(syntheticTelegramUserId);
        customer.setTelegramUsername(normalizedUsername);
        return customerRepository.save(customer);
    }

    private long ensureActivePayment(long orderId) {
        Long paymentId = txTemplate.execute(status -> {
            OrderEntity order = orderRepository.findByIdForUpdate(orderId)
                    .orElseThrow(() -> notFoundOrder(orderId));

            List<PaymentEntity> payments = paymentRepository.findLatestByOrderIdAndProvider(
                    orderId,
                    properties.getProviderName(),
                    PageRequest.of(0, 1)
            );

            if (!payments.isEmpty()) {
                PaymentEntity existing = payments.get(0);
                if (!TERMINAL_PAYMENT_STATUSES.contains(existing.getStatus())) {
                    return existing.getId();
                }
                if (order.getStatus() != OrderStatus.created && order.getStatus() != OrderStatus.pending_payment) {
                    return existing.getId();
                }
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
            payment.setPaymentMethod("ton_wallet");
            payment.setStatus(PaymentStatus.pending);
            payment.setAmount(order.getTotalAmount());
            payment.setCurrency(order.getCurrency());
            payment.setExpiresAt(OffsetDateTime.now(ZoneOffset.UTC).plusSeconds(Math.max(30, properties.getPaymentWindowSeconds())));
            payment.setFailureCode(null);
            payment.setFailureMessage(null);
            PaymentEntity saved = paymentRepository.save(payment);

            updateOrderStatusIfNeeded(order, OrderStatus.pending_payment, "ton wallet payment created");
            return saved.getId();
        });

        if (paymentId == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not create TON wallet payment");
        }
        return paymentId;
    }

    private ReconcileOutcome reconcilePaymentById(long paymentId) {
        PaymentCheckContext checkContext = txTemplate.execute(status -> preparePaymentCheck(paymentId));
        if (checkContext == null) {
            return ReconcileOutcome.notChanged(false);
        }
        if (!checkContext.needsBlockchainCheck()) {
            return ReconcileOutcome.updated(false);
        }

        Optional<TonWalletIncomingTransfer> transfer;
        try {
            transfer = blockchainClient.findIncomingTransfer(
                    properties.getRecipientAddress(),
                    checkContext.expectedAmountNano(),
                    checkContext.notBefore()
            );
        } catch (TonWalletBlockchainException ex) {
            log.warn(
                    "TON blockchain check failed for paymentId={} reference={}: {}",
                    paymentId,
                    checkContext.paymentReference(),
                    ex.getMessage()
            );
            return ReconcileOutcome.notChanged(false);
        }

        if (transfer.isEmpty()) {
            return ReconcileOutcome.notChanged(false);
        }

        Boolean applied = txTemplate.execute(status -> applyMatchedIncomingPayment(paymentId, transfer.get()));
        if (!Boolean.TRUE.equals(applied)) {
            return ReconcileOutcome.notChanged(false);
        }
        return ReconcileOutcome.updated(true);
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
        if (payment.getExpiresAt() != null && now.isAfter(payment.getExpiresAt())) {
            payment.setStatus(PaymentStatus.expired);
            payment.setFailureCode("invoice_expired");
            payment.setFailureMessage("TON wallet payment window expired");
            paymentRepository.save(payment);
            updateOrderStatusIfNeeded(order, OrderStatus.expired, "ton wallet payment expired");
            return PaymentCheckContext.expired();
        }

        BigInteger expectedAmountNano = expectedAmountNano(order, payment.getProviderPaymentId());
        Instant notBefore = payment.getCreatedAt() == null
                ? Instant.now().minusSeconds(3_600)
                : payment.getCreatedAt().toInstant();

        return PaymentCheckContext.forBlockchainCheck(
                payment.getProviderPaymentId(),
                expectedAmountNano,
                notBefore
        );
    }

    private Boolean applyMatchedIncomingPayment(long paymentId, TonWalletIncomingTransfer transfer) {
        PaymentEntity payment = paymentRepository.findByIdForUpdate(paymentId).orElse(null);
        if (payment == null) {
            return false;
        }
        if (TERMINAL_PAYMENT_STATUSES.contains(payment.getStatus())) {
            return false;
        }
        if (payment.getExpiresAt() != null && OffsetDateTime.now(ZoneOffset.UTC).isAfter(payment.getExpiresAt())) {
            return false;
        }

        OrderEntity order = payment.getOrder();
        if (order == null || TERMINAL_ORDER_STATUSES.contains(order.getStatus())) {
            return false;
        }

        String transferTxHash = transfer.txHash() == null ? null : transfer.txHash().trim();
        if (transferTxHash != null && !transferTxHash.isBlank()) {
            PaymentEntity duplicateByTxHash = paymentRepository.findByProviderAndProviderTxHash(
                    properties.getProviderName(),
                    transferTxHash
            ).orElse(null);
            if (duplicateByTxHash != null && !Objects.equals(duplicateByTxHash.getId(), payment.getId())) {
                log.warn(
                        "Ignoring duplicate TON transfer txHash={} for paymentId={} (already used by paymentId={})",
                        transferTxHash,
                        paymentId,
                        duplicateByTxHash.getId()
                );
                return false;
            }
            payment.setProviderTxHash(transferTxHash);
        }

        payment.setStatus(PaymentStatus.succeeded);
        payment.setCapturedAt(OffsetDateTime.now(ZoneOffset.UTC));
        payment.setFailureCode(null);
        payment.setFailureMessage(null);
        try {
            paymentRepository.save(payment);
        } catch (DataIntegrityViolationException ex) {
            log.warn(
                    "Failed to persist TON payment match for paymentId={} (likely duplicate txHash={}): {}",
                    paymentId,
                    transferTxHash,
                    ex.getMessage()
            );
            return false;
        }

        String reason = "ton wallet payment confirmed";
        if (transferTxHash != null && !transferTxHash.isBlank()) {
            reason = reason + " txHash=" + compactReason(transferTxHash, 120);
        }
        boolean changed = updateOrderStatusIfNeeded(order, OrderStatus.paid, reason);
        return changed;
    }

    private TonWalletOrderResponse buildOrderResponse(long orderId) {
        OrderEntity order = orderRepository.findById(orderId).orElseThrow(() -> notFoundOrder(orderId));
        List<PaymentEntity> payments = paymentRepository.findLatestByOrderIdAndProvider(
                orderId,
                properties.getProviderName(),
                PageRequest.of(0, 1)
        );
        if (payments.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No TON wallet payment found for order " + orderId);
        }

        PaymentEntity payment = payments.get(0);
        BigInteger expectedNano = expectedAmountNano(order, payment.getProviderPaymentId());
        String amountTon = formatTonAmount(expectedNano);
        long validUntil = payment.getExpiresAt() == null
                ? OffsetDateTime.now(ZoneOffset.UTC).plusSeconds(Math.max(30, properties.getPaymentWindowSeconds())).toEpochSecond()
                : payment.getExpiresAt().toEpochSecond();

        return new TonWalletOrderResponse(
                order.getId(),
                payment.getProviderPaymentId(),
                payment.getStatus().name(),
                order.getStatus().name(),
                properties.getRecipientAddress(),
                amountTon,
                expectedNano.toString(),
                validUntil,
                properties.getNetwork()
        );
    }

    private BigInteger expectedAmountNano(OrderEntity order, String paymentReference) {
        int nonce = parseNonce(paymentReference);
        BigDecimal usdPerTon = properties.getUsdPerTon();
        if (usdPerTon == null || usdPerTon.signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "tonwallet.usd-per-ton must be > 0");
        }

        BigDecimal tonAmount = order.getTotalAmount()
                .divide(usdPerTon, 9, RoundingMode.UP);

        BigInteger baseNano = tonAmount
                .movePointRight(9)
                .setScale(0, RoundingMode.UP)
                .toBigIntegerExact();

        return baseNano.add(BigInteger.valueOf(nonce));
    }

    private static String formatTonAmount(BigInteger nano) {
        BigDecimal ton = new BigDecimal(nano).movePointLeft(9).setScale(9, RoundingMode.DOWN).stripTrailingZeros();
        if (ton.scale() < 0) {
            ton = ton.setScale(0);
        }
        return ton.toPlainString();
    }

    private String generatePaymentReference(long orderId) {
        int nonceMax = Math.max(1, properties.getAmountNonceMaxNano());
        int nonce = secureRandom.nextInt(nonceMax) + 1;
        return "tw-" + orderId + "-" + nonce;
    }

    private static int parseNonce(String reference) {
        if (reference == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "TON payment reference is empty");
        }
        java.util.regex.Matcher matcher = PAYMENT_REFERENCE_RE.matcher(reference.trim());
        if (!matcher.matches()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "TON payment reference format is invalid");
        }
        try {
            int nonce = Integer.parseInt(matcher.group(2));
            if (nonce <= 0) {
                throw new NumberFormatException("nonce must be positive");
            }
            return nonce;
        } catch (NumberFormatException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "TON payment reference nonce is invalid");
        }
    }

    private int fulfillPaidOrders() {
        if (!fragmentApiClient.isEnabled()) {
            return 0;
        }

        List<Long> paidOrderIds = orderRepository.findIdsByStatus(
                OrderStatus.paid,
                PageRequest.of(0, Math.max(1, properties.getPollBatchSize()))
        );
        if (paidOrderIds.isEmpty()) {
            return 0;
        }

        int fulfilled = 0;
        for (Long orderId : paidOrderIds) {
            DeliveryCommand command = txTemplate.execute(status -> startOrderDelivery(orderId));
            if (command == null) {
                continue;
            }

            String idempotencySuffix = FULFILLMENT_GIFT_PREMIUM.equals(command.method())
                    ? "gift-premium"
                    : "buy-stars";
            String idempotencyKey = "order-" + command.orderId() + "-" + idempotencySuffix;

            try {
                if (FULFILLMENT_GIFT_PREMIUM.equals(command.method())) {
                    fragmentApiClient.giftPremium(command.recipient(), command.quantity(), idempotencyKey);
                } else {
                    fragmentApiClient.buyStars(command.recipient(), command.quantity(), idempotencyKey);
                }
            } catch (FragmentApiException ex) {
                log.warn(
                        "Fragment {} failed for TON orderId={} recipient={} quantity={}: {}",
                        command.method(),
                        command.orderId(),
                        command.recipient(),
                        command.quantity(),
                        ex.getMessage()
                );
                Boolean markedFailed = txTemplate.execute(status -> markOrderDeliveryFailed(command.orderId(), ex.getMessage()));
                if (Boolean.TRUE.equals(markedFailed)) {
                    fulfillmentFailure.increment();
                }
                continue;
            }

            Boolean markedFulfilled = txTemplate.execute(status -> markOrderFulfilled(command.orderId()));
            if (Boolean.TRUE.equals(markedFulfilled)) {
                fulfillmentSuccess.increment();
                fulfilled++;
            }
        }

        return fulfilled;
    }

    private DeliveryCommand startOrderDelivery(long orderId) {
        OrderEntity order = orderRepository.findByIdForUpdate(orderId).orElse(null);
        if (order == null || order.getStatus() != OrderStatus.paid) {
            return null;
        }

        CustomerEntity customer = order.getCustomer();
        String recipient = normalizeUsername(customer == null ? null : customer.getTelegramUsername());
        Integer quantity = order.getStarsAmount();
        String method = resolveFulfillmentMethodForOrder(order);

        if (!USERNAME_RE.matcher(recipient).matches() || quantity == null || quantity <= 0) {
            log.error(
                    "Cannot build {} delivery payload for TON orderId={} (recipient='{}', quantity={})",
                    method,
                    orderId,
                    recipient,
                    quantity
            );
            boolean markedFailed = updateOrderStatusIfNeeded(
                    order,
                    OrderStatus.failed,
                    "fragment " + method + ": invalid order payload"
            );
            if (markedFailed) {
                fulfillmentFailure.increment();
            }
            return null;
        }
        if (FULFILLMENT_GIFT_PREMIUM.equals(method) && !PREMIUM_MONTH_OPTIONS.contains(quantity)) {
            log.error(
                    "Cannot build {} delivery payload for TON orderId={} (unsupported months={})",
                    method,
                    orderId,
                    quantity
            );
            boolean markedFailed = updateOrderStatusIfNeeded(
                    order,
                    OrderStatus.failed,
                    "fragment " + method + ": invalid premium duration"
            );
            if (markedFailed) {
                fulfillmentFailure.increment();
            }
            return null;
        }

        boolean movedToProcessing = updateOrderStatusIfNeeded(
                order,
                OrderStatus.processing,
                "fragment " + method + ": started"
        );
        if (!movedToProcessing) {
            return null;
        }

        return new DeliveryCommand(order.getId(), method, recipient, quantity);
    }

    private Boolean markOrderFulfilled(long orderId) {
        OrderEntity order = orderRepository.findByIdForUpdate(orderId).orElse(null);
        if (order == null || order.getStatus() != OrderStatus.processing) {
            return false;
        }
        String method = resolveFulfillmentMethodForOrder(order);
        return updateOrderStatusIfNeeded(order, OrderStatus.fulfilled, "fragment " + method + ": CONFIRMED");
    }

    private Boolean markOrderDeliveryFailed(long orderId, String failureMessage) {
        OrderEntity order = orderRepository.findByIdForUpdate(orderId).orElse(null);
        if (order == null) {
            return false;
        }
        if (order.getStatus() != OrderStatus.processing && order.getStatus() != OrderStatus.paid) {
            return false;
        }
        String method = resolveFulfillmentMethodForOrder(order);
        return updateOrderStatusIfNeeded(
                order,
                OrderStatus.failed,
                "fragment " + method + " failed: " + compactReason(failureMessage, 160)
        );
    }

    private boolean updateOrderStatusIfNeeded(OrderEntity order, OrderStatus targetStatus, String reason) {
        if (targetStatus == null) {
            return false;
        }

        OrderStatus currentStatus = order.getStatus();
        if (!isOrderTransitionAllowed(currentStatus, targetStatus)) {
            return false;
        }

        order.setStatus(targetStatus);
        switch (targetStatus) {
            case paid -> order.setPaidAt(coalesce(order.getPaidAt(), OffsetDateTime.now(ZoneOffset.UTC)));
            case fulfilled -> order.setFulfilledAt(coalesce(order.getFulfilledAt(), OffsetDateTime.now(ZoneOffset.UTC)));
            case failed -> order.setFailedAt(coalesce(order.getFailedAt(), OffsetDateTime.now(ZoneOffset.UTC)));
            case cancelled -> order.setCancelledAt(coalesce(order.getCancelledAt(), OffsetDateTime.now(ZoneOffset.UTC)));
            default -> {
                // no-op
            }
        }
        orderRepository.save(order);

        OrderStatusHistoryEntity history = new OrderStatusHistoryEntity();
        history.setOrder(order);
        history.setOldStatus(currentStatus);
        history.setNewStatus(targetStatus);
        history.setChangeReason(compactReason(reason, 255));
        history.setChangedBy("system");
        orderStatusHistoryRepository.save(history);

        return true;
    }

    private boolean isOrderTransitionAllowed(OrderStatus currentStatus, OrderStatus targetStatus) {
        if (targetStatus == null || Objects.equals(currentStatus, targetStatus)) {
            return false;
        }
        if (TERMINAL_ORDER_STATUSES.contains(currentStatus)) {
            return false;
        }

        return switch (targetStatus) {
            case pending_payment -> currentStatus == OrderStatus.created;
            case paid -> currentStatus == OrderStatus.created || currentStatus == OrderStatus.pending_payment;
            case processing -> currentStatus == OrderStatus.paid;
            case fulfilled -> currentStatus == OrderStatus.paid || currentStatus == OrderStatus.processing;
            case expired -> currentStatus == OrderStatus.created || currentStatus == OrderStatus.pending_payment;
            case failed -> currentStatus == OrderStatus.created
                    || currentStatus == OrderStatus.pending_payment
                    || currentStatus == OrderStatus.processing
                    || currentStatus == OrderStatus.paid;
            case cancelled -> currentStatus == OrderStatus.created || currentStatus == OrderStatus.pending_payment;
            default -> false;
        };
    }

    private static String resolveFulfillmentMethod(String raw) {
        if (raw == null || raw.isBlank()) {
            return FULFILLMENT_BUY_STARS;
        }
        String normalized = raw.trim();
        if (FULFILLMENT_BUY_STARS.equals(normalized) || FULFILLMENT_GIFT_PREMIUM.equals(normalized)) {
            return normalized;
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "fulfillmentMethod must be 'buyStars' or 'giftPremium'");
    }

    private static String resolveFulfillmentMethodForOrder(OrderEntity order) {
        String externalReference = order.getExternalReference();
        if (FULFILLMENT_GIFT_PREMIUM.equals(externalReference)) {
            return FULFILLMENT_GIFT_PREMIUM;
        }
        return FULFILLMENT_BUY_STARS;
    }

    private static BigDecimal expectedTotalAmountUsd(String fulfillmentMethod, int starsAmount) {
        if (FULFILLMENT_GIFT_PREMIUM.equals(fulfillmentMethod)) {
            BigDecimal premiumPrice = PREMIUM_MONTH_PRICES_USD.get(starsAmount);
            if (premiumPrice == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "For giftPremium, starsAmount must be one of 3, 6, 12 (premium months)"
                );
            }
            return premiumPrice;
        }

        return BigDecimal.valueOf(starsAmount)
                .multiply(STARS_UNIT_PRICE_USD)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private void requireTonWalletEnabled() {
        if (!properties.isEnabled()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "TON wallet integration is disabled (tonwallet.enabled=false)"
            );
        }
        if (properties.getRecipientAddress() == null || properties.getRecipientAddress().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "TON wallet recipient address is empty (tonwallet.recipient-address)"
            );
        }
    }

    private static String normalizeUsername(String username) {
        if (username == null) {
            return "";
        }
        return username.trim().replaceFirst("^@+", "").toLowerCase(Locale.ROOT);
    }

    private static long syntheticTelegramUserId(String normalizedUsername) {
        byte[] digestBytes;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            digestBytes = digest.digest(normalizedUsername.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm is not available", e);
        }

        long value = ByteBuffer.wrap(digestBytes).getLong();
        if (value == Long.MIN_VALUE) {
            value = Long.MAX_VALUE;
        }

        long negative = -Math.abs(value);
        return negative == 0 ? -1 : negative;
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
            boolean needsBlockchainCheck,
            String paymentReference,
            BigInteger expectedAmountNano,
            Instant notBefore
    ) {
        static PaymentCheckContext forBlockchainCheck(String paymentReference,
                                                      BigInteger expectedAmountNano,
                                                      Instant notBefore) {
            return new PaymentCheckContext(true, paymentReference, expectedAmountNano, notBefore);
        }

        static PaymentCheckContext expired() {
            return new PaymentCheckContext(false, null, null, null);
        }
    }

    private record DeliveryCommand(
            long orderId,
            String method,
            String recipient,
            int quantity
    ) {
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
