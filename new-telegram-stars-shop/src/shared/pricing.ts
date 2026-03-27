const HALF_MILLS_PER_STAR = 32;
const HALF_MILLS_PER_USD = 2_000;

const PRICE_NUMBER_FORMAT_LOCALE = {
  en: "en-US",
  ru: "ru-RU",
} as const;

type PriceLocale = keyof typeof PRICE_NUMBER_FORMAT_LOCALE;

export function resolveStarsAmountUsd(starsAmount: number) {
  return Number(
    ((starsAmount * HALF_MILLS_PER_STAR) / HALF_MILLS_PER_USD).toFixed(3),
  );
}

export function formatUsdAmount(
  amountUsd: number,
  options?: {
    locale?: PriceLocale;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  },
) {
  const {
    locale = "en",
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options ?? {};

  return new Intl.NumberFormat(PRICE_NUMBER_FORMAT_LOCALE[locale], {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amountUsd);
}

export function formatPackPriceUsd(starsAmount: number) {
  return `$${formatUsdAmount(resolveStarsAmountUsd(starsAmount))}`;
}
