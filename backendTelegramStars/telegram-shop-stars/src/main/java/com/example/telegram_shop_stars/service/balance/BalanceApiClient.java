package com.example.telegram_shop_stars.service.balance;

import com.example.telegram_shop_stars.error.ApiProblemException;
import com.example.telegram_shop_stars.service.pricing.OrderPricing;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.Set;

@Component
public class BalanceApiClient {

    private static final Logger log = LoggerFactory.getLogger(BalanceApiClient.class);
    private static final String INSUFFICIENT_BALANCE_DETAIL =
            "This order can’t be created right now because the service balance is insufficient. Please try again later.";
    private static final String BALANCE_CHECK_UNAVAILABLE_DETAIL =
            "Couldn’t verify available balance right now. Please try again.";
    private static final Set<Integer> RETRYABLE_HTTP_STATUSES = Set.of(408, 425, 429, 500, 502, 503, 504);

    private final BalanceApiProperties properties;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    @Autowired
    public BalanceApiClient(BalanceApiProperties properties) {
        this(
                properties,
                HttpClient.newBuilder()
                        .connectTimeout(Duration.ofMillis(Math.max(1, properties.getConnectTimeoutMs())))
                        .build(),
                new ObjectMapper()
        );
    }

    BalanceApiClient(BalanceApiProperties properties, HttpClient httpClient, ObjectMapper objectMapper) {
        this.properties = properties;
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
    }

    public void assertEnough(BigDecimal cost) {
        BigDecimal normalizedCost = OrderPricing.normalizeMoney(cost);
        if (normalizedCost.signum() <= 0) {
            throw new ApiProblemException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_COST",
                    "cost must be a positive number"
            );
        }

        boolean enough = checkEnoughWithRetries(normalizedCost);
        if (!enough) {
            throw new ApiProblemException(
                    HttpStatus.CONFLICT,
                    "INSUFFICIENT_BALANCE",
                    INSUFFICIENT_BALANCE_DETAIL
            );
        }
    }

    private boolean checkEnoughWithRetries(BigDecimal normalizedCost) {
        int maxAttempts = Math.max(1, properties.getMaxAttempts());

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return checkEnoughOnce(normalizedCost);
            } catch (RetryableBalanceCheckException ex) {
                if (attempt >= maxAttempts) {
                    log.warn(
                            "Balance check attempt {}/{} failed for cost {} with code={}; giving up",
                            attempt,
                            maxAttempts,
                            normalizedCost,
                            ex.problem().getCode()
                    );
                    throw ex.problem();
                }

                int retryBackoffMs = Math.max(0, properties.getRetryBackoffMs());
                log.warn(
                        "Balance check attempt {}/{} failed for cost {} with code={}; retrying in {} ms",
                        attempt,
                        maxAttempts,
                        normalizedCost,
                        ex.problem().getCode(),
                        retryBackoffMs
                );
                pauseBeforeRetry(retryBackoffMs);
            }
        }

        throw new ApiProblemException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "BALANCE_UPSTREAM_UNAVAILABLE",
                BALANCE_CHECK_UNAVAILABLE_DETAIL
        );
    }

    private boolean checkEnoughOnce(BigDecimal normalizedCost) {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(properties.getLocalApiUrl()))
                .timeout(Duration.ofMillis(Math.max(1, properties.getReadTimeoutMs())))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(
                        writeJson(Map.of("cost", normalizedCost)),
                        StandardCharsets.UTF_8
                ))
                .build();

        HttpResponse<String> response;
        try {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new ApiProblemException(
                    HttpStatus.GATEWAY_TIMEOUT,
                    "BALANCE_UPSTREAM_TIMEOUT",
                    BALANCE_CHECK_UNAVAILABLE_DETAIL
            );
        } catch (IOException ex) {
            throw retryable(new ApiProblemException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "BALANCE_UPSTREAM_UNAVAILABLE",
                    BALANCE_CHECK_UNAVAILABLE_DETAIL
            ));
        }

        int statusCode = response.statusCode();
        if (statusCode < 200 || statusCode >= 300) {
            ApiProblemException problem = new ApiProblemException(
                    HttpStatus.BAD_GATEWAY,
                    "BALANCE_UPSTREAM_ERROR",
                    BALANCE_CHECK_UNAVAILABLE_DETAIL
            );
            if (RETRYABLE_HTTP_STATUSES.contains(statusCode)) {
                throw retryable(problem);
            }
            throw problem;
        }

        JsonNode root = readJson(response.body());
        JsonNode enoughNode = root.path("enough");
        if (!enoughNode.isBoolean()) {
            throw new ApiProblemException(
                    HttpStatus.BAD_GATEWAY,
                    "BALANCE_UPSTREAM_INVALID",
                    BALANCE_CHECK_UNAVAILABLE_DETAIL
            );
        }

        return enoughNode.booleanValue();
    }

    private String writeJson(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (RuntimeException ex) {
            throw new ApiProblemException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "BALANCE_REQUEST_SERIALIZATION_ERROR",
                    "Failed to serialize balance check request"
            );
        }
    }

    private JsonNode readJson(String rawBody) {
        try {
            JsonNode root = objectMapper.readTree(rawBody == null ? "" : rawBody);
            if (root == null || !root.isObject()) {
                throw new ApiProblemException(
                        HttpStatus.BAD_GATEWAY,
                        "BALANCE_UPSTREAM_INVALID",
                        BALANCE_CHECK_UNAVAILABLE_DETAIL
                );
            }
            return root;
        } catch (RuntimeException ex) {
            throw new ApiProblemException(
                    HttpStatus.BAD_GATEWAY,
                    "BALANCE_UPSTREAM_INVALID",
                    BALANCE_CHECK_UNAVAILABLE_DETAIL
            );
        }
    }

    private void pauseBeforeRetry(int retryBackoffMs) {
        if (retryBackoffMs <= 0) {
            return;
        }

        try {
            Thread.sleep(retryBackoffMs);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new ApiProblemException(
                    HttpStatus.GATEWAY_TIMEOUT,
                    "BALANCE_UPSTREAM_TIMEOUT",
                    BALANCE_CHECK_UNAVAILABLE_DETAIL
            );
        }
    }

    private static RetryableBalanceCheckException retryable(ApiProblemException problem) {
        return new RetryableBalanceCheckException(problem);
    }

    private static final class RetryableBalanceCheckException extends RuntimeException {

        private final ApiProblemException problem;

        private RetryableBalanceCheckException(ApiProblemException problem) {
            super(problem.getReason(), problem);
            this.problem = problem;
        }

        private ApiProblemException problem() {
            return problem;
        }
    }
}
