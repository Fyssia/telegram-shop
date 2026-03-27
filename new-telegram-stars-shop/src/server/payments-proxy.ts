import "server-only";

import { NextResponse } from "next/server";
import { API_NO_STORE_CACHE_CONTROL } from "@/config/cache-control";
import { getBackendApiBaseUrl } from "@/config/runtime-env";

const PAYMENTS_UPSTREAM_TIMEOUT_MS = 60_000;
const INSUFFICIENT_BALANCE_ERROR =
  "This order can’t be created right now because the service balance is insufficient. Please try again later.";
const PAYMENTS_UPSTREAM_UNAVAILABLE_ERROR =
  "Payment service is temporarily unavailable. Please try again.";
const PAYMENT_METHOD_UNAVAILABLE_ERROR = "Payment method is unavailable.";

type JsonRecord = Record<string, unknown>;

type JsonErrorExtra = {
  requestId: string;
  upstreamHttpStatus?: number;
};

const BACKEND_API_BASE_URL = getBackendApiBaseUrl();

function jsonNoStore(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", API_NO_STORE_CACHE_CONTROL);

  return NextResponse.json(body, {
    ...init,
    headers,
  });
}

function jsonError(
  httpStatus: number,
  code: string,
  error: string,
  extra: JsonErrorExtra,
) {
  return jsonNoStore(
    {
      ok: false,
      code,
      error,
      requestId: extra.requestId,
      upstreamHttpStatus: extra.upstreamHttpStatus,
    },
    { status: httpStatus },
  );
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseJsonRecord(rawText: string): JsonRecord | null {
  if (!rawText) return null;

  try {
    const parsed: unknown = JSON.parse(rawText);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function compactText(rawText: string): string | null {
  if (!rawText.trim()) {
    return null;
  }

  const compact = rawText.replace(/\s+/g, " ").trim();
  if (!compact) {
    return null;
  }

  const normalized = compact.toLowerCase();
  if (
    normalized.startsWith("<!doctype") ||
    normalized.startsWith("<html") ||
    normalized.includes("<body")
  ) {
    return null;
  }

  return compact.length > 280 ? `${compact.slice(0, 277)}...` : compact;
}

function extractProblemCode(record: JsonRecord | null): string | null {
  return getString(record?.code);
}

function extractProblemMessage(
  record: JsonRecord | null,
  rawText: string,
): string | null {
  return (
    getString(record?.detail) ??
    getString(record?.error) ??
    getString(record?.title) ??
    getString(record?.message) ??
    compactText(rawText)
  );
}

function buildUpstreamHeaders(request: Request) {
  const headers = new Headers();

  for (const [key, value] of request.headers) {
    const normalizedKey = key.toLowerCase();
    if (
      normalizedKey === "connection" ||
      normalizedKey === "content-length" ||
      normalizedKey === "host" ||
      normalizedKey === "transfer-encoding"
    ) {
      continue;
    }

    headers.set(key, value);
  }

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  return headers;
}

function sanitizeForwardedResponseHeaders(headers: Headers) {
  headers.delete("content-encoding");
  headers.delete("content-length");
  headers.delete("transfer-encoding");
}

function isTonDevCreateOrderRequest(
  upstreamPath: string,
  body: unknown,
): boolean {
  if (upstreamPath !== "/api/payments/ton-wallet/orders") {
    return false;
  }
  if (!isRecord(body)) {
    return false;
  }

  return getString(body.paymentMethod) === "ton_dev";
}

export async function proxyPaymentRequest(
  request: Request,
  upstreamPath: string,
) {
  const requestId = crypto.randomUUID();
  const rawBody = await request.text();

  let parsedBody: unknown = null;
  if (rawBody) {
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      return jsonError(400, "INVALID_JSON", "Request body must be valid JSON", {
        requestId,
      });
    }
  }

  if (
    process.env.NODE_ENV === "production" &&
    isTonDevCreateOrderRequest(upstreamPath, parsedBody)
  ) {
    return jsonError(
      404,
      "PAYMENT_METHOD_UNAVAILABLE",
      PAYMENT_METHOD_UNAVAILABLE_ERROR,
      {
        requestId,
      },
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    PAYMENTS_UPSTREAM_TIMEOUT_MS,
  );

  try {
    const upstreamResponse = await fetch(
      `${BACKEND_API_BASE_URL}${upstreamPath}`,
      {
        method: request.method,
        headers: buildUpstreamHeaders(request),
        body: rawBody || undefined,
        cache: "no-store",
        signal: controller.signal,
      },
    );

    const upstreamText = await upstreamResponse.text();
    if (!upstreamResponse.ok) {
      const upstreamRecord = parseJsonRecord(upstreamText);
      return jsonError(
        upstreamResponse.status,
        extractProblemCode(upstreamRecord) ?? "PAYMENTS_UPSTREAM_ERROR",
        extractProblemMessage(upstreamRecord, upstreamText) ??
          PAYMENTS_UPSTREAM_UNAVAILABLE_ERROR,
        {
          requestId,
          upstreamHttpStatus: upstreamResponse.status,
        },
      );
    }

    const headers = new Headers(upstreamResponse.headers);
    sanitizeForwardedResponseHeaders(headers);
    headers.set("Cache-Control", API_NO_STORE_CACHE_CONTROL);

    return new NextResponse(upstreamText || null, {
      status: upstreamResponse.status,
      headers,
    });
  } catch (error: unknown) {
    return jsonError(
      error instanceof DOMException && error.name === "AbortError" ? 504 : 503,
      error instanceof DOMException && error.name === "AbortError"
        ? "PAYMENTS_UPSTREAM_TIMEOUT"
        : "PAYMENTS_UPSTREAM_UNAVAILABLE",
      PAYMENTS_UPSTREAM_UNAVAILABLE_ERROR,
      {
        requestId,
      },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
