import type { Metadata } from "next";
import FaqFilters from "@/components/faq/faqFilters/FaqFilters";
import FaqHero from "@/components/faq/faqHero/FaqHero";
import FaqList from "@/components/faq/faqList/FaqList";
import FaqSupportCta from "@/components/faq/faqSupportCta/FaqSupportCta";
import { PAGES } from "@/config/pages.config";
import { withLocalizedAlternates } from "@/i18n/metadata";
import { getDictionary } from "@/i18n/server";
import styles from "./style.module.scss";

export async function generateMetadata(): Promise<Metadata> {
  const { metadata } = await getDictionary();

  return withLocalizedAlternates(metadata.pages.faq, PAGES.FAQ);
}

type SearchParams = Record<string, string | string[] | undefined>;

function getSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeQuery(value: string | undefined): string {
  if (!value) {
    return "";
  }

  return value.trim().slice(0, 120);
}

const FAQ_CATEGORIES = [
  "delivery",
  "payments",
  "refunds",
  "troubleshooting",
] as const;

type FaqCategory = (typeof FAQ_CATEGORIES)[number];

function isFaqCategory(value: string | undefined): value is FaqCategory {
  if (!value) {
    return false;
  }

  return (FAQ_CATEGORIES as readonly string[]).includes(value);
}

export default async function FaqPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const query = normalizeQuery(getSearchParam(resolvedSearchParams?.q));

  const rawCategory = getSearchParam(resolvedSearchParams?.category);
  const activeCategory: FaqCategory = isFaqCategory(rawCategory)
    ? rawCategory
    : "delivery";

  const categoryParam = isFaqCategory(rawCategory) ? rawCategory : undefined;

  return (
    <main className={styles.faq}>
      <FaqHero />

      <div className={styles.faq__content}>
        <div className={styles.faq__contentInner}>
          <FaqFilters
            query={query}
            activeCategory={activeCategory}
            categoryParam={categoryParam}
          />
          <FaqList query={query} activeCategory={activeCategory} />
          <FaqSupportCta />
        </div>
      </div>
    </main>
  );
}
