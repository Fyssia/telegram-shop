package com.example.telegram_shop_stars.error;

import org.springframework.http.HttpStatusCode;
import org.springframework.web.server.ResponseStatusException;

public class ApiProblemException extends ResponseStatusException {

    private final String code;

    public ApiProblemException(HttpStatusCode status, String code, String detail) {
        super(status, detail);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
