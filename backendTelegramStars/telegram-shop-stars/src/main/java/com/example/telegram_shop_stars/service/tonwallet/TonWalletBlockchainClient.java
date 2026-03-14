package com.example.telegram_shop_stars.service.tonwallet;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import tools.jackson.databind.JsonNode;

import java.math.BigInteger;
import java.net.http.HttpClient;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

@Component
public class TonWalletBlockchainClient {

    private static final Logger log = LoggerFactory.getLogger(TonWalletBlockchainClient.class);
    private static final String TONCENTER_API_KEY_HEADER = "X-API-Key";

    private final TonWalletProperties properties;
    private final RestClient restClient;

    public TonWalletBlockchainClient(TonWalletProperties properties) {
        this.properties = properties;

        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(Math.max(1, properties.getConnectTimeoutMs())))
                .build();

        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofMillis(Math.max(1, properties.getReadTimeoutMs())));

        this.restClient = RestClient.builder()
                .baseUrl(properties.getToncenterBaseUrl())
                .requestFactory(requestFactory)
                .build();
    }

    public Optional<TonWalletIncomingTransfer> findIncomingTransfer(String recipientAddress,
                                                                    BigInteger expectedAmountNano,
                                                                    Instant notBeforeInclusive) {
        if (recipientAddress == null || recipientAddress.isBlank()) {
            return Optional.empty();
        }
        if (expectedAmountNano == null || expectedAmountNano.signum() <= 0) {
            return Optional.empty();
        }

        JsonNode root = loadTransactions(recipientAddress);
        if (root == null) {
            return Optional.empty();
        }
        if (!root.path("ok").asBoolean(false)) {
            String error = compactBody(root.path("error").asText(root.toString()));
            throw new TonWalletBlockchainException("Toncenter getTransactions error: " + error);
        }

        JsonNode transactions = root.path("result");
        if (!transactions.isArray()) {
            return Optional.empty();
        }

        for (JsonNode transaction : transactions) {
            JsonNode inMsg = transaction.path("in_msg");
            if (inMsg.isMissingNode() || inMsg.isNull()) {
                continue;
            }

            Optional<BigInteger> incomingValue = readBigInteger(inMsg, "value");
            if (incomingValue.isEmpty() || incomingValue.get().compareTo(expectedAmountNano) != 0) {
                continue;
            }

            Optional<Instant> txTime = readInstant(transaction, "utime", "now", "timestamp");
            if (notBeforeInclusive != null) {
                if (txTime.isEmpty() || txTime.get().isBefore(notBeforeInclusive)) {
                    continue;
                }
            }

            String txHash = readText(transaction.path("transaction_id"), "hash").orElse(null);
            return Optional.of(new TonWalletIncomingTransfer(
                    txHash,
                    incomingValue.get().toString(),
                    txTime.orElse(null)
            ));
        }

        return Optional.empty();
    }

    private JsonNode loadTransactions(String recipientAddress) {
        try {
            RestClient.RequestHeadersSpec<?> spec = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/getTransactions")
                            .queryParam("address", recipientAddress)
                            .queryParam("limit", Math.max(1, properties.getToncenterTxLimit()))
                            .queryParam("archival", "true")
                            .build());

            String apiKey = properties.getToncenterApiKey();
            if (apiKey != null && !apiKey.isBlank()) {
                spec = spec.header(TONCENTER_API_KEY_HEADER, apiKey.trim());
            }

            return spec.retrieve().body(JsonNode.class);
        } catch (RestClientResponseException ex) {
            throw new TonWalletBlockchainException(
                    "Toncenter getTransactions HTTP " + ex.getStatusCode().value()
                            + compactBody(ex.getResponseBodyAsString()),
                    ex
            );
        } catch (RestClientException ex) {
            throw new TonWalletBlockchainException(
                    "Toncenter getTransactions request failed: " + safeMessage(ex),
                    ex
            );
        } catch (RuntimeException ex) {
            throw new TonWalletBlockchainException(
                    "Toncenter getTransactions failed: " + safeMessage(ex),
                    ex
            );
        }
    }

    private static Optional<String> readText(JsonNode node, String field) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return Optional.empty();
        }
        String value = node.path(field).asText("").trim();
        return value.isEmpty() ? Optional.empty() : Optional.of(value);
    }

    private static Optional<BigInteger> readBigInteger(JsonNode node, String field) {
        Optional<String> text = readText(node, field);
        if (text.isEmpty()) {
            return Optional.empty();
        }
        try {
            return Optional.of(new BigInteger(text.get()));
        } catch (NumberFormatException ex) {
            return Optional.empty();
        }
    }

    private static Optional<Instant> readInstant(JsonNode node, String... fields) {
        for (String field : fields) {
            Optional<String> raw = readText(node, field);
            if (raw.isEmpty()) {
                continue;
            }

            String value = raw.get();
            try {
                return Optional.of(Instant.ofEpochSecond(Long.parseLong(value)));
            } catch (NumberFormatException ignored) {
                // no-op, try parse ISO next
            }

            try {
                return Optional.of(Instant.parse(value));
            } catch (RuntimeException ignored) {
                // no-op
            }
        }
        return Optional.empty();
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

    public record TonWalletIncomingTransfer(
            String txHash,
            String amountNano,
            Instant timestamp
    ) {
    }

    public static class TonWalletBlockchainException extends RuntimeException {
        public TonWalletBlockchainException(String message, Throwable cause) {
            super(message, cause);
        }

        public TonWalletBlockchainException(String message) {
            super(message);
        }
    }
}
