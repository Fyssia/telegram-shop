import { StarIcon } from "@/components/ui/icons";
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
            <StarIcon size={20} />
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
