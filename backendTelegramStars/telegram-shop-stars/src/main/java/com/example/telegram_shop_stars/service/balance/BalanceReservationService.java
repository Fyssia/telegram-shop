package com.example.telegram_shop_stars.service.balance;

import com.example.telegram_shop_stars.entity.BalanceReservationStatus;
import com.example.telegram_shop_stars.entity.OrderEntity;
import com.example.telegram_shop_stars.entity.OrderStatus;
import com.example.telegram_shop_stars.entity.ServiceBalanceStateEntity;
import com.example.telegram_shop_stars.error.ApiProblemException;
import com.example.telegram_shop_stars.repository.OrderRepository;
import com.example.telegram_shop_stars.repository.ServiceBalanceStateRepository;
import com.example.telegram_shop_stars.service.pricing.OrderPricing;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Service
public class BalanceReservationService {

    private static final Logger log = LoggerFactory.getLogger(BalanceReservationService.class);
    private static final short STATE_ROW_ID = 1;

    private final OrderRepository orderRepository;
    private final ServiceBalanceStateRepository serviceBalanceStateRepository;
    private final BalanceApiClient balanceApiClient;
    private final BalanceApiProperties properties;
    private final TransactionTemplate txTemplate;

    public BalanceReservationService(OrderRepository orderRepository,
                                     ServiceBalanceStateRepository serviceBalanceStateRepository,
                                     BalanceApiClient balanceApiClient,
                                     BalanceApiProperties properties,
                                     PlatformTransactionManager transactionManager) {
        this.orderRepository = orderRepository;
        this.serviceBalanceStateRepository = serviceBalanceStateRepository;
        this.balanceApiClient = balanceApiClient;
        this.properties = properties;
        this.txTemplate = new TransactionTemplate(transactionManager);
    }

    public void reserveForOrder(long orderId, BigDecimal amount) {
        BigDecimal normalizedAmount = OrderPricing.normalizeMoney(amount);
        if (normalizedAmount.signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reservation amount must be positive");
        }

        int maxRetries = Math.max(1, properties.getReservationMaxRetries());
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            ReservationSnapshot snapshot = txTemplate.execute(status -> loadSnapshot(orderId));
            if (snapshot == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order " + orderId + " not found");
            }
            if (snapshot.alreadyReserved()) {
                return;
            }
            if (!snapshot.canReserve()) {
                throw new ApiProblemException(
                        HttpStatus.CONFLICT,
                        "BALANCE_RESERVATION_INVALID_STATE",
                        "Order cannot reserve service balance in its current state"
                );
            }

            BigDecimal proposedReservedTotal = snapshot.currentReservedTotal().add(normalizedAmount);
            balanceApiClient.assertEnough(proposedReservedTotal);

            Boolean applied = txTemplate.execute(status -> tryApplyReservation(orderId, normalizedAmount, snapshot.currentReservedTotal()));
            if (Boolean.TRUE.equals(applied)) {
                return;
            }
        }

