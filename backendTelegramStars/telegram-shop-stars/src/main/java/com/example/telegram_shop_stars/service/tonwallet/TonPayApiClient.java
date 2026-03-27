package com.example.telegram_shop_stars.service.tonwallet;

import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import tools.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Component
public class TonPayApiClient {

    private static final String API_KEY_HEADER = "x-api-key";

    private final String apiKey;
    private final RestClient mainnetRestClient;
    private final RestClient testnetRestClient;

    public TonPayApiClient(TonWalletProperties properties) {
        this.apiKey = normalizeApiKey(properties.getTonPayApiKey());
        this.mainnetRestClient = buildRestClient(
                resolveBaseUrl(properties.getTonPayMainnetBaseUrl(), "https://pay.ton.org"),
                properties.getConnectTimeoutMs(),
                properties.getReadTimeoutMs()
        );
        this.testnetRestClient = buildRestClient(
                resolveBaseUrl(properties.getTonPayTestnetBaseUrl(), "https://dev.pay.ton.org"),
                properties.getConnectTimeoutMs(),
                properties.getReadTimeoutMs()
        );
    }

    public TonPayTransfer createTransfer(TonWalletChain chain,
                                         BigDecimal amount,
                                         String asset,
                                         String recipientAddress,
                                         String senderAddress,
                                         Long queryId,
                                         String commentToSender,
                                         String commentToRecipient) {
        Map<String, Object> requestPayload = new LinkedHashMap<>();
        requestPayload.put("amount", amount);
        requestPayload.put("asset", asset);
        requestPayload.put("recipientAddr", recipientAddress);
        requestPayload.put("senderAddr", senderAddress);
        if (queryId != null) {
            requestPayload.put("queryId", queryId);
        }
        if (commentToSender != null && !commentToSender.isBlank()) {
            requestPayload.put("commentToSender", commentToSender);
        }
        if (commentToRecipient != null && !commentToRecipient.isBlank()) {
            requestPayload.put("commentToRecipient", commentToRecipient);
        }

        JsonNode root = post(chain, "/api/merchant/v1/create-transfer", requestPayload);
        JsonNode message = root.path("message");
        String address = requiredText(message, "address", "TON Pay create-transfer message.address");
        String transferAmount = requiredText(message, "amount", "TON Pay create-transfer message.amount");
        String payload = optionalText(message, "payload");
        String bodyBase64Hash = requiredText(root, "bodyBase64Hash", "TON Pay create-transfer bodyBase64Hash");
        String reference = requiredText(root, "reference", "TON Pay create-transfer reference");

        return new TonPayTransfer(
                reference,
                bodyBase64Hash,
                new TonPayMessage(address, transferAmount, payload)
        );
    }

    public Optional<TonPayTransferStatus> findTransfer(TonWalletChain chain, String bodyHash, String reference) {
        JsonNode root;
        try {
            if (bodyHash != null && !bodyHash.isBlank()) {
                try {
                    root = get(chain, "/api/merchant/v1/transfer?bodyHash=" + encodeQuery(bodyHash));
                } catch (TonPayApiException ex) {
                    if (ex.getFailureType() != FailureType.NOT_FOUND || reference == null || reference.isBlank()) {
                        throw ex;
                    }
                    root = get(chain, "/api/merchant/v1/transfer?reference=" + encodeQuery(reference));
                }
            } else if (reference != null && !reference.isBlank()) {
                root = get(chain, "/api/merchant/v1/transfer?reference=" + encodeQuery(reference));
            } else {
                return Optional.empty();
            }
        } catch (TonPayApiException ex) {
            if (ex.getFailureType() == FailureType.NOT_FOUND) {
                return Optional.empty();
            }
            throw ex;
        }

        return Optional.of(new TonPayTransferStatus(
                optionalText(root, "status"),
                optionalText(root, "reference"),
                optionalText(root, "txHash"),
                optionalText(root, "senderAddr"),
                optionalText(root, "recipientAddr"),
                optionalText(root, "asset"),
                optionalText(root, "assetTicker"),
                optionalText(root, "amount"),
                optionalText(root, "rawAmount"),
                optionalText(root, "errorMessage"),
                root.path("errorCode").isNumber() ? root.path("errorCode").asInt() : null,
                optionalText(root, "date")
        ));
    }

    private JsonNode post(TonWalletChain chain, String path, Object body) {
        try {
            RestClient.RequestBodySpec spec = withApiKey(client(chain).post().uri(path));
            return spec.body(body).retrieve().body(JsonNode.class);
        } catch (RestClientResponseException ex) {
            throw tonPayError(ex);
        } catch (RestClientException ex) {
            throw new TonPayApiException(
                    FailureType.UPSTREAM_UNAVAILABLE,
                    "TON Pay create-transfer request failed: " + safeMessage(ex),
                    ex
            );
        } catch (RuntimeException ex) {
            throw new TonPayApiException(
                    FailureType.UPSTREAM_ERROR,
                    "TON Pay create-transfer failed: " + safeMessage(ex),
                    ex
            );
        }
    }

