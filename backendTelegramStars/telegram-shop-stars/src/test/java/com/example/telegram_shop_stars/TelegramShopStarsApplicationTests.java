package com.example.telegram_shop_stars;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TelegramShopStarsApplicationTests {

    @Test
    void shouldExposeApplicationEntryPoint() {
        assertThat(TelegramShopStarsApplication.class).isNotNull();
    }
}
