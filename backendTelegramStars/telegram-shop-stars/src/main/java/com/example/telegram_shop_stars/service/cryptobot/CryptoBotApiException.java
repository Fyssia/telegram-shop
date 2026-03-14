package com.example.telegram_shop_stars.service.cryptobot;

public class CryptoBotApiException extends RuntimeException {

    public CryptoBotApiException(String message, Throwable cause) {
        super(message, cause);
    }

    public CryptoBotApiException(String message) {
        super(message);
    }
}
