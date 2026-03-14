package com.example.telegram_shop_stars.repository;

import com.example.telegram_shop_stars.entity.CustomerEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CustomerRepository extends JpaRepository<CustomerEntity, Long> {

    Optional<CustomerEntity> findByTelegramUserId(Long telegramUserId);
}
