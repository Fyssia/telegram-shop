import { SparklesIcon, StarIcon, ZapIcon } from "@/components/ui/icons";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import { PAGES } from "@/config/pages.config";
import { getDictionary } from "@/i18n/server";
import { formatPackPriceUsd } from "@/shared/pricing";
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
  priceNote: string;
  priceMeta?: string;
  features: string[];
};

type PackTextCopy = {
  title: string;
  pill: string;
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
    priceNote: "approx.",
    priceMeta: "includes bonus",
    features: [
      "Campaign-ready pack",
      "Reporting-friendly receipts",
      "Bulk friendly",
    ],
  },
];

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
            <StarIcon size={18} />
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
        <p className={styles.packCard__priceMain}>
          {formatPackPriceUsd(pack.amount)}
        </p>
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
        <StarIcon size={18} />
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
            <SparklesIcon size={20} />
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
          <ZapIcon size={18} />
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
