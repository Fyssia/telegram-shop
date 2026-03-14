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

type PrivacyCopy = {
  metaTitle: string;
  metaDescription: string;
  kicker: string;
  title: string;
  subtitle: string;
  updatedAt: string;
  sections: Section[];
};

const COPY: Record<Locale, PrivacyCopy> = {
  en: {
    metaTitle: "Privacy",
    metaDescription:
      "Privacy policy for Telegram Stars checkout and support interactions.",
    kicker: "Legal",
    title: "Privacy policy",
    subtitle:
      "This policy explains what data we process for checkout and support, and how we use it to deliver orders safely.",
    updatedAt: "Updated: March 5, 2026",
    sections: [
      {
        title: "1. Data we process",
        list: [
          "Telegram username for delivery.",
          "Order identifiers and payment status.",
          "Support form data (email and issue details).",
        ],
      },
      {
        title: "2. Why we process it",
        list: [
          "To validate order input and complete delivery.",
          "To track order status and handle disputes.",
          "To provide customer support and fraud prevention.",
        ],
      },
      {
        title: "3. Data retention",
        body: "Order and support records are retained only as long as required for operations, accounting, and dispute resolution.",
      },
      {
        title: "4. Data sharing",
        body: "We share only the minimum required data with payment and infrastructure providers used to process orders securely.",
      },
      {
        title: "5. Contact",
        body: "If you have privacy questions, contact support and include your request ID for faster handling.",
      },
    ],
  },
  ru: {
    metaTitle: "Конфиденциальность",
    metaDescription:
      "Политика конфиденциальности для checkout Telegram Stars и обращений в поддержку.",
    kicker: "Документы",
    title: "Политика конфиденциальности",
    subtitle:
      "В этой политике указано, какие данные мы обрабатываем для checkout и поддержки, и как используем их для безопасной доставки заказов.",
    updatedAt: "Обновлено: 5 марта 2026",
    sections: [
      {
        title: "1. Какие данные мы обрабатываем",
        list: [
          "Telegram username для доставки.",
          "Идентификаторы заказа и статус оплаты.",
          "Данные формы поддержки (email и описание проблемы).",
        ],
      },
      {
        title: "2. Для чего мы их используем",
        list: [
          "Для валидации данных заказа и завершения доставки.",
          "Для отслеживания статуса и обработки спорных случаев.",
          "Для поддержки пользователей и предотвращения мошенничества.",
        ],
      },
      {
        title: "3. Срок хранения",
        body: "Данные заказов и поддержки хранятся только столько, сколько необходимо для операций, учета и урегулирования споров.",
      },
      {
        title: "4. Передача данных",
        body: "Мы передаем только минимально необходимый объем данных платежным и инфраструктурным провайдерам для безопасной обработки заказов.",
      },
      {
        title: "5. Контакты",
        body: "По вопросам конфиденциальности обращайтесь в поддержку и указывайте request ID для ускоренной обработки.",
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
    PAGES.PRIVACY,
  );
}

export default async function PrivacyPage() {
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
