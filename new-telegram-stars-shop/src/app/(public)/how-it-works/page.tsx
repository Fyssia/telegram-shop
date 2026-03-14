import type { Metadata } from "next";
import BottomCta from "@/components/howItWorks/bottomCta/BottomCta";
import HowItWorksHero from "@/components/howItWorks/howItWorksHero/HowItWorksHero";
import SafetyCard from "@/components/howItWorks/safetyCard/SafetyCard";
import StatusTimeline from "@/components/howItWorks/statusTimeline/StatusTimeline";
import StepsCard from "@/components/howItWorks/stepsCard/StepsCard";
import { PAGES } from "@/config/pages.config";
import { withLocalizedAlternates } from "@/i18n/metadata";
import { getDictionary } from "@/i18n/server";
import styles from "./style.module.scss";

export async function generateMetadata(): Promise<Metadata> {
  const { metadata } = await getDictionary();

  return withLocalizedAlternates(metadata.pages.howItWorks, PAGES.HOW_IT_WORKS);
}

export default function HowItWorks() {
  return (
    <main className={styles.howItWorks}>
      <HowItWorksHero />

      <div className={styles.howItWorks__content}>
        <div className={styles.howItWorks__contentInner}>
          <StepsCard />
          <StatusTimeline />
          <SafetyCard />
          <BottomCta />
        </div>
      </div>
    </main>
  );
}
