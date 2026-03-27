package com.example.telegram_shop_stars.repository;

import com.example.telegram_shop_stars.entity.BalanceReservationStatus;
import com.example.telegram_shop_stars.entity.OrderEntity;
import com.example.telegram_shop_stars.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<OrderEntity, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from OrderEntity o where o.id = :id")
    Optional<OrderEntity> findByIdForUpdate(@Param("id") Long id);

    @Query("""
            select o from OrderEntity o
            where o.customer.id = :customerId
              and o.idempotencyKey = :idempotencyKey
            """)
    Optional<OrderEntity> findByCustomerIdAndIdempotencyKey(@Param("customerId") Long customerId,
                                                            @Param("idempotencyKey") String idempotencyKey);

    @Query("select o.id from OrderEntity o where o.status = :status order by o.id asc")
    List<Long> findIdsByStatus(@Param("status") OrderStatus status, Pageable pageable);

    @Query("""
            select o.id from OrderEntity o
            where o.status = :status
              and (o.nextFulfillmentAttemptAt is null or o.nextFulfillmentAttemptAt <= CURRENT_TIMESTAMP)
            order by coalesce(o.nextFulfillmentAttemptAt, o.paidAt, o.createdAt) asc, o.id asc
            """)
    List<Long> findIdsReadyForFulfillment(@Param("status") OrderStatus status, Pageable pageable);

    @Query("""
            select o.id from OrderEntity o
            where o.status in :statuses
              and (o.nextFulfillmentAttemptAt is null or o.nextFulfillmentAttemptAt <= CURRENT_TIMESTAMP)
            order by coalesce(o.nextFulfillmentAttemptAt, o.paidAt, o.createdAt) asc, o.id asc
            """)
    List<Long> findIdsReadyForFulfillment(@Param("statuses") Collection<OrderStatus> statuses, Pageable pageable);

    @Query("""
            select o.id from OrderEntity o
            where o.status in :statuses
              and o.balanceReservationStatus = :reservationStatus
              and o.createdAt <= :createdBefore
            order by o.createdAt asc, o.id asc
            """)
    List<Long> findIdsWithBalanceReservationStateBefore(@Param("statuses") Collection<OrderStatus> statuses,
                                                        @Param("reservationStatus") BalanceReservationStatus reservationStatus,
                                                        @Param("createdBefore") OffsetDateTime createdBefore,
                                                        Pageable pageable);
}
