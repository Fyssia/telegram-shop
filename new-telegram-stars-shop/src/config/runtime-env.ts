const DEV_BACKEND_API_BASE_URL = "http://127.0.0.1:8081";
const DEV_FRAGMENT_API_BASE_URL = "http://127.0.0.1:8080/api";
const DEV_SITE_URL = "http://localhost:3000";

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function readOptionalEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function resolveServerUrl(envName: string, developmentDefault: string): string {
  const configured = readOptionalEnv(envName);
  if (configured) {
    return trimTrailingSlash(configured);
  }
  if (isProductionRuntime()) {
    throw new Error(`${envName} must be set in production`);
  }
  return developmentDefault;
}

export function getBackendApiBaseUrl(): string {
  return resolveServerUrl("BACKEND_API_BASE_URL", DEV_BACKEND_API_BASE_URL);
}

export function getFragmentApiBaseUrl(): string {
  return resolveServerUrl("FRAGMENT_LOCAL_API_URL", DEV_FRAGMENT_API_BASE_URL);
}

export function getPublicSiteUrl(): string {
  const configuredSiteUrl =
    readOptionalEnv("NEXT_PUBLIC_SITE_URL") ?? readOptionalEnv("SITE_URL");
  if (configuredSiteUrl) {
    return trimTrailingSlash(configuredSiteUrl);
  }

  const vercelUrl = readOptionalEnv("VERCEL_URL");
  if (vercelUrl) {
    return `https://${trimTrailingSlash(vercelUrl)}`;
  }

  if (isProductionRuntime()) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL or SITE_URL must be set in production",
    );
  }

  return DEV_SITE_URL;
}
