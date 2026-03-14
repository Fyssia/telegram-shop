"use client";

import LocalizedLink from "@/components/i18n/LocalizedLink";
import { PAGES } from "@/config/pages.config";
import { useI18n } from "@/i18n/client";
import styles from "./headerButtons.module.scss";

type HeaderButtonsProps = {
  className?: string;
  onNavigate?: () => void;
};

export default function HeaderButtons({
  className,
  onNavigate,
}: HeaderButtonsProps) {
  const { locale, messages, setLocale } = useI18n();
  const common = messages.common;

  return (
    <div
      className={
        className
          ? `${styles["header-buttons"]} ${className}`
          : styles["header-buttons"]
      }
    >
      <div className={styles["language-switch"]}>
        <button
          type="button"
          className={styles["lang-button"]}
          aria-pressed={locale === "ru"}
          onClick={() => {
            onNavigate?.();
            setLocale("ru");
          }}
        >
          {common.languageShort.ru}
        </button>
        <button
          type="button"
          className={styles["lang-button"]}
          aria-pressed={locale === "en"}
          onClick={() => {
            onNavigate?.();
            setLocale("en");
          }}
        >
          {common.languageShort.en}
        </button>
      </div>

      <LocalizedLink
        href={`${PAGES.HOME}#checkout`}
        className={`${styles["header-button"]} ${styles["blue-button"]}`}
        onClick={onNavigate}
        aria-label={messages.header.buyStars}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
          className="lucide lucide-star"
        >
          <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
        </svg>

        <span>{messages.header.buyStars}</span>
      </LocalizedLink>
    </div>
  );
}
