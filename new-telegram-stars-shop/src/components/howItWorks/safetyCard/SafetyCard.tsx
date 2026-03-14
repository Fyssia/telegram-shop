import { getDictionary } from "@/i18n/server";
import styles from "./safetyCard.module.scss";

function ShieldCheckIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function CheckIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default async function SafetyCard() {
  const section = (await getDictionary()).howItWorksPage.safetyCard;

  return (
    <section className={styles.safetyCard} aria-labelledby="safety-title">
      <header className={styles.safetyCard__header}>
        <span className={styles.safetyCard__icon} aria-hidden="true">
          <ShieldCheckIcon />
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
              <CheckIcon />
            </span>
            <span className={styles.safetyCard__itemText}>{check}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
