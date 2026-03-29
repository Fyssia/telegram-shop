import {
  ArrowRightIcon,
  CrownIcon,
  RocketIcon,
  SparklesIcon,
  StarIcon,
} from "@/components/ui/icons";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import { getDictionary } from "@/i18n/server";
import { formatPackPriceUsd } from "@/shared/pricing";
import styles from "./packsSection.module.scss";

type PackCard = {
  amount: number;
  stars: string;
  tag: string;
  tagTone: "muted" | "primary" | "star";
  description: string;
  icon: "star" | "sparkles" | "rocket" | "crown";
  iconTone: "star" | "primary";
  iconBg: "dark" | "navy";
};

const PACKS: PackCard[] = [
  {
    amount: 10000,
    stars: "10,000 Stars",
    tag: "Starter",
    tagTone: "muted",
    description:
      "Perfect for recurring tips, giveaways, and team rewards. Delivered instantly after checkout.",
    icon: "star",
    iconTone: "star",
    iconBg: "navy",
  },
  {
    amount: 15000,
    stars: "15,000 Stars",
    tag: "Popular",
    tagTone: "primary",
    description:
      "Great for active creators and frequent campaigns. A balanced pack for steady usage.",
    icon: "sparkles",
    iconTone: "primary",
    iconBg: "dark",
  },
  {
    amount: 20000,
    stars: "20,000 Stars",
    tag: "Best value",
    tagTone: "star",
    description:
      "Built for channels and communities with regular volume. Better value at scale.",
    icon: "rocket",
    iconTone: "star",
    iconBg: "dark",
  },
  {
    amount: 25000,
    stars: "25,000 Stars",
    tag: "Creator",
    tagTone: "primary",
    description:
      "For power users and businesses. Optimized for bulk purchases and frequent sending.",
    icon: "crown",
    iconTone: "primary",
    iconBg: "dark",
  },
];

function PackIcon({ name }: { name: PackCard["icon"] }) {
  if (name === "sparkles") return <SparklesIcon size={20} />;
  if (name === "rocket") return <RocketIcon size={20} />;
  if (name === "crown") return <CrownIcon size={20} />;
  return <StarIcon size={20} />;
}

export default async function PacksSection() {
  const section = (await getDictionary()).home.packsSection;
  const localizedPacks = PACKS.map((pack, index) => {
    const copy = section.packs[index];

    if (!copy) {
      return pack;
    }

    return {
      ...pack,
      stars: copy.stars,
      tag: copy.tag,
      description: copy.description,
    };
  });

  return (
    <section className={styles.packs} id="packs" aria-labelledby="packs-title">
      <div className={styles.packs__inner}>
        <h2 className={styles.packs__title} id="packs-title">
          {section.title}
        </h2>
        <p className={styles.packs__subtitle}>{section.subtitle}</p>

        <div className={styles.packs__grid}>
          {localizedPacks.map((pack) => (
            <LocalizedLink
              key={pack.stars}
              href={`/?amount=${pack.amount}#checkout`}
              className={styles.packs__card}
              aria-label={`${section.buyPack}: ${pack.stars}`}
            >
              <div className={styles.packs__cardTop}>
                <div
                  className={[
                    styles.packs__cardIcon,
                    pack.iconBg === "navy"
                      ? styles["packs__cardIcon--navy"]
                      : styles["packs__cardIcon--dark"],
                    pack.iconTone === "star"
                      ? styles["packs__cardIcon--star"]
                      : styles["packs__cardIcon--primary"],
                  ].join(" ")}
                >
                  <PackIcon name={pack.icon} />
                </div>

                <h3 className={styles.packs__cardTitle}>{pack.stars}</h3>

                <span
                  className={[
                    styles.packs__tag,
                    pack.tagTone === "muted"
                      ? styles["packs__tag--muted"]
                      : pack.tagTone === "star"
                        ? styles["packs__tag--star"]
                        : styles["packs__tag--primary"],
                  ].join(" ")}
                >
                  {pack.tag}
                </span>
              </div>

              <div className={styles.packs__priceRow}>
                <p className={styles.packs__price}>
                  {formatPackPriceUsd(pack.amount)}
                </p>
              </div>

              <p className={styles.packs__desc}>{pack.description}</p>

              <span className={styles.packs__link}>
                <span>{section.buyPack} </span>
                <ArrowRightIcon
                  size={24}
                  className="lucide lucide-arrow-right"
                />
              </span>
            </LocalizedLink>
          ))}
        </div>
      </div>
    </section>
  );
}
