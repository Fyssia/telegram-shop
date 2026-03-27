import { ArrowRightIcon } from "@/components/ui/icons";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import { PAGES } from "@/config/pages.config";
import { getDictionary } from "@/i18n/server";
import styles from "./bottomCta.module.scss";

export default async function BottomCta() {
  const cta = (await getDictionary()).howItWorksPage.bottomCta;

  return (
    <section
      className={styles.bottomCta}
      aria-labelledby="how-bottom-cta-title"
    >
      <div className={styles.bottomCta__copy}>
        <h2 className={styles.bottomCta__title} id="how-bottom-cta-title">
          {cta.title}
        </h2>
        <p className={styles.bottomCta__text}>{cta.text}</p>
      </div>

      <LocalizedLink
        href={`${PAGES.HOME}#checkout`}
        className={styles.bottomCta__button}
      >
        <ArrowRightIcon size={18} />
        <span>{cta.button}</span>
      </LocalizedLink>
    </section>
  );
}
