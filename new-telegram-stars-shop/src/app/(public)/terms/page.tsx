import type { Metadata } from "next";
import { PAGES } from "@/config/pages.config";
import { withLocalizedAlternates } from "@/i18n/metadata";
import { getRequestLocale } from "@/i18n/server";
import type { Locale } from "@/i18n/types";
import styles from "../legal.module.scss";

type Section = {
  title: string;
  body?: string;
  list?: string[];
};

type TermsCopy = {
  metaTitle: string;
  metaDescription: string;
  kicker: string;
  title: string;
  subtitle: string;
  updatedAt: string;
  sections: Section[];
};

const COPY: Record<Locale, TermsCopy> = {
  en: {
    metaTitle: "Terms",
    metaDescription:
      "Terms for using Telegram Stars checkout, payments, delivery, and support.",
    kicker: "Legal",
    title: "Terms of service",
    subtitle:
      "These terms explain how Stars checkout works, when delivery is considered complete, and how support handles disputes.",
    updatedAt: "Updated: March 5, 2026",
    sections: [
      {
        title: "1. Service scope",
        body: "We provide access to Telegram Stars top-ups and related support. Orders are processed only after successful payment confirmation.",
      },
      {
        title: "2. Account responsibility",
        body: "You are responsible for entering the correct Telegram @username before payment. Completed transfers to a valid username are considered delivered.",
      },
      {
        title: "3. Delivery and timing",
        list: [
          "Most orders are delivered within seconds.",
          "During peak load delivery can take longer.",
          "Order status and request ID are provided after submission.",
        ],
      },
      {
        title: "4. Prohibited use",
        list: [
          "Fraudulent payments or chargeback abuse.",
          "Automated abuse of checkout or referral flows.",
          "Attempts to disrupt service availability.",
        ],
      },
      {
        title: "5. Support and disputes",
        body: "If you have an issue, contact support and include your request ID. We investigate each case based on payment and delivery logs.",
      },
    ],
  },
  ru: {
    metaTitle: "Условия",
    metaDescription:
      "Условия использования сервиса покупки Telegram Stars, оплаты, доставки и поддержки.",
    kicker: "Документы",
    title: "Условия использования",
    subtitle:
      "Здесь описано, как работает checkout Stars, когда заказ считается доставленным и как поддержка обрабатывает спорные случаи.",
    updatedAt: "Обновлено: 5 марта 2026",
    sections: [
      {
        title: "1. Объем сервиса",
        body: "Мы предоставляем доступ к пополнению Telegram Stars и поддержке. Заказ обрабатывается только после подтверждения оплаты.",
      },
      {
        title: "2. Ответственность за аккаунт",
        body: "Вы отвечаете за корректный Telegram @username до оплаты. Завершенный перевод на валидный username считается доставкой.",
      },
      {
        title: "3. Доставка и сроки",
        list: [
          "Большинство заказов доставляется за секунды.",
          "В пиковую нагрузку доставка может занять больше времени.",
          "После отправки вы получаете статус заказа и request ID.",
        ],
      },
      {
        title: "4. Запрещенное использование",
        list: [
          "Мошеннические оплаты и злоупотребление чарджбэками.",
          "Автоматизированные злоупотребления checkout или referral-механиками.",
          "Попытки нарушить доступность сервиса.",
        ],
      },
      {
        title: "5. Поддержка и споры",
        body: "Если возникла проблема, обратитесь в поддержку и укажите request ID. Мы проверяем каждый кейс по платежным и delivery-логам.",
      },
    ],
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = COPY[locale];

  return withLocalizedAlternates(
    {
      title: copy.metaTitle,
      description: copy.metaDescription,
    },
    PAGES.TERMS,
  );
}

export default async function TermsPage() {
  const locale = await getRequestLocale();
  const copy = COPY[locale];

  return (
    <main className={styles.legal}>
      <section className={styles.legal__hero}>
        <div className={styles.legal__heroBg} aria-hidden="true" />
        <div className={styles.legal__heroInner}>
          <p className={styles.legal__kicker}>{copy.kicker}</p>
          <h1 className={styles.legal__title}>{copy.title}</h1>
          <p className={styles.legal__subtitle}>{copy.subtitle}</p>
        </div>
      </section>

      <section className={styles.legal__content}>
        <div className={styles.legal__contentInner}>
          <p className={styles.legal__meta}>{copy.updatedAt}</p>
          {copy.sections.map((section) => (
            <article key={section.title} className={styles.legal__section}>
              <h2 className={styles.legal__sectionTitle}>{section.title}</h2>
              {section.body ? (
                <p className={styles.legal__sectionBody}>{section.body}</p>
              ) : null}
              {section.list ? (
                <ul className={styles.legal__list}>
                  {section.list.map((item) => (
                    <li key={item} className={styles.legal__listItem}>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
