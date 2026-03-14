package com.example.telegram_shop_stars.service.cryptobot;

import tools.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.math.BigDecimal;
import java.net.http.HttpClient;
import java.time.Instant;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class CryptoBotApiClient {

    private static final Logger log = LoggerFactory.getLogger(CryptoBotApiClient.class);

    private final CryptoBotTestnetProperties properties;
    private final RestClient restClient;

    public CryptoBotApiClient(CryptoBotTestnetProperties properties) {
        this.properties = properties;
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(Math.max(1, properties.getConnectTimeoutMs())))
                .build();

        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofMillis(Math.max(1, properties.getReadTimeoutMs())));

        this.restClient = RestClient.builder()
                .baseUrl(properties.getBaseUrl())
                .requestFactory(requestFactory)
                .build();
    }

    public CryptoBotInvoice createInvoice(Map<String, Object> requestPayload) {
        try {
            JsonNode root = restClient.post()
                    .uri("/createInvoice")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("Crypto-Pay-API-Token", tokenOrThrow())
                    .body(requestPayload)
                    .retrieve()
                    .body(JsonNode.class);

            JsonNode resultNode = extractResult(root, "createInvoice");
            return parseInvoice(resultNode);
        } catch (RestClientResponseException ex) {
            throw new CryptoBotApiException(
                    "CryptoBot createInvoice HTTP " + ex.getStatusCode().value()
                            + compactResponseBody(ex.getResponseBodyAsString()),
                    ex
            );
        } catch (RestClientException ex) {
            throw new CryptoBotApiException("CryptoBot createInvoice request failed: " + safeMessage(ex), ex);
        } catch (RuntimeException ex) {
            throw new CryptoBotApiException("CryptoBot createInvoice failed: " + safeMessage(ex), ex);
        }
    }

    public List<CryptoBotInvoice> getInvoices(Collection<Long> invoiceIds) {
        if (invoiceIds == null || invoiceIds.isEmpty()) {
            return List.of();
        }

        String joinedIds = invoiceIds.stream()
                .map(String::valueOf)
                .collect(Collectors.joining(","));

        try {
            JsonNode root = restClient.get()
                    .uri(builder -> builder
                            .path("/getInvoices")
                            .queryParam("invoice_ids", joinedIds)
                            .build())
                    .header("Crypto-Pay-API-Token", tokenOrThrow())
                    .retrieve()
                    .body(JsonNode.class);

            JsonNode resultNode = extractResult(root, "getInvoices");
            JsonNode itemsNode = resultNode.isArray() ? resultNode : resultNode.path("items");
            if (!itemsNode.isArray()) {
                return List.of();
            }

            List<CryptoBotInvoice> invoices = new ArrayList<>();
            for (JsonNode item : itemsNode) {
                try {
                    invoices.add(parseInvoice(item));
                } catch (RuntimeException ex) {
                    log.warn("Skipping malformed invoice in getInvoices response: {}", item, ex);
                }
            }
            return invoices;
        } catch (RestClientResponseException ex) {
            throw new CryptoBotApiException(
                    "CryptoBot getInvoices HTTP " + ex.getStatusCode().value()
                            + compactResponseBody(ex.getResponseBodyAsString()),
                    ex
            );
        } catch (RestClientException ex) {
            throw new CryptoBotApiException("CryptoBot getInvoices request failed: " + safeMessage(ex), ex);
        } catch (RuntimeException ex) {
            throw new CryptoBotApiException("CryptoBot getInvoices failed: " + safeMessage(ex), ex);
        }
    }

    private String tokenOrThrow() {
        String token = properties.getToken();
        if (token == null || token.isBlank()) {
            throw new IllegalStateException("cryptobot.testnet.token is empty");
        }
        return token;
    }

    private static JsonNode extractResult(JsonNode root, String methodName) {
        if (root == null) {
            throw new IllegalStateException("CryptoBot API returned empty body for " + methodName);
        }

        if (!root.path("ok").asBoolean(false)) {
            JsonNode errorNode = root.path("error");
            String message = errorNode.isMissingNode() || errorNode.isNull()
                    ? root.toString()
                    : errorNode.toString();
            throw new IllegalStateException("CryptoBot API error in " + methodName + ": " + message);
        }

        JsonNode resultNode = root.path("result");
        if (resultNode.isMissingNode() || resultNode.isNull()) {
            throw new IllegalStateException("CryptoBot API response has no result in " + methodName);
        }
        return resultNode;
    }

    private static CryptoBotInvoice parseInvoice(JsonNode node) {
        long invoiceId = readLong(node, "invoice_id")
                .orElseThrow(() -> new IllegalStateException("Missing invoice_id in CryptoBot response: " + node));

        return new CryptoBotInvoice(
                invoiceId,
                readText(node, "hash").orElse(null),
                readText(node, "status").orElse(""),
                readText(node, "currency_type").orElse(null),
                readText(node, "asset").orElse(null),
                readText(node, "fiat").orElse(null),
                readDecimal(node, "amount").orElse(BigDecimal.ZERO),
                readInstant(node, "expiration_date", "expires_at").orElse(null),
                readInstant(node, "paid_at").orElse(null),
                readText(node, "bot_invoice_url").orElse(null),
                readText(node, "mini_app_invoice_url").orElse(null),
                readText(node, "web_app_invoice_url").orElse(null),
                node
        );
    }

    private static Optional<String> readText(JsonNode node, String fieldName) {
        JsonNode fieldNode = node.path(fieldName);
        if (fieldNode.isMissingNode() || fieldNode.isNull()) {
            return Optional.empty();
        }

        String value = fieldNode.asText("").trim();
        if (value.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(value);
    }

    private static Optional<Long> readLong(JsonNode node, String fieldName) {
        JsonNode fieldNode = node.path(fieldName);
        if (fieldNode.isMissingNode() || fieldNode.isNull()) {
            return Optional.empty();
        }
        if (fieldNode.isNumber()) {
            return Optional.of(fieldNode.longValue());
        }
        String value = fieldNode.asText("").trim();
        if (value.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(Long.parseLong(value));
    }

    private static Optional<BigDecimal> readDecimal(JsonNode node, String fieldName) {
        JsonNode fieldNode = node.path(fieldName);
        if (fieldNode.isMissingNode() || fieldNode.isNull()) {
            return Optional.empty();
        }
        if (fieldNode.isNumber()) {
            return Optional.of(fieldNode.decimalValue());
        }
        String value = fieldNode.asText("").trim();
        if (value.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(new BigDecimal(value));
    }

    private static Optional<Instant> readInstant(JsonNode node, String... fieldNames) {
        for (String fieldName : fieldNames) {
            JsonNode fieldNode = node.path(fieldName);
            if (fieldNode.isMissingNode() || fieldNode.isNull()) {
                continue;
            }

            if (fieldNode.isNumber()) {
                return Optional.of(Instant.ofEpochSecond(fieldNode.longValue()));
            }

            String raw = fieldNode.asText("").trim();
            if (raw.isEmpty()) {
                continue;
            }

            try {
                long epochSeconds = Long.parseLong(raw);
                return Optional.of(Instant.ofEpochSecond(epochSeconds));
            } catch (NumberFormatException ignored) {
                // Some fields can be returned as ISO-8601 text depending on API version.
            }

            return Optional.of(Instant.parse(raw));
        }
        return Optional.empty();
    }

    private static String compactResponseBody(String rawBody) {
        if (rawBody == null || rawBody.isBlank()) {
            return "";
        }
        String compact = rawBody.replaceAll("\\s+", " ").trim();
        if (compact.length() > 320) {
            compact = compact.substring(0, 320) + "...";
        }
        return ": " + compact;
    }

    private static String safeMessage(Throwable throwable) {
        String message = throwable.getMessage();
        if (message == null || message.isBlank()) {
            return throwable.getClass().getSimpleName();
        }
        return message;
    }
}
