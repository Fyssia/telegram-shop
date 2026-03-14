import { getDictionary } from "@/i18n/server";
import styles from "./howItWorksSection.module.scss";

export default async function HowItWorksSection() {
  const section = (await getDictionary()).home.howItWorksSection;

  return (
    <section className={styles.how} id="how" aria-labelledby="how-title">
      <div className={styles.how__inner}>
        <div className={styles.how__row}>
          <div className={styles.how__copy}>
            <h2 className={styles.how__title} id="how-title">
              <span>{section.title1}</span>
              <span>{section.title2}</span>
            </h2>

            <p className={styles.how__body}>{section.body}</p>

            <ol className={styles.how__steps}>
              <li className={styles.how__step}>
                <span className={styles.how__stepNum}>1</span>
                <div className={styles.how__stepText}>
                  <div className={styles.how__stepTitle}>
                    <span>@</span>
                    <span>{section.steps[0].title}</span>
                  </div>
                  <p className={styles.how__stepSub}>{section.steps[0].sub}</p>
                </div>
              </li>

              <li className={styles.how__step}>
                <span className={styles.how__stepNum}>2</span>
                <div className={styles.how__stepText}>
                  <div className={styles.how__stepTitle}>
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
                      className={styles.how__stepIcon}
                    >
                      <circle cx="8" cy="21" r="1" />
                      <circle cx="19" cy="21" r="1" />
                      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.72a2 2 0 0 0 2-1.58l1.2-6.47H6.26" />
                    </svg>
                    <span>{section.steps[1].title}</span>
                  </div>
                  <p className={styles.how__stepSub}>{section.steps[1].sub}</p>
                </div>
              </li>

              <li className={styles.how__step}>
                <span className={styles.how__stepNum}>3</span>
                <div className={styles.how__stepText}>
                  <div className={styles.how__stepTitle}>
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
                      className={styles.how__stepIcon}
                    >
                      <rect width="20" height="14" x="2" y="5" rx="2" />
                      <line x1="2" x2="22" y1="10" y2="10" />
                    </svg>
                    <span>{section.steps[2].title}</span>
                  </div>
                  <p className={styles.how__stepSub}>{section.steps[2].sub}</p>
                </div>
              </li>

              <li className={styles.how__step}>
                <span className={styles.how__stepNum}>4</span>
                <div className={styles.how__stepText}>
                  <div className={styles.how__stepTitle}>
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
                      className={styles.how__stepIconStar}
                    >
                      <path d="M12 3L13.1 8.5 18 10l-4.9 1.5L12 17l-1.1-5.5L6 10l4.9-1.5L12 3z" />
                      <path d="M5 3l.5 2.5L8 6 5.5 6.5 5 9 4.5 6.5 2 6l2.5-.5L5 3z" />
                      <path d="M19 15l.7 3.3L23 19l-3.3.7L19 23l-.7-3.3L15 19l3.3-.7L19 15z" />
                    </svg>
                    <span>{section.steps[3].title}</span>
                  </div>
                  <p className={styles.how__stepSub}>{section.steps[3].sub}</p>
                </div>
              </li>
            </ol>
          </div>

          <div className={styles.how__preview} aria-hidden="true">
            <div className={styles.how__previewTopbar}>
              <div className={styles.how__previewTopLeft}>
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
                  className={styles.how__previewTopIcon}
                >
                  <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
                  <path d="m21.854 2.147-10.94 10.939" />
                </svg>

                <span className={styles.how__previewTopTitle}>
                  {section.preview.topTitle}
                </span>
                <span className={styles.how__previewTopTag}>
                  {section.preview.topTag}
                </span>
              </div>

              <div className={styles.how__previewTopRight}>
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
                  className={styles.how__previewStatusIcon}
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span className={styles.how__previewStatusText}>
                  {section.preview.delivered}
                </span>
              </div>
            </div>

            <div className={styles.how__previewBody}>
              <div className={styles.how__rowIn}>
                <div className={styles.how__bubbleIn}>
                  <div className={styles.how__bubbleInTitle}>
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
                      className={styles.how__bubbleInStar}
                    >
                      <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
                    </svg>
                    <span>{section.preview.incomingTitle}</span>
                  </div>
                  <p className={styles.how__bubbleInSub}>
                    {section.preview.incomingSub}
                  </p>
                </div>
              </div>

              <div className={styles.how__rowOut}>
                <div className={styles.how__bubbleOut}>
                  <p className={styles.how__bubbleOutTitle}>
                    {section.preview.orderConfirmed}
                  </p>
                  <p className={styles.how__bubbleOutSub}>
                    {section.preview.paymentReceived}
                  </p>
                </div>
              </div>

              <div className={styles.how__receipt}>
                <div className={styles.how__receiptTitleRow}>
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
                    className={styles.how__receiptIcon}
                  >
                    <path d="M4 2h16v20l-4-2-4 2-4-2-4 2z" />
                    <path d="M8 6h8" />
                    <path d="M8 10h8" />
                    <path d="M8 14h8" />
                  </svg>
                  <span>{section.preview.checkoutSummary}</span>
                </div>

                <div className={styles.how__receiptRow}>
                  <span className={styles.how__receiptLabel}>
                    {section.preview.packLabel}
                  </span>
                  <span className={styles.how__receiptValue}>
                    {section.preview.packValue}
                  </span>
                </div>

                <div className={styles.how__receiptRow}>
                  <span className={styles.how__receiptLabel}>
                    {section.preview.totalLabel}
                  </span>
                  <span className={styles.how__receiptTotal}>$19.99</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
