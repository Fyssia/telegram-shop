import type { Metadata } from "next";
import ComparisonSection from "@/components/home/comparisonSection/ComparisonSection";
import CtaSection from "@/components/home/ctaSection/CtaSection";
import Hero from "@/components/home/hero/Hero";
import HowItWorksSection from "@/components/home/howItWorksSection/HowItWorksSection";
import PacksSection from "@/components/home/packsSection/PacksSection";
import SplitSection from "@/components/home/splitSection/SplitSection";
import { PAGES } from "@/config/pages.config";
import { withLocalizedAlternates } from "@/i18n/metadata";
import { getDictionary } from "@/i18n/server";
import styles from "./style.module.scss";

export async function generateMetadata(): Promise<Metadata> {
  const { metadata } = await getDictionary();

  return withLocalizedAlternates(metadata.pages.home, PAGES.HOME);
}

export default function Page() {
  return (
    <main className={styles.home}>
      <Hero />
      <SplitSection />
      <PacksSection />
      <HowItWorksSection />
      <ComparisonSection />
      <CtaSection />
    </main>
  );
}
