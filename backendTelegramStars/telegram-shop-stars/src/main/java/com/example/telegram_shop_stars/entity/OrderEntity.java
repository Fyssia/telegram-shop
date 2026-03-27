package com.example.telegram_shop_stars.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcType;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.dialect.type.PostgreSQLEnumJdbcType;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "orders")
public class OrderEntity {

    private static final BigDecimal ZERO_MONEY = new BigDecimal("0.000");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private CustomerEntity customer;

    @Column(name = "star_package_id")
    private Long starPackageId;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(name = "status", columnDefinition = "order_status", nullable = false)
    private OrderStatus status;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(name = "source", columnDefinition = "order_source", nullable = false)
    private OrderSource source;

    @Column(name = "idempotency_key", length = 128)
    private String idempotencyKey;

    @Column(name = "stars_amount", nullable = false)
    private Integer starsAmount;

    @Column(name = "unit_price_amount", nullable = false, precision = 14, scale = 4)
    private BigDecimal unitPriceAmount;

    @Column(name = "subtotal_amount", nullable = false, precision = 14, scale = 3)
    private BigDecimal subtotalAmount;

    @Column(name = "discount_amount", nullable = false, precision = 14, scale = 3)
    private BigDecimal discountAmount;

    @Column(name = "total_amount", nullable = false, precision = 14, scale = 3)
    private BigDecimal totalAmount;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "currency", nullable = false, length = 3)
    private String currency;

    @Column(name = "external_reference", length = 128)
    private String externalReference;

    @Column(name = "paid_at")
    private OffsetDateTime paidAt;

    @Column(name = "fulfilled_at")
    private OffsetDateTime fulfilledAt;

    @Column(name = "failed_at")
    private OffsetDateTime failedAt;

    @Column(name = "cancelled_at")
    private OffsetDateTime cancelledAt;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime updatedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "balance_reservation_status", nullable = false, length = 16)
    private BalanceReservationStatus balanceReservationStatus = BalanceReservationStatus.none;

    @Column(name = "balance_reserved_amount", nullable = false, precision = 14, scale = 3)
    private BigDecimal balanceReservedAmount = ZERO_MONEY;

    @Column(name = "balance_reserved_at")
    private OffsetDateTime balanceReservedAt;

    @Column(name = "balance_released_at")
    private OffsetDateTime balanceReleasedAt;

    @Column(name = "balance_consumed_at")
    private OffsetDateTime balanceConsumedAt;

    @Column(name = "fulfillment_attempts", nullable = false)
    private Integer fulfillmentAttempts = 0;

    @PrePersist
    void applyDefaults() {
        if (balanceReservationStatus == null) {
            balanceReservationStatus = BalanceReservationStatus.none;
        }
        if (balanceReservedAmount == null) {
            balanceReservedAmount = ZERO_MONEY;
        }
        if (fulfillmentAttempts == null) {
            fulfillmentAttempts = 0;
        }
    }

    @Column(name = "next_fulfillment_attempt_at")
    private OffsetDateTime nextFulfillmentAttemptAt;

    public Long getId() {
        return id;
    }

    public CustomerEntity getCustomer() {
        return customer;
    }

    public void setCustomer(CustomerEntity customer) {
        this.customer = customer;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public OrderSource getSource() {
        return source;
    }

    public void setSource(OrderSource source) {
        this.source = source;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public Integer getStarsAmount() {
        return starsAmount;
    }

    public void setStarsAmount(Integer starsAmount) {
        this.starsAmount = starsAmount;
    }

    public BigDecimal getUnitPriceAmount() {
        return unitPriceAmount;
    }

    public void setUnitPriceAmount(BigDecimal unitPriceAmount) {
        this.unitPriceAmount = unitPriceAmount;
    }

    public BigDecimal getSubtotalAmount() {
        return subtotalAmount;
    }

    public void setSubtotalAmount(BigDecimal subtotalAmount) {
        this.subtotalAmount = subtotalAmount;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getExternalReference() {
        return externalReference;
    }

    public void setExternalReference(String externalReference) {
        this.externalReference = externalReference;
    }

    public OffsetDateTime getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(OffsetDateTime paidAt) {
        this.paidAt = paidAt;
    }

    public OffsetDateTime getFailedAt() {
        return failedAt;
    }

    public OffsetDateTime getFulfilledAt() {
        return fulfilledAt;
    }

    public void setFulfilledAt(OffsetDateTime fulfilledAt) {
        this.fulfilledAt = fulfilledAt;
    }

    public void setFailedAt(OffsetDateTime failedAt) {
        this.failedAt = failedAt;
    }

    public OffsetDateTime getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(OffsetDateTime cancelledAt) {
        this.cancelledAt = cancelledAt;
    }

    public BalanceReservationStatus getBalanceReservationStatus() {
        return balanceReservationStatus;
    }

    public void setBalanceReservationStatus(BalanceReservationStatus balanceReservationStatus) {
        this.balanceReservationStatus = balanceReservationStatus;
    }

    public BigDecimal getBalanceReservedAmount() {
        return balanceReservedAmount;
    }

    public void setBalanceReservedAmount(BigDecimal balanceReservedAmount) {
        this.balanceReservedAmount = balanceReservedAmount;
    }

    public OffsetDateTime getBalanceReservedAt() {
        return balanceReservedAt;
    }

    public void setBalanceReservedAt(OffsetDateTime balanceReservedAt) {
        this.balanceReservedAt = balanceReservedAt;
    }

    public OffsetDateTime getBalanceReleasedAt() {
        return balanceReleasedAt;
    }

    public void setBalanceReleasedAt(OffsetDateTime balanceReleasedAt) {
        this.balanceReleasedAt = balanceReleasedAt;
    }

    public OffsetDateTime getBalanceConsumedAt() {
        return balanceConsumedAt;
    }

    public void setBalanceConsumedAt(OffsetDateTime balanceConsumedAt) {
        this.balanceConsumedAt = balanceConsumedAt;
    }

    public Integer getFulfillmentAttempts() {
        return fulfillmentAttempts;
    }

    public void setFulfillmentAttempts(Integer fulfillmentAttempts) {
        this.fulfillmentAttempts = fulfillmentAttempts;
    }

    public OffsetDateTime getNextFulfillmentAttemptAt() {
        return nextFulfillmentAttemptAt;
    }

    public void setNextFulfillmentAttemptAt(OffsetDateTime nextFulfillmentAttemptAt) {
        this.nextFulfillmentAttemptAt = nextFulfillmentAttemptAt;
    }
}
