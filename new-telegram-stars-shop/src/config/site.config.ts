const SITE_URL_FALLBACK =
  process.env.NODE_ENV === "production"
    ? "https://www.quackstars.com"
    : "http://localhost:3000";

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function getSiteUrl(): URL {
  const vercelUrl = process.env.VERCEL_URL?.trim();
  const vercelDerivedUrl = vercelUrl ? `https://${vercelUrl}` : null;
  const rawSiteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    vercelDerivedUrl ??
    SITE_URL_FALLBACK;

  return new URL(trimTrailingSlash(rawSiteUrl));
}
