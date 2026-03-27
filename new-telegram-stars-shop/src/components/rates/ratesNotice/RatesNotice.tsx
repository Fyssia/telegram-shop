import { ShieldCheckIcon } from "@/components/ui/icons";
import { getDictionary } from "@/i18n/server";
import styles from "./ratesNotice.module.scss";

export default async function RatesNotice() {
  const notice = (await getDictionary()).rates.notice;

  return (
    <aside
      className={styles.ratesNotice}
      role="note"
      aria-label={notice.ariaNotice}
    >
      <span className={styles.ratesNotice__icon} aria-hidden="true">
        <ShieldCheckIcon size={20} />
      </span>
      <p className={styles.ratesNotice__text}>{notice.text}</p>
    </aside>
  );
}
