import { proxyPaymentRequest } from "@/server/payments-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return proxyPaymentRequest(request, "/api/payments/ton-wallet/orders");
}
