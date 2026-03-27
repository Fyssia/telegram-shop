package com.example.telegram_shop_stars.service.balance;

import com.example.telegram_shop_stars.error.ApiProblemException;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.net.Authenticator;
import java.net.CookieHandler;
import java.net.ProxySelector;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpHeaders;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLParameters;
import javax.net.ssl.SSLSession;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BalanceApiClientTest {

    @Test
    void shouldRetryTemporaryUpstreamFailureAndEventuallySucceed() {
        TestHttpClient httpClient = new TestHttpClient()
                .enqueue(mockResponse(503, "{\"error\":\"busy\"}"))
                .enqueue(mockResponse(200, "{\"enough\":true}"));

        BalanceApiClient client = createClient(httpClient, 2, 0);

        client.assertEnough(new BigDecimal("1.60"));

        assertThat(httpClient.sendCalls()).isEqualTo(2);
    }

    @Test
    void shouldNotRetryBusinessInsufficientBalanceResponse() {
        TestHttpClient httpClient = new TestHttpClient()
                .enqueue(mockResponse(200, "{\"enough\":false}"));

        BalanceApiClient client = createClient(httpClient, 2, 0);

        assertThatThrownBy(() -> client.assertEnough(new BigDecimal("1.60")))
                .isInstanceOf(ApiProblemException.class)
                .extracting(error -> ((ApiProblemException) error).getCode())
                .isEqualTo("INSUFFICIENT_BALANCE");

        assertThat(httpClient.sendCalls()).isEqualTo(1);
    }

    @Test
    void shouldFailAfterRetryBudgetIsExhausted() {
        TestHttpClient httpClient = new TestHttpClient()
                .enqueue(mockResponse(503, "{\"error\":\"still-busy\"}"))
                .enqueue(mockResponse(503, "{\"error\":\"still-busy\"}"));

        BalanceApiClient client = createClient(httpClient, 2, 0);

        assertThatThrownBy(() -> client.assertEnough(new BigDecimal("1.60")))
                .isInstanceOf(ApiProblemException.class)
                .extracting(error -> ((ApiProblemException) error).getCode())
                .isEqualTo("BALANCE_UPSTREAM_ERROR");

        assertThat(httpClient.sendCalls()).isEqualTo(2);
    }

    private static BalanceApiClient createClient(HttpClient httpClient, int maxAttempts, int retryBackoffMs) {
        BalanceApiProperties properties = new BalanceApiProperties();
        properties.setLocalApiUrl("http://127.0.0.1:8080/api/balance");
        properties.setConnectTimeoutMs(1_000);
        properties.setReadTimeoutMs(1_000);
        properties.setMaxAttempts(maxAttempts);
        properties.setRetryBackoffMs(retryBackoffMs);
        return new BalanceApiClient(properties, httpClient, new ObjectMapper());
    }

    private static HttpResponse<String> mockResponse(int statusCode, String body) {
        return new TestHttpResponse(statusCode, body);
    }

    private static final class TestHttpClient extends HttpClient {

        private final java.util.ArrayDeque<HttpResponse<String>> responses = new java.util.ArrayDeque<>();
        private int sendCalls;

        private TestHttpClient() {
        }

        private TestHttpClient enqueue(HttpResponse<String> response) {
            responses.addLast(response);
            return this;
        }

        private int sendCalls() {
            return sendCalls;
        }

        @Override
        public Optional<CookieHandler> cookieHandler() {
            return Optional.empty();
        }

        @Override
        public Optional<Duration> connectTimeout() {
            return Optional.empty();
        }

        @Override
        public Redirect followRedirects() {
            return Redirect.NEVER;
        }

        @Override
        public Optional<ProxySelector> proxy() {
            return Optional.empty();
        }

        @Override
        public SSLContext sslContext() {
            try {
                return SSLContext.getDefault();
            } catch (Exception ex) {
                throw new IllegalStateException(ex);
            }
        }

        @Override
        public SSLParameters sslParameters() {
            return new SSLParameters();
        }

        @Override
        public Optional<Authenticator> authenticator() {
            return Optional.empty();
        }

        @Override
        public Version version() {
            return Version.HTTP_1_1;
        }

        @Override
        public Optional<Executor> executor() {
            return Optional.empty();
        }

        @Override
        public <T> HttpResponse<T> send(HttpRequest request, HttpResponse.BodyHandler<T> responseBodyHandler) {
            sendCalls++;
            HttpResponse<String> response = responses.pollFirst();
            if (response == null) {
                throw new AssertionError("No prepared responses left");
            }

            @SuppressWarnings("unchecked")
            HttpResponse<T> typedResponse = (HttpResponse<T>) response;
            return typedResponse;
        }

        @Override
        public <T> CompletableFuture<HttpResponse<T>> sendAsync(HttpRequest request,
                                                                HttpResponse.BodyHandler<T> responseBodyHandler) {
            throw new UnsupportedOperationException("sendAsync is not used in BalanceApiClient tests");
        }

        @Override
        public <T> CompletableFuture<HttpResponse<T>> sendAsync(HttpRequest request,
                                                                HttpResponse.BodyHandler<T> responseBodyHandler,
                                                                HttpResponse.PushPromiseHandler<T> pushPromiseHandler) {
            throw new UnsupportedOperationException("sendAsync is not used in BalanceApiClient tests");
        }
    }

    private record TestHttpResponse(int statusCode, String body) implements HttpResponse<String> {

        @Override
        public HttpRequest request() {
            return HttpRequest.newBuilder(URI.create("http://127.0.0.1:8080/api/balance")).build();
        }

        @Override
        public Optional<HttpResponse<String>> previousResponse() {
            return Optional.empty();
        }

        @Override
        public HttpHeaders headers() {
            return HttpHeaders.of(java.util.Map.of("Content-Type", java.util.List.of("application/json")), (left, right) -> true);
        }

        @Override
        public Optional<SSLSession> sslSession() {
            return Optional.empty();
        }

        @Override
        public URI uri() {
            return URI.create("http://127.0.0.1:8080/api/balance");
        }

        @Override
        public HttpClient.Version version() {
            return HttpClient.Version.HTTP_1_1;
        }
    }
}
