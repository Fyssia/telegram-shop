import { NextResponse } from "next/server";
import { API_NO_STORE_CACHE_CONTROL } from "@/config/cache-control";
import { getBackendApiBaseUrl } from "@/config/runtime-env";

const USERNAME_CHECK_TIMEOUT_MS = 15_000;
const USERNAME_CHECK_UNAVAILABLE_MESSAGE =
  "Username lookup backend is unavailable";

type JsonRecord = Record<string, unknown>;

const BACKEND_API_BASE_URL = getBackendApiBaseUrl();

function jsonNoStore(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", API_NO_STORE_CACHE_CONTROL);

  return NextResponse.json(body, {
    ...init,
    headers,
  });
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function buildErrorPayload(message: string) {
  return {
    ok: false,
    status: "ERROR",
    displayName: message,
    avatarUrl: null,
    isPremium: null,
  };
}

async function readJsonRecord(response: Response): Promise<JsonRecord | null> {
  const rawText = await response.text();
  if (!rawText) return null;

  try {
    const parsed: unknown = JSON.parse(rawText);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (!isRecord(body)) {
    return jsonNoStore(
      buildErrorPayload("Request body must be a JSON object"),
      {
        status: 400,
      },
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    USERNAME_CHECK_TIMEOUT_MS,
  );

  try {
    const upstreamResponse = await fetch(
      `${BACKEND_API_BASE_URL}/api/tg/username/check`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
        signal: controller.signal,
      },
    );

    const payload = await readJsonRecord(upstreamResponse);
    return jsonNoStore(
      payload ?? buildErrorPayload(USERNAME_CHECK_UNAVAILABLE_MESSAGE),
      {
        status: upstreamResponse.status,
      },
    );
  } catch (error: unknown) {
    return jsonNoStore(
      buildErrorPayload(
        error instanceof DOMException && error.name === "AbortError"
          ? "Username lookup request timed out"
          : USERNAME_CHECK_UNAVAILABLE_MESSAGE,
      ),
      {
        status:
          error instanceof DOMException && error.name === "AbortError"
            ? 504
            : 503,
      },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
