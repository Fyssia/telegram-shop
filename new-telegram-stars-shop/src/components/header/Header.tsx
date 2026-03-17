"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
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
  const [mobilePanelTop, setMobilePanelTop] = useState<number | null>(null);
  const menuPanelRef = useRef<HTMLDivElement | null>(null);
  const menuToggleRef = useRef<HTMLButtonElement | null>(null);

  const isMobileViewport = useCallback(
    () => window.matchMedia("(max-width: 960px)").matches,
    [],
  );

  const updateMobilePanelTop = useCallback(() => {
    if (!isMobileViewport()) {
      setMobilePanelTop(null);
      return;
    }

    const toggle = menuToggleRef.current;
    if (!toggle) return;

    const { bottom } = toggle.getBoundingClientRect();
    setMobilePanelTop(Math.max(0, Math.round(bottom + 16)));
  }, [isMobileViewport]);

  useEffect(() => {
    if (!isMenuOpen || !isMobileViewport()) {
      return;
    }

    updateMobilePanelTop();
  }, [isMenuOpen, isMobileViewport, updateMobilePanelTop]);

  useEffect(() => {
    if (!isMenuOpen || !isMobileViewport()) {
      setMobilePanelTop(null);
      return;
    }

    updateMobilePanelTop();
    const onViewportChange = () => updateMobilePanelTop();
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("orientationchange", onViewportChange);

    return () => {
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("orientationchange", onViewportChange);
    };
  }, [isMenuOpen, isMobileViewport, updateMobilePanelTop]);

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

    focusable[0]?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isMenuOpen) return;

      if (event.key === "Escape") {
        event.preventDefault();
        setIsMenuOpen(false);
        menuToggleRef.current?.focus({ preventScroll: true });
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

  useEffect(() => {
    if (!isMenuOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      if (
        menuPanelRef.current?.contains(target) ||
        menuToggleRef.current?.contains(target)
      ) {
        return;
      }

      setIsMenuOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen || !isMobileViewport()) return;

    const onScroll = () => setIsMenuOpen(false);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [isMenuOpen, isMobileViewport]);

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
            onClick={() => {
              if (!isMenuOpen) {
                updateMobilePanelTop();
              }

              setIsMenuOpen((value) => !value);
            }}
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
          style={
            mobilePanelTop === null
              ? undefined
              : ({
                  "--header-mobile-panel-top": `${mobilePanelTop}px`,
                } as React.CSSProperties)
          }
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
      <div
        className={styles.header__backdrop}
        aria-hidden="true"
        data-open={isMenuOpen}
      />
    </header>
  );
}
