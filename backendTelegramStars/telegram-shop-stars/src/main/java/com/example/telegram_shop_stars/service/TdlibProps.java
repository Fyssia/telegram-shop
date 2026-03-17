package com.example.telegram_shop_stars.service;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "tg.tdlib")
public class TdlibProps {

    private int apiId;
    private String apiHash = "";
    private String sessionDir = "./tdlight-session";
    private String phoneNumber = "";
    private boolean enabledForPublicChecks = false;

    public TdlibProps() {
    }

    public TdlibProps(
            int apiId,
            String apiHash,
            String sessionDir
    ) {
        this(apiId, apiHash, sessionDir, "", true);
    }

    public TdlibProps(
            int apiId,
            String apiHash,
            String sessionDir,
            String phoneNumber,
            boolean enabledForPublicChecks
    ) {
        this.apiId = apiId;
        this.apiHash = apiHash;
        this.sessionDir = sessionDir;
        this.phoneNumber = phoneNumber;
        this.enabledForPublicChecks = enabledForPublicChecks;
    }

    public int getApiId() {
        return apiId;
    }

    public void setApiId(int apiId) {
        this.apiId = apiId;
    }

    public String getApiHash() {
        return apiHash;
    }

    public void setApiHash(String apiHash) {
        this.apiHash = apiHash;
    }

    public String getSessionDir() {
        return sessionDir;
    }

    public void setSessionDir(String sessionDir) {
        this.sessionDir = sessionDir;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public boolean isEnabledForPublicChecks() {
        return enabledForPublicChecks;
    }

    public void setEnabledForPublicChecks(boolean enabledForPublicChecks) {
        this.enabledForPublicChecks = enabledForPublicChecks;
    }
}
