import LocalizedLink from "@/components/i18n/LocalizedLink";
import { PAGES } from "@/config/pages.config";
import { getDictionary } from "@/i18n/server";
import styles from "./supportRow.module.scss";

function CreditCardIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}

function CoinsIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.37 18.1" />
      <path d="M7 6h1v4" />
      <path d="m16 16 1-1" />
    </svg>
  );
}

function SendIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
      <path d="m21.854 2.147-10.94 10.939" />
    </svg>
  );
}

function HelpCircleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function PlusIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

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
  if (icon === "crypto") return <CoinsIcon />;
  if (icon === "telegram") return <SendIcon />;
  return <CreditCardIcon />;
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
              <CreditCardIcon />
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
              <HelpCircleIcon />
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
                  <PlusIcon />
                </span>
              </LocalizedLink>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
