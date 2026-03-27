package com.example.telegram_shop_stars.controller;

import com.example.telegram_shop_stars.error.ApiProblemException;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        ProblemDetail body = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        body.setTitle(HttpStatus.BAD_REQUEST.toString());
        body.setDetail(resolveValidationDetail(ex));
        body.setProperty("path", request.getRequestURI());
        return body;
    }

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
        if (ex instanceof ApiProblemException apiProblemException) {
            body.setProperty("code", apiProblemException.getCode());
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

    private static String resolveValidationDetail(MethodArgumentNotValidException ex) {
        if (ex.getBindingResult().hasFieldErrors()) {
            var fieldError = ex.getBindingResult().getFieldErrors().getFirst();
            String field = fieldError.getField();
            String message = fieldError.getDefaultMessage();
            if (message != null && !message.isBlank()) {
                return field + ": " + message;
            }
            return field + ": invalid value";
        }

        if (ex.getBindingResult().hasGlobalErrors()) {
            var error = ex.getBindingResult().getGlobalErrors().getFirst();
            String message = error.getDefaultMessage();
            if (message != null && !message.isBlank()) {
                return message;
            }
        }

        return "Request validation failed";
    }
}
