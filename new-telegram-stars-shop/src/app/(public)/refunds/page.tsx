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

type RefundsCopy = {
  metaTitle: string;
  metaDescription: string;
  kicker: string;
  title: string;
  subtitle: string;
  updatedAt: string;
  sections: Section[];
};

const COPY: Record<Locale, RefundsCopy> = {
  en: {
    metaTitle: "Refunds",
    metaDescription:
      "Refund policy for Telegram Stars purchases and failed deliveries.",
    kicker: "Legal",
    title: "Refund policy",
    subtitle:
      "Refunds are evaluated by payment and delivery status. Include your request ID in every support ticket.",
    updatedAt: "Updated: March 5, 2026",
    sections: [
      {
        title: "1. Refund eligibility",
        list: [
          "Order failed and Stars were not delivered.",
          "Payment was captured but status stayed unresolved beyond the support SLA.",
          "A confirmed technical issue on our side prevented delivery.",
        ],
      },
      {
        title: "2. Non-refundable cases",
        list: [
          "Successful delivery to the username entered before payment.",
          "Incorrect recipient entered by the customer.",
          "Requests that violate abuse and fraud protections.",
        ],
      },
      {
        title: "3. How to request a refund",
        list: [
          "Contact support with your request ID.",
          "Attach payment confirmation and approximate payment time.",
          "Describe the issue in one message to speed up resolution.",
        ],
      },
      {
        title: "4. Review and timeline",
        body: "Each request is reviewed manually against payment and delivery logs. Response time depends on payment provider confirmation windows.",
      },
      {
        title: "5. Final note",
        body: "To reduce risk, always verify the @username in checkout before submitting payment.",
      },
    ],
  },
  ru: {
    metaTitle: "Возвраты",
    metaDescription:
      "Политика возвратов для покупки звёзд Telegram и неуспешной доставки.",
    kicker: "Документы",
    title: "Политика возвратов",
    subtitle:
      "Возвраты рассматриваются по статусу оплаты и доставки. В каждом обращении указывайте ID запроса.",
    updatedAt: "Обновлено: 5 марта 2026",
    sections: [
      {
        title: "1. Когда возможен возврат",
        list: [
          "Заказ завершился ошибкой, и звёзды не были доставлены.",
          "Оплата прошла, но статус не был урегулирован в заявленный срок обработки.",
          "Подтверждена техническая проблема на нашей стороне, которая помешала доставке.",
        ],
      },
      {
        title: "2. Когда возврат невозможен",
        list: [
          "Успешная доставка на @username, указанный до оплаты.",
          "Неверный получатель, введённый пользователем.",
          "Запросы, нарушающие антифрод-правила и защиту от злоупотреблений.",
        ],
      },
      {
        title: "3. Как запросить возврат",
        list: [
          "Напишите в поддержку и укажите ID запроса.",
          "Приложите подтверждение оплаты и примерное время платежа.",
          "Опишите проблему одним сообщением, чтобы ускорить разбор.",
        ],
      },
      {
        title: "4. Проверка и сроки",
        body: "Каждый запрос проверяется вручную по платёжным логам и логам доставки. Срок ответа зависит от времени подтверждения у платёжного провайдера.",
      },
      {
        title: "5. Важно",
        body: "Чтобы снизить риск ошибки, всегда проверяйте @username в форме заказа перед оплатой.",
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
    PAGES.REFUNDS,
  );
}

export default async function RefundsPage() {
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
