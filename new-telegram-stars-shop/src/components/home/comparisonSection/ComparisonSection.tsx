import { CheckIcon } from "@/components/ui/icons";
import { getDictionary } from "@/i18n/server";
import styles from "./comparisonSection.module.scss";

export default async function ComparisonSection() {
  const section = (await getDictionary()).home.comparisonSection;

  return (
    <section className={styles.comparison} id="why" aria-labelledby="why-title">
      <div className={styles.comparison__inner}>
        <h2 className={styles.comparison__title} id="why-title">
          {section.title}
        </h2>
        <p className={styles.comparison__subtitle}>{section.subtitle}</p>

        <div className={styles.comparison__cards}>
          <article
            className={[
              styles.comparison__card,
              styles["comparison__card--traditional"],
            ].join(" ")}
          >
            <h3
              className={[
                styles.comparison__cardTitle,
                styles["comparison__cardTitle--muted"],
              ].join(" ")}
            >
              {section.randomSellers}
            </h3>
            <ul className={styles.comparison__list}>
              {section.traditionalPoints.map((text) => (
                <li
                  key={text}
                  className={[
                    styles.comparison__listItem,
                    styles["comparison__listItem--muted"],
                  ].join(" ")}
                >
                  <span
                    className={[
                      styles.comparison__listItemIcon,
                      styles["comparison__listItemIcon--muted"],
                    ].join(" ")}
                    aria-hidden="true"
                  >
                    <span className={styles.comparison__listItemDot} />
                  </span>
                  <span className={styles.comparison__listItemText}>
                    {text}
                  </span>
                </li>
              ))}
            </ul>
          </article>

          <article
            className={[
              styles.comparison__card,
              styles["comparison__card--our"],
            ].join(" ")}
          >
            <div className={styles.comparison__cardTitleRow}>
              <h3 className={styles.comparison__cardTitle}>
                {section.ourStore}
              </h3>
              <span className={styles.comparison__recommended}>
                {section.recommended}
              </span>
            </div>

            <ul className={styles.comparison__list}>
              {section.ourPoints.map((text) => (
                <li
                  key={text}
                  className={[
                    styles.comparison__listItem,
                    styles["comparison__listItem--positive"],
                  ].join(" ")}
                >
                  <span
                    className={[
                      styles.comparison__listItemIcon,
                      styles["comparison__listItemIcon--positive"],
                    ].join(" ")}
                    aria-hidden="true"
                  >
                    <CheckIcon size={16} weight="bold" />
                  </span>
                  <span className={styles.comparison__listItemText}>
                    {text}
                  </span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
