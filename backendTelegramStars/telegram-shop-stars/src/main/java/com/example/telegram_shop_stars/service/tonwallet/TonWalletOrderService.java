package com.example.telegram_shop_stars.service.tonwallet;

import com.example.telegram_shop_stars.dto.TonWalletCreateOrderRequest;
import com.example.telegram_shop_stars.entity.CustomerEntity;
import com.example.telegram_shop_stars.entity.OrderEntity;
import com.example.telegram_shop_stars.entity.OrderSource;
import com.example.telegram_shop_stars.entity.OrderStatus;
import com.example.telegram_shop_stars.entity.OrderStatusHistoryEntity;
import com.example.telegram_shop_stars.repository.CustomerRepository;
import com.example.telegram_shop_stars.repository.OrderRepository;
import com.example.telegram_shop_stars.repository.OrderStatusHistoryRepository;
import com.example.telegram_shop_stars.service.TelegramUsernameService;
import com.example.telegram_shop_stars.service.balance.BalanceReservationService;
import com.example.telegram_shop_stars.service.fragment.FragmentApiClient;
import com.example.telegram_shop_stars.service.fragment.FragmentApiException;
import com.example.telegram_shop_stars.service.fragment.FragmentApiProperties;
import com.example.telegram_shop_stars.service.pricing.OrderPricing;
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
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.regex.Pattern;

@Service
public class TonWalletOrderService {

    private static final Logger log = LoggerFactory.getLogger(TonWalletOrderService.class);
    private static final Pattern USERNAME_RE = Pattern.compile("^[a-z0-9_]{5,32}$");
    private static final String FULFILLMENT_BUY_STARS = OrderPricing.FULFILLMENT_BUY_STARS;
    private static final String FULFILLMENT_GIFT_PREMIUM = OrderPricing.FULFILLMENT_GIFT_PREMIUM;
    private static final List<OrderStatus> FULFILLMENT_READY_ORDER_STATUSES = List.of(
            OrderStatus.paid,
            OrderStatus.processing
    );

    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;
    private final OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final BalanceReservationService balanceReservationService;
    private final FragmentApiClient fragmentApiClient;
    private final FragmentApiProperties fragmentProperties;
    private final TelegramUsernameService telegramUsernameService;
    private final TonWalletProperties properties;
    private final TransactionTemplate txTemplate;

    public TonWalletOrderService(CustomerRepository customerRepository,
                                 OrderRepository orderRepository,
                                 OrderStatusHistoryRepository orderStatusHistoryRepository,
                                 BalanceReservationService balanceReservationService,
                                 FragmentApiClient fragmentApiClient,
                                 FragmentApiProperties fragmentProperties,
                                 TelegramUsernameService telegramUsernameService,
                                 TonWalletProperties properties,
                                 PlatformTransactionManager transactionManager) {
        this.customerRepository = customerRepository;
        this.orderRepository = orderRepository;
        this.orderStatusHistoryRepository = orderStatusHistoryRepository;
        this.balanceReservationService = balanceReservationService;
        this.fragmentApiClient = fragmentApiClient;
        this.fragmentProperties = fragmentProperties;
        this.telegramUsernameService = telegramUsernameService;
        this.properties = properties;
        this.txTemplate = new TransactionTemplate(transactionManager);
    }

    public long resolveOrCreateOrderId(TonWalletCreateOrderRequest request, String idempotencyKey) {
        Long providedOrderId = request.orderId();
        if (providedOrderId != null) {
            OrderEntity order = orderRepository.findById(providedOrderId)
                    .orElseThrow(() -> notFoundOrder(providedOrderId));
            balanceReservationService.reserveForOrder(order.getId(), order.getTotalAmount());
            return order.getId();
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
        OrderPricing.validateQuantity(fulfillmentMethod, starsAmount);

        BigDecimal totalAmount = OrderPricing.expectedTotalAmountUsd(fulfillmentMethod, starsAmount);
        BigDecimal requestedAmount = request.amount();
        if (requestedAmount == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "amount is required when orderId is not provided"
            );
        }

        BigDecimal normalizedRequestedAmount = OrderPricing.normalizeMoney(requestedAmount);
        if (normalizedRequestedAmount.compareTo(totalAmount) != 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "amount does not match server-side price"
            );
        }

