import {
  ActivityIcon,
  BarChartIcon,
  CalendarIcon,
  DownloadIcon,
  LayoutDashboardIcon,
  PieChartIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "@/components/ui/icons";
import { getDictionary } from "@/i18n/server";
import styles from "./reportingPreview.module.scss";

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
            <LayoutDashboardIcon size={20} />
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
          <DownloadIcon size={18} />
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
                  <ActivityIcon size={20} />
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
                <SparklesIcon size={16} />
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
                  <PieChartIcon size={20} />
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
                <ShieldCheckIcon size={16} />
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
                <BarChartIcon size={20} />
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
              <CalendarIcon size={16} />
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
