import "server-only";
import { getFragmentApiBaseUrl } from "@/config/runtime-env";

const FRAGMENT_LOCAL_API_URL = getFragmentApiBaseUrl();
const BALANCE_UPSTREAM_TIMEOUT_MS = 10_000;
const BALANCE_CHECK_UNAVAILABLE_ERROR =
  "Couldn’t verify available balance right now. Please try again.";

type JsonRecord = Record<string, unknown>;

type BalanceCheckFailure = {
  ok: false;
  code: string;
  error: string;
  status: number;
  upstreamHttpStatus?: number;
};

type BalanceCheckSuccess = {
  ok: true;
  enough: boolean;
};

export type BalanceCheckResult = BalanceCheckSuccess | BalanceCheckFailure;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function getBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
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

export async function checkAvailableBalance(
  cost: number,
): Promise<BalanceCheckResult> {
  if (!Number.isFinite(cost) || cost <= 0) {
    return {
      ok: false,
      code: "INVALID_COST",
      error: "cost must be a positive number",
      status: 400,
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    BALANCE_UPSTREAM_TIMEOUT_MS,
  );

  try {
    const response = await fetch(`${FRAGMENT_LOCAL_API_URL}/balance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ cost }),
      cache: "no-store",
      signal: controller.signal,
    });

    const payload = await readJsonRecord(response);
    if (!response.ok) {
      return {
        ok: false,
        code: "BALANCE_UPSTREAM_ERROR",
        error: BALANCE_CHECK_UNAVAILABLE_ERROR,
        status: 502,
        upstreamHttpStatus: response.status,
      };
    }

    const enough = getBoolean(payload?.enough);
    if (enough === null) {
      return {
        ok: false,
        code: "BALANCE_UPSTREAM_INVALID",
        error: BALANCE_CHECK_UNAVAILABLE_ERROR,
        status: 502,
      };
    }

    return {
      ok: true,
      enough,
    };
  } catch (error: unknown) {
    return {
      ok: false,
      code:
        error instanceof DOMException && error.name === "AbortError"
          ? "BALANCE_UPSTREAM_TIMEOUT"
          : "BALANCE_UPSTREAM_UNAVAILABLE",
      error: BALANCE_CHECK_UNAVAILABLE_ERROR,
      status:
        error instanceof DOMException && error.name === "AbortError"
          ? 504
          : 503,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
