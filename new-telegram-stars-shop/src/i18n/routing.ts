import { DEFAULT_LOCALE, isLocale, LOCALES, type Locale } from "./types";

export const LOCALE_REQUEST_HEADER = "x-site-locale";

type LocalePathMatch = {
  locale: Locale | null;
  pathname: string;
};

function splitPathAndSuffix(href: string) {
  const queryIndex = href.indexOf("?");
  const hashIndex = href.indexOf("#");

  let cutIndex = -1;

  if (queryIndex >= 0 && hashIndex >= 0) {
    cutIndex = Math.min(queryIndex, hashIndex);
  } else if (queryIndex >= 0) {
    cutIndex = queryIndex;
  } else if (hashIndex >= 0) {
    cutIndex = hashIndex;
  }

  if (cutIndex === -1) {
    return { pathname: href, suffix: "" };
  }

  return {
    pathname: href.slice(0, cutIndex) || "/",
    suffix: href.slice(cutIndex),
  };
}

export function stripLocalePrefix(pathname: string): LocalePathMatch {
  if (!pathname.startsWith("/")) {
    return { locale: null, pathname };
  }

  const [rawPath] = pathname.split(/[?#]/, 1);
  const segments = rawPath.split("/");
  const candidate = segments[1];

  if (!isLocale(candidate)) {
    return { locale: null, pathname: rawPath || "/" };
  }

  const rest = segments.slice(2).join("/");

  return {
    locale: candidate,
    pathname: rest ? `/${rest}` : "/",
  };
}

export function localizePath(locale: Locale, href: string): string {
  if (!href.startsWith("/") || href.startsWith("//")) {
    return href;
  }

  const { pathname, suffix } = splitPathAndSuffix(href);
  const { pathname: basePath } = stripLocalePrefix(pathname);
  const normalizedPath = basePath === "/" ? "" : basePath;

  return `/${locale}${normalizedPath}${suffix}`;
}

export function replaceLocaleInPath(href: string, nextLocale: Locale): string {
  if (!href.startsWith("/")) {
    return localizePath(nextLocale, "/");
  }

  return localizePath(nextLocale, href);
}

export function resolvePreferredLocale(options: {
  cookieLocale?: string | null;
  acceptLanguage?: string | null;
}): Locale {
  if (isLocale(options.cookieLocale)) {
    return options.cookieLocale;
  }

  const acceptLanguage = options.acceptLanguage?.toLowerCase() ?? "";

  if (acceptLanguage.includes("ru")) {
    return "ru";
  }

  return DEFAULT_LOCALE;
}

export function buildAlternatesForPath(
  pathname: string,
  canonicalLocale: Locale = DEFAULT_LOCALE,
) {
  const languages = Object.fromEntries(
    LOCALES.map((locale) => [locale, localizePath(locale, pathname)]),
  ) as Record<Locale, string>;

  return {
    canonical: languages[canonicalLocale],
    languages: {
      ...languages,
      "x-default": languages[DEFAULT_LOCALE],
    },
  };
}
