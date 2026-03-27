package com.example.telegram_shop_stars.service.balance;

import com.example.telegram_shop_stars.entity.BalanceReservationStatus;
import com.example.telegram_shop_stars.entity.OrderEntity;
import com.example.telegram_shop_stars.entity.OrderStatus;
import com.example.telegram_shop_stars.entity.OrderStatusHistoryEntity;
import com.example.telegram_shop_stars.entity.PaymentStatus;
import com.example.telegram_shop_stars.repository.OrderRepository;
import com.example.telegram_shop_stars.repository.OrderStatusHistoryRepository;
import com.example.telegram_shop_stars.repository.PaymentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Set;

@Component
public class OrderReservationCleanupScheduler {

    private static final Logger log = LoggerFactory.getLogger(OrderReservationCleanupScheduler.class);
    private static final List<OrderStatus> STALE_ORDER_STATUSES = List.of(
            OrderStatus.created,
            OrderStatus.pending_payment
    );
    private static final Set<PaymentStatus> INACTIVE_PAYMENT_STATUSES = Set.of(
            PaymentStatus.failed,
            PaymentStatus.cancelled,
            PaymentStatus.expired,
            PaymentStatus.refunded,
            PaymentStatus.partially_refunded
    );

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final BalanceReservationService balanceReservationService;
    private final BalanceApiProperties properties;
    private final TransactionTemplate txTemplate;

    public OrderReservationCleanupScheduler(OrderRepository orderRepository,
                                            PaymentRepository paymentRepository,
                                            OrderStatusHistoryRepository orderStatusHistoryRepository,
                                            BalanceReservationService balanceReservationService,
                                            BalanceApiProperties properties,
                                            PlatformTransactionManager transactionManager) {
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.orderStatusHistoryRepository = orderStatusHistoryRepository;
        this.balanceReservationService = balanceReservationService;
        this.properties = properties;
        this.txTemplate = new TransactionTemplate(transactionManager);
    }

    @Scheduled(fixedDelayString = "${balance.cleanup-delay-ms:60000}")
    public void expireStaleReservations() {
        long ttlMs = properties.getUnpaidReservationTtlMs();
        if (ttlMs <= 0) {
            return;
        }

        OffsetDateTime createdBefore = OffsetDateTime.now(ZoneOffset.UTC).minus(Duration.ofMillis(ttlMs));
        List<Long> staleOrderIds = orderRepository.findIdsWithBalanceReservationStateBefore(
                STALE_ORDER_STATUSES,
                BalanceReservationStatus.reserved,
                createdBefore,
                PageRequest.of(0, Math.max(1, properties.getCleanupBatchSize()))
        );
        if (staleOrderIds.isEmpty()) {
            return;
        }

        int expiredOrders = 0;
        for (Long orderId : staleOrderIds) {
            Boolean expired = txTemplate.execute(status -> expireStaleOrderIfNeeded(orderId));
            if (Boolean.TRUE.equals(expired)) {
                expiredOrders++;
            }
        }

        if (expiredOrders > 0) {
            log.warn("Expired {} stale reserved orders to release blocked service balance", expiredOrders);
        }
    }

    private Boolean expireStaleOrderIfNeeded(long orderId) {
        OrderEntity order = orderRepository.findByIdForUpdate(orderId).orElse(null);
        if (order == null) {
            return false;
        }

        OrderStatus currentStatus = order.getStatus();
        if (currentStatus != OrderStatus.created && currentStatus != OrderStatus.pending_payment) {
            return false;
        }
        if (order.getBalanceReservationStatus() != BalanceReservationStatus.reserved) {
            return false;
        }
        if (paymentRepository.existsActivePaymentForOrder(orderId, INACTIVE_PAYMENT_STATUSES)) {
            return false;
        }

        order.setStatus(OrderStatus.expired);
        order.setNextFulfillmentAttemptAt(null);
        orderRepository.save(order);

        OrderStatusHistoryEntity history = new OrderStatusHistoryEntity();
        history.setOrder(order);
        history.setOldStatus(currentStatus);
        history.setNewStatus(OrderStatus.expired);
        history.setChangeReason("stale unpaid reservation expired by cleanup");
        history.setChangedBy("system");
        orderStatusHistoryRepository.save(history);

        balanceReservationService.applyReservationSideEffects(order, currentStatus, OrderStatus.expired);
        log.info("Expired stale reserved orderId={} from status={}", orderId, currentStatus);
        return true;
    }
}
