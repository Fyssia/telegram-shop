import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { TONCONNECT_MANIFEST_CACHE_CONTROL } from "@/config/cache-control";

const APP_NAME =
  process.env.NEXT_PUBLIC_TONCONNECT_APP_NAME?.trim() || "Quack Stars";
const ICON_PATH =
  process.env.NEXT_PUBLIC_TONCONNECT_ICON_PATH?.trim() || "/logo-mark.svg";
const TERMS_PATH =
  process.env.NEXT_PUBLIC_TONCONNECT_TERMS_PATH?.trim() || "/en/terms";
const PRIVACY_PATH =
  process.env.NEXT_PUBLIC_TONCONNECT_PRIVACY_PATH?.trim() || "/en/privacy";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const EXAMPLE_COM_HOST = "example.com";

function isHttpUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://");
}

function normalizeBaseUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!isHttpUrl(trimmed)) return null;

  try {
    const parsed = new URL(trimmed);
    return parsed.origin;
  } catch {
    return null;
  }
}

function isPlaceholderBaseUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host === EXAMPLE_COM_HOST || host.endsWith(`.${EXAMPLE_COM_HOST}`);
  } catch {
    return false;
  }
}

function resolveBaseUrlFromRequest(request: NextRequest): string | null {
  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const host =
    forwardedHost ||
    request.headers.get("host")?.trim() ||
    request.nextUrl.host;
  if (!host) return null;

  const requestProtocol = request.nextUrl.protocol.replace(":", "").trim();
  const proto =
    forwardedProto && (forwardedProto === "http" || forwardedProto === "https")
      ? forwardedProto
      : requestProtocol === "http" || requestProtocol === "https"
        ? requestProtocol
        : null;
  if (!proto) return null;

  return `${proto}://${host}`;
}

function resolveTargetUrl(baseUrl: string, pathOrUrl: string): string {
  const raw = pathOrUrl.trim();
  if (!raw) {
    return baseUrl;
  }
  if (isHttpUrl(raw)) {
    return raw;
  }

  return new URL(
    raw.startsWith("/") ? raw : `/${raw}`,
    `${baseUrl}/`,
  ).toString();
}

export function GET(request: NextRequest) {
  const explicitBaseUrl = normalizeBaseUrl(SITE_URL);
  const baseUrl =
    explicitBaseUrl && !isPlaceholderBaseUrl(explicitBaseUrl)
      ? explicitBaseUrl
      : resolveBaseUrlFromRequest(request);
  if (!baseUrl) {
    return NextResponse.json(
      {
        error:
          "Unable to resolve public site URL for TON Connect manifest. Set NEXT_PUBLIC_SITE_URL to your real HTTPS domain.",
      },
      { status: 500 },
    );
  }

  const payload = {
    url: baseUrl,
    name: APP_NAME,
    iconUrl: resolveTargetUrl(baseUrl, ICON_PATH),
    termsOfUseUrl: resolveTargetUrl(baseUrl, TERMS_PATH),
    privacyPolicyUrl: resolveTargetUrl(baseUrl, PRIVACY_PATH),
  };

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": TONCONNECT_MANIFEST_CACHE_CONTROL,
    },
  });
}
