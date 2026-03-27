package com.example.telegram_shop_stars.repository;

import com.example.telegram_shop_stars.entity.ServiceBalanceStateEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ServiceBalanceStateRepository extends JpaRepository<ServiceBalanceStateEntity, Short> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from ServiceBalanceStateEntity s where s.id = :id")
    Optional<ServiceBalanceStateEntity> findByIdForUpdate(@Param("id") Short id);
}
