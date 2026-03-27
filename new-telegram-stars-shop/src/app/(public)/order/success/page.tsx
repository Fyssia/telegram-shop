import type { Metadata } from "next";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import {
  ArrowRightIcon,
  CheckBadgeIcon,
  HomeIcon,
  LifeBuoyIcon,
  ShieldIcon,
} from "@/components/ui/icons";
import { PAGES } from "@/config/pages.config";
import { withLocalizedAlternates } from "@/i18n/metadata";
import { getRequestLocale } from "@/i18n/server";
import type { Locale } from "@/i18n/types";
import styles from "./style.module.scss";

type OrderFlowStep = {
  title: string;
  text: string;
};

type OrderSuccessCopy = {
  metaTitle: string;
  metaDescription: string;
  kicker: string;
  title: string;
  subtitle: string;
  highlights: string[];
  homeCard: {
    eyebrow: string;
    title: string;
    text: string;
  };
  flowTitle: string;
  flowIntro: string;
  flow: OrderFlowStep[];
  securityTitle: string;
  securityText: string;
  securityPoints: string[];
  helpTitle: string;
  helpText: string;
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
    subtitle:
      "Payment has been accepted and the order is already moving through Telegram delivery.",
    highlights: [
      "Payment verified",
      "Telegram delivery in progress",
      "Support available if delayed",
    ],
    homeCard: {
      eyebrow: "Next step",
      title: "You can return to the homepage",
      text: "Delivery continues in the background, so you do not need to stay on this page while the order is being completed.",
    },
    flowTitle: "What happens next",
    flowIntro:
      "The delivery process is automatic after payment confirmation. Here is what to expect next.",
    flow: [
      {
        title: "We verify the payment",
        text: "The order is matched with the successful payment and prepared for Telegram delivery.",
      },
      {
        title: "We send the order in Telegram",
        text: "Stars or Telegram Premium are delivered to the selected Telegram account after verification.",
      },
      {
        title: "We stay available for follow-up",
        text: "If delivery takes longer than expected, support can manually check the order and update you.",
      },
    ],
    securityTitle: "Stay secure while you wait",
    securityText:
      "The order is already in process. You never need to send sensitive credentials to speed it up.",
    securityPoints: [
      "Support never asks for card codes or full payment secrets.",
      "Support never asks for Telegram login codes.",
      "Support never asks for wallet seed phrases or recovery words.",
    ],
    helpTitle: "Need help with this order?",
    helpText:
      "If delivery goes beyond the expected time, open support and include your payment receipt or order details.",
    actions: {
      home: "Back to home",
      support: "Contact support",
    },
  },
  ru: {
    metaTitle: "Заказ подтверждён",
    metaDescription:
      "Оплата подтверждена. Доставка обычно завершается в течение 15 минут.",
    kicker: "Заказ подтверждён",
    title: "Спасибо за заказ",
    subtitle:
      "Оплата принята, а заказ уже передан в процесс доставки через Telegram.",
    highlights: [
      "Оплата подтверждена",
      "Доставка в Telegram уже идёт",
      "Поддержка на связи при задержке",
    ],
    homeCard: {
      eyebrow: "Следующий шаг",
      title: "Можно вернуться на главную",
      text: "Доставка продолжается в фоне, поэтому оставаться на этой странице до завершения заказа не нужно.",
    },
    flowTitle: "Что происходит дальше",
    flowIntro:
      "После подтверждения оплаты доставка запускается автоматически. Вот что будет происходить дальше.",
    flow: [
      {
        title: "Проверяем оплату",
        text: "Заказ связывается с успешным платежом и подготавливается к доставке в Telegram.",
      },
      {
        title: "Передаём заказ в Telegram",
        text: "Звёзды или Telegram Premium отправляются на выбранный Telegram-аккаунт после подтверждения оплаты.",
      },
      {
        title: "Остаёмся на связи",
        text: "Если доставка заняла больше ожидаемого, поддержка может вручную проверить заказ и подсказать статус.",
      },
    ],
    securityTitle: "Пока ждёте, держите фокус на безопасности",
    securityText:
      "Заказ уже обрабатывается. Для ускорения доставки не нужно отправлять чувствительные данные.",
    securityPoints: [
      "Поддержка не запрашивает CVV/CVC и другие секреты оплаты.",
      "Поддержка не запрашивает коды входа Telegram.",
      "Поддержка не запрашивает seed-фразы и recovery words кошелька.",
    ],
    helpTitle: "Нужна помощь по заказу?",
    helpText:
      "Если доставка заняла больше ожидаемого, откройте поддержку и приложите чек оплаты или детали заказа.",
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
        className={styles.successHero}
        aria-labelledby="order-success-title"
      >
        <div className={styles.successHero__background} aria-hidden="true" />

        <div className={styles.successHero__inner}>
          <div className={styles.successHero__copy}>
            <p className={styles.successHero__kicker}>
              <CheckBadgeIcon size={18} />
              <span>{copy.kicker}</span>
            </p>

            <h1 className={styles.successHero__title} id="order-success-title">
              {copy.title}
            </h1>

            <p className={styles.successHero__subtitle}>{copy.subtitle}</p>

            <ul className={styles.successHero__highlights}>
              {copy.highlights.map((highlight) => (
                <li key={highlight} className={styles.successHero__highlight}>
                  {highlight}
                </li>
              ))}
            </ul>
          </div>

          <aside
            className={styles.successHero__homeCard}
            aria-labelledby="order-success-home-title"
          >
            <p className={styles.successHero__homeEyebrow}>
              {copy.homeCard.eyebrow}
            </p>

            <div className={styles.successHero__homeHeader}>
              <span className={styles.successHero__homeIcon} aria-hidden="true">
                <HomeIcon size={20} />
              </span>

              <div className={styles.successHero__homeCopy}>
                <h2
                  className={styles.successHero__homeTitle}
                  id="order-success-home-title"
                >
                  {copy.homeCard.title}
                </h2>
                <p className={styles.successHero__homeText}>
                  {copy.homeCard.text}
                </p>
              </div>
            </div>

            <LocalizedLink
              href={PAGES.HOME}
              className={styles.successHero__homeButton}
            >
              <span>{copy.actions.home}</span>
              <ArrowRightIcon size={18} />
            </LocalizedLink>
          </aside>
        </div>
      </section>

      <section className={styles.success__content}>
        <div className={styles.success__contentInner}>
          <div className={styles.success__sectionHeading}>
            <h2 className={styles.success__sectionTitle}>{copy.flowTitle}</h2>
            <p className={styles.success__sectionText}>{copy.flowIntro}</p>
          </div>

          <div className={styles.success__flowGrid}>
            {copy.flow.map((step, index) => (
              <article key={step.title} className={styles.success__flowCard}>
                <span className={styles.success__flowIndex} aria-hidden="true">
                  {index + 1}
                </span>
                <h3 className={styles.success__flowCardTitle}>{step.title}</h3>
                <p className={styles.success__flowCardText}>{step.text}</p>
              </article>
            ))}
          </div>

          <div className={styles.success__bottomGrid}>
            <article className={styles.success__noticeCard}>
              <div className={styles.success__noticeIcon} aria-hidden="true">
                <ShieldIcon size={20} />
              </div>
              <div className={styles.success__noticeCopy}>
                <h2 className={styles.success__noticeTitle}>
                  {copy.securityTitle}
                </h2>
                <p className={styles.success__noticeText}>
                  {copy.securityText}
                </p>
                <ul className={styles.success__noticeList}>
                  {copy.securityPoints.map((point) => (
                    <li key={point} className={styles.success__noticeItem}>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </article>

            <article className={styles.success__helpCard}>
              <div className={styles.success__helpIcon} aria-hidden="true">
                <LifeBuoyIcon size={20} />
              </div>
              <div className={styles.success__helpCopy}>
                <h2 className={styles.success__helpTitle}>{copy.helpTitle}</h2>
                <p className={styles.success__helpText}>{copy.helpText}</p>
              </div>
              <LocalizedLink
                href={PAGES.SUPPORT}
                className={styles.success__helpButton}
              >
                <span>{copy.actions.support}</span>
                <ArrowRightIcon size={18} />
              </LocalizedLink>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
