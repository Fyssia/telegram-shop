import {
  AtSignIcon,
  CheckCircleIcon,
  LockIcon,
  RouteIcon,
  SlidersIcon,
  ZapIcon,
} from "@/components/ui/icons";
import { getDictionary } from "@/i18n/server";
import styles from "./stepsCard.module.scss";

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
  if (name === "sliders") return <SlidersIcon size={20} />;
  if (name === "lock") return <LockIcon size={20} />;
  if (name === "check") return <CheckCircleIcon size={20} />;
  return <AtSignIcon size={20} />;
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
            <RouteIcon size={20} />
          </span>

          <div className={styles.stepsCard__headerText}>
            <h2 className={styles.stepsCard__title} id="checkout-steps-title">
              {section.title}
            </h2>
            <p className={styles.stepsCard__subtitle}>{section.subtitle}</p>
          </div>
        </div>

        <p className={styles.stepsCard__pill}>
          <ZapIcon size={18} />
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
