const HALF_MILLS_PER_STAR = 33;
const HALF_MILLS_PER_USD = 2_000;
const HALF_MILLS_PER_CENT = 20;
const CENTS_PER_USD = 100;

const PRICE_NUMBER_FORMAT_LOCALE = {
  en: "en-US",
  ru: "ru-RU",
} as const;

type PriceLocale = keyof typeof PRICE_NUMBER_FORMAT_LOCALE;

export function resolveStarsAmountUsd(starsAmount: number) {
  const totalHalfMills = starsAmount * HALF_MILLS_PER_STAR;
  const totalCents = Math.floor(
    (totalHalfMills + HALF_MILLS_PER_CENT / 2) / HALF_MILLS_PER_CENT,
  );

  return totalCents / CENTS_PER_USD;
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
