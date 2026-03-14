import LocalizedLink from "@/components/i18n/LocalizedLink";
import { getDictionary } from "@/i18n/server";
import styles from "./packsSection.module.scss";

type PackCard = {
  amount: number;
  stars: string;
  tag: string;
  tagTone: "muted" | "primary" | "star";
  price: string;
  bonus: string;
  bonusTone: "muted" | "star";
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
    price: "$179.99",
    bonus: "No hidden fees",
    bonusTone: "muted",
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
    price: "$259.99",
    bonus: "+5% bonus",
    bonusTone: "star",
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
    price: "$339.99",
    bonus: "+10% bonus",
    bonusTone: "star",
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
    price: "$429.99",
    bonus: "Priority support",
    bonusTone: "muted",
    description:
      "For power users and businesses. Optimized for bulk purchases and frequent sending.",
    icon: "crown",
    iconTone: "primary",
    iconBg: "dark",
  },
];

function PackIcon({ name }: { name: PackCard["icon"] }) {
  if (name === "sparkles") {
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

  if (name === "rocket") {
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
        <path d="M4.5 16.5c-1.5 1.26-2 5.5-2 5.5s4.24-.5 5.5-2c.71-.84.7-2.1-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
        <path d="m12 15-3-3a22 22 0 0 1 3-7 22 22 0 0 1 7-3 22 22 0 0 1-3 7 22 22 0 0 1-7 6z" />
        <path d="M9 12H4s.55-3.03 2-4.5c1.26-1.26 3.5-2 3.5-2" />
        <path d="M12 15v5s3.03-.55 4.5-2c1.26-1.26 2-3.5 2-3.5" />
      </svg>
    );
  }

  if (name === "crown") {
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
        <path d="M2 6l4 4 3-6 3 6 4-4 4 4-2 12H4L2 10z" />
        <path d="M6 22h12" />
      </svg>
    );
  }

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
      <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
    </svg>
  );
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
      price: copy.price,
      bonus: copy.bonus,
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
                <p className={styles.packs__price}>{pack.price}</p>
                <span
                  className={[
                    styles.packs__bonus,
                    pack.bonusTone === "star"
                      ? styles["packs__bonus--star"]
                      : styles["packs__bonus--muted"],
                  ].join(" ")}
                >
                  {pack.bonus}
                </span>
              </div>

              <p className={styles.packs__desc}>{pack.description}</p>

              <span className={styles.packs__link}>
                <span>{section.buyPack} </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  focusable="false"
                  className="lucide lucide-arrow-right"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </span>
            </LocalizedLink>
          ))}
        </div>
      </div>
    </section>
  );
}
