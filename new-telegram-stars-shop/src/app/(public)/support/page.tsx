import type { Metadata } from "next";
import SupportChannels from "@/components/support/supportChannels/SupportChannels";
import SupportContactCard from "@/components/support/supportContactCard/SupportContactCard";
import SupportHero from "@/components/support/supportHero/SupportHero";
import SupportQuickLinks from "@/components/support/supportQuickLinks/SupportQuickLinks";
import SupportTelegramCta from "@/components/support/supportTelegramCta/SupportTelegramCta";
import { PAGES } from "@/config/pages.config";
import { withLocalizedAlternates } from "@/i18n/metadata";
import { getDictionary } from "@/i18n/server";
import styles from "./style.module.scss";

export async function generateMetadata(): Promise<Metadata> {
  const { metadata } = await getDictionary();

  return withLocalizedAlternates(metadata.pages.support, PAGES.SUPPORT);
}

export default function SupportPage() {
  return (
    <main className={styles.support}>
      <SupportHero />

      <div className={styles.support__content}>
        <div className={styles.support__contentInner}>
          <div className={styles.support__topGrid}>
            <div className={styles.support__contact}>
              <SupportContactCard />
            </div>
            <div className={styles.support__channels}>
              <SupportChannels />
            </div>
            <div className={styles.support__quickLinks}>
              <SupportQuickLinks />
            </div>
          </div>

          <SupportTelegramCta />
        </div>
      </div>
    </main>
  );
}
