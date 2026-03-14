import { getDictionary } from "@/i18n/server";
import styles from "./statusTimeline.module.scss";

type TimelineStep = {
  title: string;
  description: string;
};

const STEPS: TimelineStep[] = [
  {
    title: "Created",
    description: "Checkout started",
  },
  {
    title: "Paid",
    description: "Payment confirmed",
  },
  {
    title: "Sent",
    description: "Stars delivered",
  },
  {
    title: "Completed",
    description: "Receipt available",
  },
];

export default async function StatusTimeline() {
  const section = (await getDictionary()).howItWorksPage.statusTimeline;
  const localizedSteps = STEPS.map((step, index) => ({
    ...step,
    title: section.steps[index]?.title ?? step.title,
    description: section.steps[index]?.description ?? step.description,
  }));

  return (
    <section
      className={styles.statusTimeline}
      aria-labelledby="order-status-timeline-title"
    >
      <div className={styles.statusTimeline__inner}>
        <header className={styles.statusTimeline__header}>
          <h2
            className={styles.statusTimeline__title}
            id="order-status-timeline-title"
          >
            {section.title}
          </h2>
          <p className={styles.statusTimeline__typical}>{section.typical}</p>
        </header>

        <p className={styles.statusTimeline__subtitle}>{section.subtitle}</p>

        <ol
          className={styles.statusTimeline__steps}
          aria-label={section.ariaTimelineSteps}
        >
          {localizedSteps.map((step, index) => (
            <li
              key={`${step.title}-${index}`}
              className={styles.statusTimeline__step}
            >
              <span
                className={styles.statusTimeline__marker}
                aria-hidden="true"
              >
                <span className={styles.statusTimeline__index}>
                  {index + 1}
                </span>
                {index < localizedSteps.length - 1 ? (
                  <span className={styles.statusTimeline__line} />
                ) : null}
              </span>

              <div className={styles.statusTimeline__stepContent}>
                <p className={styles.statusTimeline__stepTitle}>{step.title}</p>
                <p className={styles.statusTimeline__stepDesc}>
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <ul
          className={styles.statusTimeline__highlights}
          aria-label={section.ariaHighlights}
        >
          <li className={styles.statusTimeline__highlight}>
            {section.highlights.telegramConfirmation}
          </li>
          <li className={styles.statusTimeline__highlight}>
            {section.highlights.receiptIncluded}
          </li>
        </ul>
      </div>
    </section>
  );
}
