"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { useI18n } from "@/i18n/client";
import { localizePath } from "@/i18n/routing";
import { scrollToHashTarget } from "@/shared/hashScroll";

type LinkProps = ComponentProps<typeof Link>;

function isUnmodifiedPrimaryClick(event: MouseEvent<HTMLAnchorElement>) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

export default function LocalizedLink({
  href,
  onClick,
  prefetch,
  scroll,
  ...props
}: LinkProps) {
  const { locale } = useI18n();

  const localizedHref =
    typeof href === "string" ? localizePath(locale, href) : href;

  const resolvedPrefetch =
    prefetch ?? (process.env.NODE_ENV === "development" ? false : undefined);
  const resolvedScroll =
    scroll ??
    (typeof localizedHref === "string" && localizedHref.includes("#")
      ? false
      : undefined);

  return (
    <Link
      href={localizedHref}
      prefetch={resolvedPrefetch}
      scroll={resolvedScroll}
      onClick={(event) => {
        onClick?.(event);

        if (
          event.defaultPrevented ||
          typeof window === "undefined" ||
          typeof localizedHref !== "string" ||
          !isUnmodifiedPrimaryClick(event) ||
          event.currentTarget.target === "_blank"
        ) {
          return;
        }

        const targetUrl = new URL(localizedHref, window.location.href);
        const currentUrl = new URL(window.location.href);
        const isSameDocumentTarget =
          Boolean(targetUrl.hash) &&
          targetUrl.pathname === currentUrl.pathname &&
          targetUrl.search === currentUrl.search;

        if (!isSameDocumentTarget) {
          return;
        }

        if (
          !scrollToHashTarget(targetUrl.hash, {
            behavior: "smooth",
          })
        ) {
          return;
        }

        event.preventDefault();
      }}
      {...props}
    />
  );
}
