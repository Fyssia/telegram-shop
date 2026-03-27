package com.example.telegram_shop_stars.service;

import com.example.telegram_shop_stars.dto.UsernameCheckResponse;
import it.tdlight.client.TelegramError;
import it.tdlight.jni.TdApi;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeoutException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TelegramUsernameServiceTest {

    @Test
    void shouldReturnUserWhenGetUserFailsButChatTitleIsAvailable() throws Exception {
        StubTdlibClient tdlib = new StubTdlibClient(fn -> {
            if (fn instanceof TdApi.SearchPublicChat) {
                TdApi.Chat chat = new TdApi.Chat();
                chat.type = new TdApi.ChatTypePrivate(42L);
                chat.title = "Fyssia";
                return chat;
            }
            if (fn instanceof TdApi.GetUser) {
                throw new TimeoutException();
            }
            return null;
        });
        TelegramUsernameService service = new TelegramUsernameService(tdlib) {
            @Override
            protected UsernameCheckResponse lookupViaPublicPage(String username) {
                return null;
            }
        };

        UsernameCheckResponse response = service.check("Fyssia");

        assertThat(response.ok()).isTrue();
        assertThat(response.status()).isEqualTo("USER");
        assertThat(response.normalizedUsername()).isEqualTo("fyssia");
        assertThat(response.displayName()).isEqualTo("Fyssia");
    }

    @Test
    void shouldReturnNotFoundForUsernameNotOccupiedTelegramError() throws Exception {
        StubTdlibClient tdlib = new StubTdlibClient(fn -> {
            TelegramError error = new TelegramError(new TdApi.Error(400, "USERNAME_NOT_OCCUPIED"));
            throw new ExecutionException(error);
        });
        TelegramUsernameService service = new TelegramUsernameService(tdlib) {
            @Override
            protected UsernameCheckResponse lookupViaPublicPage(String username) {
                return null;
            }
        };

        UsernameCheckResponse response = service.check("fyssia");

        assertThat(response.ok()).isTrue();
        assertThat(response.status()).isEqualTo("NOT_FOUND");
        assertThat(response.normalizedUsername()).isEqualTo("fyssia");
        assertThat(response.displayName()).isNull();
    }

    @Test
    void shouldReturnErrorWithNonEmptyMessageForNullExceptionMessage() throws Exception {
        TdlibClient tdlib = new StubTdlibClient(fn -> {
            throw new TimeoutException();
        });
        TelegramUsernameService service = new TelegramUsernameService(tdlib) {
            @Override
            protected UsernameCheckResponse lookupViaPublicPage(String username) {
                return null;
            }
        };

        UsernameCheckResponse response = service.check("fyssia");

        assertThat(response.ok()).isFalse();
        assertThat(response.status()).isEqualTo("ERROR");
        assertThat(response.normalizedUsername()).isEqualTo("fyssia");
        assertThat(response.displayName()).isEqualTo("TimeoutException");
    }

    @Test
    void shouldUsePublicPageFallbackWhenTdlibTimesOut() throws Exception {
        StubTdlibClient tdlib = new StubTdlibClient(fn -> {
            throw new TimeoutException("tdlib timeout");
        });
        TelegramUsernameService service = new TelegramUsernameService(tdlib) {
            @Override
            protected UsernameCheckResponse lookupViaPublicPage(String username) {
                return UsernameCheckResponse.user(username, "Fyssia", null);
            }
        };

        UsernameCheckResponse response = service.check("fyssia");

        assertThat(response.ok()).isTrue();
        assertThat(response.status()).isEqualTo("USER");
        assertThat(response.normalizedUsername()).isEqualTo("fyssia");
        assertThat(response.displayName()).isEqualTo("Fyssia");
        assertThat(tdlib.callCount()).isEqualTo(1);
    }

    @Test
    void shouldClassifyPublicPageAsNotFound() {
        String html = "<html><head><title>Telegram Messenger</title></head><body></body></html>";
        UsernameCheckResponse response = TelegramUsernameService.parsePublicPage("fyssia", html);

        assertThat(response.ok()).isTrue();
        assertThat(response.status()).isEqualTo("NOT_FOUND");
    }

    @Test
    void shouldClassifyPlaceholderContactPageAsNotFound() {
        String html = """
                <html>
                <head>
                  <title>Telegram: Contact @uiohiuhtsnuioipreoi3321c</title>
                  <meta property="og:title" content="Telegram: Contact @uiohiuhtsnuioipreoi3321c">
                  <meta property="al:ios:url" content="tg://resolve?domain=uiohiuhtsnuioipreoi3321c">
                </head>
                <body>
                  <div class="tgme_page_icon"><i class="tgme_icon_user"></i></div>
                  <div class="tgme_page_action"><a class="tgme_action_button_new">Send Message</a></div>
                </body>
                </html>
                """;
        UsernameCheckResponse response = TelegramUsernameService.parsePublicPage("uiohiuhtsnuioipreoi3321c", html);

        assertThat(response.ok()).isTrue();
        assertThat(response.status()).isEqualTo("NOT_FOUND");
    }

    @Test
    void shouldClassifyRealContactPageAsUser() {
        String html = """
                <html>
                <head>
                  <title>Telegram: Contact @fyssia</title>
                  <meta property="og:title" content=".">
                  <meta property="al:ios:url" content="tg://resolve?domain=fyssia">
                </head>
                <body>
                  <div class="tgme_page_photo"><img class="tgme_page_photo_image"></div>
                  <div class="tgme_page_title"><span dir="auto">.</span></div>
                  <div class="tgme_page_extra">@fyssia</div>
                  <div class="tgme_page_action"><a class="tgme_action_button_new">Send Message</a></div>
                </body>
                </html>
                """;
        UsernameCheckResponse response = TelegramUsernameService.parsePublicPage("fyssia", html);

        assertThat(response.ok()).isTrue();
        assertThat(response.status()).isEqualTo("USER");
        assertThat(response.displayName()).isEqualTo(".");
        assertThat(response.avatarUrl()).isEqualTo("https://t.me/i/userpic/320/fyssia.jpg");
    }

    @Test
    void shouldClassifyContactWithoutPhotoAsUserWithoutAvatarUrl() {
        String html = """
                <html>
                <head>
                  <title>Telegram: Contact @Slavyansk1y</title>
                  <meta property="og:title" content="слава">
                  <meta property="og:image" content="https://telegram.org/img/t_logo_2x.png">
                  <meta property="al:ios:url" content="tg://resolve?domain=Slavyansk1y">
                </head>
                <body>
                  <div class="tgme_page_title"><span dir="auto">слава</span></div>
                  <div class="tgme_page_extra">@Slavyansk1y</div>
                  <div class="tgme_page_action"><a class="tgme_action_button_new">Send Message</a></div>
                </body>
                </html>
                """;
        UsernameCheckResponse response = TelegramUsernameService.parsePublicPage("slavyansk1y", html);

        assertThat(response.ok()).isTrue();
        assertThat(response.status()).isEqualTo("USER");
        assertThat(response.displayName()).isEqualTo("слава");
        assertThat(response.avatarUrl()).isNull();
    }

    @Test
    void shouldClassifyPublicPageAsBot() {
        String html = """
                <html>
                <head>
                  <title>Telegram: Launch @BotFather</title>
                  <meta property="og:title" content="BotFather">
                  <meta property="al:ios:url" content="tg://resolve?domain=BotFather">
                </head>
                <body><a>Start Bot</a></body>
                </html>
                """;
        UsernameCheckResponse response = TelegramUsernameService.parsePublicPage("botfather", html);

        assertThat(response.ok()).isTrue();
        assertThat(response.status()).isEqualTo("BOT");
        assertThat(response.displayName()).isEqualTo("BotFather");
    }

    @Test
    void shouldClassifyPublicPageAsChannelOrGroup() {
        String html = """
                <html>
                <head>
                  <title>Telegram: View @telegram</title>
                  <meta property="al:ios:url" content="tg://resolve?domain=telegram">
                </head>
                <body><a>View in Telegram</a></body>
                </html>
                """;
        UsernameCheckResponse response = TelegramUsernameService.parsePublicPage("telegram", html);

        assertThat(response.ok()).isTrue();
        assertThat(response.status()).isEqualTo("NOT_A_USER");
    }

    @Test
    void shouldReturnIsPremiumWhenPremiumCheckRequested() throws Exception {
        StubTdlibClient tdlib = new StubTdlibClient(fn -> {
            if (fn instanceof TdApi.SearchPublicChat) {
                TdApi.Chat chat = new TdApi.Chat();
                chat.type = new TdApi.ChatTypePrivate(42L);
                chat.title = "Fyssia";
                return chat;
            }
            if (fn instanceof TdApi.GetUser) {
                TdApi.User user = new TdApi.User();
                user.firstName = "Fyssia";
                user.type = new TdApi.UserTypeRegular();
                user.isPremium = true;
                return user;
            }
            return null;
        });
        TelegramUsernameService service = new TelegramUsernameService(tdlib);

        UsernameCheckResponse response = service.check("fyssia", true);

        assertThat(response.ok()).isTrue();
        assertThat(response.status()).isEqualTo("USER");
        assertThat(response.isPremium()).isTrue();
    }

    @Test
    void shouldReturnPremiumCheckUnavailableWhenTdlibNotConfigured() {
        TdlibClient tdlib = new TdlibClient(new TdlibProps(0, "", "./tdlight-session-test"));
        TelegramUsernameService service = new TelegramUsernameService(tdlib);

        UsernameCheckResponse response = service.check("fyssia", true);

        assertThat(response.ok()).isFalse();
        assertThat(response.status()).isEqualTo("PREMIUM_CHECK_UNAVAILABLE");
        assertThat(response.isPremium()).isNull();
    }

    @Test
    void shouldRejectPremiumGiftWhenRecipientAlreadyHasPremium() throws Exception {
        StubTdlibClient tdlib = new StubTdlibClient(fn -> {
            if (fn instanceof TdApi.SearchPublicChat) {
                TdApi.Chat chat = new TdApi.Chat();
                chat.type = new TdApi.ChatTypePrivate(42L);
                chat.title = "Fyssia";
                return chat;
            }
            if (fn instanceof TdApi.GetUser) {
                TdApi.User user = new TdApi.User();
                user.firstName = "Fyssia";
                user.type = new TdApi.UserTypeRegular();
                user.isPremium = true;
                return user;
            }
            return null;
        });
        TelegramUsernameService service = new TelegramUsernameService(tdlib);

        assertThatThrownBy(() -> service.assertPremiumGiftAllowed("fyssia"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(error -> {
                    ResponseStatusException exception = (ResponseStatusException) error;
                    assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
                });
    }

    @Test
    void shouldRetryGetUserForPremiumCheck() throws Exception {
        AtomicInteger getUserCalls = new AtomicInteger();
        StubTdlibClient tdlib = new StubTdlibClient(fn -> {
            if (fn instanceof TdApi.SearchPublicChat) {
                TdApi.Chat chat = new TdApi.Chat();
                chat.type = new TdApi.ChatTypePrivate(42L);
                chat.title = "Fyssia";
                return chat;
            }
            if (fn instanceof TdApi.GetUser) {
                if (getUserCalls.incrementAndGet() == 1) {
                    throw new TimeoutException("first call timeout");
                }
                TdApi.User user = new TdApi.User();
                user.firstName = "Fyssia";
                user.type = new TdApi.UserTypeRegular();
                user.isPremium = false;
                return user;
            }
            return null;
        });
        TelegramUsernameService service = new TelegramUsernameService(tdlib);

        UsernameCheckResponse response = service.check("fyssia", true);

        assertThat(response.ok()).isTrue();
        assertThat(response.status()).isEqualTo("USER");
        assertThat(response.isPremium()).isFalse();
        assertThat(getUserCalls.get()).isEqualTo(2);
    }

    @Test
    void shouldReturnTdlibConfigurationErrorWhenPublicChecksDisabledAndPublicLookupMisses() {
        TdlibClient tdlib = new TdlibClient(new TdlibProps(1, "hash", "./tdlight-session-test", "", false));
        TelegramUsernameService service = new TelegramUsernameService(tdlib) {
            @Override
            protected UsernameCheckResponse lookupViaPublicPage(String username) {
                return null;
            }
        };

        UsernameCheckResponse response = service.check("fyssia");

        assertThat(response.ok()).isFalse();
        assertThat(response.status()).isEqualTo("ERROR");
        assertThat(response.displayName()).isEqualTo("TDLib phone number is required when TDLib credentials are configured");
    }

    private static final class StubTdlibClient extends TdlibClient {
        private final ThrowingHandler handler;
        private int callCount;

        private StubTdlibClient(ThrowingHandler handler) {
            super(new TdlibProps(1, "hash", "./tdlight-session-test"));
            this.handler = handler;
        }

        @Override
        public <T extends TdApi.Object> T send(TdApi.Function<T> fn, Duration timeout) throws Exception {
            callCount++;
            return (T) handler.handle(fn);
        }

        private int callCount() {
            return callCount;
        }
    }

    @FunctionalInterface
    private interface ThrowingHandler {
        TdApi.Object handle(TdApi.Function<?> fn) throws Exception;
    }
}
