package com.example.telegram_shop_stars.service;

import it.tdlight.Init;
import it.tdlight.client.APIToken;
import it.tdlight.client.AuthenticationSupplier;
import it.tdlight.client.SimpleTelegramClient;
import it.tdlight.client.SimpleTelegramClientFactory;
import it.tdlight.client.TDLibSettings;
import it.tdlight.jni.TdApi;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.time.Duration;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Component
public class TdlibClient implements DisposableBean {
    private final TdlibProps props;
    private final boolean configured;
    private volatile SimpleTelegramClientFactory clientFactory;
    private volatile SimpleTelegramClient client;

    public TdlibClient(TdlibProps props) {
        this.props = props;
        this.configured = props.getApiId() > 0 && props.getApiHash() != null && !props.getApiHash().isBlank();
    }

    public <T extends TdApi.Object> T send(TdApi.Function<T> fn, Duration timeout) throws Exception {
        if (!configured) {
            throw new IllegalStateException("TDLib credentials are not configured");
        }
        CompletableFuture<T> future = getClient().send(fn);
        return future.get(timeout.toMillis(), TimeUnit.MILLISECONDS);
    }

    public boolean isConfigured() {
        return configured;
    }

    public boolean isEnabledForPublicChecks() {
        return configured && props.isEnabledForPublicChecks();
    }

    private SimpleTelegramClient getClient() throws Exception {
        SimpleTelegramClient localClient = client;
        if (localClient != null) {
            return localClient;
        }

        synchronized (this) {
            if (client != null) {
                return client;
            }

            Init.init();

            String sessionDir = props.getSessionDir() == null || props.getSessionDir().isBlank()
                    ? "./tdlight-session"
                    : props.getSessionDir();

            TDLibSettings settings = TDLibSettings.create(new APIToken(props.getApiId(), props.getApiHash()));
            Path sessionPath = Path.of(sessionDir).toAbsolutePath().normalize();
            settings.setDatabaseDirectoryPath(sessionPath);
            settings.setDownloadedFilesDirectoryPath(sessionPath.resolve("files"));
            settings.setEnableStorageOptimizer(true);

            SimpleTelegramClientFactory localFactory = new SimpleTelegramClientFactory();
            SimpleTelegramClient builtClient = localFactory.builder(settings).build(resolveAuthSupplier());

            this.clientFactory = localFactory;
            this.client = builtClient;
            return builtClient;
        }
    }

    private AuthenticationSupplier<?> resolveAuthSupplier() {
        String phone = props.getPhoneNumber();
        if (phone == null || phone.isBlank()) {
            phone = System.getenv("TDLIB_PHONE_NUMBER");
        }
        if (phone != null && !phone.isBlank()) {
            return AuthenticationSupplier.user(phone);
        }
        throw new IllegalStateException(
                "TDLib phone number is required when TDLib credentials are configured"
        );
    }

    @Override
    public void destroy() {
        SimpleTelegramClient localClient = this.client;
        if (localClient != null) {
            try {
                localClient.close();
            } catch (Exception ignored) {
                // no-op
            }
        }

        SimpleTelegramClientFactory localFactory = this.clientFactory;
        if (localFactory != null) {
            localFactory.close();
        }
    }
}
