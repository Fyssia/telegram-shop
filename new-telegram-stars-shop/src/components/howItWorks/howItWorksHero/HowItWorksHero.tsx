import { getDictionary } from "@/i18n/server";
import styles from "./howItWorksHero.module.scss";

function WandIcon() {
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
      <path d="M15 4V2" />
      <path d="M15 16v-2" />
      <path d="M8 9h2" />
      <path d="M20 9h2" />
      <path d="M17.8 11.8 19 13" />
      <path d="M15 9a3 3 0 1 1-3-3" />
      <path d="M2 20l12-12" />
      <path d="M6 18l4 4" />
      <path d="M14 10l4 4" />
    </svg>
  );
}

export default async function HowItWorksHero() {
  const hero = (await getDictionary()).howItWorksPage.hero;

  return (
    <section
      className={styles.howItWorksHero}
      aria-labelledby="how-it-works-hero-title"
    >
      <div className={styles.howItWorksHero__background} aria-hidden="true" />

      <div className={styles.howItWorksHero__inner}>
        <p className={styles.howItWorksHero__kicker}>
          <WandIcon />
          <span>{hero.kicker}</span>
        </p>

        <h1
          className={styles.howItWorksHero__title}
          id="how-it-works-hero-title"
        >
          {hero.title}
        </h1>

        <p className={styles.howItWorksHero__subtitle}>{hero.subtitle}</p>
      </div>
    </section>
  );
}
