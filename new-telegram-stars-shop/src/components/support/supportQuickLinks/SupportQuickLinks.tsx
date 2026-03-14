import LocalizedLink from "@/components/i18n/LocalizedLink";
import {
  BugIcon,
  ClockIcon,
  CreditCardIcon,
  LifeBuoyIcon,
} from "@/components/support/icons";
import { PAGES } from "@/config/pages.config";
import { getDictionary } from "@/i18n/server";
import styles from "./supportQuickLinks.module.scss";

export default async function SupportQuickLinks() {
  const links = (await getDictionary()).support.quickLinks;

  return (
    <nav
      className={styles.supportQuickLinks}
      aria-labelledby="support-quick-title"
    >
      <div className={styles.supportQuickLinks__titleRow}>
        <LifeBuoyIcon className={styles.supportQuickLinks__titleIcon} />
        <h2
          className={styles.supportQuickLinks__title}
          id="support-quick-title"
        >
          {links.title}
        </h2>
      </div>

      <ul className={styles.supportQuickLinks__list}>
        <li>
          <LocalizedLink
            href={PAGES.PACKS}
            className={styles.supportQuickLinks__item}
          >
            <CreditCardIcon
              className={`${styles.supportQuickLinks__itemIcon} ${styles["supportQuickLinks__itemIcon--primary"]}`}
            />
            <span className={styles.supportQuickLinks__itemText}>
              {links.paymentsReceipts}
            </span>
          </LocalizedLink>
        </li>
        <li>
          <a href="#support-contact" className={styles.supportQuickLinks__item}>
            <BugIcon
              className={`${styles.supportQuickLinks__itemIcon} ${styles["supportQuickLinks__itemIcon--star"]}`}
            />
            <span className={styles.supportQuickLinks__itemText}>
              {links.reportProblem}
            </span>
          </a>
        </li>
        <li>
          <LocalizedLink
            href={PAGES.HOW_IT_WORKS}
            className={styles.supportQuickLinks__item}
          >
            <ClockIcon
              className={`${styles.supportQuickLinks__itemIcon} ${styles["supportQuickLinks__itemIcon--primary"]}`}
            />
            <span className={styles.supportQuickLinks__itemText}>
              {links.deliveryConfirmation}
            </span>
          </LocalizedLink>
        </li>
      </ul>
    </nav>
  );
}
