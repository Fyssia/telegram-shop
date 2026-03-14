package com.example.telegram_shop_stars.dto;

public record UsernameCheckResponse(
        boolean ok,
        String status,
        String normalizedUsername,
        String displayName,
        String avatarUrl
) {
    public static UsernameCheckResponse invalid(String u) {
        return new UsernameCheckResponse(false, "INVALID", u, null, null);
    }
    public static UsernameCheckResponse notFound(String u) {
        return new UsernameCheckResponse(true, "NOT_FOUND", u, null, null);
    }
    public static UsernameCheckResponse bot(String u, String name, String avatarUrl) {
        return new UsernameCheckResponse(true, "BOT", u, name, avatarUrl);
    }
    public static UsernameCheckResponse user(String u, String name, String avatarUrl) {
        return new UsernameCheckResponse(true, "USER", u, name, avatarUrl);
    }
    public static UsernameCheckResponse channelOrGroup(String u) {
        return new UsernameCheckResponse(true, "NOT_A_USER", u, null, null);
    }
}