        throw new ApiProblemException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "BALANCE_RESERVATION_CONTENTION",
                "Couldn’t reserve service balance right now. Please try again."
        );
    }

    public void applyReservationSideEffects(OrderEntity order, OrderStatus previousStatus, OrderStatus targetStatus) {
        if (order == null || targetStatus == null || previousStatus == targetStatus) {
            return;
        }

        if (targetStatus == OrderStatus.fulfilled) {
            consumeReservation(order);
            return;
        }

        if (targetStatus == OrderStatus.cancelled
                || targetStatus == OrderStatus.failed
                || targetStatus == OrderStatus.expired
                || targetStatus == OrderStatus.refunded) {
            releaseReservation(order);
        }
    }

    public boolean hasActiveReservation(OrderEntity order) {
        return resolveReservationStatus(order) == BalanceReservationStatus.reserved;
    }

    private ReservationSnapshot loadSnapshot(long orderId) {
        OrderEntity order = orderRepository.findByIdForUpdate(orderId).orElse(null);
        if (order == null) {
            return null;
        }

        BalanceReservationStatus reservationStatus = resolveReservationStatus(order);
        ServiceBalanceStateEntity state = loadStateForUpdate();
        BigDecimal currentReservedTotal = normalizeStateAmount(state.getReservedAmount());

        return new ReservationSnapshot(
                reservationStatus == BalanceReservationStatus.reserved || reservationStatus == BalanceReservationStatus.consumed,
                reservationStatus == BalanceReservationStatus.none,
                currentReservedTotal
        );
    }

    private boolean tryApplyReservation(long orderId, BigDecimal reservationAmount, BigDecimal expectedReservedTotal) {
        OrderEntity order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order " + orderId + " not found"));

        BalanceReservationStatus reservationStatus = resolveReservationStatus(order);
        if (reservationStatus == BalanceReservationStatus.reserved || reservationStatus == BalanceReservationStatus.consumed) {
            return true;
        }
        if (reservationStatus != BalanceReservationStatus.none) {
            throw new ApiProblemException(
                    HttpStatus.CONFLICT,
                    "BALANCE_RESERVATION_INVALID_STATE",
                    "Order reservation can’t be created in its current state"
            );
        }

        ServiceBalanceStateEntity state = loadStateForUpdate();
        BigDecimal currentReservedTotal = normalizeStateAmount(state.getReservedAmount());
        if (currentReservedTotal.compareTo(expectedReservedTotal) != 0) {
            return false;
        }

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        state.setReservedAmount(currentReservedTotal.add(reservationAmount));
        serviceBalanceStateRepository.save(state);

        order.setBalanceReservationStatus(BalanceReservationStatus.reserved);
        order.setBalanceReservedAmount(reservationAmount);
        order.setBalanceReservedAt(now);
        order.setBalanceReleasedAt(null);
        order.setBalanceConsumedAt(null);
        orderRepository.save(order);

        log.info(
                "Reserved service balance amount={} for orderId={}, reservedTotal={}",
                reservationAmount,
                orderId,
                state.getReservedAmount()
        );
        return true;
    }

    private void releaseReservation(OrderEntity order) {
        if (resolveReservationStatus(order) != BalanceReservationStatus.reserved) {
            return;
        }

        BigDecimal reservationAmount = normalizeOrderAmount(order.getBalanceReservedAmount());
        ServiceBalanceStateEntity state = loadStateForUpdate();
        state.setReservedAmount(subtractReservedAmount(state.getReservedAmount(), reservationAmount));
        serviceBalanceStateRepository.save(state);

        order.setBalanceReservationStatus(BalanceReservationStatus.released);
        order.setBalanceReleasedAt(OffsetDateTime.now(ZoneOffset.UTC));
        orderRepository.save(order);
    }

    private void consumeReservation(OrderEntity order) {
        if (resolveReservationStatus(order) != BalanceReservationStatus.reserved) {
            return;
        }

        BigDecimal reservationAmount = normalizeOrderAmount(order.getBalanceReservedAmount());
        ServiceBalanceStateEntity state = loadStateForUpdate();
        state.setReservedAmount(subtractReservedAmount(state.getReservedAmount(), reservationAmount));
        serviceBalanceStateRepository.save(state);

        order.setBalanceReservationStatus(BalanceReservationStatus.consumed);
        order.setBalanceConsumedAt(OffsetDateTime.now(ZoneOffset.UTC));
        orderRepository.save(order);
    }

    private ServiceBalanceStateEntity loadStateForUpdate() {
        ServiceBalanceStateEntity existing = serviceBalanceStateRepository.findByIdForUpdate(STATE_ROW_ID).orElse(null);
        if (existing != null) {
            if (existing.getReservedAmount() == null) {
                existing.setReservedAmount(OrderPricing.zeroMoney());
            }
            return existing;
        }

        ServiceBalanceStateEntity created = new ServiceBalanceStateEntity();
        created.setId(STATE_ROW_ID);
        created.setReservedAmount(OrderPricing.zeroMoney());
        serviceBalanceStateRepository.saveAndFlush(created);
        return serviceBalanceStateRepository.findByIdForUpdate(STATE_ROW_ID)
                .orElseThrow(() -> new IllegalStateException("service_balance_state row is missing"));
    }

    private static BigDecimal normalizeStateAmount(BigDecimal amount) {
        return amount == null ? OrderPricing.zeroMoney() : OrderPricing.normalizeMoney(amount);
    }

    private static BigDecimal normalizeOrderAmount(BigDecimal amount) {
        if (amount == null) {
            return OrderPricing.zeroMoney();
        }
        return OrderPricing.normalizeMoney(amount);
    }

    private static BigDecimal subtractReservedAmount(BigDecimal currentReservedAmount, BigDecimal subtractionAmount) {
        BigDecimal normalizedCurrent = normalizeStateAmount(currentReservedAmount);
        BigDecimal normalizedSubtraction = normalizeOrderAmount(subtractionAmount);
        BigDecimal updated = normalizedCurrent.subtract(normalizedSubtraction);
        if (updated.signum() < 0) {
            updated = OrderPricing.zeroMoney();
        }
        return OrderPricing.normalizeMoney(updated);
    }

    private static BalanceReservationStatus resolveReservationStatus(OrderEntity order) {
        BalanceReservationStatus status = order.getBalanceReservationStatus();
        return status == null ? BalanceReservationStatus.none : status;
    }

    private record ReservationSnapshot(
            boolean alreadyReserved,
            boolean canReserve,
            BigDecimal currentReservedTotal
    ) {
    }
}
