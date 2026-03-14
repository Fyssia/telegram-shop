"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { dictionaries, type Messages } from "./messages";
import { replaceLocaleInPath } from "./routing";
import { LANGUAGE_COOKIE, type Locale } from "./types";

type I18nContextValue = {
  locale: Locale;
  messages: Messages;
  setLocale: (nextLocale: Locale) => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function writeLocaleCookie(locale: Locale) {
  // biome-ignore lint/suspicious/noDocumentCookie: Cookie is used to sync locale with server-rendered Next components.
  document.cookie = `${LANGUAGE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function I18nProvider({
  children,
  initialLocale,
  initialMessages,
}: PropsWithChildren<{ initialLocale: Locale; initialMessages: Messages }>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [messages, setMessages] = useState<Messages>(initialMessages);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dataset.lang = locale;
  }, [locale]);

  useEffect(() => {
    setLocaleState(initialLocale);
    setMessages(initialMessages);
  }, [initialLocale, initialMessages]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      messages,
      setLocale(nextLocale) {
        if (nextLocale === locale) return;

        writeLocaleCookie(nextLocale);
        setLocaleState(nextLocale);
        setMessages(dictionaries[nextLocale]);

        const search = searchParams.toString();
        const hash =
          typeof window === "undefined" ? "" : (window.location.hash ?? "");
        const currentHref = `${pathname}${search ? `?${search}` : ""}${hash}`;

        router.replace(replaceLocaleInPath(currentHref, nextLocale));
        router.refresh();
      },
    }),
    [locale, messages, pathname, router, searchParams],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }

  return context;
}