    private JsonNode get(TonWalletChain chain, String path) {
        try {
            RestClient.RequestHeadersSpec<?> spec = client(chain).get().uri(path);
            spec = withApiKey(spec);
            return spec.retrieve().body(JsonNode.class);
        } catch (RestClientResponseException ex) {
            throw tonPayError(ex);
        } catch (RestClientException ex) {
            throw new TonPayApiException(
                    FailureType.UPSTREAM_UNAVAILABLE,
                    "TON Pay transfer lookup request failed: " + safeMessage(ex),
                    ex
            );
        } catch (RuntimeException ex) {
            throw new TonPayApiException(
                    FailureType.UPSTREAM_ERROR,
                    "TON Pay transfer lookup failed: " + safeMessage(ex),
                    ex
            );
        }
    }

    private RestClient client(TonWalletChain chain) {
        return chain == TonWalletChain.TESTNET ? testnetRestClient : mainnetRestClient;
    }

    private RestClient.RequestHeadersSpec<?> withApiKey(RestClient.RequestHeadersSpec<?> spec) {
        if (apiKey == null) {
            return spec;
        }
        return spec.header(API_KEY_HEADER, apiKey);
    }

    private RestClient.RequestBodySpec withApiKey(RestClient.RequestBodySpec spec) {
        if (apiKey == null) {
            return spec;
        }
        return spec.header(API_KEY_HEADER, apiKey);
    }

    private static RestClient buildRestClient(String baseUrl, int connectTimeoutMs, int readTimeoutMs) {
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(Math.max(1, connectTimeoutMs)))
                .build();

        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofMillis(Math.max(1, readTimeoutMs)));

        return RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .build();
    }

    private static String resolveBaseUrl(String configured, String fallback) {
        if (configured == null || configured.isBlank()) {
            return fallback;
        }
        return configured.trim();
    }

    private static String normalizeApiKey(String rawApiKey) {
        if (rawApiKey == null) {
            return null;
        }
        String normalized = rawApiKey.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private static TonPayApiException tonPayError(RestClientResponseException ex) {
        int status = ex.getStatusCode().value();
        FailureType failureType = status == 404
                ? FailureType.NOT_FOUND
                : status == 429
                ? FailureType.RATE_LIMIT
                : ex.getStatusCode().is5xxServerError()
                ? FailureType.UPSTREAM_UNAVAILABLE
                : FailureType.UPSTREAM_ERROR;

        String operation = status == 404 ? "lookup" : "request";
        return new TonPayApiException(
                failureType,
                "TON Pay " + operation + " HTTP " + status + compactBody(ex.getResponseBodyAsString()),
                ex
        );
    }

    private static String requiredText(JsonNode node, String field, String message) {
        String value = optionalText(node, field);
        if (value == null || value.isBlank()) {
            throw new TonPayApiException(FailureType.UPSTREAM_ERROR, message + " is missing");
        }
        return value;
    }

    private static String optionalText(JsonNode node, String field) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }
        JsonNode valueNode = node.path(field);
        if (valueNode.isMissingNode() || valueNode.isNull()) {
            return null;
        }
        String value = valueNode.asText("").trim();
        return value.isEmpty() ? null : value;
    }

    private static String encodeQuery(String value) {
        return java.net.URLEncoder.encode(value, java.nio.charset.StandardCharsets.UTF_8);
    }

    private static String compactBody(String rawBody) {
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

    public record TonPayTransfer(
            String reference,
            String bodyBase64Hash,
            TonPayMessage message
    ) {
    }

    public record TonPayMessage(
            String address,
            String amount,
            String payload
    ) {
    }

    public record TonPayTransferStatus(
            String status,
            String reference,
            String txHash,
            String senderAddress,
            String recipientAddress,
            String asset,
            String assetTicker,
            String amount,
            String rawAmount,
            String errorMessage,
            Integer errorCode,
            String date
    ) {
    }

    public enum FailureType {
        NOT_FOUND,
        RATE_LIMIT,
        UPSTREAM_UNAVAILABLE,
        UPSTREAM_ERROR
    }

    public static class TonPayApiException extends RuntimeException {
        private final FailureType failureType;

        public TonPayApiException(FailureType failureType, String message, Throwable cause) {
            super(message, cause);
            this.failureType = failureType == null ? FailureType.UPSTREAM_ERROR : failureType;
        }

        public TonPayApiException(FailureType failureType, String message) {
            super(message);
            this.failureType = failureType == null ? FailureType.UPSTREAM_ERROR : failureType;
        }

        public FailureType getFailureType() {
            return failureType;
        }
    }
}
