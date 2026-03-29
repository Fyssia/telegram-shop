import type { NextConfig } from "next";
import { getPublicSiteUrl } from "./src/config/runtime-env";

const ENTRYPOINT_NO_STORE_CACHE_CONTROL =
  "private, no-store, max-age=0, must-revalidate";
const ENTRYPOINT_VARY_HEADER = "Accept-Language, Cookie";
const PUBLIC_PAGE_CACHE_CONTROL =
  "public, max-age=0, s-maxage=300, stale-while-revalidate=86400";
const PUBLIC_ASSET_CACHE_CONTROL =
  "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800";
const SEO_CACHE_CONTROL =
  "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400";

const nextConfig: NextConfig = {
  output: "standalone",
  skipProxyUrlNormalize: true,
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: ENTRYPOINT_NO_STORE_CACHE_CONTROL,
          },
          {
            key: "Vary",
            value: ENTRYPOINT_VARY_HEADER,
          },
        ],
      },
      {
        source: "/:locale(en|ru)",
        headers: [
          {
            key: "Cache-Control",
            value: PUBLIC_PAGE_CACHE_CONTROL,
          },
          {
            key: "Vary",
            value: ENTRYPOINT_VARY_HEADER,
          },
        ],
      },
      {
        source: "/:locale(en|ru)/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: PUBLIC_PAGE_CACHE_CONTROL,
          },
          {
            key: "Vary",
            value: ENTRYPOINT_VARY_HEADER,
          },
        ],
      },
      {
        source: "/robots.txt",
        headers: [
          {
            key: "Cache-Control",
            value: SEO_CACHE_CONTROL,
          },
        ],
      },
      {
        source: "/sitemap.xml",
        headers: [
          {
            key: "Cache-Control",
            value: SEO_CACHE_CONTROL,
          },
        ],
      },
      {
        source: "/(.*)\\.(svg|webp|png|jpg|jpeg|gif|ico|json)",
        headers: [
          {
            key: "Cache-Control",
            value: PUBLIC_ASSET_CACHE_CONTROL,
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "t.me",
        pathname: "/i/userpic/**",
      },
    ],
  },
  reactCompiler: true,
  env: {
    NEXT_PUBLIC_SITE_URL: getPublicSiteUrl(),
  },
};

export default nextConfig;
