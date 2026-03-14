import { getDictionary } from "@/i18n/server";
import styles from "./ratesHero.module.scss";

function BadgePercentIcon() {
  return (
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
    >
      <path d="M17 17a2 2 0 1 0 2 2 2 2 0 0 0-2-2" />
      <path d="M7 5a2 2 0 1 0 2 2 2 2 0 0 0-2-2" />
      <path d="M19 5 5 19" />
    </svg>
  );
}

export default async function RatesHero() {
  const hero = (await getDictionary()).rates.hero;

  return (
    <section className={styles.ratesHero} aria-labelledby="rates-hero-title">
      <div className={styles.ratesHero__background} aria-hidden="true" />

      <div className={styles.ratesHero__inner}>
        <p className={styles.ratesHero__kicker}>
          <BadgePercentIcon />
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
