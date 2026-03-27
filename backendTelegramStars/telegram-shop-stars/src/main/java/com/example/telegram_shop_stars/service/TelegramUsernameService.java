package com.example.telegram_shop_stars.service;

import com.example.telegram_shop_stars.dto.UsernameCheckResponse;
import it.tdlight.client.TelegramError;
import it.tdlight.jni.TdApi;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.HtmlUtils;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

@Service
public class TelegramUsernameService {
    private static final Logger log = LoggerFactory.getLogger(TelegramUsernameService.class);

    private static final Pattern USERNAME_RE = Pattern.compile("^[a-z0-9_]{5,32}$");
    private static final Pattern HTML_TITLE_RE = Pattern.compile("<title>(.*?)</title>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
    private static final Pattern OG_TITLE_RE = Pattern.compile(
            "<meta\\s+property=[\"']og:title[\"']\\s+content=[\"'](.*?)[\"']",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );
    private static final Pattern OG_IMAGE_RE = Pattern.compile(
            "<meta\\s+property=[\"']og:image[\"']\\s+content=[\"'](.*?)[\"']",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );
    private static final Pattern PAGE_TITLE_BLOCK_RE = Pattern.compile(
            "<div\\s+class=[\"']tgme_page_title[\"'][^>]*>(.*?)</div>",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );

    private static final Duration SEARCH_TIMEOUT = Duration.ofSeconds(6);
    private static final Duration GET_USER_TIMEOUT = Duration.ofSeconds(4);
    private static final Duration GET_USER_PREMIUM_TIMEOUT = Duration.ofSeconds(8);
    private static final int PREMIUM_GET_USER_MAX_ATTEMPTS = 2;
    private static final Duration PUBLIC_LOOKUP_TIMEOUT = Duration.ofSeconds(3);
    private static final Duration PUBLIC_CACHE_TTL = Duration.ofSeconds(30);
    private static final Duration PREMIUM_CACHE_TTL = Duration.ofSeconds(20);
    private static final int PUBLIC_CACHE_MAX_SIZE = 10_000;
    private static final int PREMIUM_CACHE_MAX_SIZE = 5_000;

    private static final HttpClient PUBLIC_HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(2))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    private final TdlibClient tdlib;
    private final ConcurrentHashMap<String, CachedLookup> publicLookupCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, CachedLookup> premiumLookupCache = new ConcurrentHashMap<>();

    public TelegramUsernameService(TdlibClient tdlib) {
        this.tdlib = tdlib;
    }

    public UsernameCheckResponse check(String raw) {
        return check(raw, false);
    }

    public UsernameCheckResponse check(String raw, boolean requirePremiumStatus) {
        String u = normalize(raw);
        if (u.isEmpty() || !USERNAME_RE.matcher(u).matches()) {
            return UsernameCheckResponse.invalid(u);
        }

        if (requirePremiumStatus) {
            UsernameCheckResponse cachedPremium = getCachedPremiumLookup(u);
            if (cachedPremium != null) {
                return cachedPremium;
            }

            if (!tdlib.isConfigured()) {
                log.warn(
                        "Premium check requested for username=@{} but TDLib is not configured (TG_TDLIB_API_ID/TG_TDLIB_API_HASH)",
                        u
                );
                return new UsernameCheckResponse(
                        false,
                        "PREMIUM_CHECK_UNAVAILABLE",
                        u,
                        "TDLib is not configured",
                        null,
                        null
                );
            }

            UsernameCheckResponse tdlibPremiumResult = lookupViaTdlib(u, true);
            if (isPremiumLookupCacheable(tdlibPremiumResult)) {
                cachePremiumLookup(u, tdlibPremiumResult);
            }
            return tdlibPremiumResult;
        }

        UsernameCheckResponse cachedPublic = getCachedPublicLookup(u);
        if (cachedPublic != null) {
            return cachedPublic;
        }

        UsernameCheckResponse publicCheckResult = resolvePublicCheck(u);
        if (isPublicLookupCacheable(publicCheckResult)) {
            cachePublicLookup(u, publicCheckResult);
        }
        return publicCheckResult;
    }

