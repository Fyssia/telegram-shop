import { CheckIcon, ShieldCheckIcon } from "@/components/ui/icons";
import { getDictionary } from "@/i18n/server";
import styles from "./safetyCard.module.scss";

export default async function SafetyCard() {
  const section = (await getDictionary()).howItWorksPage.safetyCard;

  return (
    <section className={styles.safetyCard} aria-labelledby="safety-title">
      <header className={styles.safetyCard__header}>
        <span className={styles.safetyCard__icon} aria-hidden="true">
          <ShieldCheckIcon size={20} />
        </span>
        <h2 className={styles.safetyCard__title} id="safety-title">
          {section.title}
        </h2>
      </header>

      <p className={styles.safetyCard__desc}>{section.desc}</p>

      <ul className={styles.safetyCard__list} aria-label={section.ariaChecks}>
        {section.checks.map((check) => (
          <li key={check} className={styles.safetyCard__item}>
            <span className={styles.safetyCard__itemIcon} aria-hidden="true">
              <CheckIcon size={18} />
            </span>
            <span className={styles.safetyCard__itemText}>{check}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
