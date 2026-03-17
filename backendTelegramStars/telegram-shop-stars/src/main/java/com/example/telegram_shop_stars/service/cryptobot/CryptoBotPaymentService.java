package com.example.telegram_shop_stars.service.cryptobot;

import com.example.telegram_shop_stars.dto.CryptoBotCreateInvoiceRequest;
import com.example.telegram_shop_stars.dto.CryptoBotCreateInvoiceResponse;
import com.example.telegram_shop_stars.dto.CryptoBotPollResponse;
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
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.dao.DataIntegrityViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CryptoBotPaymentService {

    private static final Logger log = LoggerFactory.getLogger(CryptoBotPaymentService.class);
    private static final java.util.regex.Pattern USERNAME_RE = java.util.regex.Pattern.compile("^[a-z0-9_]{5,32}$");
    private static final String FULFILLMENT_BUY_STARS = "buyStars";
    private static final String FULFILLMENT_GIFT_PREMIUM = "giftPremium";
    private static final Set<Integer> PREMIUM_MONTH_OPTIONS = Set.of(3, 6, 12);

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
    private final CryptoBotApiClient apiClient;
    private final FragmentApiClient fragmentApiClient;
    private final TelegramUsernameService telegramUsernameService;
    private final CryptoBotTestnetProperties properties;
    private final TransactionTemplate txTemplate;
    private final Counter invoiceCreateRequests;
    private final Counter invoiceCreateSuccess;
    private final Counter invoiceCreateFailure;
    private final Counter fulfillmentSuccess;
    private final Counter fulfillmentFailure;

    public CryptoBotPaymentService(CustomerRepository customerRepository,
                                   OrderRepository orderRepository,
                                   PaymentRepository paymentRepository,
                                   OrderStatusHistoryRepository orderStatusHistoryRepository,
                                   CryptoBotApiClient apiClient,
                                   FragmentApiClient fragmentApiClient,
                                   TelegramUsernameService telegramUsernameService,
                                   CryptoBotTestnetProperties properties,
                                   PlatformTransactionManager transactionManager,
                                   MeterRegistry meterRegistry) {
        this.customerRepository = customerRepository;
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.orderStatusHistoryRepository = orderStatusHistoryRepository;
        this.apiClient = apiClient;
        this.fragmentApiClient = fragmentApiClient;
        this.telegramUsernameService = telegramUsernameService;
        this.properties = properties;
        this.txTemplate = new TransactionTemplate(transactionManager);
        this.invoiceCreateRequests = meterRegistry.counter("cryptobot.invoice.create.requests");
        this.invoiceCreateSuccess = meterRegistry.counter("cryptobot.invoice.create.success");
        this.invoiceCreateFailure = meterRegistry.counter("cryptobot.invoice.create.failure");
        this.fulfillmentSuccess = meterRegistry.counter("cryptobot.fulfillment.success");
        this.fulfillmentFailure = meterRegistry.counter("cryptobot.fulfillment.failure");
    }

    public CryptoBotCreateInvoiceResponse createInvoice(CryptoBotCreateInvoiceRequest request, String idempotencyKeyHeader) {
        requireCryptoBotEnabled();
        invoiceCreateRequests.increment();

        String normalizedIdempotencyKey = normalizeIdempotencyKey(idempotencyKeyHeader);
        Map<String, Object> createPayload = buildCreateInvoicePayload(request);
        long orderId = resolveOrCreateOrderId(request, createPayload, normalizedIdempotencyKey);

        CryptoBotInvoice invoice = tryReuseExistingInvoice(orderId);
        if (invoice == null) {
            try {
                invoice = apiClient.createInvoice(createPayload);
            } catch (CryptoBotApiException ex) {
                log.warn(
                        "CryptoBot createInvoice failed for orderId={} payload={}: {}",
                        orderId,
                        createPayload,
                        ex.getMessage(),
                        ex
                );
                invoiceCreateFailure.increment();
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Payment provider is unavailable");
            }
        }

        PaymentStatus paymentStatus = mapPaymentStatus(invoice.normalizedStatus());
        if (paymentStatus == null) {
            paymentStatus = PaymentStatus.pending;
        }

        OrderStatus orderStatus = mapOrderStatus(invoice.normalizedStatus());
        if (orderStatus == null) {
            orderStatus = OrderStatus.pending_payment;
        }

        BigDecimal paymentAmount = invoice.amount() == null ? request.amount() : invoice.amount();
        String currencyForStorage = resolveCurrencyForStorage(invoice);
        OffsetDateTime expiresAt = toOffsetDateTime(invoice.expirationDate());
        OffsetDateTime capturedAt = paymentStatus == PaymentStatus.succeeded
                ? toOffsetDateTime(invoice.paidAt())
                : null;

        CryptoBotInvoice persistedInvoice = invoice;
        PaymentStatus persistedPaymentStatus = paymentStatus;
        OrderStatus persistedOrderStatus = orderStatus;

        OrderStatus finalOrderStatus = txTemplate.execute(status -> {
            OrderEntity order = orderRepository.findByIdForUpdate(orderId)
                    .orElseThrow(() -> notFoundOrder(orderId));

            upsertPayment(
                    order,
                    String.valueOf(persistedInvoice.invoiceId()),
                    persistedPaymentStatus,
                    paymentAmount,
                    currencyForStorage,
                    expiresAt,
                    capturedAt
            );

            updateOrderStatusIfNeeded(
                    order,
                    persistedOrderStatus,
                    "cryptobot createInvoice: " + persistedInvoice.normalizedStatus()
            );

            return order.getStatus();
        });

        invoiceCreateSuccess.increment();
        return new CryptoBotCreateInvoiceResponse(
                orderId,
                invoice.invoiceId(),
                invoice.hash(),
                invoice.normalizedStatus(),
                paymentStatus.name(),
                finalOrderStatus == null ? null : finalOrderStatus.name(),
                invoice.botInvoiceUrl(),
                invoice.miniAppInvoiceUrl(),
                invoice.webAppInvoiceUrl()
        );
    }

    private long resolveOrCreateOrderId(CryptoBotCreateInvoiceRequest request,
                                        Map<String, Object> createPayload,
                                        String idempotencyKey) {
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

        String currencyCode = resolveOrderCurrencyFromRequest(request, createPayload);
        BigDecimal totalAmount = request.amount();
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
        order.setCurrency(currencyCode);
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

    private CryptoBotInvoice tryReuseExistingInvoice(long orderId) {
        List<PaymentEntity> payments = paymentRepository.findLatestByOrderIdAndProvider(
                orderId,
                properties.getProviderName(),
                PageRequest.of(0, 1)
        );
        if (payments.isEmpty()) {
            return null;
        }

        Long invoiceId = parseInvoiceId(payments.get(0).getProviderPaymentId());
        if (invoiceId == null) {
            return null;
        }

        try {
            List<CryptoBotInvoice> invoices = apiClient.getInvoices(List.of(invoiceId));
            if (invoices.isEmpty()) {
                return null;
            }

            CryptoBotInvoice invoice = invoices.get(0);
            if (!isInvoiceReusable(invoice.normalizedStatus())) {
                return null;
            }
            return invoice;
        } catch (CryptoBotApiException ex) {
            log.warn("Failed to reuse existing invoice for orderId={}: {}", orderId, ex.getMessage(), ex);
            return null;
        }
    }

    private static boolean isInvoiceReusable(String status) {
        return "active".equals(status) || "paid".equals(status);
    }

    private static String normalizeUsername(String username) {
        if (username == null) {
            return "";
        }
        return username.trim()
                .replaceFirst("^@+", "")
                .toLowerCase(Locale.ROOT);
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

    private static String resolveFulfillmentMethod(String raw) {
        if (raw == null || raw.isBlank()) {
            return FULFILLMENT_BUY_STARS;
        }
        String normalized = raw.trim();
        if (FULFILLMENT_BUY_STARS.equals(normalized) || FULFILLMENT_GIFT_PREMIUM.equals(normalized)) {
            return normalized;
        }
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "fulfillmentMethod must be 'buyStars' or 'giftPremium'"
        );
    }

    public CryptoBotPollResponse pollPendingPayments() {
        requireCryptoBotEnabled();

        List<PaymentEntity> pendingPayments = paymentRepository.findForPolling(
                properties.getProviderName(),
                POLLABLE_PAYMENT_STATUSES,
                PageRequest.of(0, Math.max(1, properties.getPollBatchSize()))
        );

        int checkedPayments = 0;
        int invoicesReturned = 0;
        int updatedRows = 0;
        int missingInvoices = 0;

        if (!pendingPayments.isEmpty()) {
            List<PaymentPollCandidate> candidates = new ArrayList<>();
            for (PaymentEntity payment : pendingPayments) {
                Long invoiceId = parseInvoiceId(payment.getProviderPaymentId());
                if (invoiceId == null) {
                    log.warn(
                            "Skipping payment {} with non-numeric provider_payment_id='{}'",
                            payment.getId(),
                            payment.getProviderPaymentId()
                    );
                    continue;
                }
                candidates.add(new PaymentPollCandidate(payment.getId(), invoiceId));
            }

            if (!candidates.isEmpty()) {
                checkedPayments = candidates.size();

                List<Long> invoiceIds = candidates.stream()
                        .map(PaymentPollCandidate::invoiceId)
                        .distinct()
                        .toList();

                List<CryptoBotInvoice> invoices;
                try {
                    invoices = apiClient.getInvoices(invoiceIds);
                } catch (CryptoBotApiException ex) {
                    log.warn("CryptoBot getInvoices failed for invoiceIds={}: {}", invoiceIds, ex.getMessage(), ex);
                    throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Payment provider is unavailable");
                }
                invoicesReturned = invoices.size();
                Map<Long, CryptoBotInvoice> invoicesById = invoices.stream()
                        .collect(Collectors.toMap(CryptoBotInvoice::invoiceId, invoice -> invoice, (left, right) -> right));

                for (PaymentPollCandidate candidate : candidates) {
                    CryptoBotInvoice invoice = invoicesById.get(candidate.invoiceId());
                    if (invoice == null) {
                        missingInvoices++;
                        continue;
                    }

                    Boolean changed = txTemplate.execute(status -> reconcileCandidate(candidate, invoice));
                    if (Boolean.TRUE.equals(changed)) {
                        updatedRows++;
                    }
                }
            }
        }

        int fulfilledOrders = fulfillPaidOrders();
        if (fulfilledOrders > 0) {
            log.info("Fragment fulfillment succeeded for {} paid orders", fulfilledOrders);
        }

        return new CryptoBotPollResponse(
                checkedPayments,
                invoicesReturned,
                updatedRows,
                missingInvoices
        );
    }

    private Boolean reconcileCandidate(PaymentPollCandidate candidate, CryptoBotInvoice invoice) {
        PaymentEntity payment = paymentRepository.findByIdForUpdate(candidate.paymentId())
                .orElse(null);
        if (payment == null) {
            return false;
        }

        if (TERMINAL_PAYMENT_STATUSES.contains(payment.getStatus())) {
            return false;
        }

        String invoiceStatus = invoice.normalizedStatus();
        PaymentStatus targetPaymentStatus = mapPaymentStatus(invoiceStatus);
        OrderStatus targetOrderStatus = mapOrderStatus(invoiceStatus);
        boolean changed = false;

        if (targetPaymentStatus != null && !Objects.equals(targetPaymentStatus, payment.getStatus())) {
            applyPaymentStatus(payment, targetPaymentStatus, invoice);
            paymentRepository.save(payment);
            changed = true;
        }

        if (targetOrderStatus != null) {
            boolean orderChanged = updateOrderStatusIfNeeded(
                    payment.getOrder(),
                    targetOrderStatus,
                    "cryptobot poll: " + invoiceStatus
            );
            changed = changed || orderChanged;
        }

        return changed;
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
                        "Fragment {} failed for orderId={} recipient={} quantity={}: {}",
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
                    "Cannot build {} delivery payload for orderId={} (recipient='{}', quantity={})",
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
                    "Cannot build {} delivery payload for orderId={} (unsupported months={})",
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

    private void upsertPayment(OrderEntity order,
                               String providerPaymentId,
                               PaymentStatus paymentStatus,
                               BigDecimal amount,
                               String currency,
                               OffsetDateTime expiresAt,
                               OffsetDateTime capturedAt) {
        PaymentEntity payment = paymentRepository.findByProviderAndProviderPaymentId(
                properties.getProviderName(),
                providerPaymentId
        ).orElseGet(PaymentEntity::new);

        if (payment.getId() == null) {
            payment.setProvider(properties.getProviderName());
            payment.setProviderPaymentId(providerPaymentId);
        }

        payment.setOrder(order);
        payment.setPaymentMethod("cryptobot_testnet");
        payment.setStatus(paymentStatus);
        payment.setAmount(amount);
        payment.setCurrency(currency);
        payment.setExpiresAt(expiresAt);
        payment.setCapturedAt(capturedAt);

        if (paymentStatus != PaymentStatus.failed
                && paymentStatus != PaymentStatus.cancelled
                && paymentStatus != PaymentStatus.expired) {
            payment.setFailureCode(null);
            payment.setFailureMessage(null);
        }

        paymentRepository.save(payment);
    }

    private void applyPaymentStatus(PaymentEntity payment, PaymentStatus paymentStatus, CryptoBotInvoice invoice) {
        payment.setStatus(paymentStatus);
        payment.setExpiresAt(coalesce(toOffsetDateTime(invoice.expirationDate()), payment.getExpiresAt()));
        if (paymentStatus == PaymentStatus.succeeded) {
            payment.setCapturedAt(coalesce(toOffsetDateTime(invoice.paidAt()), payment.getCapturedAt()));
        }

        switch (paymentStatus) {
            case failed -> {
                payment.setFailureCode("provider_failed");
                payment.setFailureMessage("Payment failed on CryptoBot side");
            }
            case cancelled -> {
                payment.setFailureCode("provider_cancelled");
                payment.setFailureMessage("Payment cancelled on CryptoBot side");
            }
            case expired -> {
                payment.setFailureCode("provider_expired");
                payment.setFailureMessage("Payment expired on CryptoBot side");
            }
            default -> {
                payment.setFailureCode(null);
                payment.setFailureMessage(null);
            }
        }
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

    private Map<String, Object> buildCreateInvoicePayload(CryptoBotCreateInvoiceRequest request) {
        String currencyType = request.currencyType().trim().toLowerCase(Locale.ROOT);
        if (!"fiat".equals(currencyType) && !"crypto".equals(currencyType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "currencyType must be 'fiat' or 'crypto'");
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("currency_type", currencyType);
        payload.put("amount", request.amount().stripTrailingZeros().toPlainString());

        if ("fiat".equals(currencyType)) {
            String fiat = normalizeRequiredCurrency(request.fiat(), "fiat is required for currencyType=fiat");
            payload.put("fiat", fiat);

            if (request.acceptedAssets() != null && !request.acceptedAssets().isBlank()) {
                payload.put("accepted_assets", request.acceptedAssets().trim().toUpperCase(Locale.ROOT));
            }
        } else {
            String asset = normalizeRequiredCurrency(request.asset(), "asset is required for currencyType=crypto");
            payload.put("asset", asset);
        }

        if (request.description() != null && !request.description().isBlank()) {
            payload.put("description", request.description().trim());
        }
        if (request.payload() != null && !request.payload().isBlank()) {
            payload.put("payload", request.payload().trim());
        }
        if (request.expiresIn() != null) {
            payload.put("expires_in", request.expiresIn());
        }

        return payload;
    }

    private static String normalizeRequiredCurrency(String value, String errorMessage) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errorMessage);
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }

    private static String resolveOrderCurrencyFromRequest(CryptoBotCreateInvoiceRequest request,
                                                          Map<String, Object> createPayload) {
        String currencyType = request.currencyType().trim().toLowerCase(Locale.ROOT);
        String currency;
        if ("fiat".equals(currencyType)) {
            Object fiat = createPayload.get("fiat");
            currency = fiat instanceof String ? ((String) fiat).trim().toUpperCase(Locale.ROOT) : "";
        } else {
            Object asset = createPayload.get("asset");
            currency = asset instanceof String ? ((String) asset).trim().toUpperCase(Locale.ROOT) : "";
        }

        if (currency.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot resolve order currency from request");
        }
        if (currency.length() > 3) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Currency '" + currency + "' does not fit orders.currency CHAR(3). Use fiat currency like RUB/USD."
            );
        }
        return currency;
    }

    private String resolveCurrencyForStorage(CryptoBotInvoice invoice) {
        String currency = invoice.resolvedCurrencyCode();
        if (currency == null || currency.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "CryptoBot did not return currency");
        }
        if (currency.length() > 3) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Currency '" + currency + "' does not fit payments.currency CHAR(3). " +
                            "Use fiat invoices (example: USD) or widen DB schema."
            );
        }
        return currency;
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
            case paid -> currentStatus == OrderStatus.created
                    || currentStatus == OrderStatus.pending_payment;
            case processing -> currentStatus == OrderStatus.paid;
            case fulfilled -> currentStatus == OrderStatus.paid
                    || currentStatus == OrderStatus.processing;
            case expired -> currentStatus == OrderStatus.created
                    || currentStatus == OrderStatus.pending_payment;
            case failed -> currentStatus == OrderStatus.created
                    || currentStatus == OrderStatus.pending_payment
                    || currentStatus == OrderStatus.processing;
            case cancelled -> currentStatus == OrderStatus.created
                    || currentStatus == OrderStatus.pending_payment;
            default -> false;
        };
    }

    private static PaymentStatus mapPaymentStatus(String invoiceStatus) {
        return switch (invoiceStatus) {
            case "paid" -> PaymentStatus.succeeded;
            case "active" -> PaymentStatus.pending;
            case "expired" -> PaymentStatus.expired;
            case "cancelled" -> PaymentStatus.cancelled;
            case "failed" -> PaymentStatus.failed;
            default -> null;
        };
    }

    private static OrderStatus mapOrderStatus(String invoiceStatus) {
        return switch (invoiceStatus) {
            case "paid" -> OrderStatus.paid;
            case "active" -> OrderStatus.pending_payment;
            case "expired" -> OrderStatus.expired;
            case "cancelled" -> OrderStatus.cancelled;
            case "failed" -> OrderStatus.failed;
            default -> null;
        };
    }

    private void requireCryptoBotEnabled() {
        if (!properties.isEnabled()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "CryptoBot testnet integration is disabled (cryptobot.testnet.enabled=false)"
            );
        }
        if (properties.getToken() == null || properties.getToken().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "CryptoBot token is empty (cryptobot.testnet.token)"
            );
        }
    }

    private static OffsetDateTime toOffsetDateTime(Instant instant) {
        return instant == null ? null : instant.atOffset(ZoneOffset.UTC);
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

    private static Long parseInvoiceId(String rawProviderPaymentId) {
        if (rawProviderPaymentId == null || rawProviderPaymentId.isBlank()) {
            return null;
        }
        try {
            return Long.parseLong(rawProviderPaymentId.trim());
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private static ResponseStatusException notFoundOrder(long orderId) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Order " + orderId + " not found");
    }

    private static String resolveFulfillmentMethodForOrder(OrderEntity order) {
        String externalReference = order.getExternalReference();
        if (FULFILLMENT_GIFT_PREMIUM.equals(externalReference)) {
            return FULFILLMENT_GIFT_PREMIUM;
        }
        return FULFILLMENT_BUY_STARS;
    }

    private record PaymentPollCandidate(
            long paymentId,
            long invoiceId
    ) {
    }

    private record DeliveryCommand(
            long orderId,
            String method,
            String recipient,
            int quantity
    ) {
    }
}
