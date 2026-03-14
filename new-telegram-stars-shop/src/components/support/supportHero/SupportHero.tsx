import { LifeBuoyIcon } from "@/components/support/icons";
import { getDictionary } from "@/i18n/server";
import styles from "./supportHero.module.scss";

export default async function SupportHero() {
  const hero = (await getDictionary()).support.hero;

  return (
    <section
      className={styles.supportHero}
      aria-labelledby="support-hero-title"
    >
      <div className={styles.supportHero__background} aria-hidden="true" />

      <div className={styles.supportHero__inner}>
        <p className={styles.supportHero__kicker}>
          <LifeBuoyIcon className={styles.supportHero__kickerIcon} />
          <span>{hero.kicker}</span>
        </p>

        <h1 className={styles.supportHero__title} id="support-hero-title">
          {hero.title}
        </h1>

        <p className={styles.supportHero__subtitle}>{hero.subtitle}</p>
      </div>
    </section>
  );
}
