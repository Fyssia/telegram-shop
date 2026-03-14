import LocalizedLink from "@/components/i18n/LocalizedLink";
import { PAGES } from "@/config/pages.config";
import { getDictionary } from "@/i18n/server";
import styles from "./ctaSection.module.scss";

export default async function CtaSection() {
  const cta = (await getDictionary()).home.ctaSection;

  return (
    <section className={styles.cta} aria-labelledby="cta-title">
      <div className={styles.cta__inner}>
        <h2 className={styles.cta__title} id="cta-title">
          <span>{cta.title1}</span>
          <span>{cta.title2}</span>
        </h2>

        <p className={styles.cta__subtitle}>{cta.subtitle}</p>

        <div className={styles.cta__actions}>
          <LocalizedLink
            href={`${PAGES.HOME}#checkout`}
            className={[
              styles.cta__button,
              styles["cta__button--primary"],
            ].join(" ")}
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
              <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
            </svg>
            <span>{cta.buyStars}</span>
          </LocalizedLink>

          <LocalizedLink href={PAGES.FAQ} className={styles.cta__link}>
            {cta.readFaq}
          </LocalizedLink>
        </div>
      </div>
    </section>
  );
}
