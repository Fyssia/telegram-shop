"use client";

import { usePathname } from "next/navigation";
import { match } from "path-to-regexp";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import { PAGES } from "@/config/pages.config";
import { useI18n } from "@/i18n/client";
import { stripLocalePrefix } from "@/i18n/routing";
import styles from "./headerMenuLinks.module.scss";

type HeaderMenuProps = {
  className?: string;
  onNavigate?: () => void;
};

export default function HeaderMenu({ className, onNavigate }: HeaderMenuProps) {
  const pathname = usePathname();
  const { messages } = useI18n();
  const basePathname = stripLocalePrefix(pathname).pathname;
  const menu = messages.header.menu;
  const items = [
    { href: PAGES.PACKS, label: menu.rates },
    { href: PAGES.HOW_IT_WORKS, label: menu.howItWorks },
    { href: PAGES.FAQ, label: menu.faq },
    { href: PAGES.SUPPORT, label: menu.support },
  ] as const;

  return (
    <nav
      className={
        className
          ? `${styles["menu-links"]} ${className}`
          : styles["menu-links"]
      }
      aria-label={messages.header.menuAria}
    >
      {items.map((item) => {
        const isActive = Boolean(match(item.href)(basePathname));

        return (
          <LocalizedLink
            key={item.href}
            className={
              isActive
                ? `${styles.active} ${styles["menu-link"]}`
                : styles["menu-link"]
            }
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </LocalizedLink>
        );
      })}
    </nav>
  );
}
