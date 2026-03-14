import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

const FRAGMENT_LOCAL_API_URL =
  process.env.FRAGMENT_LOCAL_API_URL ?? "http://127.0.0.1:8080/api";
const UPSTREAM_TIMEOUT_MS = 180_000;
const USERNAME_RE = /^[a-z0-9_]{5,32}$/;
const PREMIUM_GIFT_MONTHS = new Set([3, 6, 12]);
const inFlightIdempotencyKeys = new Set<string>();
const IDEMPOTENCY_CACHE_TTL_MS = 5 * 60_000;
const IDEMPOTENCY_CACHE_MAX_SIZE = 2_000;
const completedIdempotencyResponses = new Map<
  string,
  CachedIdempotencyResponse
>();
let idempotencySweepCounter = 0;

type CachedIdempotencyResponse = {
  statusCode: number;
  payload: Record<string, unknown>;
  expiresAt: number;
};

type FragmentMethod = "buyStars" | "giftPremium";

type FragmentRequest = {
  method: FragmentMethod;
  recipient: string;
  quantity: number;
};

type FragmentApiResponse = {
  status?: unknown;
  error?: unknown;
};

type ParsedUpstreamPayload = {
  json: Record<string, unknown> | null;
  rawText: string;
};

type ErrorResponseExtra = {
  requestId: string;
  idempotencyKey?: string;
  upstreamHttpStatus?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeRecipient(value: string): string {
  return value.trim().replace(/^@+/, "").toLowerCase();
}

function getString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function sweepIdempotencyCache(now: number) {
  for (const [key, value] of completedIdempotencyResponses) {
    if (value.expiresAt <= now) {
      completedIdempotencyResponses.delete(key);
    }
  }

  while (completedIdempotencyResponses.size > IDEMPOTENCY_CACHE_MAX_SIZE) {
    const oldestKey = completedIdempotencyResponses.keys().next().value;
    if (typeof oldestKey !== "string") {
      break;
    }
    completedIdempotencyResponses.delete(oldestKey);
  }
}

function maybeSweepIdempotencyCache() {
  idempotencySweepCounter++;
  if ((idempotencySweepCounter & 63) === 0) {
    sweepIdempotencyCache(Date.now());
  }
}

function getCompletedIdempotencyResponse(
  key: string,
): CachedIdempotencyResponse | null {
  const value = completedIdempotencyResponses.get(key);
  if (!value) return null;

  if (value.expiresAt <= Date.now()) {
    completedIdempotencyResponses.delete(key);
    return null;
  }

  return value;
}

function setCompletedIdempotencyResponse(
  key: string,
  statusCode: number,
  payload: Record<string, unknown>,
) {
  const now = Date.now();
  sweepIdempotencyCache(now);
  if (completedIdempotencyResponses.size >= IDEMPOTENCY_CACHE_MAX_SIZE) {
    const oldestKey = completedIdempotencyResponses.keys().next().value;
    if (typeof oldestKey === "string") {
      completedIdempotencyResponses.delete(oldestKey);
    }
  }
  completedIdempotencyResponses.set(key, {
    statusCode,
    payload,
    expiresAt: now + IDEMPOTENCY_CACHE_TTL_MS,
  });
}

function jsonError(
  httpStatus: number,
  code: string,
  error: string,
  extra: ErrorResponseExtra,
) {
  return NextResponse.json(
    {
      ok: false,
      code,
      error,
      requestId: extra.requestId,
      idempotencyKey: extra.idempotencyKey,
      upstreamHttpStatus: extra.upstreamHttpStatus,
    },
    { status: httpStatus },
  );
}

function validatePayload(
  body: unknown,
): { ok: true; value: FragmentRequest } | { ok: false; error: string } {
  if (!isRecord(body)) {
    return { ok: false, error: "Request body must be a JSON object" };
  }

  const method = getString(body.method);
  const recipientRaw = getString(body.recipient);
  const quantityRaw = body.quantity;

  if (method !== "buyStars" && method !== "giftPremium") {
    return { ok: false, error: "Unsupported method" };
  }

  if (typeof recipientRaw !== "string") {
    return { ok: false, error: "recipient must be a string" };
  }

  const recipient = normalizeRecipient(recipientRaw);
  if (!USERNAME_RE.test(recipient)) {
    return { ok: false, error: "Invalid Telegram username format" };
  }

  if (typeof quantityRaw !== "number" || !Number.isSafeInteger(quantityRaw)) {
    return { ok: false, error: "quantity must be an integer" };
  }
  const quantity = quantityRaw;

  if (method === "buyStars") {
    if (quantity <= 0) {
      return { ok: false, error: "quantity must be > 0 for buyStars" };
    }
  } else if (!PREMIUM_GIFT_MONTHS.has(quantity)) {
    return {
      ok: false,
      error: "quantity must be one of 3, 6, 12 for giftPremium",
    };
  }

  return {
    ok: true,
    value: {
      method,
      recipient,
      quantity,
    },
  };
}

async function readJsonObject(
  response: Response,
): Promise<ParsedUpstreamPayload> {
  const rawText = await response.text();
  if (!rawText) {
    return {
      json: null,
      rawText: "",
    };
  }

  try {
    const parsed: unknown = JSON.parse(rawText);
    return {
      json: isRecord(parsed) ? parsed : null,
      rawText,
    };
  } catch {
    return {
      json: null,
      rawText,
    };
  }
}

function compactBody(value: string): string {
  if (!value) return "";
  const compact = value.replace(/\s+/g, " ").trim();
  if (!compact) return "";
  if (compact.length <= 240) return compact;
  return `${compact.slice(0, 240)}...`;
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const rawIdempotencyKey = request.headers.get("Idempotency-Key")?.trim();
  const idempotencyKey =
    rawIdempotencyKey && rawIdempotencyKey.length <= 128
      ? rawIdempotencyKey
      : undefined;

  maybeSweepIdempotencyCache();

  if (idempotencyKey) {
    const cached = getCompletedIdempotencyResponse(idempotencyKey);
    if (cached) {
      return NextResponse.json(cached.payload, { status: cached.statusCode });
    }
  }

  if (idempotencyKey && inFlightIdempotencyKeys.has(idempotencyKey)) {
    return jsonError(
      409,
      "DUPLICATE_IN_FLIGHT",
      "Request is already being processed",
      {
        requestId,
        idempotencyKey,
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "INVALID_JSON", "Request body must be valid JSON", {
      requestId,
      idempotencyKey,
    });
  }

  const validation = validatePayload(body);
  if (!validation.ok) {
    return jsonError(400, "VALIDATION_ERROR", validation.error, {
      requestId,
      idempotencyKey,
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  if (idempotencyKey) {
    inFlightIdempotencyKeys.add(idempotencyKey);
  }

  try {
    const upstreamResponse = await fetch(FRAGMENT_LOCAL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(validation.value),
      signal: controller.signal,
      cache: "no-store",
    });

    const parsed = await readJsonObject(upstreamResponse);
    const compactUpstreamBody = compactBody(parsed.rawText);
    const upstream = (parsed.json ?? {}) as FragmentApiResponse;
    const upstreamStatus = getString(upstream.status);
    const upstreamError = getString(upstream.error)?.trim();

    if (upstreamStatus === "CONFIRMED") {
      const payload = {
        ok: true,
        status: "CONFIRMED",
        requestId,
        idempotencyKey,
      };
      if (idempotencyKey) {
        setCompletedIdempotencyResponse(idempotencyKey, 200, payload);
      }
      return NextResponse.json(payload, { status: 200 });
    }

    if (upstreamStatus === "FAILED") {
      const message =
        upstreamError ||
        (compactUpstreamBody
          ? `Fragment API returned FAILED: ${compactUpstreamBody}`
          : "Fragment API returned FAILED");
      const statusCode =
        upstreamResponse.status >= 400 && upstreamResponse.status < 600
          ? upstreamResponse.status
          : 502;

      const payload = {
        ok: false,
        status: "FAILED",
        error: message,
        requestId,
        idempotencyKey,
        upstreamHttpStatus: upstreamResponse.status,
      };
      if (idempotencyKey) {
        setCompletedIdempotencyResponse(idempotencyKey, statusCode, payload);
      }
      return NextResponse.json(payload, { status: statusCode });
    }

    const upstreamContextParts = [`HTTP ${upstreamResponse.status}`];
    if (upstreamStatus) {
      upstreamContextParts.push(`status=${upstreamStatus}`);
    }
    if (compactUpstreamBody) {
      upstreamContextParts.push(`body=${compactUpstreamBody}`);
    }
    const configHint =
      upstreamResponse.status === 401 ||
      upstreamResponse.status === 403 ||
      upstreamResponse.status === 404 ||
      upstreamResponse.status === 405
        ? " Check FRAGMENT_LOCAL_API_URL and local API port mapping."
        : "";

    return jsonError(
      502,
      "UPSTREAM_INVALID_RESPONSE",
      `Fragment API returned invalid JSON or unexpected status (${upstreamContextParts.join(", ")})${configHint}`,
      {
        requestId,
        idempotencyKey,
        upstreamHttpStatus: upstreamResponse.status,
      },
    );
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return jsonError(
        504,
        "UPSTREAM_TIMEOUT",
        "Fragment API request timed out",
        {
          requestId,
          idempotencyKey,
        },
      );
    }

    console.error("Fragment proxy error", { requestId, error });
    return jsonError(
      502,
      "UPSTREAM_REQUEST_FAILED",
      "Failed to reach Fragment API",
      {
        requestId,
        idempotencyKey,
      },
    );
  } finally {
    clearTimeout(timeout);
    if (idempotencyKey) {
      inFlightIdempotencyKeys.delete(idempotencyKey);
    }
  }
}
