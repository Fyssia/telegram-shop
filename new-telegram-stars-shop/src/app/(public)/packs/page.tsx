import type { Metadata } from "next";
import BottomCta from "@/components/rates/bottomCta/BottomCta";
import FeaturedPacks from "@/components/rates/featuredPacks/FeaturedPacks";
import RatesHero from "@/components/rates/ratesHero/RatesHero";
import RatesNotice from "@/components/rates/ratesNotice/RatesNotice";
import SupportRow from "@/components/rates/supportRow/SupportRow";
import { PAGES } from "@/config/pages.config";
import { withLocalizedAlternates } from "@/i18n/metadata";
import { getDictionary } from "@/i18n/server";
import styles from "./style.module.scss";

export async function generateMetadata(): Promise<Metadata> {
  const { metadata } = await getDictionary();

  return withLocalizedAlternates(metadata.pages.packs, PAGES.PACKS);
}

export default function Page() {
  return (
    <main className={styles.rates}>
      <RatesHero />

      <div className={styles.rates__content}>
        <div className={styles.rates__contentInner}>
          <RatesNotice />
          <FeaturedPacks />
          <SupportRow />
          <BottomCta />
        </div>
      </div>
    </main>
  );
}
