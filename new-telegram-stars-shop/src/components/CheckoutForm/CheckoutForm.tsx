"use client";

import {
  CHAIN,
  UserRejectsError,
  useTonConnectUI,
  useTonWallet,
  WalletNotConnectedError,
} from "@tonconnect/ui-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PAGES } from "@/config/pages.config";
import { useI18n } from "@/i18n/client";
import { localizePath } from "@/i18n/routing";
import { formatUsdAmount, resolveStarsAmountUsd } from "@/shared/pricing";
import { UsernameBadge } from "../Avatar/Avatar";
import styles from "./checkoutForm.module.scss";

const USERNAME_RE = /^[a-z0-9_]{5,32}$/;

type PurchaseSubmitState = "idle" | "submitting" | "success" | "error";
type SubmitStage = "payment" | "balance";

type JsonRecord = Record<string, unknown>;

type InvoiceCreateRequestPayload = {
  orderId?: number;
  username: string;
  starsAmount: number;
  fulfillmentMethod: "buyStars" | "giftPremium";
  currencyType: "fiat";
  amount: number;
  fiat: "USD";
  acceptedAssets?: string;
  description: string;
  payload: string;
  expiresIn: number;
};

type TonWalletCreateOrderRequestPayload = {
  orderId?: number;
  username: string;
  starsAmount: number;
  fulfillmentMethod: "buyStars" | "giftPremium";
  amount: number;
  paymentMethod: "ton" | "usdt_ton" | "ton_dev";
  senderAddress: string;
};

type InvoiceCreateResponsePayload = {
  orderId?: number;
  invoiceHash?: string;
  invoiceStatus?: string;
  paymentStatus?: string;
  orderStatus?: string;
  botInvoiceUrl?: string;
  miniAppInvoiceUrl?: string;
  webAppInvoiceUrl?: string;
};

type BalanceCheckResponsePayload = {
  enough?: boolean;
};

type TonWalletOrderResponsePayload = {
  orderId?: number;
  paymentReference?: string;
  paymentStatus?: string;
  orderStatus?: string;
  paymentMethod?: string;
  asset?: string;
  assetAmount?: string;
  assetAmountBaseUnits?: string;
  transferAddress?: string;
  transferAmount?: string;
  transferPayload?: string;
  recipientAddress?: string;
  validUntil?: number;
  network?: string;
};

type UsernameCheckStatus =
  | "idle"
  | "typing"
  | "checking"
  | "valid"
  | "already_premium"
  | "invalid"
  | "not_found"
  | "bot"
  | "not_a_user"
  | "error";

type UsernameCheckPayload = {
  ok?: boolean;
  status?: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  isPremium?: boolean | null;
};

type UsernameCheckCacheEntry = {
  payload: UsernameCheckPayload;
  expiresAt: number;
};

type PaymentMethodValue =
  | "fiat"
  | "ton_wallet"
  | "crypto_bot"
  | "usdt_ton"
  | "ton"
  | "usdt_trc20"
  | "ton_dev";
type PaymentMethodOption = {
  value: PaymentMethodValue;
  label: string;
  accent: string;
};
type PurchaseKindValue = "stars" | "premium";
type PremiumDurationValue = 3 | 6 | 12;

const PREMIUM_DURATION_OPTIONS = [3, 6, 12] as const;
const PREMIUM_DURATION_PRICES_USD: Record<PremiumDurationValue, number> = {
  3: 12.99,
  6: 23.99,
  12: 42.99,
};
const ORDER_POLL_INTERVAL_MS = 5_000;
const ORDER_POLL_MAX_DURATION_MS = 15 * 60_000;
const DEV_PAYMENT_METHOD_ENABLED = process.env.NODE_ENV !== "production";
const SPLIT_PAYMENT_METHOD_ICON_SRC: Partial<Record<PaymentMethodValue, string>> =
  {
    ton: "/payment-methods/split/ton.svg",
    ton_dev: "/payment-methods/split/tondev.png",
    usdt_ton: "/payment-methods/split/usdt.svg",
    usdt_trc20: "/payment-methods/split/usdt.svg",
    // split.tg uses xRocket artwork instead of a dedicated Crypto Bot icon.
    crypto_bot: "/payment-methods/split/xrocket.svg",
  };

function getSplitPaymentMethodIconSrc(method: PaymentMethodValue) {
  return SPLIT_PAYMENT_METHOD_ICON_SRC[method] ?? null;
}

function PaymentMethodGlyph({ method }: { method: PaymentMethodValue }) {
  const splitIconSrc = getSplitPaymentMethodIconSrc(method);

  if (splitIconSrc) {
    return (
      <img
        src={splitIconSrc}
        alt=""
        className={styles.checkout__paymentMethodImage}
        decoding="async"
        draggable={false}
      />
    );
  }

  if (method === "usdt_ton" || method === "usdt_trc20") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        focusable="false"
        aria-hidden="true"
      >
        <path
          d="M6.1 6.45h11.8"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        <path
          d="M9.2 6.45V4.95h5.6v1.5"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 6.85v9.55"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        <path
          d="M7.95 9.8c1.28.7 2.63 1.04 4.05 1.04s2.77-.34 4.05-1.04"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        <path
          d="M8.7 10.45v1.72c0 .83 1.48 1.49 3.3 1.49s3.3-.66 3.3-1.49v-1.72"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (method === "crypto_bot") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        focusable="false"
        aria-hidden="true"
      >
        <path
          d="M9.15 7.3V6.45a2.85 2.85 0 0 1 5.7 0v.85"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        <rect
          x="5.35"
          y="7.8"
          width="13.3"
          height="9.1"
          rx="4.25"
          stroke="currentColor"
          strokeWidth="1.9"
        />
        <circle cx="9.5" cy="12.25" r="1.15" fill="currentColor" />
        <circle cx="14.5" cy="12.25" r="1.15" fill="currentColor" />
        <path
          d="M10.05 14.95c.52.31 1.17.46 1.95.46s1.43-.15 1.95-.46"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (method === "fiat") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        focusable="false"
        aria-hidden="true"
      >
        <rect
          x="4.6"
          y="6.5"
          width="14.8"
          height="10.8"
          rx="3.25"
          stroke="currentColor"
          strokeWidth="1.9"
        />
        <path
          d="M4.95 10.15h14.1"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        <path
          d="M8.05 14.15h3.3"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (method === "ton_wallet") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        focusable="false"
        aria-hidden="true"
      >
        <path
          d="M6.95 8.05h9.85a2.75 2.75 0 0 1 2.75 2.75v2.85a2.75 2.75 0 0 1-2.75 2.75h-9.6a2.75 2.75 0 0 1-2.75-2.75v-3.1a2.5 2.5 0 0 1 2.5-2.5Z"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinejoin="round"
        />
        <path
          d="M6.7 8.05v-.4a1.7 1.7 0 0 1 1.7-1.7h7.15"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        <path
          d="M15.2 12.25h2.1"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      focusable="false"
      aria-hidden="true"
    >
      <path d="M12 3.8 6.45 8.58a.72.72 0 0 0-.14.9L11.44 18a.64.64 0 0 0 1.12 0l5.13-8.52a.72.72 0 0 0-.14-.9z" />
      <path
        d="M12 7.3 9.23 9.66h5.54z"
        fill={
          method === "ton_dev"
            ? "rgba(255,255,255,0.78)"
            : "rgba(255,255,255,0.88)"
        }
      />
    </svg>
  );
}

