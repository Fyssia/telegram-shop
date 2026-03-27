import { NextResponse } from "next/server";
import { API_NO_STORE_CACHE_CONTROL } from "@/config/cache-control";
import { checkAvailableBalance } from "@/server/balance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonNoStore(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", API_NO_STORE_CACHE_CONTROL);

  return NextResponse.json(body, {
    ...init,
    headers,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const body: unknown = await request.json().catch(() => null);

  if (!isRecord(body)) {
    return jsonNoStore(
      {
        ok: false,
        code: "INVALID_BODY",
        error: "Request body must be a JSON object",
        requestId,
      },
      { status: 400 },
    );
  }

  const cost = body.cost;
  if (typeof cost !== "number" || !Number.isFinite(cost) || cost <= 0) {
    return jsonNoStore(
      {
        ok: false,
        code: "INVALID_COST",
        error: "cost must be a positive number",
        requestId,
      },
      { status: 400 },
    );
  }

  const balanceCheck = await checkAvailableBalance(cost);
  if (!balanceCheck.ok) {
    return jsonNoStore(
      {
        ok: false,
        code: balanceCheck.code,
        error: balanceCheck.error,
        requestId,
        upstreamHttpStatus: balanceCheck.upstreamHttpStatus,
      },
      { status: balanceCheck.status },
    );
  }

  return jsonNoStore({
    ok: true,
    enough: balanceCheck.enough,
    requestId,
  });
}
