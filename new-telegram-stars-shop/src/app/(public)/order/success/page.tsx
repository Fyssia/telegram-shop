import type { Metadata } from "next";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import { PAGES } from "@/config/pages.config";
import { withLocalizedAlternates } from "@/i18n/metadata";
import { getRequestLocale } from "@/i18n/server";
import type { Locale } from "@/i18n/types";
import styles from "./style.module.scss";

type OrderSuccessCopy = {
  metaTitle: string;
  metaDescription: string;
  kicker: string;
  title: string;
  subtitle: string;
  etaLabel: string;
  etaValue: string;
  stepsTitle: string;
  steps: string[];
  securityTitle: string;
  securityText: string;
  actions: {
    home: string;
    support: string;
  };
};

const COPY: Record<Locale, OrderSuccessCopy> = {
  en: {
    metaTitle: "Order confirmed",
    metaDescription:
      "Your payment is confirmed. Delivery usually completes within 15 minutes.",
    kicker: "Order confirmed",
    title: "Thanks for your order",
    subtitle: "Payment is confirmed. Please expect delivery within 15 minutes.",
    etaLabel: "Estimated delivery time",
    etaValue: "up to 15 minutes",
    stepsTitle: "What happens next",
    steps: [
      "We finalize delivery in Telegram after payment verification.",
      "Keep Telegram open to receive confirmation faster.",
      "If delivery takes longer than 15 minutes, contact support.",
    ],
    securityTitle: "Security note",
    securityText:
      "Support never asks for card codes, Telegram login codes, or wallet seed phrases.",
    actions: {
      home: "Back to home",
      support: "Contact support",
    },
  },
  ru: {
    metaTitle: "Заказ подтвержден",
    metaDescription:
      "Оплата подтверждена. Доставка обычно завершается в течение 15 минут.",
    kicker: "Заказ подтвержден",
    title: "Спасибо за заказ",
    subtitle:
      "Оплата подтверждена. Ожидайте получение товара в течение 15 минут.",
    etaLabel: "Ожидаемое время доставки",
    etaValue: "до 15 минут",
    stepsTitle: "Что происходит дальше",
    steps: [
      "После подтверждения оплаты мы завершаем доставку в Telegram.",
      "Держите Telegram открытым, чтобы быстрее получить подтверждение.",
      "Если доставка заняла больше 15 минут, обратитесь в поддержку.",
    ],
    securityTitle: "Важно по безопасности",
    securityText:
      "Поддержка никогда не запрашивает CVV/CVC, коды входа Telegram или seed-фразы кошелька.",
    actions: {
      home: "На главную",
      support: "Связаться с поддержкой",
    },
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = COPY[locale];
  const metadata = await withLocalizedAlternates(
    {
      title: copy.metaTitle,
      description: copy.metaDescription,
    },
    PAGES.ORDER_SUCCESS,
  );

  return {
    ...metadata,
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}

export default async function OrderSuccessPage() {
  const locale = await getRequestLocale();
  const copy = COPY[locale];

  return (
    <main className={styles.success}>
      <section
        className={styles.success__hero}
        aria-labelledby="order-success-title"
      >
        <div className={styles.success__heroBg} aria-hidden="true" />

        <div className={styles.success__heroInner}>
          <span className={styles.success__kicker}>{copy.kicker}</span>

          <div className={styles.success__titleRow}>
            <span className={styles.success__iconWrap} aria-hidden="true">
              <span>{`\u2713`}</span>
            </span>
            <h1 className={styles.success__title} id="order-success-title">
              {copy.title}
            </h1>
          </div>

          <p className={styles.success__subtitle}>{copy.subtitle}</p>

          <output className={styles.success__etaCard} aria-live="polite">
            <span className={styles.success__etaLabel}>{copy.etaLabel}</span>
            <span className={styles.success__etaValue}>{copy.etaValue}</span>
          </output>

          <div className={styles.success__infoGrid}>
            <article className={styles.success__panel}>
              <h2 className={styles.success__panelTitle}>{copy.stepsTitle}</h2>
              <ul className={styles.success__steps}>
                {copy.steps.map((step) => (
                  <li key={step} className={styles.success__step}>
                    {step}
                  </li>
                ))}
              </ul>
            </article>

            <article className={styles.success__panel}>
              <h2 className={styles.success__panelTitle}>
                {copy.securityTitle}
              </h2>
              <p className={styles.success__panelText}>{copy.securityText}</p>
            </article>
          </div>

          <div className={styles.success__actions}>
            <LocalizedLink
              href={PAGES.HOME}
              className={styles.success__primaryBtn}
            >
              {copy.actions.home}
            </LocalizedLink>
            <LocalizedLink
              href={PAGES.SUPPORT}
              className={styles.success__secondaryBtn}
            >
              {copy.actions.support}
            </LocalizedLink>
          </div>
        </div>
      </section>
    </main>
  );
}
