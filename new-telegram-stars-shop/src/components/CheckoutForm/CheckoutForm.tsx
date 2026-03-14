"use client";

import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PAGES } from "@/config/pages.config";
import { useI18n } from "@/i18n/client";
import { localizePath } from "@/i18n/routing";
import { UsernameBadge } from "../Avatar/Avatar";
import styles from "./checkoutForm.module.scss";

const USERNAME_RE = /^[a-z0-9_]{5,32}$/;
const APPROX_USD_NUMBER_FORMAT_LOCALE = {
  en: "en-US",
  ru: "ru-RU",
} as const;

type PurchaseSubmitState = "idle" | "submitting" | "success" | "error";

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

type TonWalletOrderResponsePayload = {
  orderId?: number;
  paymentReference?: string;
  paymentStatus?: string;
  orderStatus?: string;
  recipientAddress?: string;
  amountTon?: string;
  amountNano?: string;
  validUntil?: number;
  network?: string;
};

type UsernameCheckStatus =
  | "idle"
  | "typing"
  | "checking"
  | "valid"
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

  return Number((starsAmount * 0.018).toFixed(2));
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
}): TonWalletCreateOrderRequestPayload {
  const { orderId, recipient, quantity, isPremiumCheckout, premiumDuration } =
    options;
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
    recipientAddress: getStringValue(record.recipientAddress),
    amountTon: getStringValue(record.amountTon),
    amountNano: getPositiveIntegerString(record.amountNano),
    validUntil: getNumberValue(record.validUntil),
    network: getStringValue(record.network),
  };
}

function parseProblemMessage(record: JsonRecord | null): string | null {
  if (!record) return null;

  const detail = getStringValue(record.detail);
  if (detail?.trim()) return detail.trim();

  const title = getStringValue(record.title);
  if (title?.trim()) return title.trim();

  const error = getStringValue(record.error);
  if (error?.trim()) return error.trim();

  return null;
}

