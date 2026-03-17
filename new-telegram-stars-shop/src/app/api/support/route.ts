import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const SUPPORT_WEBHOOK_URL = process.env.SUPPORT_WEBHOOK_URL?.trim();
const SUPPORT_TELEGRAM_BOT_TOKEN =
  process.env.SUPPORT_TELEGRAM_BOT_TOKEN?.trim() ??
  process.env.TELEGRAM_BOT_TOKEN?.trim();
const SUPPORT_TELEGRAM_CHAT_ID = process.env.SUPPORT_TELEGRAM_CHAT_ID?.trim();
const SUPPORT_UPSTREAM_TIMEOUT_MS = 8_000;

type SupportPayload = {
  email: string;
  message: string;
};

function isValidEmail(email: string): boolean {
  return (
    email.length > 3 &&
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}

function isValidMessage(message: string): boolean {
  return message.length >= 10 && message.length <= 2000;
}

function sanitizeInput(input: string): string {
  return input.trim();
}

function toSupportWebhookPayload(payload: SupportPayload, requestId: string) {
  return {
    source: "quackstars-web",
    requestId,
    createdAt: new Date().toISOString(),
    email: payload.email,
    message: payload.message,
  };
}

function toTelegramText(payload: SupportPayload, requestId: string): string {
  return [
    "New support request",
    `Request ID: ${requestId}`,
    `Email: ${payload.email}`,
    "",
    payload.message,
  ].join("\n");
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    SUPPORT_UPSTREAM_TIMEOUT_MS,
  );

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function submitToWebhook(
  payload: SupportPayload,
  requestId: string,
): Promise<boolean> {
  if (!SUPPORT_WEBHOOK_URL) return false;

  try {
    const response = await fetchWithTimeout(SUPPORT_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(toSupportWebhookPayload(payload, requestId)),
      cache: "no-store",
    });

    return response.ok;
  } catch {
    return false;
  }
}

async function submitToTelegram(
  payload: SupportPayload,
  requestId: string,
): Promise<boolean> {
  if (!SUPPORT_TELEGRAM_BOT_TOKEN || !SUPPORT_TELEGRAM_CHAT_ID) return false;

  const endpoint = `https://api.telegram.org/bot${SUPPORT_TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    const response = await fetchWithTimeout(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        chat_id: SUPPORT_TELEGRAM_CHAT_ID,
        text: toTelegramText(payload, requestId),
        disable_web_page_preview: true,
      }),
      cache: "no-store",
    });

    return response.ok;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "INVALID_JSON", requestId },
      { status: 400 },
    );
  }

  const emailRaw =
    typeof body === "object" &&
    body !== null &&
    "email" in body &&
    typeof (body as { email?: unknown }).email === "string"
      ? (body as { email: string }).email
      : "";

  const messageRaw =
    typeof body === "object" &&
    body !== null &&
    "message" in body &&
    typeof (body as { message?: unknown }).message === "string"
      ? (body as { message: string }).message
      : "";

  const payload: SupportPayload = {
    email: sanitizeInput(emailRaw),
    message: sanitizeInput(messageRaw),
  };

  if (!isValidEmail(payload.email) || !isValidMessage(payload.message)) {
    return NextResponse.json(
      { ok: false, code: "VALIDATION_ERROR", requestId },
      { status: 400 },
    );
  }

  const hasTelegramTransport =
    Boolean(SUPPORT_TELEGRAM_BOT_TOKEN) && Boolean(SUPPORT_TELEGRAM_CHAT_ID);
  const hasWebhookTransport = Boolean(SUPPORT_WEBHOOK_URL);
  if (!hasTelegramTransport && !hasWebhookTransport) {
    return NextResponse.json(
      { ok: false, code: "SUPPORT_UNAVAILABLE", requestId },
      { status: 503 },
    );
  }

  try {
    const [sentToTelegram, sentToWebhook] = await Promise.all([
      hasTelegramTransport
        ? submitToTelegram(payload, requestId)
        : Promise.resolve(false),
      hasWebhookTransport
        ? submitToWebhook(payload, requestId)
        : Promise.resolve(false),
    ]);

    if (!sentToTelegram && !sentToWebhook) {
      return NextResponse.json(
        { ok: false, code: "SUPPORT_DELIVERY_FAILED", requestId },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, requestId });
  } catch {
    return NextResponse.json(
      { ok: false, code: "SUPPORT_DELIVERY_FAILED", requestId },
      { status: 502 },
    );
  }
}