        BigDecimal unitPrice = OrderPricing.resolveUnitPriceAmount(fulfillmentMethod, starsAmount);
        CustomerEntity customer = findOrCreateCustomer(normalizedUsername);
        if (idempotencyKey != null) {
            OrderEntity existingOrder = orderRepository.findByCustomerIdAndIdempotencyKey(customer.getId(), idempotencyKey)
                    .orElse(null);
            if (existingOrder != null) {
                balanceReservationService.reserveForOrder(existingOrder.getId(), existingOrder.getTotalAmount());
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
        order.setDiscountAmount(OrderPricing.zeroMoney());
        order.setTotalAmount(totalAmount);
        order.setCurrency("USD");
        order.setExternalReference(fulfillmentMethod);

        try {
            OrderEntity savedOrder = orderRepository.saveAndFlush(order);
            balanceReservationService.reserveForOrder(savedOrder.getId(), totalAmount);
            return savedOrder.getId();
        } catch (DataIntegrityViolationException ex) {
            if (idempotencyKey == null) {
                throw ex;
            }
            OrderEntity existingOrder = orderRepository.findByCustomerIdAndIdempotencyKey(customer.getId(), idempotencyKey)
                    .orElseThrow(() -> ex);
            balanceReservationService.reserveForOrder(existingOrder.getId(), existingOrder.getTotalAmount());
            return existingOrder.getId();
        }
    }

    public TonWalletFulfillmentResult fulfillPaidOrders() {
        if (!fragmentApiClient.isEnabled()) {
            return TonWalletFulfillmentResult.empty();
        }

        List<Long> paidOrderIds = orderRepository.findIdsReadyForFulfillment(
                FULFILLMENT_READY_ORDER_STATUSES,
                PageRequest.of(0, Math.max(1, properties.getPollBatchSize()))
        );
        if (paidOrderIds.isEmpty()) {
            return TonWalletFulfillmentResult.empty();
        }

        int fulfilled = 0;
        int failed = 0;

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
                DeliveryFailureOutcome failureOutcome = txTemplate.execute(
                        status -> scheduleOrderDeliveryRetryOrFail(command.orderId(), ex.getMessage())
                );
                if (failureOutcome != null && failureOutcome.terminalFailure()) {
                    failed++;
                }
                continue;
            }

            Boolean markedFulfilled = txTemplate.execute(status -> markOrderFulfilled(command.orderId()));
            if (Boolean.TRUE.equals(markedFulfilled)) {
                fulfilled++;
            }
        }

