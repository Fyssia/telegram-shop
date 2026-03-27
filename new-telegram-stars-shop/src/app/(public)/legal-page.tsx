import LocalizedLink from "@/components/i18n/LocalizedLink";
import {
  ArrowCounterClockwiseIcon,
  ArrowRightIcon,
  CalendarBlankIcon,
  FileTextIcon,
  HeadsetIcon,
  ShieldCheckIcon,
} from "@/components/ui/icons";
import { PAGES } from "@/config/pages.config";
import type { Locale } from "@/i18n/types";
import { EXTERNAL_LINKS } from "@/shared/data/links.data";
import styles from "./legal.module.scss";

export type LegalDocumentKey = "terms" | "privacy" | "refunds";

export type LegalSection = {
  id: string;
  title: string;
  body?: string;
  list?: string[];
};

export type LegalCopy = {
  metaTitle: string;
  metaDescription: string;
  kicker: string;
  title: string;
  subtitle: string;
  updatedAt: string;
  sections: LegalSection[];
};

type LegalPageProps = {
  locale: Locale;
  documentKey: LegalDocumentKey;
  copy: LegalCopy;
};

const LEGAL_PATHS: Record<LegalDocumentKey, string> = {
  terms: PAGES.TERMS,
  privacy: PAGES.PRIVACY,
  refunds: PAGES.REFUNDS,
};

const LEGAL_CHROME = {
  en: {
    updatedLabel: "Updated",
    summaryTitle: "At a glance",
    navLabel: "Legal documents",
    contentsTitle: "On this page",
    supportTitle: "Need help with an order?",
    supportBody:
      "Support can move faster when your ticket includes the request ID, payment time, and a short issue summary.",
    supportPrimary: "Open support",
    supportSecondary: "Read FAQ",
    supportEmailPrefix: "Or email",
    nav: {
      terms: "Terms",
      privacy: "Privacy",
      refunds: "Refunds",
    },
  },
  ru: {
    updatedLabel: "Обновлено",
    summaryTitle: "Коротко",
    navLabel: "Юридические документы",
    contentsTitle: "На странице",
    supportTitle: "Нужна помощь по заказу?",
    supportBody:
      "Поддержка сможет ответить быстрее, если в обращении будут ID запроса, время оплаты и короткое описание проблемы.",
    supportPrimary: "Открыть поддержку",
    supportSecondary: "Посмотреть FAQ",
    supportEmailPrefix: "Или напишите на",
    nav: {
      terms: "Условия",
      privacy: "Конфиденциальность",
      refunds: "Возвраты",
    },
  },
} satisfies Record<
  Locale,
  {
    updatedLabel: string;
    summaryTitle: string;
    navLabel: string;
    contentsTitle: string;
    supportTitle: string;
    supportBody: string;
    supportPrimary: string;
    supportSecondary: string;
    supportEmailPrefix: string;
    nav: Record<LegalDocumentKey, string>;
  }
>;

const LEGAL_ICONS = {
  terms: FileTextIcon,
  privacy: ShieldCheckIcon,
  refunds: ArrowCounterClockwiseIcon,
} as const;

function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
) {
  return classNames.filter(Boolean).join(" ");
}

export default function LegalPage({
  locale,
  documentKey,
  copy,
}: LegalPageProps) {
  const chrome = LEGAL_CHROME[locale];
  const navItems = (Object.keys(LEGAL_PATHS) as LegalDocumentKey[]).map(
    (key) => ({
      key,
      href: LEGAL_PATHS[key],
      label: chrome.nav[key],
    }),
  );

  return (
    <main className={styles.legal}>
      <section className={styles.legal__hero}>
        <div className={styles.legal__heroBg} aria-hidden="true" />

        <div className={styles.legal__heroInner}>
          <div className={styles.legal__heroMain}>
            <p className={styles.legal__kicker}>{copy.kicker}</p>
            <h1 className={styles.legal__title}>{copy.title}</h1>
            <p className={styles.legal__subtitle}>{copy.subtitle}</p>

            <div className={styles.legal__updatedRow}>
              <span className={styles.legal__updatedPill}>
                <CalendarBlankIcon size={16} />
                <span>
                  {chrome.updatedLabel}: {copy.updatedAt}
                </span>
              </span>
            </div>
          </div>

          <nav className={styles.legal__docNav} aria-label={chrome.navLabel}>
            {navItems.map((item) => {
              const Icon = LEGAL_ICONS[item.key];
              const isActive = item.key === documentKey;

              return (
                <LocalizedLink
                  key={item.key}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={joinClassNames(
                    styles.legal__docLink,
                    isActive && styles.legal__docLinkActive,
                  )}
                >
                  <Icon size={17} className={styles.legal__docLinkIcon} />
                  <span>{item.label}</span>
                </LocalizedLink>
              );
            })}
          </nav>
        </div>
      </section>

      <section className={styles.legal__content}>
        <div className={styles.legal__contentInner}>
          <aside className={styles.legal__sidebar}>
            <div className={styles.legal__sidebarStack}>
              <div className={styles.legal__sidebarCard}>
                <p className={styles.legal__sidebarTitle}>
                  {chrome.contentsTitle}
                </p>

                <nav aria-label={chrome.contentsTitle}>
                  <ul className={styles.legal__tocList}>
                    {copy.sections.map((section, index) => (
                      <li key={section.id}>
                        <a
                          href={`#${section.id}`}
                          className={styles.legal__tocLink}
                        >
                          <span className={styles.legal__tocIndex}>
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span>{section.title}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>

              <div className={styles.legal__supportCard}>
                <div className={styles.legal__supportIconWrap}>
                  <HeadsetIcon size={18} />
                </div>

                <p className={styles.legal__sidebarTitle}>
                  {chrome.supportTitle}
                </p>
                <p className={styles.legal__sidebarBody}>
                  {chrome.supportBody}
                </p>

                <div className={styles.legal__supportActions}>
                  <LocalizedLink
                    href={PAGES.SUPPORT}
                    className={styles.legal__supportPrimary}
                  >
                    <span>{chrome.supportPrimary}</span>
                    <ArrowRightIcon size={16} />
                  </LocalizedLink>

                  <LocalizedLink
                    href={PAGES.FAQ}
                    className={styles.legal__supportSecondary}
                  >
                    {chrome.supportSecondary}
                  </LocalizedLink>
                </div>

                <p className={styles.legal__supportEmail}>
                  {chrome.supportEmailPrefix}{" "}
                  <a href={`mailto:${EXTERNAL_LINKS.supportEmail}`}>
                    {EXTERNAL_LINKS.supportEmail}
                  </a>
                </p>
              </div>
            </div>
          </aside>

          <div className={styles.legal__main}>
            {copy.sections.map((section, index) => (
              <article
                key={section.id}
                id={section.id}
                className={styles.legal__section}
              >
                <div className={styles.legal__sectionHeader}>
                  <span className={styles.legal__sectionIndex}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2 className={styles.legal__sectionTitle}>
                    {section.title}
                  </h2>
                </div>

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
        </div>
      </section>
    </main>
  );
}