    public void assertPremiumGiftAllowed(String rawUsername) {
        UsernameCheckResponse response = check(rawUsername, true);

        switch (response.status()) {
            case "USER" -> {
                if (Boolean.FALSE.equals(response.isPremium())) {
                    return;
                }
                if (Boolean.TRUE.equals(response.isPremium())) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Recipient already has Telegram Premium");
                }
                throw new ResponseStatusException(
                        HttpStatus.SERVICE_UNAVAILABLE,
                        "Unable to verify recipient Telegram Premium status"
                );
            }
            case "INVALID" -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "username must match ^[a-z0-9_]{5,32}$"
            );
            case "NOT_FOUND" -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Telegram username was not found");
            case "BOT" -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bots cannot receive Telegram Premium gifts");
            case "NOT_A_USER" -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only personal Telegram accounts can receive Premium gifts"
            );
            case "PREMIUM_CHECK_UNAVAILABLE" -> throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Unable to verify recipient Telegram Premium status"
            );
            default -> throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Unable to verify recipient Telegram Premium status"
            );
        }
    }

    private UsernameCheckResponse lookupViaTdlib(String username, boolean requirePremiumStatus) {
        String avatarUrl = avatarUrlFor(username);

        try {
            TdApi.Chat chat = tdlib.send(new TdApi.SearchPublicChat(username), SEARCH_TIMEOUT);
            if (!(chat.type instanceof TdApi.ChatTypePrivate priv)) {
                return UsernameCheckResponse.channelOrGroup(username);
            }

            String fallbackName = normalizeDisplayName(chat.title);
            TdApi.User user;
            try {
                user = fetchUserForCheck(priv.userId, username, requirePremiumStatus);
            } catch (Exception userLookupError) {
                Throwable userRoot = rootCause(userLookupError);
                if (isNotFound(userRoot)) {
                    return UsernameCheckResponse.notFound(username);
                }
                if (!requirePremiumStatus && fallbackName != null) {
                    return UsernameCheckResponse.user(username, fallbackName, avatarUrl);
                }
                if (requirePremiumStatus) {
                    log.warn(
                            "TDLib GetUser failed for premium check username=@{}: {}",
                            username,
                            compactError(userRoot)
                    );
                }
                return requirePremiumStatus
                        ? UsernameCheckResponse.premiumCheckUnavailable(username)
                        : new UsernameCheckResponse(false, "ERROR", username, errorMessage(userRoot), null, null);
            }

            String name = joinName(user.firstName, user.lastName);
            if (name == null) {
                name = fallbackName;
            }

            if (user.type instanceof TdApi.UserTypeBot) {
                return UsernameCheckResponse.bot(username, name, avatarUrl);
            }

            return UsernameCheckResponse.user(
                    username,
                    name,
                    avatarUrl,
                    requirePremiumStatus ? user.isPremium : null
            );
        } catch (Exception e) {
            Throwable root = rootCause(e);
            if (isNotFound(root)) {
                return UsernameCheckResponse.notFound(username);
            }
            if (requirePremiumStatus) {
                log.warn(
                        "TDLib lookup failed for premium check username=@{}: {}",
                        username,
                        compactError(root)
                );
                return UsernameCheckResponse.premiumCheckUnavailable(username);
            }
            return new UsernameCheckResponse(false, "ERROR", username, errorMessage(root), null, null);
        }
    }

    private TdApi.User fetchUserForCheck(long userId, String username, boolean requirePremiumStatus) throws Exception {
        if (!requirePremiumStatus) {
            return tdlib.send(new TdApi.GetUser(userId), GET_USER_TIMEOUT);
        }

        Exception lastError = null;
        for (int attempt = 1; attempt <= PREMIUM_GET_USER_MAX_ATTEMPTS; attempt++) {
            try {
                return tdlib.send(new TdApi.GetUser(userId), GET_USER_PREMIUM_TIMEOUT);
            } catch (Exception ex) {
                lastError = ex;
                Throwable root = rootCause(ex);
                if (isNotFound(root)) {
                    throw ex;
                }
                if (attempt < PREMIUM_GET_USER_MAX_ATTEMPTS) {
                    log.warn(
                            "TDLib GetUser attempt {}/{} failed for premium check username=@{}: {}",
                            attempt,
                            PREMIUM_GET_USER_MAX_ATTEMPTS,
                            username,
                            compactError(root)
                    );
                }
            }
        }

        throw lastError == null ? new IllegalStateException("TDLib GetUser failed") : lastError;
    }

    private static String avatarUrlFor(String username) {
        // Самый простой способ: публичный userpic
        return "https://t.me/i/userpic/320/" + username + ".jpg";
    }

    private static String normalize(String raw) {
        if (raw == null) return "";
        String s = raw.trim();
        if (s.startsWith("@")) s = s.substring(1);
        return s.toLowerCase(Locale.ROOT);
    }

    private static String joinName(String first, String last) {
        String f = first == null ? "" : first.trim();
        String l = last == null ? "" : last.trim();
        String full = (f + " " + l).trim();
        return full.isEmpty() ? null : full;
    }

    private static String normalizeDisplayName(String raw) {
        if (raw == null) return null;
        String value = raw.trim();
        return value.isEmpty() ? null : value;
    }

    private static Throwable rootCause(Throwable error) {
        Throwable current = error;
        while (current != null && current.getCause() != null && current.getCause() != current) {
            current = current.getCause();
        }
        return current == null ? error : current;
    }

    private static boolean isNotFound(Throwable error) {
        String msg = errorMessage(error).toLowerCase(Locale.ROOT);
        if (msg.contains("username_not_occupied")
                || msg.contains("not occupied")
                || msg.contains("chat not found")
                || msg.contains("not found")) {
            return true;
        }

        if (error instanceof TelegramError tgError) {
            int code = tgError.getErrorCode();
            String tgMsg = normalizeMessage(tgError.getErrorMessage()).toLowerCase(Locale.ROOT);
            return code == 400 && (tgMsg.contains("username_not_occupied")
                    || tgMsg.contains("not occupied")
                    || tgMsg.contains("chat not found")
                    || tgMsg.contains("not found"));
        }

        return false;
    }

    protected UsernameCheckResponse lookupViaPublicPage(String username) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://t.me/" + username))
                    .timeout(PUBLIC_LOOKUP_TIMEOUT)
                    .header("User-Agent", "Mozilla/5.0")
                    .GET()
                    .build();

            HttpResponse<String> response = PUBLIC_HTTP.send(request, HttpResponse.BodyHandlers.ofString());
            return parsePublicPage(username, response.body());
        } catch (Exception ignored) {
            return null;
        }
    }

    private UsernameCheckResponse resolvePublicCheck(String username) {
        if (tdlib.isEnabledForPublicChecks()) {
            UsernameCheckResponse tdlibPreferredResult = lookupViaTdlib(username, false);
            if (isUsableLookupResult(tdlibPreferredResult)) {
                return tdlibPreferredResult;
            }
        }

        UsernameCheckResponse publicResult = lookupViaPublicPage(username);
        if (publicResult != null) {
            return publicResult;
        }

        if (tdlib.isConfigured()) {
            return lookupViaTdlib(username, false);
        }

        return new UsernameCheckResponse(
                false,
                "ERROR",
                username,
                "Username lookup backend is unavailable",
                null,
                null
        );
    }

    private UsernameCheckResponse getCachedPublicLookup(String username) {
        CachedLookup cached = publicLookupCache.get(username);
        if (cached == null) return null;

        if (cached.expiresAtMillis() < System.currentTimeMillis()) {
            publicLookupCache.remove(username, cached);
            return null;
        }
        return cached.response();
    }

    private void cachePublicLookup(String username, UsernameCheckResponse response) {
        evictPublicCacheIfNeeded();
        long expiresAtMillis = System.currentTimeMillis() + PUBLIC_CACHE_TTL.toMillis();
        publicLookupCache.put(username, new CachedLookup(response, expiresAtMillis));
    }

    private UsernameCheckResponse getCachedPremiumLookup(String username) {
        CachedLookup cached = premiumLookupCache.get(username);
        if (cached == null) return null;

        if (cached.expiresAtMillis() < System.currentTimeMillis()) {
            premiumLookupCache.remove(username, cached);
            return null;
        }
        return cached.response();
    }

    private void cachePremiumLookup(String username, UsernameCheckResponse response) {
        evictPremiumCacheIfNeeded();
        long expiresAtMillis = System.currentTimeMillis() + PREMIUM_CACHE_TTL.toMillis();
        premiumLookupCache.put(username, new CachedLookup(response, expiresAtMillis));
    }

    private void evictPublicCacheIfNeeded() {
        if (publicLookupCache.size() < PUBLIC_CACHE_MAX_SIZE) {
            return;
        }

        long now = System.currentTimeMillis();
        publicLookupCache.entrySet().removeIf(entry -> entry.getValue().expiresAtMillis() < now);

        if (publicLookupCache.size() < PUBLIC_CACHE_MAX_SIZE) {
            return;
        }

        var keys = publicLookupCache.keys();
        if (keys.hasMoreElements()) {
            publicLookupCache.remove(keys.nextElement());
        }
    }

    private void evictPremiumCacheIfNeeded() {
        if (premiumLookupCache.size() < PREMIUM_CACHE_MAX_SIZE) {
            return;
        }

        long now = System.currentTimeMillis();
        premiumLookupCache.entrySet().removeIf(entry -> entry.getValue().expiresAtMillis() < now);

        if (premiumLookupCache.size() < PREMIUM_CACHE_MAX_SIZE) {
            return;
        }

        var keys = premiumLookupCache.keys();
        if (keys.hasMoreElements()) {
            premiumLookupCache.remove(keys.nextElement());
        }
    }

    private static boolean isPremiumLookupCacheable(UsernameCheckResponse response) {
        return switch (response.status()) {
            case "USER", "NOT_FOUND", "BOT", "NOT_A_USER" -> true;
            default -> false;
        };
    }

    private static boolean isPublicLookupCacheable(UsernameCheckResponse response) {
        return switch (response.status()) {
            case "USER", "NOT_FOUND", "BOT", "NOT_A_USER" -> true;
            default -> false;
        };
    }

    private static boolean isUsableLookupResult(UsernameCheckResponse response) {
        return response != null
                && !"ERROR".equals(response.status())
                && !"PREMIUM_CHECK_UNAVAILABLE".equals(response.status());
    }

    static UsernameCheckResponse parsePublicPage(String username, String html) {
        if (html == null || html.isBlank()) return null;

        String lowerUsername = username.toLowerCase(Locale.ROOT);
        String lowerHtml = html.toLowerCase(Locale.ROOT);
        String resolveMarker = "tg://resolve?domain=" + lowerUsername;
        if (!lowerHtml.contains(resolveMarker)) {
            return UsernameCheckResponse.notFound(username);
        }

        String avatarUrl = resolvePublicAvatarUrl(username, html, lowerHtml);

        String pageTitle = extractHtmlTitle(html);
        String lowerPageTitle = pageTitle.toLowerCase(Locale.ROOT);
        String displayName = extractDisplayName(html);

        if (isPlaceholderContactPage(lowerHtml, lowerUsername, lowerPageTitle)) {
            return UsernameCheckResponse.notFound(username);
        }

        if (lowerPageTitle.contains("telegram: launch @")
                || lowerHtml.contains(">start bot<")
                || lowerHtml.contains("you can launch")) {
            return UsernameCheckResponse.bot(username, displayName, avatarUrl);
        }

        if (lowerPageTitle.contains("telegram: view @")
                || lowerPageTitle.contains("telegram: join @")
                || lowerHtml.contains(">view in telegram<")
                || lowerHtml.contains(">join channel<")
                || lowerHtml.contains(">join group<")) {
            return UsernameCheckResponse.channelOrGroup(username);
        }

        return UsernameCheckResponse.user(username, displayName, avatarUrl);
    }

    private static String extractHtmlTitle(String html) {
        var m = HTML_TITLE_RE.matcher(html);
        if (m.find()) {
            return HtmlUtils.htmlUnescape(m.group(1)).trim();
        }
        return "";
    }

    private static String extractOgTitle(String html) {
        var m = OG_TITLE_RE.matcher(html);
        if (m.find()) {
            return normalizeDisplayName(HtmlUtils.htmlUnescape(m.group(1)));
        }
        return null;
    }

    private static String extractOgImage(String html) {
        var m = OG_IMAGE_RE.matcher(html);
        if (m.find()) {
            return normalizeDisplayName(HtmlUtils.htmlUnescape(m.group(1)));
        }
        return null;
    }

    private static String resolvePublicAvatarUrl(String username, String html, String lowerHtml) {
        if (lowerHtml.contains("class=\"tgme_page_photo\"")) {
            return avatarUrlFor(username);
        }

        String ogImage = extractOgImage(html);
        if (ogImage == null) return null;

        String lowerOgImage = ogImage.toLowerCase(Locale.ROOT);
        if (lowerOgImage.contains("telegram.org/img/t_logo")) {
            return null;
        }

        return avatarUrlFor(username);
    }

    private static String extractDisplayName(String html) {
        String nameFromPageTitle = extractPageEntityTitle(html);
        if (nameFromPageTitle != null) {
            return nameFromPageTitle;
        }

        String ogTitle = extractOgTitle(html);
        if (ogTitle == null) return null;

        String lower = ogTitle.toLowerCase(Locale.ROOT);
        if (lower.startsWith("telegram: contact @")
                || lower.startsWith("telegram: view @")
                || lower.startsWith("telegram: join @")
                || lower.startsWith("telegram: launch @")) {
            return null;
        }
        return ogTitle;
    }

    private static String extractPageEntityTitle(String html) {
        var m = PAGE_TITLE_BLOCK_RE.matcher(html);
        if (!m.find()) return null;

        String raw = m.group(1);
        String withoutTags = raw.replaceAll("<[^>]+>", " ");
        String decoded = HtmlUtils.htmlUnescape(withoutTags).replace('\u00A0', ' ');
        String normalizedSpaces = decoded.replaceAll("\\s+", " ").trim();
        return normalizeDisplayName(normalizedSpaces);
    }

    private static boolean isPlaceholderContactPage(String lowerHtml, String lowerUsername, String lowerPageTitle) {
        boolean hasEntityTitle = lowerHtml.contains("class=\"tgme_page_title\"");
        boolean hasEntityPhoto = lowerHtml.contains("class=\"tgme_page_photo\"");
        boolean hasPlaceholderIcon = lowerHtml.contains("class=\"tgme_page_icon\"")
                || lowerHtml.contains("class=\"tgme_icon_user\"");
        boolean placeholderTitle = lowerPageTitle.equals("telegram: contact @" + lowerUsername);

        return placeholderTitle && hasPlaceholderIcon && !hasEntityTitle && !hasEntityPhoto;
    }

    private static String errorMessage(Throwable error) {
        if (error == null) return "Unknown error";

        if (error instanceof TelegramError tgError) {
            String tgMsg = normalizeMessage(tgError.getErrorMessage());
            if (!tgMsg.isEmpty()) return tgMsg;
            return "Telegram error code " + tgError.getErrorCode();
        }

        String msg = normalizeMessage(error.getMessage());
        if (!msg.isEmpty()) return msg;

        return error.getClass().getSimpleName();
    }

    private static String normalizeMessage(String raw) {
        return raw == null ? "" : raw.trim();
    }

    private static String compactError(Throwable error) {
        String message = errorMessage(error).replaceAll("\\s+", " ").trim();
        if (message.length() <= 180) {
            return message;
        }
        return message.substring(0, 177) + "...";
    }

    private record CachedLookup(UsernameCheckResponse response, long expiresAtMillis) {}
}
