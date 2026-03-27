# CDN Cache-Control

This project now uses different cache policies for HTML, public assets, and API responses so a CDN can cache what is safe without serving stale personalized content.

## Current policy

| Path | Header | Why |
| --- | --- | --- |
| `/` | `private, no-store, max-age=0, must-revalidate` | Redirect depends on `Accept-Language` and the locale cookie. Do not share-cache it. |
| `/:locale` and `/:locale/*` | `public, max-age=0, s-maxage=300, stale-while-revalidate=86400` | Locale pages are public and path-specific, so the CDN can keep them for 5 minutes and serve stale while revalidating. |
| `/*.svg`, `/*.webp`, `/*.png`, `/*.jpg`, `/*.jpeg`, `/*.gif`, `/*.ico`, `/*.json` | `public, max-age=0, s-maxage=86400, stale-while-revalidate=604800` | Files from `public/` are not fingerprinted, so browsers revalidate but the CDN can cache them for 1 day. |
| `/robots.txt`, `/sitemap.xml` | `public, max-age=0, s-maxage=3600, stale-while-revalidate=86400` | SEO files change rarely and are safe to share-cache. |
| `/api/tonconnect-manifest` | `public, max-age=300, s-maxage=300, stale-while-revalidate=60` | Public metadata with a short TTL. |
| `/api/stars`, `/api/support` | `private, no-store, max-age=0, must-revalidate` | Request-specific and must never be stored by a CDN. |

## Important project-specific detail

Locale pages used to send `Set-Cookie` on every `/en` and `/ru` response. Many CDNs will not cache a response that sets cookies. The proxy now writes the locale cookie only on the root redirect, not on every localized HTML page.

## What Next.js already does for you

Do not override `/_next/static/*`. Next.js serves hashed build assets from there with a long-lived immutable cache policy already. That is the right place for your JS and CSS bundles.

## CDN setup checklist

1. Configure the CDN to respect origin `Cache-Control` headers.
2. Cache HTML only for locale-prefixed routes such as `/en` and `/ru`.
3. Do not force-cache `/`, `/api/stars`, or `/api/support`.
4. If you need very long caching for images or icons from `public/`, rename them with a version in the filename, for example `logo-mark.v2.svg`.

## How to verify

Run the production server and inspect the headers:

```bash
curl -I http://localhost:3000/
curl -I http://localhost:3000/en
curl -I http://localhost:3000/logo-mark.svg
curl -I http://localhost:3000/api/tonconnect-manifest
```

Expected result:

- `/` returns `Cache-Control: private, no-store, max-age=0, must-revalidate`
- `/en` returns `Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=86400`
- `/logo-mark.svg` returns `Cache-Control: public, max-age=0, s-maxage=86400, stale-while-revalidate=604800`
- `/api/tonconnect-manifest` returns `Cache-Control: public, max-age=300, s-maxage=300, stale-while-revalidate=60`

## Yandex Cloud CDN

For Yandex Cloud CDN, do not rely only on `s-maxage`. The official documentation for origin-controlled caching describes edge caching through origin `Cache-Control` headers with `public` and `max-age`. The browser caching feature can also inject its own `Cache-Control` header.

Recommended setup:

1. Disable Browser caching in the CDN resource.
2. Leave Ignore cookies and Ignore query parameters disabled.
3. Leave follow redirects from origin disabled.
4. Configure location rules and set edge TTL there:
   - `^/$` -> disable cache
   - `^/api/(stars|support)$` -> disable cache
   - `^/api/tonconnect-manifest$` -> 300 seconds
   - `^/(robots\\.txt|sitemap\\.xml)$` -> 3600 seconds
   - `^/_next/static/.*$` -> same as origin
   - `^/.*\\.(svg|webp|png|jpg|jpeg|gif|ico|json)$` -> 86400 seconds
   - `^/(en|ru)(/.*)?$` -> 300 seconds
5. After changing settings, wait for propagation and purge the affected cache paths.

## Gcore

For Gcore, keep the resource default as origin-controlled and override only the paths where you want edge caching despite `max-age=0` on the origin.

Recommended setup:

1. Cache -> CDN caching -> Origin controlled.
2. Browser caching -> Origin controlled.
3. Leave Ignore Set-Cookie disabled globally.
4. Leave Query string handling disabled globally unless you explicitly want to ignore analytics parameters.
5. Leave Redirection from origin disabled.
6. Add rules for particular files:
   - `^/(en|ru)(/.*)?$` -> CDN caching, CDN controlled, 300 seconds
   - `^/.*\\.(svg|webp|png|jpg|jpeg|gif|ico|json)$` -> CDN caching, CDN controlled, 86400 seconds
   - `^/(robots\\.txt|sitemap\\.xml)$` -> CDN caching, CDN controlled, 3600 seconds
   - `^/api/tonconnect-manifest$` -> CDN caching, CDN controlled, 300 seconds

Why this split works:

- Root `/` and the sensitive API routes stay origin-controlled and keep `no-store`.
- `/_next/static/*` continues using Next.js immutable headers from origin.
- Public HTML and `public/` assets get edge caching from provider rules without forcing long browser caching.
