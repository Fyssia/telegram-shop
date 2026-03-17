"use client";

import type { PropsWithChildren } from "react";
import { I18nProvider } from "@/i18n/client";
import type { Messages } from "@/i18n/messages";
import type { Locale } from "@/i18n/types";
import { TonProvider } from "./TonProvider";

type AppProvidersProps = PropsWithChildren<{
  locale: Locale;
  messages: Messages;
}>;

export function AppProviders({
  children,
  locale,
  messages,
}: AppProvidersProps) {
  return (
    <I18nProvider initialLocale={locale} initialMessages={messages}>
      {children}
    </I18nProvider>
  );
}
