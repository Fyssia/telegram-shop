import LocalizedLink from "@/components/i18n/LocalizedLink";
import { PAGES } from "@/config/pages.config";
import { getDictionary } from "@/i18n/server";
import styles from "./bottomCta.module.scss";

function StarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
    </svg>
  );
}

export default async function BottomCta() {
  const cta = (await getDictionary()).rates.bottomCta;

  return (
    <section
      className={styles.bottomCta}
      aria-labelledby="rates-bottom-cta-title"
    >
      <div className={styles.bottomCta__copy}>
        <h2 className={styles.bottomCta__title} id="rates-bottom-cta-title">
          {cta.title}
        </h2>
        <p className={styles.bottomCta__text}>{cta.text}</p>
      </div>

      <LocalizedLink
        href={`${PAGES.HOME}#checkout`}
        className={styles.bottomCta__button}
      >
        <StarIcon />
        <span>{cta.button}</span>
      </LocalizedLink>
    </section>
  );
}
