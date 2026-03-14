"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useI18n } from "@/i18n/client";
import HeaderButtons from "../headerButtons/HeaderButtons";
import HeaderMenu from "../headerMenuLinks/HeaderMenu";
import Logo from "../logo/Logo";
import styles from "./header.module.scss";

export default function Header() {
  const pathname = usePathname();
  const { messages } = useI18n();
  const panelId = useId();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuPanelRef = useRef<HTMLDivElement | null>(null);
  const menuToggleRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const shouldLockBody =
      isMenuOpen && window.matchMedia("(max-width: 960px)").matches;

    document.body.classList.toggle("body--mobile-menu-open", shouldLockBody);

    return () => {
      document.body.classList.remove("body--mobile-menu-open");
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (pathname) {
      setIsMenuOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const panel = menuPanelRef.current;
    if (!panel) return;

    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );

    focusable[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isMenuOpen) return;

      if (event.key === "Escape") {
        event.preventDefault();
        setIsMenuOpen(false);
        menuToggleRef.current?.focus();
        return;
      }

      if (event.key !== "Tab" || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <header className={styles.header} data-open={isMenuOpen}>
      <div className={styles.header__inner}>
        <div className={styles.header__row}>
          <Logo />

          <button
            type="button"
            className={styles.header__menuToggle}
            aria-expanded={isMenuOpen}
            aria-controls={panelId}
            aria-label={
              isMenuOpen ? messages.header.closeMenu : messages.header.openMenu
            }
            onClick={() => setIsMenuOpen((value) => !value)}
            ref={menuToggleRef}
          >
            <span
              className={`${styles.header__menuLine} ${isMenuOpen ? styles["header__menuLine--topOpen"] : ""}`}
              aria-hidden="true"
            />
            <span
              className={`${styles.header__menuLine} ${isMenuOpen ? styles["header__menuLine--middleOpen"] : ""}`}
              aria-hidden="true"
            />
            <span
              className={`${styles.header__menuLine} ${isMenuOpen ? styles["header__menuLine--bottomOpen"] : ""}`}
              aria-hidden="true"
            />
          </button>
        </div>

        <div
          id={panelId}
          className={styles.header__panel}
          data-open={isMenuOpen}
          ref={menuPanelRef}
        >
          <HeaderMenu
            className={styles.header__menu}
            onNavigate={() => setIsMenuOpen(false)}
          />
          <HeaderButtons
            className={styles.header__actions}
            onNavigate={() => setIsMenuOpen(false)}
          />
        </div>
      </div>
      <button
        type="button"
        className={styles.header__backdrop}
        aria-hidden={!isMenuOpen}
        tabIndex={-1}
        data-open={isMenuOpen}
        onClick={() => setIsMenuOpen(false)}
      />
    </header>
  );
}
