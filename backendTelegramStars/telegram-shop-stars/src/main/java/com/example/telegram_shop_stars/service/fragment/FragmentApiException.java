package com.example.telegram_shop_stars.service.fragment;

public class FragmentApiException extends RuntimeException {

    public FragmentApiException(String message, Throwable cause) {
        super(message, cause);
    }

    public FragmentApiException(String message) {
        super(message);
    }
}
