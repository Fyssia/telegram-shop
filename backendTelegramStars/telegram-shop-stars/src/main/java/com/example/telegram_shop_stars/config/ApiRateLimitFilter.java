package com.example.telegram_shop_stars.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class ApiRateLimitFilter extends OncePerRequestFilter {

    private static final String INVOICE_PATH = "/api/payments/cryptobot/testnet/invoices";
    private static final String TON_WALLET_ORDER_PATH = "/api/payments/ton-wallet/orders";
    private static final String USERNAME_CHECK_PATH = "/api/tg/username/check";

    private final ApiRateLimitProperties properties;
    private final ConcurrentHashMap<String, BucketEntry> buckets = new ConcurrentHashMap<>();
    private final AtomicLong requestCounter = new AtomicLong();

    public ApiRateLimitFilter(ApiRateLimitProperties properties) {
        this.properties = properties;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (!properties.isEnabled()) {
            filterChain.doFilter(request, response);
            return;
        }

        String method = request.getMethod();
        String path = request.getRequestURI();
        if (!HttpMethod.POST.matches(method)) {
            filterChain.doFilter(request, response);
            return;
        }

        int tokensPerMinute = resolveTokensPerMinute(path);
        if (tokensPerMinute <= 0) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = path + "|" + clientIp(request);
        Bucket bucket = getBucket(key, tokensPerMinute);
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        if (probe.isConsumed()) {
            response.setHeader("X-RateLimit-Remaining", String.valueOf(probe.getRemainingTokens()));
            long every = requestCounter.incrementAndGet();
            if ((every & 1023L) == 0L) {
                evictExpiredBuckets();
            }
            filterChain.doFilter(request, response);
            return;
        }

        long secondsToRetry = Math.max(1L, Duration.ofNanos(probe.getNanosToWaitForRefill()).toSeconds());
        response.setStatus(429);
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Retry-After", String.valueOf(secondsToRetry));
        response.getWriter().write(
                "{\"title\":\"Too Many Requests\",\"status\":429,\"detail\":\"Rate limit exceeded\"}"
        );
    }

    private int resolveTokensPerMinute(String path) {
        if (INVOICE_PATH.equals(path)) {
            return properties.getInvoicePerMinute();
        }
        if (TON_WALLET_ORDER_PATH.equals(path)) {
            return properties.getInvoicePerMinute();
        }
        if (USERNAME_CHECK_PATH.equals(path)) {
            return properties.getUsernameCheckPerMinute();
        }
        return 0;
    }

    private Bucket getBucket(String key, int tokensPerMinute) {
        long now = System.currentTimeMillis();
        BucketEntry entry = buckets.computeIfAbsent(key, unused -> new BucketEntry(buildBucket(tokensPerMinute), now));
        entry.lastAccessMillis().set(now);
        if (buckets.size() > properties.getMaxBuckets()) {
            evictExpiredBuckets();
        }
        return entry.bucket();
    }

    private static Bucket buildBucket(int tokensPerMinute) {
        Bandwidth limit = Bandwidth.classic(
                Math.max(1L, tokensPerMinute),
                Refill.greedy(Math.max(1L, tokensPerMinute), Duration.ofMinutes(1))
        );
        return Bucket.builder().addLimit(limit).build();
    }

    private void evictExpiredBuckets() {
        long now = System.currentTimeMillis();
        long ttlMillis = Math.max(1L, properties.getBucketTtlMinutes()) * 60_000L;

        Iterator<Map.Entry<String, BucketEntry>> iterator = buckets.entrySet().iterator();
        while (iterator.hasNext()) {
            Map.Entry<String, BucketEntry> entry = iterator.next();
            if (now - entry.getValue().lastAccessMillis().get() > ttlMillis) {
                buckets.remove(entry.getKey(), entry.getValue());
            }
        }

        if (buckets.size() <= properties.getMaxBuckets()) {
            return;
        }

        int overflow = buckets.size() - properties.getMaxBuckets();
        Iterator<String> keyIterator = buckets.keySet().iterator();
        while (overflow > 0 && keyIterator.hasNext()) {
            String key = keyIterator.next();
            buckets.remove(key);
            overflow--;
        }
    }

    private static String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            String[] parts = forwardedFor.split(",");
            if (parts.length > 0 && !parts[0].isBlank()) {
                return parts[0].trim();
            }
        }

        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }

        String remoteAddr = request.getRemoteAddr();
        return remoteAddr == null ? "unknown" : remoteAddr;
    }

    private record BucketEntry(Bucket bucket, AtomicLong lastAccessMillis) {
        BucketEntry(Bucket bucket, long lastAccessMillis) {
            this(bucket, new AtomicLong(lastAccessMillis));
        }
    }
}
