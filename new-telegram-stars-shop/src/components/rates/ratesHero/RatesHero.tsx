import { BadgePercentIcon } from "@/components/ui/icons";
import { getDictionary } from "@/i18n/server";
import styles from "./ratesHero.module.scss";

export default async function RatesHero() {
  const hero = (await getDictionary()).rates.hero;

  return (
    <section className={styles.ratesHero} aria-labelledby="rates-hero-title">
      <div className={styles.ratesHero__background} aria-hidden="true" />

      <div className={styles.ratesHero__inner}>
        <p className={styles.ratesHero__kicker}>
          <BadgePercentIcon size={18} />
          <span>{hero.kicker}</span>
        </p>

        <h1 className={styles.ratesHero__title} id="rates-hero-title">
          {hero.title}
        </h1>

        <p className={styles.ratesHero__subtitle}>{hero.subtitle}</p>
      </div>
    </section>
  );
}
