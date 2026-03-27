import {
  HeadsetIcon,
  ShieldCheckIcon,
  StarIcon,
  WalletIcon,
  ZapIcon,
} from "@/components/ui/icons";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import { PAGES } from "@/config/pages.config";
import { getDictionary } from "@/i18n/server";
import styles from "./hero.module.scss";

export default async function Hero() {
  const hero = (await getDictionary()).home.hero;

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.hero__background} aria-hidden="true" />

      <div className={styles.hero__inner}>
        <h1 className={styles.hero__title} id="hero-title">
          <span>{hero.titleStart}</span>
          <span className={styles.hero__accent}>{hero.titleAccent}</span>
        </h1>

        <p className={styles.hero__subheading}>{hero.subtitle}</p>

        <div className={styles.hero__actions}>
          <LocalizedLink
            href={`${PAGES.HOME}#checkout`}
            className={[
              styles.hero__button,
              styles["hero__button--primary"],
            ].join(" ")}
          >
            <StarIcon size={20} />
            <span>{hero.buyStars}</span>
          </LocalizedLink>

          <LocalizedLink
            href={PAGES.PACKS}
            className={[
              styles.hero__button,
              styles["hero__button--secondary"],
            ].join(" ")}
          >
            <WalletIcon size={20} />
            <span>{hero.buyPremium}</span>
          </LocalizedLink>
        </div>

        <ul className={styles.hero__badges}>
          <li
            className={[
              styles.hero__badge,
              styles["hero__badge--instant"],
            ].join(" ")}
          >
            <ZapIcon size={18} />
            <span>{hero.badges.instant}</span>
          </li>

          <li
            className={[styles.hero__badge, styles["hero__badge--secure"]].join(
              " ",
            )}
          >
            <ShieldCheckIcon size={18} />
            <span>{hero.badges.secure}</span>
          </li>

          <li
            className={[
              styles.hero__badge,
              styles["hero__badge--support"],
            ].join(" ")}
          >
            <HeadsetIcon size={18} />
            <span>{hero.badges.support}</span>
          </li>
        </ul>
      </div>
    </section>
  );
}
