package com.example.telegram_shop_stars.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UsernameCheckRequest(
        @NotBlank
        @Size(max = 64)
        String username,
        Boolean checkPremium
) {
    public boolean isPremiumCheckRequested() {
        return Boolean.TRUE.equals(checkPremium);
    }
}
