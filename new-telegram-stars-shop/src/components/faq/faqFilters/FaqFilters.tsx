import {
  CreditCardIcon,
  LifeBuoyIcon,
  RefreshCwIcon,
  SearchIcon,
  ZapIcon,
} from "@/components/faq/icons";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import { getDictionary } from "@/i18n/server";
import styles from "./faqFilters.module.scss";

const FAQ_CATEGORIES = [
  "delivery",
  "payments",
  "refunds",
  "troubleshooting",
] as const;

type FaqCategory = (typeof FAQ_CATEGORIES)[number];

type Props = {
  query: string;
  activeCategory: FaqCategory;
  categoryParam?: FaqCategory;
};

function buildFaqUrl({
  category,
  query,
}: {
  category: FaqCategory;
  query: string;
}): string {
  const params = new URLSearchParams();

  if (query) {
    params.set("q", query);
  }

  if (category !== "delivery") {
    params.set("category", category);
  }

  const search = params.toString();
  return search ? `/faq?${search}` : "/faq";
}

export default async function FaqFilters({
  query,
  activeCategory,
  categoryParam,
}: Props) {
  const copy = (await getDictionary()).faq.filters;

  return (
    <section
      className={styles.faqFilters}
      aria-label={copy.searchAndCategories}
    >
      <form
        action="/faq"
        method="get"
        className={styles.faqFilters__search}
        aria-label={copy.searchFaq}
      >
        <label htmlFor="faq-query" className="visually-hidden">
          {copy.searchFaq}
        </label>

        <SearchIcon className={styles.faqFilters__searchIcon} />

        <input
          id="faq-query"
          name="q"
          type="search"
          inputMode="search"
          enterKeyHint="search"
          className={styles.faqFilters__searchInput}
          placeholder={copy.searchPlaceholder}
          defaultValue={query}
          autoComplete="off"
        />

        {categoryParam ? (
          <input type="hidden" name="category" value={categoryParam} />
        ) : null}

        <button type="submit" className="visually-hidden">
          {copy.searchSubmit}
        </button>
      </form>

      <nav
        className={styles.faqFilters__chips}
        aria-label={copy.categoriesLabel}
      >
        <ul className={styles.faqFilters__chipList}>
          <li>
            <LocalizedLink
              href={buildFaqUrl({ category: "delivery", query })}
              className={`${styles.faqFilters__chip} ${
                activeCategory === "delivery"
                  ? styles["faqFilters__chip--active"]
                  : ""
              }`}
              aria-current={activeCategory === "delivery" ? "page" : undefined}
            >
              <ZapIcon className={styles.faqFilters__chipIcon} />
              <span className={styles.faqFilters__chipText}>
                {copy.categories.delivery}
              </span>
            </LocalizedLink>
          </li>
          <li>
            <LocalizedLink
              href={buildFaqUrl({ category: "payments", query })}
              className={`${styles.faqFilters__chip} ${
                activeCategory === "payments"
                  ? styles["faqFilters__chip--active"]
                  : ""
              }`}
              aria-current={activeCategory === "payments" ? "page" : undefined}
            >
              <CreditCardIcon className={styles.faqFilters__chipIcon} />
              <span className={styles.faqFilters__chipText}>
                {copy.categories.payments}
              </span>
            </LocalizedLink>
          </li>
          <li>
            <LocalizedLink
              href={buildFaqUrl({ category: "refunds", query })}
              className={`${styles.faqFilters__chip} ${
                activeCategory === "refunds"
                  ? styles["faqFilters__chip--active"]
                  : ""
              }`}
              aria-current={activeCategory === "refunds" ? "page" : undefined}
            >
              <RefreshCwIcon className={styles.faqFilters__chipIcon} />
              <span className={styles.faqFilters__chipText}>
                {copy.categories.refunds}
              </span>
            </LocalizedLink>
          </li>
          <li>
            <LocalizedLink
              href={buildFaqUrl({ category: "troubleshooting", query })}
              className={`${styles.faqFilters__chip} ${
                activeCategory === "troubleshooting"
                  ? styles["faqFilters__chip--active"]
                  : ""
              }`}
              aria-current={
                activeCategory === "troubleshooting" ? "page" : undefined
              }
            >
              <LifeBuoyIcon className={styles.faqFilters__chipIcon} />
              <span className={styles.faqFilters__chipText}>
                {copy.categories.troubleshooting}
              </span>
            </LocalizedLink>
          </li>
        </ul>
      </nav>
    </section>
  );
}
