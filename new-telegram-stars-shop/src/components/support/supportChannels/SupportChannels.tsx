import LocalizedLink from "@/components/i18n/LocalizedLink";
import { HelpCircleIcon, MailIcon, SendIcon } from "@/components/support/icons";
import { PAGES } from "@/config/pages.config";
import { getDictionary } from "@/i18n/server";
import { EXTERNAL_LINKS } from "@/shared/data/links.data";
import styles from "./supportChannels.module.scss";

export default async function SupportChannels() {
  const channels = (await getDictionary()).support.channels;

  return (
    <section
      className={styles.supportChannels}
      aria-labelledby="support-channels-title"
    >
      <div className={styles.supportChannels__titleRow}>
        <SendIcon className={styles.supportChannels__titleIcon} />
        <h2
          className={styles.supportChannels__title}
          id="support-channels-title"
        >
          {channels.title}
        </h2>
      </div>

      <p className={styles.supportChannels__desc}>{channels.desc}</p>

      <ul className={styles.supportChannels__list}>
        <li>
          <a
            href={EXTERNAL_LINKS.telegramSupport}
            target="_blank"
            rel="noreferrer noopener"
            className={styles.supportChannels__item}
          >
            <SendIcon
              className={`${styles.supportChannels__itemIcon} ${styles["supportChannels__itemIcon--primary"]}`}
            />
            <span className={styles.supportChannels__itemText}>
              {channels.telegram}
            </span>
          </a>
        </li>
        <li>
          <a
            href={`mailto:${EXTERNAL_LINKS.supportEmail}`}
            className={styles.supportChannels__item}
          >
            <MailIcon
              className={`${styles.supportChannels__itemIcon} ${styles["supportChannels__itemIcon--star"]}`}
            />
            <span className={styles.supportChannels__itemText}>
              {channels.email}
            </span>
          </a>
        </li>
        <li>
          <LocalizedLink
            href={PAGES.FAQ}
            className={styles.supportChannels__item}
          >
            <HelpCircleIcon className={styles.supportChannels__itemIcon} />
            <span className={styles.supportChannels__itemText}>
              {channels.faqFirst}
            </span>
          </LocalizedLink>
        </li>
      </ul>
    </section>
  );
}
