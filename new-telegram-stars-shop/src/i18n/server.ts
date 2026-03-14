import "server-only";

import { cookies, headers } from "next/headers";
import { cache } from "react";
import { dictionaries } from "./messages";
import { LOCALE_REQUEST_HEADER } from "./routing";
import {
  DEFAULT_LOCALE,
  isLocale,
  LANGUAGE_COOKIE,
  type Locale,
} from "./types";

export const getRequestLocale = cache(async (): Promise<Locale> => {
  const headerStore = await headers();
  const headerLocale = headerStore.get(LOCALE_REQUEST_HEADER);

  if (isLocale(headerLocale)) {
    return headerLocale;
  }

  const cookieStore = await cookies();
  const value = cookieStore.get(LANGUAGE_COOKIE)?.value;

  return isLocale(value) ? value : DEFAULT_LOCALE;
});

export const getDictionary = cache(async () => {
  const locale = await getRequestLocale();
  return dictionaries[locale];
});
