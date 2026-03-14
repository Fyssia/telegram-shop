package com.example.telegram_shop_stars.repository;

import com.example.telegram_shop_stars.entity.PaymentEntity;
import com.example.telegram_shop_stars.entity.PaymentStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<PaymentEntity, Long> {

    Optional<PaymentEntity> findByProviderAndProviderPaymentId(String provider, String providerPaymentId);

    Optional<PaymentEntity> findByProviderAndProviderTxHash(String provider, String providerTxHash);

    @Query("""
            select p from PaymentEntity p
            where p.order.id = :orderId
              and p.provider = :provider
            order by p.createdAt desc, p.id desc
            """)
    List<PaymentEntity> findLatestByOrderIdAndProvider(@Param("orderId") Long orderId,
                                                        @Param("provider") String provider,
                                                        Pageable pageable);

    @Query("""
            select p from PaymentEntity p
            where p.provider = :provider
              and p.status in :statuses
            order by p.createdAt asc, p.id asc
            """)
    List<PaymentEntity> findForPolling(@Param("provider") String provider,
                                       @Param("statuses") Collection<PaymentStatus> statuses,
                                       Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select p from PaymentEntity p
            join fetch p.order o
            where p.id = :id
            """)
    Optional<PaymentEntity> findByIdForUpdate(@Param("id") Long id);
}