function extractInvoiceUrl(
  payload: InvoiceCreateResponsePayload,
): string | null {
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

function openInvoiceUrl(url: string) {
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
  username: string,
  payload: UsernameCheckPayload,
) {
  const now = Date.now();

  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) {
      cache.delete(key);
    }
  }

  if (cache.has(username)) {
    cache.delete(username);
  }

  while (cache.size >= USERNAME_CHECK_CACHE_MAX_SIZE) {
    const oldestKey = cache.keys().next().value;
    if (typeof oldestKey !== "string") {
      break;
    }
    cache.delete(oldestKey);
  }

  cache.set(username, {
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
  const paymentMethodOptions = useMemo(
    () => [
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
        value: "ton_dev" as const,
        label: copy.paymentMethods.tonDev,
        accent: "violet",
      },
      {
        value: "crypto_bot" as const,
        label: copy.paymentMethods.cryptoBot,
        accent: "amber",
      },
    ],
    [copy.paymentMethods],
  );
  const selectedPaymentMethodLabel =
    paymentMethodOptions.find((option) => option.value === paymentMethod)
      ?.label ?? copy.paymentMethods.ton;
  const amountApproxUsd = useMemo(() => amount * 0.018, [amount]);
  const amountApproxUsdFormatter = useMemo(
    () =>
      new Intl.NumberFormat(APPROX_USD_NUMBER_FORMAT_LOCALE[locale], {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [locale],
  );
  const amountApproxUsdLabel = useMemo(
    () => amountApproxUsdFormatter.format(amountApproxUsd),
    [amountApproxUsd, amountApproxUsdFormatter],
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
            const problemMessage = parseProblemMessage(record);
            setPurchaseState("error");
            setPurchaseMessage(
              problemMessage ||
                `${copy.messages.requestFailed} (HTTP ${pollRes.status})`,
            );
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
          setPurchaseMessage(copy.messages.requestFailed);
          stopOrderPolling();
        } finally {
          if (pollControllerRef.current === controller) {
            pollControllerRef.current = null;
          }
        }
      };

      void tick();
    },
    [
      copy.messages.awaitingPaymentConfirmation,
      copy.messages.paymentFailedStatusPrefix,
      copy.messages.paymentReceivedProcessingDelivery,
      copy.messages.paymentTimeout,
      copy.messages.requestFailed,
      handleOrderFulfilled,
      stopOrderPolling,
    ],
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
            const problemMessage = parseProblemMessage(record);
            setPurchaseState("error");
            setPurchaseMessage(
              problemMessage ||
                `${copy.messages.requestFailed} (HTTP ${pollRes.status})`,
            );
            stopOrderPolling();
            return;
          }

          const payload = parseTonWalletOrderResponse(record);
          const orderStatus = payload?.orderStatus;

          if (orderStatus === "fulfilled") {
            handleOrderFulfilled(context.fulfillmentMethod);
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
          setPurchaseMessage(copy.messages.requestFailed);
          stopOrderPolling();
        } finally {
          if (tonPollControllerRef.current === controller) {
            tonPollControllerRef.current = null;
          }
        }
      };

      void tick();
    },
    [
      copy.messages.awaitingPaymentConfirmation,
      copy.messages.paymentFailedStatusPrefix,
      copy.messages.paymentReceivedProcessingDelivery,
      copy.messages.paymentTimeout,
      copy.messages.requestFailed,
      handleOrderFulfilled,
      stopOrderPolling,
    ],
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

      if (backendStatus === "USER" && data.ok) {
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
      copy.messages.requestFailedGeneric,
      copy.messages.usernameIsBot,
      copy.messages.usernameNotFound,
      copy.messages.usernameNotUser,
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

    try {
      if (isTonWalletPaymentMethod(paymentMethod)) {
        const tonWalletRequestPayload = buildTonWalletCreateOrderRequest({
          recipient,
          quantity: quantityToSubmit,
          isPremiumCheckout,
          premiumDuration,
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
          const problemMessage = parseProblemMessage(tonOrderRecord);
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

        if (isFinalErrorOrderStatus(tonOrderPayload.orderStatus)) {
          setPurchaseState("error");
          setPurchaseMessage(
            `${copy.messages.paymentFailedStatusPrefix}: ${tonOrderPayload.orderStatus}`,
          );
          return;
        }

        if (!tonWallet) {
          setPurchaseMessage(copy.messages.tonWalletConnect);
          await tonConnectUI.connectWallet();
        }

        if (!tonOrderPayload.recipientAddress || !tonOrderPayload.amountNano) {
          setPurchaseState("error");
          setPurchaseMessage(copy.messages.invalidInvoiceResponse);
          setPurchaseRequestId(null);
          return;
        }

        const fallbackValidUntil = Math.floor(Date.now() / 1000) + 900;
        const validUntil =
          typeof tonOrderPayload.validUntil === "number" &&
          Number.isFinite(tonOrderPayload.validUntil) &&
          tonOrderPayload.validUntil > Math.floor(Date.now() / 1000)
            ? Math.floor(tonOrderPayload.validUntil)
            : fallbackValidUntil;
        const requestedNetwork =
          paymentMethod === "ton_dev" ? "-239" : tonOrderPayload.network;

        setPurchaseMessage(copy.messages.tonWalletOpenAndConfirm);
        await tonConnectUI.sendTransaction({
          validUntil,
          network: requestedNetwork,
          messages: [
            {
              address: tonOrderPayload.recipientAddress,
              amount: tonOrderPayload.amountNano,
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
        const problemMessage = parseProblemMessage(record);
        setPurchaseState("error");
        setPurchaseMessage(
          problemMessage ||
            `${copy.messages.requestFailed} (HTTP ${res.status})`,
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

      const invoiceUrl = extractInvoiceUrl(payload);
      if (invoiceUrl) {
        openInvoiceUrl(invoiceUrl);
        setPurchaseMessage(copy.messages.invoiceCreatedOpenPayment);
      } else {
        setPurchaseMessage(copy.messages.invoiceCreatedNoLink);
      }

      startOrderPolling(payload.orderId, {
        ...invoiceRequestPayload,
        fulfillmentMethod: method,
      });
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setPurchaseState("error");
      setPurchaseMessage(copy.messages.requestFailed);
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

    // пока печатает — можно показать "typing"
    setCheckStatus("typing");
    setCheckMessage("");

    // локальная валидация, чтобы не дергать бек
    if (!USERNAME_RE.test(u)) {
      setAvatarUrl(null);
      setDisplayName(null);
      setCheckStatus("invalid");
      setCheckMessage(copy.messages.invalidUsernameFormat);
      return;
    }

    const cachedPayload = getCachedUsernameCheck(
      usernameCheckCacheRef.current,
      u,
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
          body: JSON.stringify({ username: u }),
          signal: controller.signal,
        });

        let data: UsernameCheckPayload | null = null;

        const payloadText = await res.text();
        if (payloadText) {
          try {
            data = JSON.parse(payloadText);
          } catch {
            data = null;
          }
        }

        if (!res.ok) {
          setAvatarUrl(null);
          setDisplayName(null);
          setCheckStatus("error");

          const backendMessage =
            typeof data?.displayName === "string" && data.displayName.trim()
              ? data.displayName.trim()
              : typeof data?.status === "string" && data.status.trim()
                ? data.status.trim()
                : "";

          setCheckMessage(backendMessage || `HTTP ${res.status}`);
          return;
        }

        if (!data) {
          throw new Error("Invalid JSON response");
        }

        setCachedUsernameCheck(usernameCheckCacheRef.current, u, data);
        applyUsernameCheckPayload(data);
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === "AbortError") return; // отменили предыдущий запрос — это нормально
        setAvatarUrl(null);
        setDisplayName(null);
        setCheckStatus("error");
        setCheckMessage(copy.messages.requestFailedGeneric);
      }
    }, 500); // <-- задержка (500мс)

    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [applyUsernameCheckPayload, copy, username]);

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
              size={22}
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
            className={styles.checkout__inputIconAbs}
          >
            <circle cx="8" cy="8" r="6" />
            <path d="M18.09 10.37A6 6 0 1 1 10.37 18.1" />
            <path d="M7 6h1v4" />
            <path d="m16 16 1-1" />
          </svg>

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
                          <span className={styles.checkout__modalOptionDot} />
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
    </form>
  );
}
