import { WandIcon } from "@/components/ui/icons";
import { getDictionary } from "@/i18n/server";
import styles from "./howItWorksHero.module.scss";

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
          <WandIcon size={18} />
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
