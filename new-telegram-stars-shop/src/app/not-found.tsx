import type { Metadata } from "next";
import Image from "next/image";
import Footer from "@/components/footer/Footer";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import { PAGES } from "@/config/pages.config";
import { getDictionary } from "@/i18n/server";
import styles from "./not-found.module.scss";

export async function generateMetadata(): Promise<Metadata> {
  const { metadata } = await getDictionary();

  return {
    ...metadata.pages.notFound,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function NotFound() {
  const messages = await getDictionary();
  const notFound = messages.notFound;

  return (
    <div className={styles.notFound}>
      <header className={styles.notFound__header}>
        <div className={styles.notFound__headerInner}>
          <LocalizedLink href={PAGES.HOME} className={styles.notFound__brand}>
            <Image
              src="/logo-mark.svg"
              alt={messages.common.brandName}
              width={24}
              height={24}
              className={styles.notFound__brandMark}
              priority
            />
            <span className={styles.notFound__brandText}>
              {messages.common.brandName}
            </span>
          </LocalizedLink>

          <nav
            className={styles.notFound__headerNav}
            aria-label={notFound.navLabel}
          >
            <LocalizedLink
              href={PAGES.HOME}
              className={styles.notFound__backLink}
            >
              {notFound.backToHome}
            </LocalizedLink>
            <LocalizedLink
              href={PAGES.PACKS}
              className={styles.notFound__buyLink}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
                className={styles.notFound__buyIcon}
              >
                <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
              </svg>
              <span>{notFound.buyStars}</span>
            </LocalizedLink>
          </nav>
        </div>
      </header>

      <main className={styles.notFound__main}>
        <section
          className={styles.notFound__hero}
          aria-labelledby="not-found-title"
        >
          <p className={styles.notFound__heroCode} aria-hidden="true">
            404
          </p>

          <div className={styles.notFound__card}>
            <h1 className={styles.notFound__title} id="not-found-title">
              {notFound.title}
            </h1>
            <p className={styles.notFound__text}>{notFound.description}</p>

            <div className={styles.notFound__actions}>
              <LocalizedLink
                href={PAGES.HOME}
                className={styles.notFound__primaryBtn}
              >
                {notFound.backToHome}
              </LocalizedLink>
              <LocalizedLink
                href={PAGES.SUPPORT}
                className={styles.notFound__secondaryBtn}
              >
                {notFound.contactSupport}
              </LocalizedLink>
            </div>
          </div>
        </section>

        <section
          className={styles.notFound__content}
          aria-labelledby="not-found-cta-title"
        >
          <div className={styles.notFound__contentInner}>
            <div className={styles.notFound__cta}>
              <div className={styles.notFound__ctaCopy}>
                <h2
                  className={styles.notFound__ctaTitle}
                  id="not-found-cta-title"
                >
                  {notFound.ctaTitle}
                </h2>
                <p className={styles.notFound__ctaText}>{notFound.ctaText}</p>
              </div>

              <LocalizedLink
                href={PAGES.PACKS}
                className={styles.notFound__ctaBtn}
              >
                {notFound.buyStars}
              </LocalizedLink>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
