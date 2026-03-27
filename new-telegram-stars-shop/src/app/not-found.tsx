import type { Metadata } from "next";
import Footer from "@/components/footer/Footer";
import Header from "@/components/header/Header";
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
      <Header />

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
