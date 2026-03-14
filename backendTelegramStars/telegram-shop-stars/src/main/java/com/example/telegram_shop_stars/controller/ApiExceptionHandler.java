package com.example.telegram_shop_stars.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(ResponseStatusException.class)
    public ProblemDetail handleResponseStatus(ResponseStatusException ex, HttpServletRequest request) {
        ProblemDetail body = ProblemDetail.forStatus(ex.getStatusCode());
        body.setTitle(ex.getStatusCode().toString());
        if (ex.getStatusCode().is5xxServerError()) {
            body.setDetail("Internal server error");
            log.error("API 5xx on path {}: {}", request.getRequestURI(), resolveDetail(ex), ex);
        } else {
            body.setDetail(resolveDetail(ex));
        }
        body.setProperty("path", request.getRequestURI());
        return body;
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleUnhandled(Exception ex, HttpServletRequest request) {
        log.error("Unhandled API exception on path {}", request.getRequestURI(), ex);

        ProblemDetail body = ProblemDetail.forStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        body.setTitle(HttpStatus.INTERNAL_SERVER_ERROR.toString());
        body.setDetail("Internal server error");
        body.setProperty("path", request.getRequestURI());
        return body;
    }

    private static String resolveDetail(ResponseStatusException ex) {
        String reason = ex.getReason();
        if (reason != null && !reason.isBlank()) {
            return reason;
        }

        String message = ex.getMessage();
        if (message != null && !message.isBlank()) {
            return message;
        }

        return ex.getStatusCode().toString();
    }
}
