import {
  CoinsIcon,
  CreditCardIcon,
  HelpCircleIcon,
  PlusIcon,
  TelegramIcon,
} from "@/components/ui/icons";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import { PAGES } from "@/config/pages.config";
import { getDictionary } from "@/i18n/server";
import styles from "./supportRow.module.scss";

type PaymentMethod = {
  title: string;
  description: string;
  tone: "star" | "primary" | "muted";
  icon: "card" | "crypto" | "telegram";
};

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    title: "Card",
    description: "Pay with bank cards (3DS where supported).",
    tone: "star",
    icon: "card",
  },
  {
    title: "Crypto",
    description: "USDT and TON with clear network selection.",
    tone: "primary",
    icon: "crypto",
  },
  {
    title: "Telegram",
    description: "Confirm orders inside Telegram for a smoother flow.",
    tone: "muted",
    icon: "telegram",
  },
];

function MethodIcon({ icon }: { icon: PaymentMethod["icon"] }) {
  if (icon === "crypto") return <CoinsIcon size={20} />;
  if (icon === "telegram") return <TelegramIcon size={20} />;
  return <CreditCardIcon size={20} />;
}

export default async function SupportRow() {
  const section = (await getDictionary()).rates.supportRow;
  const paymentMethods = PAYMENT_METHODS.map((method, index) => {
    const copy = section.paymentMethods.methods[index];
    if (!copy) return method;

    return {
      ...method,
      title: copy.title,
      description: copy.description,
    };
  });
  const faqPreview = section.faqPreview.questions;

  return (
    <section className={styles.supportRow} aria-label={section.supportAria}>
      <section
        className={styles.paymentMethods}
        aria-labelledby="payment-methods-title"
      >
        <header className={styles.paymentMethods__header}>
          <div className={styles.paymentMethods__titleRow}>
            <span
              className={styles.paymentMethods__titleIcon}
              aria-hidden="true"
            >
              <CreditCardIcon size={20} />
            </span>
            <h2
              className={styles.paymentMethods__title}
              id="payment-methods-title"
            >
              {section.paymentMethods.title}
            </h2>
            <span className={styles.paymentMethods__note}>
              {section.paymentMethods.note}
            </span>
          </div>
        </header>

        <div className={styles.paymentMethods__cards}>
          {paymentMethods.map((method) => (
            <article key={method.title} className={styles.paymentMethods__card}>
              <div className={styles.paymentMethods__cardTop}>
                <span
                  className={[
                    styles.paymentMethods__cardIcon,
                    method.tone === "star"
                      ? styles["paymentMethods__cardIcon--star"]
                      : method.tone === "primary"
                        ? styles["paymentMethods__cardIcon--primary"]
                        : styles["paymentMethods__cardIcon--muted"],
                  ].join(" ")}
                  aria-hidden="true"
                >
                  <MethodIcon icon={method.icon} />
                </span>
                <h3 className={styles.paymentMethods__cardTitle}>
                  {method.title}
                </h3>
              </div>
              <p className={styles.paymentMethods__cardDesc}>
                {method.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.faqPreview} aria-labelledby="rates-faq-title">
        <header className={styles.faqPreview__header}>
          <div className={styles.faqPreview__titleLeft}>
            <span className={styles.faqPreview__titleIcon} aria-hidden="true">
              <HelpCircleIcon size={20} />
            </span>
            <h2 className={styles.faqPreview__title} id="rates-faq-title">
              {section.faqPreview.title}
            </h2>
          </div>

          <LocalizedLink href={PAGES.FAQ} className={styles.faqPreview__link}>
            {section.faqPreview.viewAll}
          </LocalizedLink>
        </header>

        <ul
          className={styles.faqPreview__list}
          aria-label={section.faqPreview.ariaLabel}
        >
          {faqPreview.map((question) => (
            <li key={question}>
              <LocalizedLink
                href={PAGES.FAQ}
                className={styles.faqPreview__item}
              >
                <span className={styles.faqPreview__itemText}>{question}</span>
                <span
                  className={styles.faqPreview__itemIcon}
                  aria-hidden="true"
                >
                  <PlusIcon size={18} />
                </span>
              </LocalizedLink>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
