package com.example.telegram_shop_stars.service;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "tg.tdlib")
public record TdlibProps(
        int apiId,
        String apiHash,
        String sessionDir
) {}
