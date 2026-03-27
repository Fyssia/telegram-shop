import Image from "next/image";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import {
  ArrowCounterClockwiseIcon,
  CurrencyDollarSimpleIcon,
  FileTextIcon,
  HeadsetIcon,
  MailIcon,
  RobotIcon,
  ShieldCheckIcon,
  StarIcon,
  TelegramIcon,
  UsersIcon,
  ZapIcon,
} from "@/components/ui/icons";
import { PAGES } from "@/config/pages.config";
import { getDictionary } from "@/i18n/server";
import { EXTERNAL_LINKS } from "@/shared/data/links.data";
import styles from "./footer.module.scss";

export default async function Footer() {
  const messages = await getDictionary();
  const footer = messages.footer;
  const common = messages.common;

  return (
    <footer className={styles.footer}>
      <div className={styles.footer__inner}>
        <div className={styles.footer__top}>
          <div className={styles.footer__brand}>
            <LocalizedLink
              href={PAGES.HOME}
              className={styles.footer__brandRow}
            >
              <Image
                src="/logo-mark.svg"
                alt={common.brandName}
                width={22}
                height={22}
                className={styles.footer__brandMark}
              />
              <span className={styles.footer__brandText}>
                {common.brandName}
              </span>
            </LocalizedLink>

            <p className={styles.footer__brandDesc}>{footer.brandDesc}</p>

            <ul
              className={styles.footer__trust}
              aria-label={footer.trust.label}
            >
              <li className={styles.footer__trustPill}>
                <ZapIcon
                  size={16}
                  className={styles.footer__trustInstantIcon}
                />
                <span>{footer.trust.instant}</span>
              </li>
              <li className={styles.footer__trustPill}>
                <HeadsetIcon
                  size={16}
                  className={styles.footer__trustSupportIcon}
                />
                <span>{footer.trust.support}</span>
              </li>
            </ul>
          </div>

          <nav
            className={styles.footer__cols}
            aria-label={footer.columns.footerLabel}
          >
            <div className={styles.footer__col}>
              <p className={styles.footer__colTitle}>
                {footer.columns.product}
              </p>
              <ul className={styles.footer__colLinks}>
                <li>
                  <LocalizedLink
                    href={`${PAGES.HOME}#checkout`}
                    className={styles.footer__colLink}
                  >
                    <StarIcon
                      size={16}
                      className={styles.footer__linkIconStar}
                    />
                    <span>{footer.links.buyStars}</span>
                  </LocalizedLink>
                </li>
                <li>
                  <LocalizedLink
                    href={PAGES.PACKS}
                    className={styles.footer__colLink}
                  >
                    <CurrencyDollarSimpleIcon
                      size={16}
                      className={styles.footer__linkIconPrimary}
                    />
                    <span>{footer.links.ratesPacks}</span>
                  </LocalizedLink>
                </li>
                <li>
                  <LocalizedLink
                    href={`${PAGES.HOME}#referral`}
                    className={styles.footer__colLink}
                  >
                    <UsersIcon
                      size={16}
                      className={styles.footer__linkIconMuted}
                    />
                    <span>{footer.links.referralProgram}</span>
                  </LocalizedLink>
                </li>
              </ul>
            </div>

            <div className={styles.footer__col}>
              <p className={styles.footer__colTitle}>
                {footer.columns.telegram}
              </p>
              <ul className={styles.footer__colLinks}>
                <li>
                  <a
                    href={EXTERNAL_LINKS.telegramBot}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={styles.footer__colLink}
                  >
                    <RobotIcon
                      size={16}
                      className={styles.footer__linkIconPrimary}
                    />
                    <span>{footer.links.openBot}</span>
                  </a>
                </li>
                <li>
                  <a
                    href={EXTERNAL_LINKS.telegramChannel}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={styles.footer__colLink}
                  >
                    <TelegramIcon
                      size={16}
                      className={styles.footer__linkIconMuted}
                    />
                    <span>{footer.links.joinChannel}</span>
                  </a>
                </li>
                <li>
                  <LocalizedLink
                    href={PAGES.SUPPORT}
                    className={styles.footer__colLink}
                  >
                    <HeadsetIcon
                      size={16}
                      className={styles.footer__linkIconStar}
                    />
                    <span>{footer.links.support}</span>
                  </LocalizedLink>
                </li>
              </ul>
            </div>

            <div className={styles.footer__col}>
              <p className={styles.footer__colTitle}>{footer.columns.legal}</p>
              <ul className={styles.footer__colLinks}>
                <li>
                  <LocalizedLink
                    href={PAGES.TERMS}
                    className={styles.footer__colLink}
                  >
                    <FileTextIcon
                      size={16}
                      className={styles.footer__linkIconMuted}
                    />
                    <span>{footer.links.terms}</span>
                  </LocalizedLink>
                </li>
                <li>
                  <LocalizedLink
                    href={PAGES.PRIVACY}
                    className={styles.footer__colLink}
                  >
                    <ShieldCheckIcon
                      size={16}
                      className={styles.footer__linkIconMuted}
                    />
                    <span>{footer.links.privacy}</span>
                  </LocalizedLink>
                </li>
                <li>
                  <LocalizedLink
                    href={PAGES.REFUNDS}
                    className={styles.footer__colLink}
                  >
                    <ArrowCounterClockwiseIcon
                      size={16}
                      className={styles.footer__linkIconMuted}
                    />
                    <span>{footer.links.refunds}</span>
                  </LocalizedLink>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        <hr className={styles.footer__divider} />

        <div className={styles.footer__bottom}>
          <p className={styles.footer__copyright}>{footer.copyright}</p>

          <nav
            className={styles.footer__social}
            aria-label={footer.social.label}
          >
            <a
              href={EXTERNAL_LINKS.telegramChannel}
              target="_blank"
              rel="noreferrer noopener"
              className={styles.footer__socialBtn}
            >
              <TelegramIcon
                size={18}
                className={styles.footer__socialTelegramIcon}
              />
              <span className="visually-hidden">{footer.social.telegram}</span>
            </a>

            <LocalizedLink
              href={PAGES.SUPPORT}
              className={styles.footer__socialBtn}
            >
              <HeadsetIcon
                size={18}
                className={styles.footer__socialSupportIcon}
              />
              <span className="visually-hidden">{footer.social.support}</span>
            </LocalizedLink>

            <a
              href={`mailto:${EXTERNAL_LINKS.supportEmail}`}
              className={styles.footer__socialBtn}
            >
              <MailIcon size={18} className={styles.footer__socialEmailIcon} />
              <span className="visually-hidden">{footer.social.email}</span>
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
