"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { scrollToHashTarget } from "@/shared/hashScroll";

const HASH_SCROLL_RETRY_LIMIT = 8;
const HASH_SCROLL_RETRY_DELAY_MS = 80;

export default function HashScrollHandler() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const routeKey = `${pathname}${search ? `?${search}` : ""}`;

  useEffect(() => {
    if (!routeKey || typeof window === "undefined" || !window.location.hash) {
      return;
    }

    let isCancelled = false;
    let retryTimer: number | null = null;
    const hash = window.location.hash;

    const tryScroll = (attempt: number) => {
      if (isCancelled) return;

      const didScroll = scrollToHashTarget(hash, {
        behavior: "smooth",
        updateHistory: false,
      });
      if (didScroll || attempt >= HASH_SCROLL_RETRY_LIMIT) {
        return;
      }

      retryTimer = window.setTimeout(() => {
        tryScroll(attempt + 1);
      }, HASH_SCROLL_RETRY_DELAY_MS);
    };

    const frameId = window.requestAnimationFrame(() => {
      tryScroll(0);
    });

    return () => {
      isCancelled = true;
      window.cancelAnimationFrame(frameId);
      if (retryTimer !== null) {
        window.clearTimeout(retryTimer);
      }
    };
  }, [routeKey]);

  return null;
}
