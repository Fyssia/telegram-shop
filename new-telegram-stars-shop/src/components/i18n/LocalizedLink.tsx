"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useI18n } from "@/i18n/client";
import { localizePath } from "@/i18n/routing";

type LinkProps = ComponentProps<typeof Link>;

export default function LocalizedLink({ href, prefetch, ...props }: LinkProps) {
  const { locale } = useI18n();

  const localizedHref =
    typeof href === "string" ? localizePath(locale, href) : href;

  const resolvedPrefetch =
    prefetch ?? (process.env.NODE_ENV === "development" ? false : undefined);

  return <Link href={localizedHref} prefetch={resolvedPrefetch} {...props} />;
}
