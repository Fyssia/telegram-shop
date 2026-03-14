import Image from "next/image";
import { CheckoutForm } from "@/components/CheckoutForm/CheckoutForm";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import { PAGES } from "@/config/pages.config";
import { getDictionary } from "@/i18n/server";
import { EXTERNAL_LINKS } from "@/shared/data/links.data";
import CopyReferralButton from "./CopyReferralButton";
import styles from "./splitSection.module.scss";

export default async function SplitSection() {
  const section = (await getDictionary()).home.split;

  return (
    <section
      className={styles.checkout}
      aria-labelledby="checkout-title"
      id="checkout"
    >
      <div className={styles.checkout__inner}>
        <header className={styles.checkout__header}>
          <h2 className={styles.checkout__title}>{section.header.title}</h2>
          <p className={styles.checkout__subtitle}>{section.header.subtitle}</p>
        </header>

        <div className={styles.checkout__row}>
          <article
            className={styles.checkout__buyCard}
            aria-labelledby="checkout-widget-title"
            aria-describedby="checkout-widget-subtitle"
          >
            <header className={styles.checkout__buyHeader}>
              <div className={styles.checkout__buyTitleRow}>
                <div className={styles.checkout__buyTitleLeft}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    focusable="false"
                    className={styles.checkout__buyTitleIcon}
                  >
                    <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
                  </svg>
                  <h3
                    className={styles.checkout__buyTitleText}
                    id="checkout-widget-title"
                  >
                    {section.buyCard.title}
                  </h3>
                </div>

                <div className={styles.checkout__buyTitlePill}>
                  <span>{section.buyCard.instant}</span>
                </div>
              </div>

              <p
                className={styles.checkout__buySubtitle}
                id="checkout-widget-subtitle"
              >
                {section.buyCard.subtitle}
              </p>
            </header>
            <CheckoutForm />
          </article>

          <article
            className={styles.checkout__tgCard}
            aria-labelledby="tg-integration-title"
            aria-describedby="tg-integration-desc"
          >
            <header className={styles.checkout__tgHeader}>
              <div className={styles.checkout__tgHeaderLeft}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                <h3
                  className={styles.checkout__tgHeaderText}
                  id="tg-integration-title"
                >
                  {section.telegramCard.title}
                </h3>
              </div>

              <div className={styles.checkout__tgHeaderPill}>
                <span>{section.telegramCard.badge}</span>
              </div>
            </header>

            <p className={styles.checkout__tgDesc} id="tg-integration-desc">
              {section.telegramCard.desc}
            </p>

            <div className={styles.checkout__tgButtons}>
              <a
                href={EXTERNAL_LINKS.telegramBot}
                target="_blank"
                rel="noreferrer noopener"
                className={styles.checkout__tgPrimaryBtn}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
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
                <span>{section.telegramCard.openBot}</span>
              </a>

              <a
                href={EXTERNAL_LINKS.telegramChannel}
                target="_blank"
                rel="noreferrer noopener"
                className={styles.checkout__tgSecondaryBtn}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M3 11l18-5-5 18-3-7-7-3z" />
                  <path d="M13 17l8-11" />
                </svg>
                <span>{section.telegramCard.joinChannel}</span>
              </a>
            </div>

            <div className={styles.checkout__phone} aria-hidden="true">
              <div className={styles.checkout__phoneTop}>
                <div className={styles.checkout__phoneTopLeft}>
                  <div className={styles.checkout__phoneAvatar} />
                  <span className={styles.checkout__phoneTitle}>
                    {section.telegramCard.phoneBotTitle}
                  </span>
                </div>

                <div className={styles.checkout__phoneTopRight}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    focusable="false"
                    className={styles.checkout__phoneTopIcon}
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    focusable="false"
                    className={styles.checkout__phoneTopIcon}
                  >
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="19" r="1" />
                  </svg>
                </div>
              </div>

              <div className={styles.checkout__phoneBody}>
                <div className={styles.checkout__phonePill}>
                  <span className={styles.checkout__phonePill__text}>
                    {section.telegramCard.phoneCommand}
                  </span>
                </div>

                <div className={styles.checkout__phoneImage}>
                  <Image
                    src={"/utka_star.webp"}
                    alt={section.telegramCard.phoneImageAlt}
                    width={200}
                    height={200}
                  ></Image>
                </div>
              </div>
            </div>
          </article>
        </div>

        <aside
          className={styles.checkout__referral}
          id="referral"
          aria-labelledby="referral-title"
        >
          <div className={styles.checkout__referralCopy}>
            <div className={styles.checkout__referralTitleRow}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
                className={styles.checkout__referralTitleIcon}
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>

              <h3
                className={styles.checkout__referralTitle}
                id="referral-title"
              >
                {section.referral.title}
              </h3>

              <span className={styles.checkout__referralBadge}>
                {section.referral.badge}
              </span>
            </div>

            <p className={styles.checkout__referralDesc}>
              {section.referral.desc}
            </p>

            <div className={styles.checkout__referralButtons}>
              <CopyReferralButton
                className={styles.checkout__refCopyBtn}
                label={section.referral.copyLink}
                copiedLabel={section.referral.copied}
              />

              <LocalizedLink
                href={PAGES.SUPPORT}
                className={styles.checkout__refLearnBtn}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
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
                  <path d="m12 5 7 7-7 7" />
                </svg>
                <span>{section.referral.learnMore}</span>
              </LocalizedLink>
            </div>
          </div>

          <div className={styles.checkout__referralIllo} aria-hidden="true">
            <div className={styles.checkout__refGlow} />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.checkout__refStar}
              aria-hidden="true"
              focusable="false"
            >
              <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
            </svg>

            <div className={styles.checkout__refCoinOne} />
            <div className={styles.checkout__refCoinTwo} />
          </div>
        </aside>
      </div>
    </section>
  );
}
