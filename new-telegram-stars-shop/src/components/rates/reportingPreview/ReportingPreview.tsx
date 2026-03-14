import { getDictionary } from "@/i18n/server";
import styles from "./reportingPreview.module.scss";

function LayoutDashboardIcon() {
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
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}

function DownloadIcon() {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}

function ActivityIcon() {
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
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 3L13.1 8.5 18 10l-4.9 1.5L12 17l-1.1-5.5L6 10l4.9-1.5L12 3z" />
      <path d="M5 3l.5 2.5L8 6 5.5 6.5 5 9 4.5 6.5 2 6l2.5-.5L5 3z" />
      <path d="M19 15l.7 3.3L23 19l-3.3.7L19 23l-.7-3.3L15 19l3.3-.7L19 15z" />
    </svg>
  );
}

function PieChartIcon() {
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
      <path d="M21 12c.552 0 1.005-.449.95-.998A10 10 0 1 0 13 21.95c.55.055.998-.398.998-.95 0-5.523 4.477-10 10.002-10" />
      <path d="M12 2v10h10" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
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

function BarChartIcon() {
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
      <path d="M3 3v18h18" />
      <path d="M7 16v-6" />
      <path d="M12 16V8" />
      <path d="M17 16v-3" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

function TrendChart() {
  return (
    <div className={styles.reportingPreview__trendChart} aria-hidden="true">
      <svg
        className={styles.reportingPreview__trendChartSvg}
        viewBox="0 0 692 96"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          className={styles.reportingPreview__trendChartLine}
          d="M0 76 C 110 52, 190 62, 260 44 S 420 60, 492 40 S 620 20, 692 30"
        />
        <circle
          className={styles.reportingPreview__trendChartDot}
          cx="622"
          cy="14"
          r="5"
        />
      </svg>
    </div>
  );
}

function MixBar() {
  return (
    <div className={styles.reportingPreview__mixBar} aria-hidden="true">
      <span className={styles.reportingPreview__mixSegTon} />
      <span className={styles.reportingPreview__mixSegCard} />
      <span className={styles.reportingPreview__mixSegOther} />
    </div>
  );
}

export default async function ReportingPreview() {
  const section = (await getDictionary()).rates.reportingPreview;

  return (
    <section
      className={styles.reportingPreview}
      aria-labelledby="reporting-preview-title"
    >
      <header className={styles.reportingPreview__titleRow}>
        <div className={styles.reportingPreview__titleLeft}>
          <span
            className={styles.reportingPreview__titleIcon}
            aria-hidden="true"
          >
            <LayoutDashboardIcon />
          </span>
          <h2
            className={styles.reportingPreview__title}
            id="reporting-preview-title"
          >
            {section.title}
          </h2>
        </div>

        <button
          type="button"
          className={styles.reportingPreview__export}
          disabled
          aria-disabled="true"
        >
          <DownloadIcon />
          <span>{section.exportCsv}</span>
        </button>
      </header>

      <p className={styles.reportingPreview__subtitle}>{section.subtitle}</p>

      <div className={styles.reportingPreview__grid}>
        <div className={styles.reportingPreview__topRow}>
          <article
            className={styles.reportingPreview__card}
            aria-labelledby="reporting-delivery-title"
          >
            <header className={styles.reportingPreview__cardHeader}>
              <div className={styles.reportingPreview__cardHeaderLeft}>
                <span
                  className={[
                    styles.reportingPreview__cardHeaderIcon,
                    styles["reportingPreview__cardHeaderIcon--accent"],
                  ].join(" ")}
                  aria-hidden="true"
                >
                  <ActivityIcon />
                </span>
                <h3
                  className={styles.reportingPreview__cardTitle}
                  id="reporting-delivery-title"
                >
                  {section.cards.deliverySuccess}
                </h3>
              </div>

              <span
                className={[
                  styles.reportingPreview__pill,
                  styles["reportingPreview__pill--live"],
                ].join(" ")}
              >
                <SparklesIcon />
                <span>{section.cards.live}</span>
              </span>
            </header>

            <div className={styles.reportingPreview__valueRow}>
              <p className={styles.reportingPreview__value}>99.4%</p>
              <span className={styles.reportingPreview__valueNote}>
                {section.cards.last24h}
              </span>
            </div>

            <TrendChart />
          </article>

          <article
            className={styles.reportingPreview__card}
            aria-labelledby="reporting-mix-title"
          >
            <header className={styles.reportingPreview__cardHeader}>
              <div className={styles.reportingPreview__cardHeaderLeft}>
                <span
                  className={styles.reportingPreview__cardHeaderIcon}
                  aria-hidden="true"
                >
                  <PieChartIcon />
                </span>
                <h3
                  className={styles.reportingPreview__cardTitle}
                  id="reporting-mix-title"
                >
                  {section.cards.paymentMix}
                </h3>
              </div>

              <span
                className={[
                  styles.reportingPreview__pill,
                  styles["reportingPreview__pill--secure"],
                ].join(" ")}
              >
                <ShieldCheckIcon />
                <span>{section.cards.secure}</span>
              </span>
            </header>

            <div className={styles.reportingPreview__valueRow}>
              <p className={styles.reportingPreview__value}>68%</p>
              <span className={styles.reportingPreview__valueNote}>
                {section.cards.tonSharePlaceholder}
              </span>
            </div>

            <MixBar />

            <ul
              className={styles.reportingPreview__legend}
              aria-label={section.cards.legend}
            >
              <li className={styles.reportingPreview__legendItem}>
                <span
                  className={[
                    styles.reportingPreview__legendDot,
                    styles["reportingPreview__legendDot--ton"],
                  ].join(" ")}
                  aria-hidden="true"
                />
                <span>TON</span>
              </li>
              <li className={styles.reportingPreview__legendItem}>
                <span
                  className={[
                    styles.reportingPreview__legendDot,
                    styles["reportingPreview__legendDot--card"],
                  ].join(" ")}
                  aria-hidden="true"
                />
                <span>{section.cards.legendCard}</span>
              </li>
              <li className={styles.reportingPreview__legendItem}>
                <span
                  className={[
                    styles.reportingPreview__legendDot,
                    styles["reportingPreview__legendDot--other"],
                  ].join(" ")}
                  aria-hidden="true"
                />
                <span>{section.cards.legendOther}</span>
              </li>
            </ul>
          </article>
        </div>

        <article
          className={styles.reportingPreview__card}
          aria-labelledby="reporting-popularity-title"
        >
          <header className={styles.reportingPreview__cardHeader}>
            <div className={styles.reportingPreview__cardHeaderLeft}>
              <span
                className={styles.reportingPreview__cardHeaderIcon}
                aria-hidden="true"
              >
                <BarChartIcon />
              </span>
              <h3
                className={styles.reportingPreview__cardTitle}
                id="reporting-popularity-title"
              >
                {section.cards.packPopularity}
              </h3>
            </div>

            <span
              className={[
                styles.reportingPreview__pill,
                styles["reportingPreview__pill--time"],
              ].join(" ")}
            >
              <CalendarIcon />
              <span>{section.cards.last7Days}</span>
            </span>
          </header>

          <div
            className={styles.reportingPreview__barsChart}
            aria-hidden="true"
          >
            <div className={styles.reportingPreview__barsGroup}>
              <div className={styles.reportingPreview__barWrap}>
                <div className={styles.reportingPreview__barLabel}>
                  <span className={styles.reportingPreview__barLabelValue}>
                    12%
                  </span>
                  <span className={styles.reportingPreview__barLabelText}>
                    250
                  </span>
                </div>
                <div
                  className={[
                    styles.reportingPreview__bar,
                    styles["reportingPreview__bar--250"],
                  ].join(" ")}
                />
              </div>

              <div className={styles.reportingPreview__barWrap}>
                <div className={styles.reportingPreview__barLabel}>
                  <span className={styles.reportingPreview__barLabelValue}>
                    32%
                  </span>
                  <span className={styles.reportingPreview__barLabelText}>
                    1k
                  </span>
                </div>
                <div
                  className={[
                    styles.reportingPreview__bar,
                    styles["reportingPreview__bar--1000"],
                  ].join(" ")}
                />
              </div>

              <div className={styles.reportingPreview__barWrap}>
                <div className={styles.reportingPreview__barLabel}>
                  <span className={styles.reportingPreview__barLabelValue}>
                    41%
                  </span>
                  <span className={styles.reportingPreview__barLabelText}>
                    2.5k
                  </span>
                </div>
                <div
                  className={[
                    styles.reportingPreview__bar,
                    styles["reportingPreview__bar--2500"],
                  ].join(" ")}
                />
              </div>

              <div className={styles.reportingPreview__barWrap}>
                <div className={styles.reportingPreview__barLabel}>
                  <span className={styles.reportingPreview__barLabelValue}>
                    15%
                  </span>
                  <span className={styles.reportingPreview__barLabelText}>
                    5k
                  </span>
                </div>
                <div
                  className={[
                    styles.reportingPreview__bar,
                    styles["reportingPreview__bar--5000"],
                  ].join(" ")}
                />
              </div>
            </div>

            <span className={styles.reportingPreview__barsAxisLabel}>
              {section.cards.packs}
            </span>
          </div>
        </article>
      </div>
    </section>
  );
}
