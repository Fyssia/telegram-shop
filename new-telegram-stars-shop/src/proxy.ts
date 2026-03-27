import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  ENTRYPOINT_NO_STORE_CACHE_CONTROL,
  ENTRYPOINT_VARY_HEADER,
} from "@/config/cache-control";
import {
  LOCALE_REQUEST_HEADER,
  resolvePreferredLocale,
  stripLocalePrefix,
} from "@/i18n/routing";
import { LANGUAGE_COOKIE } from "@/i18n/types";

const INTERNAL_LOCALE_REWRITE_HEADER = "x-internal-locale-rewrite";

function withLeadingSlash(pathname: string) {
  if (!pathname.startsWith("/")) {
    return `/${pathname}`;
  }

  return pathname;
}

function shouldBypassMiddleware(pathname: string) {
  return (
    pathname.startsWith("/_not-found") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/__nextjs") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const localeMatch = stripLocalePrefix(pathname);
  const isInternalLocaleRewrite =
    request.headers.get(INTERNAL_LOCALE_REWRITE_HEADER) === "1";

  if (shouldBypassMiddleware(pathname)) {
    return NextResponse.next();
  }

  // In dev (and sometimes during client navigation), Next can request internal
  // endpoints with a locale prefix (e.g. /en/_next/*, /ru/__nextjs*). Those
  // endpoints must be served from the root path, otherwise HMR/overlay can hang.
  if (localeMatch.locale && shouldBypassMiddleware(localeMatch.pathname)) {
    const internalUrl = request.nextUrl.clone();
    internalUrl.pathname = withLeadingSlash(localeMatch.pathname);

    return NextResponse.rewrite(internalUrl);
  }

  if (!localeMatch.locale) {
    // Prevent redirect loops for internally rewritten locale paths:
    // /en -> rewrite(/) -> middleware runs again on / and must not redirect to /en again.
    if (isInternalLocaleRewrite) {
      return NextResponse.next();
    }

    const locale = resolvePreferredLocale({
      cookieLocale: request.cookies.get(LANGUAGE_COOKIE)?.value,
      acceptLanguage: request.headers.get("accept-language"),
    });

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname =
      pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;

    const response = NextResponse.redirect(redirectUrl);
    response.headers.set("Cache-Control", ENTRYPOINT_NO_STORE_CACHE_CONTROL);
    response.headers.set("Vary", ENTRYPOINT_VARY_HEADER);
    response.cookies.set(LANGUAGE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });

    return response;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LOCALE_REQUEST_HEADER, localeMatch.locale);
  requestHeaders.set(INTERNAL_LOCALE_REWRITE_HEADER, "1");

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = withLeadingSlash(localeMatch.pathname);

  const response = NextResponse.rewrite(rewriteUrl, {
    request: {
      headers: requestHeaders,
    },
  });

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next|__nextjs|_not-found|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)",
  ],
};
