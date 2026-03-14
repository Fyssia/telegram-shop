import LocalizedLink from "@/components/i18n/LocalizedLink";
import { PAGES } from "@/config/pages.config";
import { getDictionary } from "@/i18n/server";
import styles from "./featuredPacks.module.scss";

type PackTone = "neutral" | "highlightBlue" | "highlightGold";

type Pack = {
  id: "pack-10000" | "pack-15000" | "pack-20000" | "pack-25000";
  amount: number;
  title: string;
  pill: string;
  pillTone: "neutral" | "primary" | "star";
  iconTone: "primary" | "star";
  tone: PackTone;
  price: string;
  priceNote: string;
  priceMeta?: string;
  features: string[];
};

type PackTextCopy = {
  title: string;
  pill: string;
  price: string;
  priceNote: string;
  priceMeta?: string;
  features: string[];
};

const PACKS_TOP_ROW: Pack[] = [
  {
    id: "pack-10000",
    amount: 10000,
    title: "10,000 Stars",
    pill: "Popular",
    pillTone: "star",
    iconTone: "primary",
    tone: "highlightBlue",
    price: "$179.99",
    priceNote: "approx.",
    priceMeta: "includes bonus",
    features: [
      "Great for giveaways",
      "Best value tier",
      "Simple checkout flow",
    ],
  },
  {
    id: "pack-15000",
    amount: 15000,
    title: "15,000 Stars",
    pill: "Quick",
    pillTone: "primary",
    iconTone: "star",
    tone: "neutral",
    price: "$259.99",
    priceNote: "approx.",
    priceMeta: "includes bonus",
    features: [
      "Best for tips & small rewards",
      "Balanced monthly top-ups",
      "Send to any @username",
    ],
  },
];

const PACKS_BOTTOM_ROW: Pack[] = [
  {
    id: "pack-20000",
    amount: 20000,
    title: "20,000 Stars",
    pill: "Events",
    pillTone: "neutral",
    iconTone: "star",
    tone: "neutral",
    price: "$339.99",
    priceNote: "approx.",
    priceMeta: "includes bonus",
    features: [
      "Perfect for events",
      "Flexible payment options",
      "Priority support",
    ],
  },
  {
    id: "pack-25000",
    amount: 25000,
    title: "25,000 Stars",
    pill: "Bulk",
    pillTone: "primary",
    iconTone: "star",
    tone: "highlightGold",
    price: "$429.99",
    priceNote: "approx.",
    priceMeta: "includes bonus",
    features: [
      "Campaign-ready pack",
      "Reporting-friendly receipts",
      "Bulk friendly",
    ],
  },
];

function SparklesIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 3L13.1 8.5 18 10l-4.9 1.5L12 17l-1.1-5.5L6 10l4.9-1.5L12 3z" />
      <path d="M5 3l.5 2.5L8 6 5.5 6.5 5 9 4.5 6.5 2 6l2.5-.5L5 3z" />
      <path d="M19 15l.7 3.3L23 19l-3.3.7L19 23l-.7-3.3L15 19l3.3-.7L19 15z" />
    </svg>
  );
}

function ZapIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
    </svg>
  );
}

function PackCard({
  pack,
  labels,
}: {
  pack: Pack;
  labels: {
    selectPack: string;
  };
}) {
  const titleId = `${pack.id}-title`;
  const useCase = pack.features[0] ?? pack.title;

  return (
    <article
      className={[
        styles.packCard,
        pack.tone === "highlightBlue"
          ? styles["packCard--highlightBlue"]
          : pack.tone === "highlightGold"
            ? styles["packCard--highlightGold"]
            : styles["packCard--neutral"],
      ].join(" ")}
      aria-labelledby={titleId}
    >
      <header className={styles.packCard__top}>
        <div className={styles.packCard__left}>
          <span
            className={[
              styles.packCard__icon,
              pack.iconTone === "primary"
                ? styles["packCard__icon--primary"]
                : styles["packCard__icon--star"],
            ].join(" ")}
            aria-hidden="true"
          >
            <StarIcon />
          </span>

          <h3 className={styles.packCard__title} id={titleId}>
            {pack.title}
          </h3>
        </div>

        <span
          className={[
            styles.packCard__pill,
            pack.pillTone === "star"
              ? styles["packCard__pill--star"]
              : pack.pillTone === "primary"
                ? styles["packCard__pill--primary"]
                : styles["packCard__pill--neutral"],
          ].join(" ")}
        >
          {pack.pill}
        </span>
      </header>

      <p className={styles.packCard__useCase}>{useCase}</p>

      <div className={styles.packCard__priceRow}>
        <p className={styles.packCard__priceMain}>{pack.price}</p>
        <span className={styles.packCard__priceNote}>{pack.priceNote}</span>
        {pack.priceMeta ? (
          <span className={styles.packCard__priceMeta}>{pack.priceMeta}</span>
        ) : null}
      </div>

      <LocalizedLink
        href={`${PAGES.HOME}?amount=${pack.amount}#checkout`}
        className={styles.packCard__button}
        aria-label={`${labels.selectPack}: ${pack.title}`}
      >
        <StarIcon />
        <span>{labels.selectPack}</span>
      </LocalizedLink>
    </article>
  );
}

function mergePackRows(base: Pack[], copy: readonly PackTextCopy[]): Pack[] {
  return base.map((pack, index) => {
    const localized = copy[index];
    if (!localized) return pack;

    return {
      ...pack,
      title: localized.title,
      pill: localized.pill,
      price: localized.price,
      priceNote: localized.priceNote,
      priceMeta: localized.priceMeta,
      features: localized.features,
    };
  });
}

export default async function FeaturedPacks() {
  const section = (await getDictionary()).rates.featuredPacks;
  const topRow = mergePackRows(PACKS_TOP_ROW, section.topRow);
  const bottomRow = mergePackRows(PACKS_BOTTOM_ROW, section.bottomRow);
  const packCardLabels = {
    selectPack: section.selectPack,
  };

  return (
    <section
      className={styles.featuredPacks}
      aria-labelledby="featured-packs-title"
    >
      <header className={styles.featuredPacks__header}>
        <div className={styles.featuredPacks__headerLeft}>
          <span className={styles.featuredPacks__icon} aria-hidden="true">
            <SparklesIcon />
          </span>

          <div className={styles.featuredPacks__headerText}>
            <h2
              className={styles.featuredPacks__title}
              id="featured-packs-title"
            >
              {section.title}
            </h2>
            <p className={styles.featuredPacks__subtitle}>{section.subtitle}</p>
          </div>
        </div>

        <p className={styles.featuredPacks__pill}>
          <ZapIcon />
          <span>{section.instantDelivery}</span>
        </p>
      </header>

      <div className={styles.featuredPacks__rows}>
        <div className={styles.featuredPacks__row}>
          {topRow.map((pack) => (
            <PackCard key={pack.id} pack={pack} labels={packCardLabels} />
          ))}
        </div>
        <div className={styles.featuredPacks__row}>
          {bottomRow.map((pack) => (
            <PackCard key={pack.id} pack={pack} labels={packCardLabels} />
          ))}
        </div>
      </div>
    </section>
  );
}
