import { SendIcon } from "@/components/support/icons";
import { getDictionary } from "@/i18n/server";
import { EXTERNAL_LINKS } from "@/shared/data/links.data";
import styles from "./supportTelegramCta.module.scss";

export default async function SupportTelegramCta() {
  const cta = (await getDictionary()).support.telegramCta;

  return (
    <aside
      className={styles.bottomCta}
      aria-labelledby="support-telegram-title"
    >
      <div className={styles.bottomCta__copy}>
        <h2 className={styles.bottomCta__title} id="support-telegram-title">
          {cta.title}
        </h2>
        <p className={styles.bottomCta__text}>{cta.text}</p>
      </div>

      <a
        href={EXTERNAL_LINKS.telegramSupport}
        target="_blank"
        rel="noreferrer noopener"
        className={styles.bottomCta__button}
      >
        <SendIcon className={styles.bottomCta__buttonIcon} />
        <span>{cta.button}</span>
      </a>
    </aside>
  );
}
