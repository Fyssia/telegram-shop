import Image from "next/image";
import LocalizedLink from "@/components/i18n/LocalizedLink";
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  focusable="false"
                  className={styles.footer__trustInstantIcon}
                >
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                <span>{footer.trust.instant}</span>
              </li>
              <li className={styles.footer__trustPill}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  focusable="false"
                  className={styles.footer__trustSupportIcon}
                >
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
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
                    href={PAGES.PACKS}
                    className={styles.footer__colLink}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      focusable="false"
                      className={styles.footer__linkIconStar}
                    >
                      <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
                    </svg>
                    <span>{footer.links.buyStars}</span>
                  </LocalizedLink>
                </li>
                <li>
                  <LocalizedLink
                    href={PAGES.PACKS}
                    className={styles.footer__colLink}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      focusable="false"
                      className={styles.footer__linkIconPrimary}
                    >
                      <path d="M12 1v22" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                    <span>{footer.links.ratesPacks}</span>
                  </LocalizedLink>
                </li>
                <li>
                  <LocalizedLink
                    href={`${PAGES.HOME}#referral`}
                    className={styles.footer__colLink}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      focusable="false"
                      className={styles.footer__linkIconMuted}
                    >
                      <path d="M19 5h-4" />
                      <path d="M5 5h4" />
                      <path d="M19 19h-4" />
                      <path d="M5 19h4" />
                      <path d="M12 3v18" />
                    </svg>
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      focusable="false"
                      className={styles.footer__linkIconPrimary}
                    >
                      <path d="M12 8V4H8" />
                      <rect width="16" height="12" x="4" y="8" rx="2" />
                      <path d="M2 14h2" />
                      <path d="M20 14h2" />
                      <path d="M15 13v2" />
                      <path d="M9 13v2" />
                    </svg>
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      focusable="false"
                      className={styles.footer__linkIconMuted}
                    >
                      <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
                      <path d="m21.854 2.147-10.94 10.939" />
                    </svg>
                    <span>{footer.links.joinChannel}</span>
                  </a>
                </li>
                <li>
                  <LocalizedLink
                    href={PAGES.SUPPORT}
                    className={styles.footer__colLink}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      focusable="false"
                      className={styles.footer__linkIconStar}
                    >
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="4" />
                      <path d="m4.93 4.93 4.24 4.24" />
                      <path d="m14.83 9.17 4.24-4.24" />
                      <path d="m14.83 14.83 4.24 4.24" />
                      <path d="m9.17 14.83-4.24 4.24" />
                    </svg>
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      focusable="false"
                      className={styles.footer__linkIconMuted}
                    >
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <path d="M14 2v6h6" />
                      <path d="M16 13H8" />
                      <path d="M16 17H8" />
                      <path d="M10 9H8" />
                    </svg>
                    <span>{footer.links.terms}</span>
                  </LocalizedLink>
                </li>
                <li>
                  <LocalizedLink
                    href={PAGES.PRIVACY}
                    className={styles.footer__colLink}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      focusable="false"
                      className={styles.footer__linkIconMuted}
                    >
                      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                    </svg>
                    <span>{footer.links.privacy}</span>
                  </LocalizedLink>
                </li>
                <li>
                  <LocalizedLink
                    href={PAGES.REFUNDS}
                    className={styles.footer__colLink}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      focusable="false"
                      className={styles.footer__linkIconMuted}
                    >
                      <path d="M21 12a9 9 0 1 1-3-6.7" />
                      <path d="M21 3v6h-6" />
                      <path d="M12 7v5l3 3" />
                    </svg>
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
                className={styles.footer__socialTelegramIcon}
              >
                <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
                <path d="m21.854 2.147-10.94 10.939" />
              </svg>
              <span className="visually-hidden">{footer.social.telegram}</span>
            </a>

            <LocalizedLink
              href={PAGES.SUPPORT}
              className={styles.footer__socialBtn}
            >
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
                className={styles.footer__socialSupportIcon}
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span className="visually-hidden">{footer.social.support}</span>
            </LocalizedLink>

            <a
              href={`mailto:${EXTERNAL_LINKS.supportEmail}`}
              className={styles.footer__socialBtn}
            >
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
                className={styles.footer__socialEmailIcon}
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <span className="visually-hidden">{footer.social.email}</span>
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
