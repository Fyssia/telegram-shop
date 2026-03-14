import { getDictionary } from "@/i18n/server";
import styles from "./faqHero.module.scss";

export default async function FaqHero() {
  const hero = (await getDictionary()).faq.hero;

  return (
    <section className={styles.faqHero} aria-labelledby="faq-hero-title">
      <div className={styles.faqHero__background} aria-hidden="true" />
      <div className={styles.faqHero__inner}>
        <h1 className={styles.faqHero__title} id="faq-hero-title">
          {hero.title}
        </h1>

        <p className={styles.faqHero__subtitle}>{hero.subtitle}</p>
      </div>
    </section>
  );
}