function getPaymentMethodMarkerTone(
  method: PaymentMethodValue,
): "cyan" | "rose" | "violet" | null {
  if (getSplitPaymentMethodIconSrc(method)) return null;
  if (method === "usdt_ton") return "cyan";
  if (method === "usdt_trc20") return "rose";
  if (method === "ton_dev") return "violet";
  return null;
}

function PaymentMethodIcon({
  method,
  className,
}: {
  method: PaymentMethodValue;
  className?: string;
}) {
  const splitIconSrc = getSplitPaymentMethodIconSrc(method);
  const markerTone = getPaymentMethodMarkerTone(method);

  return (
    <span
      className={`${styles.checkout__paymentMethodIcon} ${className ?? ""}`.trim()}
      data-method={method}
      data-source={splitIconSrc ? "split" : "local"}
      data-marker={markerTone ?? "none"}
      aria-hidden="true"
    >
      <span className={styles.checkout__paymentMethodGlyph}>
        <PaymentMethodGlyph method={method} />
      </span>
      {markerTone ? (
        <span
          className={styles.checkout__paymentMethodMarker}
          data-tone={markerTone}
        />
      ) : null}
    </span>
  );
}

function clampAmount(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeAmountValue(
  value: number,
  min: number,
  max: number,
  step: number,
) {
  const clamped = clampAmount(Math.round(value), min, max);
  const stepsFromMin = Math.round((clamped - min) / step);
  return clampAmount(min + stepsFromMin * step, min, max);
}

function parseAmountInputValue(value: string) {
  const digits = value.replace(/\D+/g, "");
  if (!digits) return null;

  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeUsername(value: string): string {
  return value.trim().replace(/^@+/, "").toLowerCase();
}

function isInvalidUsernameStatus(status: UsernameCheckStatus): boolean {
  return (
    status === "already_premium" ||
    status === "invalid" ||
    status === "not_found" ||
    status === "bot" ||
    status === "not_a_user" ||
    status === "error"
  );
}

function createIdempotencyKey(prefix: PurchaseKindValue): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getStringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function getNumberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function getBooleanValue(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

async function readJsonRecord(response: Response): Promise<JsonRecord | null> {
  const text = await response.text();
  if (!text) return null;

  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed as JsonRecord;
  } catch {
    return null;
  }
}

function resolveInvoiceAmountUsd(
  isPremiumCheckout: boolean,
  starsAmount: number,
  premiumDuration: PremiumDurationValue,
) {
  if (isPremiumCheckout) {
    return PREMIUM_DURATION_PRICES_USD[premiumDuration];
  }

  return resolveStarsAmountUsd(starsAmount);
}

function buildInvoiceCreateRequest(options: {
  orderId?: number;
  recipient: string;
  quantity: number;
  paymentMethod: PaymentMethodValue;
  isPremiumCheckout: boolean;
  premiumDuration: PremiumDurationValue;
}): InvoiceCreateRequestPayload {
  const { orderId, recipient, quantity, paymentMethod, isPremiumCheckout } =
    options;
  const fulfillmentMethod = isPremiumCheckout ? "giftPremium" : "buyStars";
  const amountUsd = resolveInvoiceAmountUsd(
    isPremiumCheckout,
    quantity,
    options.premiumDuration,
  );
  const description = isPremiumCheckout
    ? `Telegram Premium gift (${quantity} months) for @${recipient}`
    : `Telegram Stars (${quantity}) for @${recipient}`;
  const payload = JSON.stringify({
    recipient,
    fulfillmentMethod,
    quantity,
    purchaseType: isPremiumCheckout ? "premium" : "stars",
  });
  let acceptedAssets: string | undefined;

  if (paymentMethod === "crypto_bot") {
    acceptedAssets = "TON,USDT,BTC,ETH";
  } else if (paymentMethod === "ton") {
    acceptedAssets = "TON";
  } else if (paymentMethod === "usdt_ton" || paymentMethod === "usdt_trc20") {
    acceptedAssets = "USDT";
  }

  return {
    orderId,
    username: recipient,
    starsAmount: quantity,
    fulfillmentMethod,
    currencyType: "fiat",
    amount: amountUsd,
    fiat: "USD",
    acceptedAssets,
    description,
    payload,
    expiresIn: 900,
  };
}

function buildTonWalletCreateOrderRequest(options: {
  orderId?: number;
  recipient: string;
  quantity: number;
  isPremiumCheckout: boolean;
  premiumDuration: PremiumDurationValue;
  paymentMethod: "ton" | "usdt_ton" | "ton_dev";
  senderAddress: string;
}): TonWalletCreateOrderRequestPayload {
  const {
    orderId,
    recipient,
    quantity,
    isPremiumCheckout,
    premiumDuration,
    paymentMethod,
    senderAddress,
  } = options;
  const fulfillmentMethod = isPremiumCheckout ? "giftPremium" : "buyStars";
  const amountUsd = resolveInvoiceAmountUsd(
    isPremiumCheckout,
    quantity,
    premiumDuration,
  );

  return {
    orderId,
    username: recipient,
    starsAmount: quantity,
    fulfillmentMethod,
    amount: amountUsd,
    paymentMethod,
    senderAddress,
  };
}

function parseInvoiceCreateResponse(
  record: JsonRecord | null,
): InvoiceCreateResponsePayload | null {
  if (!record) return null;

  return {
    orderId: getNumberValue(record.orderId),
    invoiceHash: getStringValue(record.invoiceHash),
    invoiceStatus: getStringValue(record.invoiceStatus),
    paymentStatus: getStringValue(record.paymentStatus),
    orderStatus: getStringValue(record.orderStatus),
    botInvoiceUrl: getStringValue(record.botInvoiceUrl),
    miniAppInvoiceUrl: getStringValue(record.miniAppInvoiceUrl),
    webAppInvoiceUrl: getStringValue(record.webAppInvoiceUrl),
  };
}

function parseBalanceCheckResponse(
  record: JsonRecord | null,
): BalanceCheckResponsePayload | null {
  if (!record) return null;

  return {
    enough: getBooleanValue(record.enough),
  };
}

function parseUsernameCheckPayload(
  record: JsonRecord | null,
): UsernameCheckPayload | null {
  if (!record) return null;

  return {
    ok: getBooleanValue(record.ok),
    status: getStringValue(record.status),
    displayName: getStringValue(record.displayName),
    avatarUrl: getStringValue(record.avatarUrl),
    isPremium:
      typeof record.isPremium === "boolean"
        ? record.isPremium
        : record.isPremium === null
          ? null
          : undefined,
  };
}

function shouldCacheUsernameCheckPayload(payload: UsernameCheckPayload) {
  return (
    payload.status === "USER" ||
    payload.status === "NOT_FOUND" ||
    payload.status === "BOT" ||
    payload.status === "NOT_A_USER"
  );
}

function getPositiveIntegerString(value: unknown): string | undefined {
  if (typeof value === "string" && /^\d+$/.test(value)) {
    return value;
  }
  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) {
    return String(value);
  }
  return undefined;
}

function parseTonWalletOrderResponse(
  record: JsonRecord | null,
): TonWalletOrderResponsePayload | null {
  if (!record) return null;

  return {
    orderId: getNumberValue(record.orderId),
    paymentReference: getStringValue(record.paymentReference),
    paymentStatus: getStringValue(record.paymentStatus),
    orderStatus: getStringValue(record.orderStatus),
    paymentMethod: getStringValue(record.paymentMethod),
    asset: getStringValue(record.asset),
    assetAmount: getStringValue(record.assetAmount),
    assetAmountBaseUnits: getPositiveIntegerString(record.assetAmountBaseUnits),
    transferAddress: getStringValue(record.transferAddress),
    transferAmount: getPositiveIntegerString(record.transferAmount),
    transferPayload: getStringValue(record.transferPayload),
    recipientAddress: getStringValue(record.recipientAddress),
    validUntil: getNumberValue(record.validUntil),
    network: getStringValue(record.network),
  };
}

function parseProblemMessage(record: JsonRecord | null): string | null {
  if (!record) return null;

  const detail = getStringValue(record.detail);
  if (detail?.trim()) return detail.trim();

  const message = getStringValue(record.message);
  if (message?.trim()) return message.trim();

  const title = getStringValue(record.title);
  if (title?.trim()) return title.trim();

  const error = getStringValue(record.error);
  if (error?.trim()) return error.trim();

  return null;
}

function parseProblemCode(record: JsonRecord | null): string | null {
  if (!record) return null;

  const code = getStringValue(record.code);
  return code?.trim() ? code.trim() : null;
}

function resolveCheckoutProblemMessage(
  record: JsonRecord | null,
  messages: {
    insufficientBalance: string;
    balanceCheckUnavailable: string;
    paymentProviderUnavailable: string;
  },
) {
  const code = parseProblemCode(record);

  if (code === "INSUFFICIENT_BALANCE") {
    return messages.insufficientBalance;
  }

  if (code?.startsWith("BALANCE_")) {
    return messages.balanceCheckUnavailable;
  }

  if (
    code === "PAYMENT_PROVIDER_UNAVAILABLE" ||
    code?.startsWith("PAYMENTS_UPSTREAM_")
  ) {
    return messages.paymentProviderUnavailable;
  }

  return parseProblemMessage(record);
}

function getSubmitErrorText(error: unknown): string {
  if (!(error instanceof Error)) return "";

  const info =
    typeof error === "object" && error !== null
      ? getStringValue((error as unknown as Record<string, unknown>).info)
      : undefined;
  const parts = [error.name, error.message, info];

  return parts
    .filter((value) => typeof value === "string" && value.trim().length > 0)
    .join(" ")
    .toLowerCase();
}

function isTonWalletInsufficientFundsError(error: unknown): boolean {
  const text = getSubmitErrorText(error);

  return (
    text.includes("insufficient funds") ||
    text.includes("insufficient balance") ||
    text.includes("not enough funds") ||
    text.includes("not enough balance") ||
    text.includes("balance is too low") ||
    text.includes("low balance") ||
    text.includes("недостаточно средств") ||
    text.includes("недостаточно денег") ||
    text.includes("недостаточный баланс") ||
    text.includes("не хватает средств") ||
    text.includes("не хватает баланса")
  );
}

function resolveTonWalletSubmitErrorMessage(
  error: unknown,
  messages: {
    tonWalletConnect: string;
    tonWalletPaymentFailed: string;
    tonWalletRejected: string;
    tonWalletInsufficientFunds: string;
  },
): string | null {
  if (error instanceof UserRejectsError) {
    return messages.tonWalletRejected;
  }

  if (error instanceof WalletNotConnectedError) {
    return messages.tonWalletConnect;
  }

  const text = getSubmitErrorText(error);
  if (
    text.includes("wallet was not connected") ||
    text.includes("connect wallet")
  ) {
    return messages.tonWalletConnect;
  }

  if (
    text.includes("transaction was not sent") ||
    text.includes("user rejects") ||
    text.includes("rejected") ||
    text.includes("cancelled") ||
    text.includes("canceled")
  ) {
    return messages.tonWalletRejected;
  }

  if (isTonWalletInsufficientFundsError(error)) {
    return messages.tonWalletInsufficientFunds;
  }

  return null;
}

function extractInvoiceUrl(
  payload: InvoiceCreateResponsePayload,
): string | null {
  const telegramWebApp =
    typeof window !== "undefined"
      ? (
          window as Window & {
            Telegram?: {
              WebApp?: {
                openLink?: (url: string) => void;
                openTelegramLink?: (url: string) => void;
              };
            };
          }
        ).Telegram?.WebApp
      : undefined;

  if (telegramWebApp) {
    if (payload.miniAppInvoiceUrl) return payload.miniAppInvoiceUrl;
    if (payload.botInvoiceUrl) return payload.botInvoiceUrl;
  }

  if (payload.botInvoiceUrl) return payload.botInvoiceUrl;
  if (payload.miniAppInvoiceUrl) return payload.miniAppInvoiceUrl;
  if (payload.webAppInvoiceUrl) return payload.webAppInvoiceUrl;

  if (payload.invoiceHash) {
    return `https://t.me/CryptoTestnetBot?start=${payload.invoiceHash}`;
  }

  return (
    payload.botInvoiceUrl ??
    payload.miniAppInvoiceUrl ??
    payload.webAppInvoiceUrl ??
    null
  );
}

function isFinalErrorOrderStatus(status: string | undefined): boolean {
  return status === "cancelled" || status === "failed" || status === "expired";
}

function isFinalErrorPaymentStatus(status: string | undefined): boolean {
  return status === "cancelled" || status === "failed" || status === "expired";
}

function resolveTonWalletTargetNetwork(
  paymentMethod: PaymentMethodValue,
): string | null {
  if (paymentMethod === "ton_dev") {
    return CHAIN.TESTNET;
  }

  if (
    paymentMethod === "ton_wallet" ||
    paymentMethod === "ton" ||
    paymentMethod === "usdt_ton"
  ) {
    return CHAIN.MAINNET;
  }

  return null;
}

function extractInvoiceUrlSafely(
  payload: InvoiceCreateResponsePayload,
): string | null {
  try {
    return extractInvoiceUrl(payload);
  } catch {
    return null;
  }
}

function openInvoiceUrlSafely(url: string): boolean {
  try {
    openInvoiceUrl(url);
    return true;
  } catch {
    return false;
  }
}

function resolveSubmitErrorMessage(options: {
  paymentMethod: PaymentMethodValue;
  submitStage: SubmitStage;
  tonWalletErrorMessage: string | null;
  messages: {
    balanceCheckUnavailable: string;
    paymentProviderUnavailable: string;
    requestFailed: string;
    tonWalletPaymentFailed: string;
  };
}): string {
  const { paymentMethod, submitStage, tonWalletErrorMessage, messages } =
    options;

  if (tonWalletErrorMessage) {
    return tonWalletErrorMessage;
  }

  if (submitStage === "balance") {
    return messages.balanceCheckUnavailable;
  }

  if (isTonWalletPaymentMethod(paymentMethod)) {
    return messages.tonWalletPaymentFailed;
  }

  if (paymentMethod === "crypto_bot") {
    return messages.paymentProviderUnavailable;
  }

  return messages.requestFailed;
}

function openInvoiceUrl(url: string) {
  const telegramWebApp = (
    window as Window & {
      Telegram?: {
        WebApp?: {
          openLink?: (url: string) => void;
          openTelegramLink?: (url: string) => void;
        };
      };
    }
  ).Telegram?.WebApp;

  if (telegramWebApp) {
    try {
      if (url.startsWith("https://t.me/") || url.startsWith("http://t.me/")) {
        telegramWebApp.openTelegramLink?.(url);
        return;
      }

      telegramWebApp.openLink?.(url);
      return;
    } catch {
      // Fall back to regular browser navigation below.
    }
  }

  const popup = window.open(url, "_blank", "noopener,noreferrer");
  if (popup) return;
  window.location.assign(url);
}

function isTonWalletPaymentMethod(paymentMethod: PaymentMethodValue): boolean {
  return (
    paymentMethod === "ton_wallet" ||
    paymentMethod === "ton" ||
    paymentMethod === "usdt_ton" ||
    paymentMethod === "ton_dev"
  );
}

const USERNAME_CHECK_CACHE_TTL_MS = 60_000;
const USERNAME_CHECK_CACHE_MAX_SIZE = 300;

function getCachedUsernameCheck(
  cache: Map<string, UsernameCheckCacheEntry>,
  username: string,
): UsernameCheckPayload | null {
  const entry = cache.get(username);
  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    cache.delete(username);
    return null;
  }

  return entry.payload;
}

