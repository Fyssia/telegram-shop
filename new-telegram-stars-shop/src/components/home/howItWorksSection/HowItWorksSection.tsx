import {
  CheckIcon,
  CreditCardIcon,
  ReceiptIcon,
  ShoppingCartIcon,
  SparklesIcon,
  StarIcon,
  TelegramIcon,
} from "@/components/ui/icons";
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
                    <ShoppingCartIcon
                      size={18}
                      className={styles.how__stepIcon}
                    />
                    <span>{section.steps[1].title}</span>
                  </div>
                  <p className={styles.how__stepSub}>{section.steps[1].sub}</p>
                </div>
              </li>

              <li className={styles.how__step}>
                <span className={styles.how__stepNum}>3</span>
                <div className={styles.how__stepText}>
                  <div className={styles.how__stepTitle}>
                    <CreditCardIcon
                      size={18}
                      className={styles.how__stepIcon}
                    />
                    <span>{section.steps[2].title}</span>
                  </div>
                  <p className={styles.how__stepSub}>{section.steps[2].sub}</p>
                </div>
              </li>

              <li className={styles.how__step}>
                <span className={styles.how__stepNum}>4</span>
                <div className={styles.how__stepText}>
                  <div className={styles.how__stepTitle}>
                    <SparklesIcon
                      size={18}
                      className={styles.how__stepIconStar}
                    />
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
                <TelegramIcon
                  size={18}
                  className={styles.how__previewTopIcon}
                />

                <span className={styles.how__previewTopTitle}>
                  {section.preview.topTitle}
                </span>
                <span className={styles.how__previewTopTag}>
                  {section.preview.topTag}
                </span>
              </div>

              <div className={styles.how__previewTopRight}>
                <CheckIcon
                  size={18}
                  className={styles.how__previewStatusIcon}
                />
                <span className={styles.how__previewStatusText}>
                  {section.preview.delivered}
                </span>
              </div>
            </div>

            <div className={styles.how__previewBody}>
              <div className={styles.how__rowIn}>
                <div className={styles.how__bubbleIn}>
                  <div className={styles.how__bubbleInTitle}>
                    <StarIcon size={18} className={styles.how__bubbleInStar} />
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
                  <ReceiptIcon size={18} className={styles.how__receiptIcon} />
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
