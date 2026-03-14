const BOT_URL_FALLBACK = "https://t.me/telegram";
const CHANNEL_URL_FALLBACK = "https://t.me/telegram";
const SUPPORT_URL_FALLBACK = "https://t.me/telegram";
const SUPPORT_EMAIL_FALLBACK = "support@telegramstars.shop";

function pickExternalUrl(value: string | undefined, fallback: string): string {
  const candidate = value?.trim();
  if (!candidate) return fallback;

  if (!candidate.startsWith("https://") && !candidate.startsWith("http://")) {
    return fallback;
  }

  return candidate;
}

function pickEmail(value: string | undefined, fallback: string): string {
  const candidate = value?.trim();
  if (!candidate) return fallback;
  return candidate.includes("@") ? candidate : fallback;
}

export const EXTERNAL_LINKS = {
  telegramBot: pickExternalUrl(
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL,
    BOT_URL_FALLBACK,
  ),
  telegramChannel: pickExternalUrl(
    process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_URL,
    CHANNEL_URL_FALLBACK,
  ),
  telegramSupport: pickExternalUrl(
    process.env.NEXT_PUBLIC_TELEGRAM_SUPPORT_URL,
    SUPPORT_URL_FALLBACK,
  ),
  supportEmail: pickEmail(
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
    SUPPORT_EMAIL_FALLBACK,
  ),
} as const;
