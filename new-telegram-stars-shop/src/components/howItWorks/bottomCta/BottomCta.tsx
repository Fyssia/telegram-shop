import LocalizedLink from "@/components/i18n/LocalizedLink";
import { PAGES } from "@/config/pages.config";
import { getDictionary } from "@/i18n/server";
import styles from "./bottomCta.module.scss";

function ArrowRightIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

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
        <ArrowRightIcon />
        <span>{cta.button}</span>
      </LocalizedLink>
    </section>
  );
}
