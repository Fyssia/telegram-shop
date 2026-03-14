package com.example.telegram_shop_stars.service.fragment;

import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class FragmentApiClient {

    private final FragmentApiProperties properties;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public FragmentApiClient(FragmentApiProperties properties) {
        this.properties = properties;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(Math.max(1, properties.getConnectTimeoutMs())))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public boolean isEnabled() {
        return properties.isEnabled();
    }

    public void buyStars(String recipient, int quantity, String idempotencyKey) {
        sendRequest("buyStars", recipient, quantity, idempotencyKey);
    }

    public void giftPremium(String recipient, int quantity, String idempotencyKey) {
        sendRequest("giftPremium", recipient, quantity, idempotencyKey);
    }

    private void sendRequest(String methodName, String recipient, int quantity, String idempotencyKey) {
        Map<String, Object> requestPayload = new LinkedHashMap<>();
        requestPayload.put("method", methodName);
        requestPayload.put("recipient", recipient);
        requestPayload.put("quantity", quantity);

        String requestBody = writeJson(requestPayload);

        HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                .uri(URI.create(properties.getLocalApiUrl()))
                .timeout(Duration.ofMillis(Math.max(1, properties.getReadTimeoutMs())))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json");

        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            requestBuilder.header("Idempotency-Key", idempotencyKey);
        }

        HttpRequest request = requestBuilder
                .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response;
        try {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new FragmentApiException("Fragment " + methodName + " request interrupted", ex);
        } catch (IOException ex) {
            throw new FragmentApiException("Fragment " + methodName + " request failed: " + safeMessage(ex), ex);
        } catch (RuntimeException ex) {
            if (ex instanceof FragmentApiException) {
                throw ex;
            }
            throw new FragmentApiException("Fragment " + methodName + " failed: " + safeMessage(ex), ex);
        }

        parseResponse(methodName, response.statusCode(), response.body());
    }

    private void parseResponse(String methodName, int httpStatus, String rawBody) {
        JsonNode root = readJson(methodName, rawBody, httpStatus);
        String status = readText(root, "status");
        String error = readText(root, "error");

        if ("CONFIRMED".equalsIgnoreCase(status)) {
            return;
        }
        if ("FAILED".equalsIgnoreCase(status)) {
            throw new FragmentApiException(
                    "Fragment " + methodName + " FAILED (HTTP " + httpStatus + "): " + coalesce(error, "unknown failure")
            );
        }

        throw new FragmentApiException(
                "Fragment " + methodName + " returned unexpected response (HTTP "
                        + httpStatus + "): " + compactBody(rawBody)
        );
    }

    private JsonNode readJson(String methodName, String rawBody, int httpStatus) {
        try {
            JsonNode root = objectMapper.readTree(rawBody == null ? "" : rawBody);
            if (root == null || !root.isObject()) {
                throw new FragmentApiException(
                        "Fragment " + methodName + " returned non-object JSON (HTTP "
                                + httpStatus + "): " + compactBody(rawBody)
                );
            }
            return root;
        } catch (RuntimeException ex) {
            throw new FragmentApiException(
                    "Fragment " + methodName + " returned invalid JSON (HTTP "
                            + httpStatus + "): " + compactBody(rawBody),
                    ex
            );
        }
    }

    private String writeJson(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (RuntimeException ex) {
            throw new FragmentApiException("Failed to serialize Fragment request payload", ex);
        }
    }

    private static String readText(JsonNode node, String fieldName) {
        if (node == null) {
            return "";
        }
        JsonNode fieldNode = node.path(fieldName);
        if (fieldNode.isMissingNode() || fieldNode.isNull()) {
            return "";
        }
        return fieldNode.asText("").trim();
    }

    private static String compactBody(String rawBody) {
        if (rawBody == null || rawBody.isBlank()) {
            return "";
        }
        String compact = rawBody.replaceAll("\\s+", " ").trim();
        if (compact.length() > 320) {
            compact = compact.substring(0, 320) + "...";
        }
        return compact;
    }

    private static String safeMessage(Throwable throwable) {
        String message = throwable.getMessage();
        if (message == null || message.isBlank()) {
            return throwable.getClass().getSimpleName();
        }
        return message;
    }

    private static String coalesce(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value;
    }
}
