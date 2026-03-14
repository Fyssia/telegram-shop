import { getDictionary } from "@/i18n/server";
import styles from "./stepsCard.module.scss";

function RouteIcon() {
  return (
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
      <circle cx="6" cy="19" r="3" />
      <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7H14a3.5 3.5 0 0 1 0-7h6" />
      <circle cx="18" cy="5" r="3" />
    </svg>
  );
}

function ZapIcon() {
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
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function AtSignIcon() {
  return (
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
      <circle cx="12" cy="12" r="4" />
      <path d="M16 8v5a3 3 0 0 1-3 3h0a3 3 0 0 1-3-3v-1" />
      <line x1="8" x2="8" y1="8" y2="8" />
      <path d="M20 12A8 8 0 1 0 4 12" />
    </svg>
  );
}

function SlidersIcon() {
  return (
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
      <line x1="21" x2="14" y1="4" y2="4" />
      <line x1="10" x2="3" y1="4" y2="4" />
      <line x1="21" x2="12" y1="12" y2="12" />
      <line x1="8" x2="3" y1="12" y2="12" />
      <line x1="21" x2="16" y1="20" y2="20" />
      <line x1="12" x2="3" y1="20" y2="20" />
      <line x1="14" x2="14" y1="2" y2="6" />
      <line x1="8" x2="8" y1="10" y2="14" />
      <line x1="16" x2="16" y1="18" y2="22" />
    </svg>
  );
}

function LockIcon() {
  return (
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
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
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
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

type Step = {
  icon: "at" | "sliders" | "lock" | "check";
  tone: "primary" | "star";
  text: string;
};

const STEPS: Step[] = [
  {
    icon: "at",
    tone: "primary",
    text: "Enter a Telegram username (or paste a link).",
  },
  {
    icon: "sliders",
    tone: "star",
    text: "Select the amount of Stars and payment method.",
  },
  {
    icon: "lock",
    tone: "primary",
    text: "Pay securely and confirm the transfer in Telegram.",
  },
  {
    icon: "check",
    tone: "star",
    text: "Receive confirmation and a receipt in Telegram.",
  },
];

function StepIcon({ name }: { name: Step["icon"] }) {
  if (name === "sliders") return <SlidersIcon />;
  if (name === "lock") return <LockIcon />;
  if (name === "check") return <CheckCircleIcon />;
  return <AtSignIcon />;
}

export default async function StepsCard() {
  const section = (await getDictionary()).howItWorksPage.stepsCard;
  const localizedSteps = STEPS.map((step, index) => ({
    ...step,
    text: section.steps[index] ?? step.text,
  }));

  return (
    <section
      className={styles.stepsCard}
      aria-labelledby="checkout-steps-title"
    >
      <header className={styles.stepsCard__header}>
        <div className={styles.stepsCard__headerLeft}>
          <span className={styles.stepsCard__headerIcon} aria-hidden="true">
            <RouteIcon />
          </span>

          <div className={styles.stepsCard__headerText}>
            <h2 className={styles.stepsCard__title} id="checkout-steps-title">
              {section.title}
            </h2>
            <p className={styles.stepsCard__subtitle}>{section.subtitle}</p>
          </div>
        </div>

        <p className={styles.stepsCard__pill}>
          <ZapIcon />
          <span>{section.fast}</span>
        </p>
      </header>

      <ol className={styles.stepsCard__grid} aria-label={section.ariaSteps}>
        {localizedSteps.map((step) => (
          <li key={step.text} className={styles.stepsCard__step}>
            <span
              className={[
                styles.stepsCard__stepIcon,
                step.tone === "star"
                  ? styles["stepsCard__stepIcon--star"]
                  : styles["stepsCard__stepIcon--primary"],
              ].join(" ")}
              aria-hidden="true"
            >
              <StepIcon name={step.icon} />
            </span>
            <span className={styles.stepsCard__stepText}>{step.text}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