        return new TonWalletFulfillmentResult(fulfilled, failed);
    }

    public boolean updateOrderStatusIfNeeded(OrderEntity order, OrderStatus targetStatus, String reason) {
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
        balanceReservationService.applyReservationSideEffects(order, currentStatus, targetStatus);

        return true;
    }

    private CustomerEntity findOrCreateCustomer(String normalizedUsername) {
        long syntheticTelegramUserId = syntheticTelegramUserId(normalizedUsername);

        CustomerEntity existing = customerRepository.findByTelegramUserId(syntheticTelegramUserId).orElse(null);
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

    private DeliveryCommand startOrderDelivery(long orderId) {
        OrderEntity order = orderRepository.findByIdForUpdate(orderId).orElse(null);
        if (order == null) {
            return null;
        }

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        if (order.getStatus() == OrderStatus.processing) {
            OffsetDateTime leaseUntil = order.getNextFulfillmentAttemptAt();
            if (leaseUntil != null && leaseUntil.isAfter(now)) {
                return null;
            }
            log.warn("Reclaiming expired TON Fragment delivery lease for orderId={}", orderId);
        } else if (order.getStatus() != OrderStatus.paid) {
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
            updateOrderStatusIfNeeded(order, OrderStatus.failed, "fragment " + method + ": invalid order payload");
            return null;
        }

        try {
            OrderPricing.validateQuantity(method, quantity);
        } catch (ResponseStatusException ex) {
            log.error(
                    "Cannot build {} delivery payload for TON orderId={} (invalid quantity={}): {}",
                    method,
                    orderId,
                    quantity,
                    ex.getReason()
            );
            updateOrderStatusIfNeeded(order, OrderStatus.failed, "fragment " + method + ": invalid quantity");
            return null;
        }

        if (order.getStatus() == OrderStatus.paid) {
            boolean movedToProcessing = updateOrderStatusIfNeeded(order, OrderStatus.processing, "fragment " + method + ": started");
            if (!movedToProcessing) {
                return null;
            }
        }

        order.setNextFulfillmentAttemptAt(now.plus(Duration.ofMillis(resolveDeliveryLeaseMs())));
        orderRepository.save(order);

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

    private DeliveryFailureOutcome scheduleOrderDeliveryRetryOrFail(long orderId, String failureMessage) {
        OrderEntity order = orderRepository.findByIdForUpdate(orderId).orElse(null);
        if (order == null) {
            return DeliveryFailureOutcome.ignored();
        }
        if (order.getStatus() != OrderStatus.processing && order.getStatus() != OrderStatus.paid) {
            return DeliveryFailureOutcome.ignored();
        }

        String method = resolveFulfillmentMethodForOrder(order);
        int nextAttempt = Math.max(0, coalesce(order.getFulfillmentAttempts(), 0)) + 1;
        order.setFulfillmentAttempts(nextAttempt);

        if (nextAttempt >= Math.max(1, fragmentProperties.getDeliveryMaxAttempts())) {
            order.setNextFulfillmentAttemptAt(null);
            boolean markedFailed = updateOrderStatusIfNeeded(
                    order,
                    OrderStatus.failed,
                    "fragment " + method + " exhausted after " + nextAttempt + " attempts: "
                            + compactReason(failureMessage, 160)
            );
            return markedFailed
                    ? DeliveryFailureOutcome.terminalFailure(nextAttempt)
                    : DeliveryFailureOutcome.ignored();
        }

        OffsetDateTime retryAt = nextDeliveryRetryAt(nextAttempt);
        order.setNextFulfillmentAttemptAt(retryAt);
        boolean movedBackToPaid = updateOrderStatusIfNeeded(
                order,
                OrderStatus.paid,
                "fragment " + method + " retry " + nextAttempt + " scheduled: "
                        + compactReason(failureMessage, 160)
        );
        if (!movedBackToPaid && order.getStatus() != OrderStatus.paid) {
            return DeliveryFailureOutcome.ignored();
        }

        orderRepository.save(order);
        log.warn(
                "Scheduled TON Fragment retry for orderId={} at {} after attempt {}: {}",
                orderId,
                retryAt,
                nextAttempt,
                compactReason(failureMessage, 255)
        );
        return DeliveryFailureOutcome.retryScheduled(retryAt, nextAttempt);
    }

    private static boolean isOrderTransitionAllowed(OrderStatus currentStatus, OrderStatus targetStatus) {
        if (targetStatus == null || Objects.equals(currentStatus, targetStatus)) {
            return false;
        }
        if (targetStatus == OrderStatus.refunded) {
            return false;
        }
        if (currentStatus == OrderStatus.fulfilled
                || currentStatus == OrderStatus.cancelled
                || currentStatus == OrderStatus.refunded
                || currentStatus == OrderStatus.failed
                || currentStatus == OrderStatus.expired) {
            return false;
        }

        return switch (targetStatus) {
            case pending_payment -> currentStatus == OrderStatus.created;
            case paid -> currentStatus == OrderStatus.created
                    || currentStatus == OrderStatus.pending_payment
                    || currentStatus == OrderStatus.processing;
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

    private OffsetDateTime nextDeliveryRetryAt(int attemptNumber) {
        long baseDelayMs = Math.max(1, fragmentProperties.getDeliveryRetryDelayMs());
        long maxDelayMs = Math.max(baseDelayMs, fragmentProperties.getDeliveryMaxRetryDelayMs());
        long multiplier = 1L << Math.min(16, Math.max(0, attemptNumber - 1));
        long delayMs = Math.min(maxDelayMs, baseDelayMs * multiplier);
        return OffsetDateTime.now(ZoneOffset.UTC).plusNanos(delayMs * 1_000_000L);
    }

    private long resolveDeliveryLeaseMs() {
        long configuredLeaseMs = Math.max(1L, fragmentProperties.getDeliveryLeaseMs());
        long minimumSafeLeaseMs = Math.max(30_000L, (long) fragmentProperties.getReadTimeoutMs() + 30_000L);
        return Math.max(configuredLeaseMs, minimumSafeLeaseMs);
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

    private record DeliveryCommand(
            long orderId,
            String method,
            String recipient,
            int quantity
    ) {
    }

    private record DeliveryFailureOutcome(
            boolean terminalFailure,
            OffsetDateTime retryAt,
            int attemptNumber
    ) {
        private static DeliveryFailureOutcome ignored() {
            return new DeliveryFailureOutcome(false, null, 0);
        }

        private static DeliveryFailureOutcome retryScheduled(OffsetDateTime retryAt, int attemptNumber) {
            return new DeliveryFailureOutcome(false, retryAt, attemptNumber);
        }

        private static DeliveryFailureOutcome terminalFailure(int attemptNumber) {
            return new DeliveryFailureOutcome(true, null, attemptNumber);
        }
    }
}
