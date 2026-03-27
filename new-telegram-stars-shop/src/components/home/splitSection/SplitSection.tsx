import Image from "next/image";
import { CheckoutForm } from "@/components/CheckoutForm/CheckoutForm";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import {
  ArrowRightIcon,
  DotsMenuIcon,
  SearchIcon,
  StarIcon,
  TelegramIcon,
  UsersIcon,
} from "@/components/ui/icons";
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
                  <StarIcon
                    size={22}
                    className={styles.checkout__buyTitleIcon}
                  />
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
                <TelegramIcon size={22} />
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
                <TelegramIcon size={20} />
                <span>{section.telegramCard.openBot}</span>
              </a>

              <a
                href={EXTERNAL_LINKS.telegramChannel}
                target="_blank"
                rel="noreferrer noopener"
                className={styles.checkout__tgSecondaryBtn}
              >
                <TelegramIcon size={20} />
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
                  <SearchIcon
                    size={20}
                    className={styles.checkout__phoneTopIcon}
                  />
                  <DotsMenuIcon
                    size={20}
                    className={styles.checkout__phoneTopIcon}
                  />
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
              <div className={styles.checkout__referralHeading}>
                <UsersIcon
                  size={24}
                  className={styles.checkout__referralTitleIcon}
                />

                <h3
                  className={styles.checkout__referralTitle}
                  id="referral-title"
                >
                  {section.referral.title}
                </h3>
              </div>

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
                <ArrowRightIcon size={20} />
                <span>{section.referral.learnMore}</span>
              </LocalizedLink>
            </div>
          </div>

          <div className={styles.checkout__referralIllo} aria-hidden="true">
            <div className={styles.checkout__refGlow} />
            <StarIcon
              size={80}
              weight="bold"
              className={styles.checkout__refStar}
            />

            <div className={styles.checkout__refCoinOne} />
            <div className={styles.checkout__refCoinTwo} />
          </div>
        </aside>
      </div>
    </section>
  );
}
