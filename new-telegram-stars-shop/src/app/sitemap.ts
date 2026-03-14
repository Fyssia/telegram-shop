import type { MetadataRoute } from "next";
import { PAGES } from "@/config/pages.config";
import { getSiteUrl } from "@/config/site.config";
import { localizePath } from "@/i18n/routing";
import { LOCALES } from "@/i18n/types";

const PUBLIC_PAGE_PATHS = [
  PAGES.HOME,
  PAGES.PACKS,
  PAGES.HOW_IT_WORKS,
  PAGES.FAQ,
  PAGES.SUPPORT,
  PAGES.TERMS,
  PAGES.PRIVACY,
  PAGES.REFUNDS,
] as const;

type SitemapEntry = MetadataRoute.Sitemap[number];

const SITEMAP_LAST_MODIFIED_SOURCE =
  process.env.SITE_LASTMOD ??
  process.env.NEXT_PUBLIC_SITE_LASTMOD ??
  process.env.VERCEL_GIT_COMMIT_DATE ??
  null;

const PAGE_SITEMAP_META: Record<
  (typeof PUBLIC_PAGE_PATHS)[number],
  Pick<SitemapEntry, "changeFrequency" | "priority">
> = {
  [PAGES.HOME]: {
    changeFrequency: "daily",
    priority: 1,
  },
  [PAGES.PACKS]: {
    changeFrequency: "weekly",
    priority: 0.9,
  },
  [PAGES.HOW_IT_WORKS]: {
    changeFrequency: "weekly",
    priority: 0.8,
  },
  [PAGES.FAQ]: {
    changeFrequency: "weekly",
    priority: 0.7,
  },
  [PAGES.SUPPORT]: {
    changeFrequency: "weekly",
    priority: 0.7,
  },
  [PAGES.TERMS]: {
    changeFrequency: "monthly",
    priority: 0.5,
  },
  [PAGES.PRIVACY]: {
    changeFrequency: "monthly",
    priority: 0.5,
  },
  [PAGES.REFUNDS]: {
    changeFrequency: "monthly",
    priority: 0.5,
  },
};

function toAbsoluteUrl(baseUrl: URL, pathname: string): string {
  return new URL(pathname, baseUrl).toString();
}

function resolveSitemapLastModified(): Date {
  if (!SITEMAP_LAST_MODIFIED_SOURCE) {
    return new Date();
  }

  const parsed = new Date(SITEMAP_LAST_MODIFIED_SOURCE);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }
  return parsed;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = resolveSitemapLastModified();

  return PUBLIC_PAGE_PATHS.flatMap((pathname) => {
    const pageMeta = PAGE_SITEMAP_META[pathname];
    const defaultLocaleHref = toAbsoluteUrl(
      siteUrl,
      localizePath("en", pathname),
    );
    const languageAlternates = Object.fromEntries([
      ...LOCALES.map((locale) => [
        locale,
        toAbsoluteUrl(siteUrl, localizePath(locale, pathname)),
      ]),
      ["x-default", defaultLocaleHref],
    ]);

    return LOCALES.map((locale) => ({
      url: toAbsoluteUrl(siteUrl, localizePath(locale, pathname)),
      lastModified,
      changeFrequency: pageMeta.changeFrequency,
      priority: pageMeta.priority,
      alternates: {
        languages: languageAlternates,
      },
    }));
  });
}
