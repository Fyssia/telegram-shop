import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import Script from "next/script";
import { getSiteUrl } from "@/config/site.config";
import { getDictionary, getRequestLocale } from "@/i18n/server";
import { EXTERNAL_LINKS } from "@/shared/data/links.data";
import { AppProviders } from "./AppProviders";
import "./globals.scss";

const appFont = Manrope({
  variable: "--font-app",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const { metadata } = await getDictionary();
  const siteUrl = getSiteUrl();
  const siteTitle =
    typeof metadata.site.title === "string"
      ? metadata.site.title
      : "Telegram Stars";
  const siteDescription =
    typeof metadata.site.description === "string"
      ? metadata.site.description
      : "Buy Telegram Stars with secure checkout and instant delivery.";
  const ogImage = new URL("/logo-mark.svg", siteUrl).toString();
  const ogLocale = locale === "ru" ? "ru_RU" : "en_US";

  return {
    ...metadata.site,
    metadataBase: siteUrl,
    applicationName: siteTitle,
    alternates: {
      canonical: "/",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      url: siteUrl.toString(),
      siteName: siteTitle,
      title: siteTitle,
      description: siteDescription,
      locale: ogLocale,
      images: [
        {
          url: ogImage,
          width: 512,
          height: 512,
          alt: siteTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description: siteDescription,
      images: [ogImage],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, messages] = await Promise.all([
    getRequestLocale(),
    getDictionary(),
  ]);
  const siteUrl = getSiteUrl();
  const socialLinks = [
    EXTERNAL_LINKS.telegramBot,
    EXTERNAL_LINKS.telegramChannel,
    EXTERNAL_LINKS.telegramSupport,
  ].filter((value, index, source) => source.indexOf(value) === index);

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: messages.common.brandName,
    url: siteUrl.toString(),
    email: EXTERNAL_LINKS.supportEmail,
    sameAs: socialLinks,
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: messages.common.brandName,
    url: siteUrl.toString(),
    inLanguage: locale,
  };

  return (
    <html lang={locale}>
      <body className={appFont.variable}>
        <Script id="org-jsonld" type="application/ld+json">
          {JSON.stringify(organizationJsonLd)}
        </Script>
        <Script id="website-jsonld" type="application/ld+json">
          {JSON.stringify(websiteJsonLd)}
        </Script>
        <AppProviders locale={locale} messages={messages}>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