function setCachedUsernameCheck(
  cache: Map<string, UsernameCheckCacheEntry>,
  cacheKey: string,
  payload: UsernameCheckPayload,
) {
  const now = Date.now();

  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) {
      cache.delete(key);
    }
  }

  if (cache.has(cacheKey)) {
    cache.delete(cacheKey);
  }

  while (cache.size >= USERNAME_CHECK_CACHE_MAX_SIZE) {
    const oldestKey = cache.keys().next().value;
    if (typeof oldestKey !== "string") {
      break;
    }
    cache.delete(oldestKey);
  }

  cache.set(cacheKey, {
    payload,
    expiresAt: now + USERNAME_CHECK_CACHE_TTL_MS,
  });
}

export function CheckoutForm() {
  const router = useRouter();
  const [tonConnectUI] = useTonConnectUI();
  const tonWallet = useTonWallet();
  const { locale, messages } = useI18n();
  const searchParams = useSearchParams();
  const copy = messages.checkoutForm;
  const common = messages.common;
  const min = 50;
  const max = 25000;
  const step = 50;
  const amountFromQuery = searchParams.get("amount");

  const [amount, setAmount] = useState(min);
  const [amountInput, setAmountInput] = useState(String(min));
  const [purchaseKind, setPurchaseKind] = useState<PurchaseKindValue>("stars");
  const [premiumDuration, setPremiumDuration] =
    useState<PremiumDurationValue>(3);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodValue>("ton");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [purchaseState, setPurchaseState] =
    useState<PurchaseSubmitState>("idle");
  const [purchaseMessage, setPurchaseMessage] = useState("");
  const [purchaseRequestId, setPurchaseRequestId] = useState<string | null>(
    null,
  );
  const [purchaseInvoiceUrl, setPurchaseInvoiceUrl] = useState<string | null>(
    null,
  );
  const submitControllerRef = useRef<AbortController | null>(null);
  const pollControllerRef = useRef<AbortController | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollStartedAtRef = useRef<number>(0);
  const pollContextRef = useRef<{
    orderId: number;
    requestPayload: InvoiceCreateRequestPayload;
  } | null>(null);
  const usernameCheckCacheRef = useRef<Map<string, UsernameCheckCacheEntry>>(
    new Map(),
  );
  const paymentFieldRef = useRef<HTMLDivElement | null>(null);
  const tonPollControllerRef = useRef<AbortController | null>(null);
  const tonPollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tonPollStartedAtRef = useRef<number>(0);
  const tonPollContextRef = useRef<{
    orderId: number;
    fulfillmentMethod: "buyStars" | "giftPremium";
  } | null>(null);

  const [checkStatus, setCheckStatus] = useState<UsernameCheckStatus>("idle");
  const [checkMessage, setCheckMessage] = useState<string>("");
  const isSubmitting = purchaseState === "submitting";
  const canSubmit = checkStatus === "valid" && !isSubmitting;
  const isPremiumCheckout = purchaseKind === "premium";
  const purchaseKindOptions = useMemo(
    () => [
      { value: "stars" as const, label: copy.purchaseKinds.stars },
      { value: "premium" as const, label: copy.purchaseKinds.premium },
    ],
    [copy.purchaseKinds],
  );
  const paymentMethodOptions = useMemo(() => {
    const options: PaymentMethodOption[] = [
      {
        value: "ton" as const,
        label: copy.paymentMethods.ton,
        accent: "cyan",
      },
      {
        value: "usdt_ton" as const,
        label: copy.paymentMethods.usdtTon,
        accent: "emerald",
      },
      {
        value: "crypto_bot" as const,
        label: copy.paymentMethods.cryptoBot,
        accent: "amber",
      },
    ];

    if (DEV_PAYMENT_METHOD_ENABLED) {
      options.splice(2, 0, {
        value: "ton_dev" as const,
        label: copy.paymentMethods.tonDev,
        accent: "violet",
      });
    }

    return options;
  }, [copy.paymentMethods]);
  const selectedPaymentMethodOption =
    paymentMethodOptions.find((option) => option.value === paymentMethod) ??
    paymentMethodOptions[0];
  const selectedPaymentMethodLabel =
    selectedPaymentMethodOption?.label ?? copy.paymentMethods.ton;
  const amountApproxUsd = useMemo(
    () => resolveStarsAmountUsd(amount),
    [amount],
  );
  const amountApproxUsdLabel = useMemo(
    () =>
      formatUsdAmount(amountApproxUsd, {
        locale,
        minimumFractionDigits: 2,
        maximumFractionDigits: 3,
      }),
    [amountApproxUsd, locale],
  );
  const normalizedUsername = useMemo(
    () => normalizeUsername(username),
    [username],
  );
  const isUsernameInvalid = isInvalidUsernameStatus(checkStatus);
  const usernameValidationTone = isUsernameInvalid
    ? "error"
    : checkStatus === "valid"
      ? "success"
      : checkStatus === "checking" || checkStatus === "typing"
        ? "info"
        : "neutral";
  const usernameValidationText = useMemo(() => {
    if (checkStatus === "idle") {
      return copy.helper.waitingUsernameCheck;
    }

    if (checkStatus === "typing" || checkStatus === "checking") {
      return copy.messages.checkingUsername;
    }

    if (checkStatus === "valid") {
      return displayName
        ? `@${normalizedUsername} · ${displayName}`
        : `@${normalizedUsername}`;
    }

    if (checkStatus === "invalid") {
      return copy.messages.invalidUsernameFormat;
    }

    if (checkMessage) {
      return checkMessage;
    }

    return copy.messages.requestFailedGeneric;
  }, [
    checkMessage,
    checkStatus,
    copy.helper.waitingUsernameCheck,
    copy.messages.invalidUsernameFormat,
    copy.messages.checkingUsername,
    copy.messages.requestFailedGeneric,
    displayName,
    normalizedUsername,
  ]);

  const stopOrderPolling = useCallback(() => {
    pollControllerRef.current?.abort();
    pollControllerRef.current = null;

    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    pollStartedAtRef.current = 0;
    pollContextRef.current = null;

    tonPollControllerRef.current?.abort();
    tonPollControllerRef.current = null;

    if (tonPollTimerRef.current) {
      clearTimeout(tonPollTimerRef.current);
      tonPollTimerRef.current = null;
    }

    tonPollStartedAtRef.current = 0;
    tonPollContextRef.current = null;
  }, []);

  const navigateToOrderSuccessPage = useCallback(() => {
    router.replace(localizePath(locale, PAGES.ORDER_SUCCESS));
  }, [locale, router]);

  const handleOrderFulfilled = useCallback(
    (fulfillmentMethod: "buyStars" | "giftPremium") => {
      setPurchaseState("success");
      setPurchaseMessage(
        fulfillmentMethod === "giftPremium"
          ? copy.messages.confirmedPremium
          : copy.messages.confirmed,
      );
      stopOrderPolling();
      navigateToOrderSuccessPage();
    },
    [
      copy.messages.confirmed,
      copy.messages.confirmedPremium,
      navigateToOrderSuccessPage,
      stopOrderPolling,
    ],
  );

  const startOrderPolling = useCallback(
    (orderId: number, requestPayload: InvoiceCreateRequestPayload) => {
      stopOrderPolling();
      pollStartedAtRef.current = Date.now();
      pollContextRef.current = { orderId, requestPayload };

      const tick = async () => {
        const context = pollContextRef.current;
        if (!context) return;

        if (
          Date.now() - pollStartedAtRef.current >
          ORDER_POLL_MAX_DURATION_MS
        ) {
          stopOrderPolling();
          setPurchaseState("error");
          setPurchaseMessage(copy.messages.paymentTimeout);
          return;
        }

        const controller = new AbortController();
        pollControllerRef.current = controller;

        try {
          const pollRes = await fetch(
            "/api/payments/cryptobot/testnet/invoices",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({
                ...context.requestPayload,
                orderId: context.orderId,
              }),
              signal: controller.signal,
            },
          );

          const record = await readJsonRecord(pollRes);
          if (!pollRes.ok) {
            setPurchaseState("error");
            setPurchaseMessage(copy.messages.invoiceStatusCheckFailed);
            stopOrderPolling();
            return;
          }

          const payload = parseInvoiceCreateResponse(record);
          const orderStatus = payload?.orderStatus;

          if (orderStatus === "fulfilled") {
            handleOrderFulfilled(context.requestPayload.fulfillmentMethod);
            return;
          }

          if (isFinalErrorOrderStatus(orderStatus)) {
            setPurchaseState("error");
            setPurchaseMessage(
              `${copy.messages.paymentFailedStatusPrefix}: ${orderStatus}`,
            );
            stopOrderPolling();
            return;
          }

          if (orderStatus === "paid" || orderStatus === "processing") {
            setPurchaseMessage(copy.messages.paymentReceivedProcessingDelivery);
          } else {
            setPurchaseMessage(copy.messages.awaitingPaymentConfirmation);
          }

          pollTimerRef.current = setTimeout(tick, ORDER_POLL_INTERVAL_MS);
        } catch (error: unknown) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }

          setPurchaseState("error");
          setPurchaseMessage(copy.messages.invoiceStatusCheckFailed);
          stopOrderPolling();
        } finally {
          if (pollControllerRef.current === controller) {
            pollControllerRef.current = null;
          }
        }
      };

      void tick();
    },
    [copy.messages, handleOrderFulfilled, stopOrderPolling],
  );

  const startTonWalletOrderPolling = useCallback(
    (orderId: number, fulfillmentMethod: "buyStars" | "giftPremium") => {
      stopOrderPolling();
      tonPollStartedAtRef.current = Date.now();
      tonPollContextRef.current = { orderId, fulfillmentMethod };

      const tick = async () => {
        const context = tonPollContextRef.current;
        if (!context) return;

        if (
          Date.now() - tonPollStartedAtRef.current >
          ORDER_POLL_MAX_DURATION_MS
        ) {
          stopOrderPolling();
          setPurchaseState("error");
          setPurchaseMessage(copy.messages.paymentTimeout);
          return;
        }

        const controller = new AbortController();
        tonPollControllerRef.current = controller;

        try {
          const pollRes = await fetch("/api/payments/ton-wallet/orders", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              orderId: context.orderId,
            } satisfies Partial<TonWalletCreateOrderRequestPayload>),
            signal: controller.signal,
          });

          const record = await readJsonRecord(pollRes);
          if (!pollRes.ok) {
            setPurchaseState("error");
            setPurchaseMessage(copy.messages.tonWalletStatusCheckFailed);
            stopOrderPolling();
            return;
          }

          const payload = parseTonWalletOrderResponse(record);
          const orderStatus = payload?.orderStatus;
          const paymentStatus = payload?.paymentStatus;

          if (orderStatus === "fulfilled") {
            handleOrderFulfilled(context.fulfillmentMethod);
            return;
          }

          if (isFinalErrorPaymentStatus(paymentStatus)) {
            setPurchaseState("error");
            setPurchaseMessage(
              `${copy.messages.paymentFailedStatusPrefix}: ${paymentStatus}`,
            );
            stopOrderPolling();
            return;
          }

          if (isFinalErrorOrderStatus(orderStatus)) {
            setPurchaseState("error");
            setPurchaseMessage(
              `${copy.messages.paymentFailedStatusPrefix}: ${orderStatus}`,
            );
            stopOrderPolling();
            return;
          }

          if (orderStatus === "paid" || orderStatus === "processing") {
            setPurchaseMessage(copy.messages.paymentReceivedProcessingDelivery);
          } else {
            setPurchaseMessage(copy.messages.awaitingPaymentConfirmation);
          }

          tonPollTimerRef.current = setTimeout(tick, ORDER_POLL_INTERVAL_MS);
        } catch (error: unknown) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }

          setPurchaseState("error");
          setPurchaseMessage(copy.messages.tonWalletStatusCheckFailed);
          stopOrderPolling();
        } finally {
          if (tonPollControllerRef.current === controller) {
            tonPollControllerRef.current = null;
          }
        }
      };

      void tick();
    },
    [copy.messages, handleOrderFulfilled, stopOrderPolling],
  );

  useEffect(() => {
    return () => {
      submitControllerRef.current?.abort();
      stopOrderPolling();
    };
  }, [stopOrderPolling]);

  useEffect(() => {
    if (!amountFromQuery) return;

    const parsed = parseAmountInputValue(amountFromQuery);
    if (parsed === null) return;

    const normalized = normalizeAmountValue(parsed, min, max, step);
    setAmount(normalized);
    setAmountInput(String(normalized));
  }, [amountFromQuery]);

  useEffect(() => {
    if (!isPaymentModalOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPaymentModalOpen(false);
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;

      if (paymentFieldRef.current?.contains(target)) {
        return;
      }

      setIsPaymentModalOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [isPaymentModalOpen]);

  function clearPurchaseFeedback() {
    if (purchaseState === "idle") return;
    if (isSubmitting) return;

    setPurchaseState("idle");
    setPurchaseMessage("");
    setPurchaseRequestId(null);
    setPurchaseInvoiceUrl(null);
  }

  function commitAmountInput(options?: { fallbackToCurrent?: boolean }) {
    const parsed = parseAmountInputValue(amountInput);

    if (parsed === null) {
      if (options?.fallbackToCurrent === false) {
        return null;
      }

      setAmountInput(String(amount));
      return amount;
    }

    const normalized = normalizeAmountValue(parsed, min, max, step);
    setAmount(normalized);
    setAmountInput(String(normalized));
    return normalized;
  }

  const applyUsernameCheckPayload = useCallback(
    (data: UsernameCheckPayload) => {
      setAvatarUrl(typeof data.avatarUrl === "string" ? data.avatarUrl : null);
      setDisplayName(
        typeof data.displayName === "string" ? data.displayName : null,
      );

      const backendStatus = typeof data.status === "string" ? data.status : "";

      if (backendStatus === "INVALID") {
        setAvatarUrl(null);
        setDisplayName(null);
        setCheckStatus("invalid");
        setCheckMessage(copy.messages.invalidUsernameFormat);
        return;
      }

      if (backendStatus === "NOT_FOUND") {
        setAvatarUrl(null);
        setDisplayName(null);
        setCheckStatus("not_found");
        setCheckMessage(copy.messages.usernameNotFound);
        return;
      }

      if (backendStatus === "BOT") {
        setCheckStatus("bot");
        setCheckMessage(copy.messages.usernameIsBot);
        return;
      }

      if (backendStatus === "NOT_A_USER") {
        setCheckStatus("not_a_user");
        setCheckMessage(copy.messages.usernameNotUser);
        return;
      }

      if (backendStatus === "PREMIUM_CHECK_UNAVAILABLE") {
        setCheckStatus("error");
        setCheckMessage(copy.messages.premiumCheckUnavailable);
        return;
      }

      if (backendStatus === "ERROR") {
        setAvatarUrl(null);
        setDisplayName(null);
        setCheckStatus("error");
        setCheckMessage(
          typeof data.displayName === "string" && data.displayName.trim()
            ? data.displayName.trim()
            : copy.messages.requestFailedGeneric,
        );
        return;
      }

      if (backendStatus === "USER" && data.ok) {
        if (isPremiumCheckout) {
          if (data.isPremium === true) {
            setCheckStatus("already_premium");
            setCheckMessage(copy.messages.usernameAlreadyPremium);
            return;
          }
          if (data.isPremium !== false) {
            setCheckStatus("error");
            setCheckMessage(copy.messages.premiumCheckUnavailable);
            return;
          }
        }

        setCheckStatus("valid");
        setCheckMessage("");
        return;
      }

      setAvatarUrl(null);
      setDisplayName(null);
      setCheckStatus("error");
      setCheckMessage(copy.messages.requestFailedGeneric);
    },
    [
      copy.messages.invalidUsernameFormat,
      copy.messages.premiumCheckUnavailable,
      copy.messages.requestFailedGeneric,
      copy.messages.usernameAlreadyPremium,
      copy.messages.usernameIsBot,
      copy.messages.usernameNotFound,
      copy.messages.usernameNotUser,
      isPremiumCheckout,
    ],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (purchaseState === "submitting") return;

    const recipient = normalizeUsername(username);
    if (!USERNAME_RE.test(recipient)) {
      setPurchaseState("error");
      setPurchaseMessage(copy.messages.invalidUsernameBeforePurchase);
      setPurchaseRequestId(null);
      return;
    }

    if (checkStatus !== "valid") {
      setPurchaseState("error");
      setPurchaseMessage(copy.messages.waitForUsernameCheck);
      setPurchaseRequestId(null);
      return;
    }

    let quantityToSubmit = amount;
    let method: "buyStars" | "giftPremium" = "buyStars";
    if (isPremiumCheckout) {
      if (
        !PREMIUM_DURATION_OPTIONS.some((months) => months === premiumDuration)
      ) {
        setPurchaseState("error");
        setPurchaseMessage(copy.messages.invalidPremiumDuration);
        setPurchaseRequestId(null);
        return;
      }

      method = "giftPremium";
      quantityToSubmit = premiumDuration;
    } else {
      const amountToSubmit = commitAmountInput({ fallbackToCurrent: false });

      if (
        amountToSubmit === null ||
        !Number.isSafeInteger(amountToSubmit) ||
        amountToSubmit < min ||
        amountToSubmit > max ||
        amountToSubmit % step !== 0
      ) {
        setPurchaseState("error");
        setPurchaseMessage(copy.messages.invalidAmount);
        setPurchaseRequestId(null);
        return;
      }

      quantityToSubmit = amountToSubmit;
    }

    stopOrderPolling();
    submitControllerRef.current?.abort();
    const controller = new AbortController();
    submitControllerRef.current = controller;

    setPurchaseState("submitting");
    setPurchaseMessage(
      isTonWalletPaymentMethod(paymentMethod)
        ? copy.messages.creatingTonOrder
        : copy.messages.creatingInvoice,
    );
    setPurchaseRequestId(null);
    setPurchaseInvoiceUrl(null);

    const submitStage: SubmitStage = "payment";

    try {
      if (isTonWalletPaymentMethod(paymentMethod)) {
        const tonCheckoutMethod =
          paymentMethod === "usdt_ton" || paymentMethod === "ton_dev"
            ? paymentMethod
            : "ton";
        const isDevTonPayment = tonCheckoutMethod === "ton_dev";
        let connectedWallet = tonConnectUI.wallet ?? tonWallet;
        let senderAddress = "dev-ton-wallet";

        if (!isDevTonPayment) {
          const requiredNetwork =
            resolveTonWalletTargetNetwork(tonCheckoutMethod);

          if (!connectedWallet) {
            setPurchaseMessage(copy.messages.tonWalletConnect);
            connectedWallet = await tonConnectUI.connectWallet();
          }

          senderAddress = connectedWallet?.account.address?.trim() ?? "";
          if (!senderAddress) {
            setPurchaseState("error");
            setPurchaseMessage(copy.messages.tonWalletConnect);
            setPurchaseRequestId(null);
            return;
          }

          if (
            requiredNetwork &&
            connectedWallet?.account.chain &&
            connectedWallet.account.chain !== requiredNetwork
          ) {
            setPurchaseState("error");
            setPurchaseMessage(
              requiredNetwork === CHAIN.TESTNET
                ? copy.messages.tonWalletSwitchToTestnet
                : copy.messages.tonWalletSwitchToMainnet,
            );
            setPurchaseRequestId(null);
            return;
          }
        }

        const tonWalletRequestPayload = buildTonWalletCreateOrderRequest({
          recipient,
          quantity: quantityToSubmit,
          isPremiumCheckout,
          premiumDuration,
          paymentMethod: tonCheckoutMethod,
          senderAddress,
        });
        const tonOrderRes = await fetch("/api/payments/ton-wallet/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "Idempotency-Key": createIdempotencyKey(purchaseKind),
          },
          body: JSON.stringify(tonWalletRequestPayload),
          signal: controller.signal,
        });

        const tonOrderRecord = await readJsonRecord(tonOrderRes);
        if (!tonOrderRes.ok) {
          const problemMessage = resolveCheckoutProblemMessage(
            tonOrderRecord,
            copy.messages,
          );
          setPurchaseState("error");
          setPurchaseMessage(
            problemMessage ||
              `${copy.messages.requestFailed} (HTTP ${tonOrderRes.status})`,
          );
          setPurchaseRequestId(null);
          return;
        }

        const tonOrderPayload = parseTonWalletOrderResponse(tonOrderRecord);
        if (!tonOrderPayload?.orderId) {
          setPurchaseState("error");
          setPurchaseMessage(copy.messages.invalidInvoiceResponse);
          setPurchaseRequestId(null);
          return;
        }

        setPurchaseRequestId(String(tonOrderPayload.orderId));

        if (tonOrderPayload.orderStatus === "fulfilled") {
          handleOrderFulfilled(method);
          return;
        }

        if (isFinalErrorPaymentStatus(tonOrderPayload.paymentStatus)) {
          setPurchaseState("error");
          setPurchaseMessage(
            `${copy.messages.paymentFailedStatusPrefix}: ${tonOrderPayload.paymentStatus}`,
          );
          return;
        }

        if (isFinalErrorOrderStatus(tonOrderPayload.orderStatus)) {
          setPurchaseState("error");
          setPurchaseMessage(
            `${copy.messages.paymentFailedStatusPrefix}: ${tonOrderPayload.orderStatus}`,
          );
          return;
        }

        if (isDevTonPayment) {
          if (
            tonOrderPayload.orderStatus === "paid" ||
            tonOrderPayload.orderStatus === "processing"
          ) {
            setPurchaseMessage(copy.messages.paymentReceivedProcessingDelivery);
          } else {
            setPurchaseMessage(copy.messages.awaitingPaymentConfirmation);
          }

          startTonWalletOrderPolling(tonOrderPayload.orderId, method);
          return;
        }

        if (
          !tonOrderPayload.transferAddress ||
          !tonOrderPayload.transferAmount ||
          !tonOrderPayload.network
        ) {
          setPurchaseState("error");
          setPurchaseMessage(copy.messages.invalidInvoiceResponse);
          setPurchaseRequestId(null);
          return;
        }

        if (
          connectedWallet?.account.chain &&
          connectedWallet.account.chain !== tonOrderPayload.network
        ) {
          setPurchaseState("error");
          setPurchaseMessage(
            tonOrderPayload.network === CHAIN.TESTNET
              ? copy.messages.tonWalletSwitchToTestnet
              : copy.messages.tonWalletSwitchToMainnet,
          );
          return;
        }

        const fallbackValidUntil = Math.floor(Date.now() / 1000) + 900;
        const validUntil =
          typeof tonOrderPayload.validUntil === "number" &&
          Number.isFinite(tonOrderPayload.validUntil) &&
          tonOrderPayload.validUntil > Math.floor(Date.now() / 1000)
            ? Math.floor(tonOrderPayload.validUntil)
            : fallbackValidUntil;

        setPurchaseMessage(copy.messages.tonWalletOpenAndConfirm);
        await tonConnectUI.sendTransaction({
          validUntil,
          network: tonOrderPayload.network,
          messages: [
            {
              address: tonOrderPayload.transferAddress,
              amount: tonOrderPayload.transferAmount,
              ...(tonOrderPayload.transferPayload
                ? { payload: tonOrderPayload.transferPayload }
                : {}),
            },
          ],
        });

        setPurchaseMessage(copy.messages.tonWalletTransactionSubmitted);
        startTonWalletOrderPolling(tonOrderPayload.orderId, method);
        return;
      }

      const invoiceRequestPayload = buildInvoiceCreateRequest({
        recipient,
        quantity: quantityToSubmit,
        paymentMethod,
        isPremiumCheckout,
        premiumDuration,
      });
      const res = await fetch("/api/payments/cryptobot/testnet/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Idempotency-Key": createIdempotencyKey(purchaseKind),
        },
        body: JSON.stringify(invoiceRequestPayload),
        signal: controller.signal,
      });

      const record = await readJsonRecord(res);
      if (!res.ok) {
        const problemMessage = resolveCheckoutProblemMessage(
          record,
          copy.messages,
        );
        setPurchaseState("error");
        setPurchaseMessage(
          problemMessage || copy.messages.paymentProviderUnavailable,
        );
        setPurchaseRequestId(null);
        return;
      }

      const payload = parseInvoiceCreateResponse(record);
      if (!payload?.orderId) {
        setPurchaseState("error");
        setPurchaseMessage(copy.messages.invalidInvoiceResponse);
        setPurchaseRequestId(null);
        return;
      }

      setPurchaseRequestId(String(payload.orderId));

      if (payload.orderStatus === "fulfilled") {
        handleOrderFulfilled(method);
        return;
      }

      if (isFinalErrorOrderStatus(payload.orderStatus)) {
        setPurchaseState("error");
        setPurchaseMessage(
          `${copy.messages.paymentFailedStatusPrefix}: ${payload.orderStatus}`,
        );
        return;
      }

      const invoiceUrl = extractInvoiceUrlSafely(payload);
      if (invoiceUrl) {
        setPurchaseInvoiceUrl(invoiceUrl);
        setPurchaseMessage(
          openInvoiceUrlSafely(invoiceUrl)
            ? copy.messages.invoiceCreatedOpenPayment
            : copy.messages.invoiceCreatedNoLink,
        );
      } else {
        setPurchaseMessage(copy.messages.invoiceCreatedNoLink);
      }

      try {
        startOrderPolling(payload.orderId, {
          ...invoiceRequestPayload,
          fulfillmentMethod: method,
        });
      } catch {
        // Keep the created invoice accessible even if polling setup fails.
      }
      return;
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      const tonWalletErrorMessage = isTonWalletPaymentMethod(paymentMethod)
        ? resolveTonWalletSubmitErrorMessage(error, copy.messages)
        : null;

      setPurchaseState("error");
      setPurchaseMessage(
        resolveSubmitErrorMessage({
          paymentMethod,
          submitStage,
          tonWalletErrorMessage,
          messages: copy.messages,
        }),
      );
      setPurchaseRequestId(null);
    } finally {
      if (submitControllerRef.current === controller) {
        submitControllerRef.current = null;
      }
    }
  }

  useEffect(() => {
    const u = normalizeUsername(username);

    if (!u) {
      setAvatarUrl(null);
      setDisplayName(null);
      setCheckStatus("idle");
      setCheckMessage("");
      return;
    }

    setCheckStatus("typing");
    setCheckMessage("");

    if (!USERNAME_RE.test(u)) {
      setAvatarUrl(null);
      setDisplayName(null);
      setCheckStatus("invalid");
      setCheckMessage(copy.messages.invalidUsernameFormat);
      return;
    }

    const cacheKey = `${u}|premium:${isPremiumCheckout ? "1" : "0"}`;
    const cachedPayload = getCachedUsernameCheck(
      usernameCheckCacheRef.current,
      cacheKey,
    );
    if (cachedPayload) {
      applyUsernameCheckPayload(cachedPayload);
      return;
    }

    const controller = new AbortController();

    const t = setTimeout(async () => {
      try {
        setCheckStatus("checking");

        const res = await fetch("/api/tg/username/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: u,
            checkPremium: isPremiumCheckout,
          }),
          signal: controller.signal,
        });

        const data = parseUsernameCheckPayload(await readJsonRecord(res));
        if (!data) {
          throw new Error("Invalid JSON response");
        }

        if (shouldCacheUsernameCheckPayload(data)) {
          setCachedUsernameCheck(usernameCheckCacheRef.current, cacheKey, data);
        }
        applyUsernameCheckPayload(data);
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setAvatarUrl(null);
        setDisplayName(null);
        setCheckStatus("error");
        setCheckMessage(copy.messages.requestFailedGeneric);
      }
    }, 500);

    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [applyUsernameCheckPayload, copy, isPremiumCheckout, username]);

  const percent = useMemo(() => {
    const clamped = Math.min(max, Math.max(min, amount));
    return ((clamped - min) / (max - min)) * 100;
  }, [amount]);
  const buyButtonLabel = isSubmitting
    ? copy.button.processing
    : isPremiumCheckout
      ? copy.button.buyPremium
      : copy.button.buy;

  return (
    <form
      className={styles.checkout__form}
      action="#"
      method="post"
      noValidate
      onSubmit={onSubmit}
      aria-busy={isSubmitting}
    >
      <fieldset className={styles.checkout__fieldset}>
        <legend className={styles.checkout__srOnly}>
          {copy.labels.purchaseKind}
        </legend>

        <div className={styles.checkout__purchaseSwitch}>
          {purchaseKindOptions.map((option) => {
            const isSelected = option.value === purchaseKind;

            return (
              <button
                key={option.value}
                type="button"
                className={styles.checkout__purchaseSwitchButton}
                data-active={isSelected}
                aria-pressed={isSelected}
                onClick={() => {
                  if (isSelected) return;
                  clearPurchaseFeedback();
                  setPurchaseKind(option.value);
                }}
                disabled={isSubmitting}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className={styles.checkout__field}>
        <label className={styles.checkout__srOnly} htmlFor="tgUsername">
          {copy.labels.telegramUsername}
        </label>

        <div
          className={styles.checkout__inputWrap}
          data-invalid={isUsernameInvalid}
        >
          <span className={styles.checkout__usernameBadgeAbs}>
            <UsernameBadge
              username={username}
              status={checkStatus}
              displayName={displayName}
              avatarUrl={avatarUrl}
              size={26}
            ></UsernameBadge>
          </span>

          <input
            id="tgUsername"
            name="tgUsername"
            type="text"
            onChange={(e) => {
              clearPurchaseFeedback();
              setUsername(e.target.value);
            }}
            value={username}
            autoComplete="username"
            spellCheck={false}
            placeholder={copy.placeholders.telegramUsername}
            className={styles.checkout__inputField}
            required
            disabled={isSubmitting}
            aria-describedby="tg-username-status"
            aria-invalid={isUsernameInvalid}
          />
        </div>

        <div
          id="tg-username-status"
          className={styles.checkout__validation}
          data-tone={usernameValidationTone}
          aria-live="polite"
        >
          <span className={styles.checkout__validationDot} aria-hidden="true" />
          <span className={styles.checkout__validationText}>
            {usernameValidationText}
          </span>
        </div>
      </div>

      {/* Currency */}
      <div
        className={`${styles.checkout__field} ${styles.checkout__paymentField}`}
        ref={paymentFieldRef}
      >
        <label className={styles.checkout__srOnly} htmlFor="currency">
          {copy.labels.paymentCurrency}
        </label>

        <div className={styles.checkout__inputWrap}>
          {selectedPaymentMethodOption ? (
            <PaymentMethodIcon
              method={selectedPaymentMethodOption.value}
              className={styles.checkout__paymentMethodIconAbs}
            />
          ) : null}

          <button
            id="currency"
            name="currency"
            type="button"
            className={styles.checkout__selectField}
            onClick={() => setIsPaymentModalOpen((prev) => !prev)}
            disabled={isSubmitting}
            aria-haspopup="dialog"
            aria-expanded={isPaymentModalOpen}
            aria-controls="payment-method-modal"
          >
            {selectedPaymentMethodLabel}
          </button>

          <input type="hidden" name="paymentMethod" value={paymentMethod} />

          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            className={styles.checkout__chevronAbs}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>

        {isPaymentModalOpen ? (
          <div className={styles.checkout__modal} role="presentation">
            <div
              id="payment-method-modal"
              role="dialog"
              aria-labelledby="payment-method-title"
              aria-modal="true"
              className={styles.checkout__modalDialog}
            >
              <div className={styles.checkout__modalGlow} aria-hidden="true" />

              <div className={styles.checkout__modalHeader}>
                <div>
                  <p className={styles.checkout__modalEyebrow}>
                    {common.brandName}
                  </p>
                  <h3
                    id="payment-method-title"
                    className={styles.checkout__modalTitle}
                  >
                    {copy.labels.paymentCurrency}
                  </h3>
                </div>

                <button
                  type="button"
                  className={styles.checkout__modalClose}
                  onClick={() => setIsPaymentModalOpen(false)}
                  aria-label={copy.labels.closeDialog}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>

              <ul className={styles.checkout__modalList}>
                {paymentMethodOptions.map((option, index) => {
                  const isSelected = option.value === paymentMethod;

                  return (
                    <li key={option.value}>
                      <button
                        type="button"
                        className={styles.checkout__modalOption}
                        data-selected={isSelected}
                        data-accent={option.accent}
                        onClick={() => {
                          clearPurchaseFeedback();
                          setPaymentMethod(option.value);
                          setIsPaymentModalOpen(false);
                        }}
                      >
                        <span className={styles.checkout__modalOptionMain}>
                          <PaymentMethodIcon
                            method={option.value}
                            className={styles.checkout__modalOptionIcon}
                          />
                          <span className={styles.checkout__modalOptionText}>
                            {option.label}
                          </span>
                        </span>

                        <span className={styles.checkout__modalOptionMeta}>
                          <span className={styles.checkout__modalOptionCode}>
                            #{index + 1}
                          </span>
                          {isSelected ? (
                            <span
                              className={styles.checkout__modalOptionCheck}
                              aria-hidden="true"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                focusable="false"
                                aria-hidden="true"
                              >
                                <path d="m20 6-11 11-5-5" />
                              </svg>
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ) : null}
      </div>

      {/* Amount + slider */}
      {isPremiumCheckout ? (
        <fieldset className={styles.checkout__fieldset}>
          <legend className={styles.checkout__srOnly}>
            {copy.labels.premiumDuration}
          </legend>

          <div className={styles.checkout__premiumDurationGrid}>
            {PREMIUM_DURATION_OPTIONS.map((duration) => {
              const isSelected = duration === premiumDuration;

              return (
                <button
                  key={duration}
                  type="button"
                  className={styles.checkout__premiumDurationButton}
                  data-selected={isSelected}
                  onClick={() => {
                    if (isSelected) return;
                    clearPurchaseFeedback();
                    setPremiumDuration(duration);
                  }}
                  disabled={isSubmitting}
                >
                  <span className={styles.checkout__premiumDurationValue}>
                    {duration}
                  </span>
                  <span className={styles.checkout__premiumDurationUnit}>
                    {copy.labels.months}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : (
        <fieldset className={styles.checkout__fieldset}>
          <legend className={styles.checkout__srOnly}>
            {copy.labels.amount}
          </legend>

          <div className={styles.checkout__displayRow}>
            <div className={styles.checkout__displayLeft}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
                className={styles.checkout__amountStar}
              >
                <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
              </svg>

              <label className={styles.checkout__srOnly} htmlFor="amountInput">
                {copy.labels.chooseAmount}
              </label>

              <input
                id="amountInput"
                name="amountInput"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                value={amountInput}
                onChange={(e) => {
                  clearPurchaseFeedback();
                  setAmountInput(e.target.value.replace(/\D+/g, ""));
                }}
                onBlur={() => {
                  clearPurchaseFeedback();
                  commitAmountInput();
                }}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;

                  e.preventDefault();
                  clearPurchaseFeedback();
                  commitAmountInput();
                }}
                disabled={isSubmitting}
                className={styles.checkout__amountInputField}
              />
            </div>

            <span
              className={styles.checkout__amountUsd}
            >{`≈ $${amountApproxUsdLabel}`}</span>
          </div>

          <div className={styles.checkout__sliderRow}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
              className={styles.checkout__sliderMinIcon}
            >
              <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
            </svg>

            <div
              className={styles.checkout__sliderControl}
              style={{ "--p": `${percent}%` } as React.CSSProperties}
            >
              <label className={styles.checkout__srOnly} htmlFor="amountRange">
                {copy.labels.chooseAmount}
              </label>

              <input
                id="amountRange"
                name="amount"
                className={styles.checkout__range}
                type="range"
                min={min}
                max={max}
                step={step}
                value={amount}
                onChange={(e) => {
                  clearPurchaseFeedback();
                  const nextAmount = Number(e.target.value);
                  setAmount(nextAmount);
                  setAmountInput(String(nextAmount));
                }}
                disabled={isSubmitting}
              />
            </div>

            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
              className={styles.checkout__sliderMaxIcon}
            >
              <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
            </svg>
          </div>
        </fieldset>
      )}

      <button
        className={styles.checkout__buyButton}
        type="submit"
        disabled={!canSubmit}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
          className={styles.checkout__buyButtonIcon}
        >
          <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
        </svg>
        {buyButtonLabel}
      </button>

      <div
        className={styles.checkout__submitStatus}
        data-state={purchaseState}
        aria-live="polite"
      >
        {purchaseMessage}
        {purchaseRequestId
          ? `${purchaseMessage ? " • " : ""}${common.requestIdPrefix}: ${purchaseRequestId}`
          : ""}
      </div>

      {purchaseInvoiceUrl && purchaseState !== "success" ? (
        <button
          type="button"
          className={styles.checkout__invoiceLinkButton}
          onClick={() => openInvoiceUrl(purchaseInvoiceUrl)}
        >
          {copy.button.openInvoice}
        </button>
      ) : null}
    </form>
  );
}
