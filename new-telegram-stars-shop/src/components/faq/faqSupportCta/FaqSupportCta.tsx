import { MessageCircleIcon } from "@/components/faq/icons";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import { PAGES } from "@/config/pages.config";
import { getDictionary } from "@/i18n/server";
import styles from "./faqSupportCta.module.scss";

export default async function FaqSupportCta() {
  const cta = (await getDictionary()).faq.supportCta;

  return (
    <aside className={styles.bottomCta} aria-labelledby="faq-support-title">
      <div className={styles.bottomCta__copy}>
        <h2 className={styles.bottomCta__title} id="faq-support-title">
          {cta.title}
        </h2>
        <p className={styles.bottomCta__text}>{cta.text}</p>
      </div>

      <LocalizedLink href={PAGES.SUPPORT} className={styles.bottomCta__button}>
        <MessageCircleIcon className={styles.bottomCta__buttonIcon} />
        <span>{cta.button}</span>
      </LocalizedLink>
    </aside>
  );
}
