package com.example.telegram_shop_stars.repository;

import com.example.telegram_shop_stars.entity.OrderEntity;
import com.example.telegram_shop_stars.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
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
}
