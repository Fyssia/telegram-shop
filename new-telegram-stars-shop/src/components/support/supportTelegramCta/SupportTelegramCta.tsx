import { SendIcon } from "@/components/support/icons";
import { getDictionary } from "@/i18n/server";
import { EXTERNAL_LINKS } from "@/shared/data/links.data";
import styles from "./supportTelegramCta.module.scss";

export default async function SupportTelegramCta() {
  const cta = (await getDictionary()).support.telegramCta;

  return (
    <aside
      className={styles.supportTelegramCta}
      aria-labelledby="support-telegram-title"
    >
      <div className={styles.supportTelegramCta__copy}>
        <h2
          className={styles.supportTelegramCta__title}
          id="support-telegram-title"
        >
          {cta.title}
        </h2>
        <p className={styles.supportTelegramCta__text}>{cta.text}</p>
      </div>

      <a
        href={EXTERNAL_LINKS.telegramSupport}
        target="_blank"
        rel="noreferrer noopener"
        className={styles.supportTelegramCta__button}
      >
        <SendIcon className={styles.supportTelegramCta__buttonIcon} />
        <span>{cta.button}</span>
      </a>
    </aside>
  );
}
