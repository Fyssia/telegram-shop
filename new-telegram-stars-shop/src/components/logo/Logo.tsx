"use client";

import Image from "next/image";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import { PAGES } from "@/config/pages.config";
import { useI18n } from "@/i18n/client";
import styles from "./logo.module.scss";

export default function Logo() {
  const { messages } = useI18n();
  const brandName = messages.common.brandName;

  return (
    <LocalizedLink
      href={PAGES.HOME}
      className={styles["logo-wrapper"]}
      aria-label={brandName}
    >
      <Image
        src="/logo-mark.svg"
        alt={brandName}
        width={24}
        height={24}
        className={styles["logo-image"]}
      />
      <span className={styles["logo-text"]} aria-hidden="true">
        {brandName}
      </span>
    </LocalizedLink>
  );
}
