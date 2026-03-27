export const ENTRYPOINT_NO_STORE_CACHE_CONTROL =
  "private, no-store, max-age=0, must-revalidate";

export const ENTRYPOINT_VARY_HEADER = "Accept-Language, Cookie";

export const PUBLIC_PAGE_CACHE_CONTROL =
  "public, max-age=0, s-maxage=300, stale-while-revalidate=86400";

export const PUBLIC_ASSET_CACHE_CONTROL =
  "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800";

export const SEO_CACHE_CONTROL =
  "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400";

export const API_NO_STORE_CACHE_CONTROL = ENTRYPOINT_NO_STORE_CACHE_CONTROL;

export const TONCONNECT_MANIFEST_CACHE_CONTROL =
  "public, max-age=300, s-maxage=300, stale-while-revalidate=60";
