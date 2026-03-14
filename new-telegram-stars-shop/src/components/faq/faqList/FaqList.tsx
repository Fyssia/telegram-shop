"use client";

import { useEffect, useMemo, useState } from "react";
import { PlusIcon } from "@/components/faq/icons";
import { useI18n } from "@/i18n/client";
import styles from "./faqList.module.scss";

const FAQ_CATEGORIES = [
  "delivery",
  "payments",
  "refunds",
  "troubleshooting",
] as const;

type FaqCategory = (typeof FAQ_CATEGORIES)[number];

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

type Props = {
  query: string;
  activeCategory: FaqCategory;
};

const ITEM_CATEGORY_MAP: Record<string, FaqCategory> = {
  "stars-delivery-speed": "delivery",
  "send-stars-to-others": "delivery",
  "bulk-stars": "delivery",
  "payment-methods": "payments",
  refunds: "refunds",
  "wrong-username": "troubleshooting",
  "track-order": "troubleshooting",
  "stars-not-arrived": "troubleshooting",
};

function normalizeQuery(value: string): string {
  return value.trim().toLowerCase();
}

function getItemCategory(id: string): FaqCategory {
  return ITEM_CATEGORY_MAP[id] ?? "troubleshooting";
}

export default function FaqList({ query, activeCategory }: Props) {
  const { messages } = useI18n();
  const copy = messages.faq.list;
  const faqItems: readonly FaqItem[] = copy.items;
  const normalizedQuery = normalizeQuery(query);
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  const visibleItems = useMemo(
    () =>
      faqItems.filter((item) => {
        if (getItemCategory(item.id) !== activeCategory) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        const haystack = `${item.question} ${item.answer}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      }),
    [activeCategory, faqItems, normalizedQuery],
  );

  useEffect(() => {
    if (!openItemId) return;
    if (visibleItems.some((item) => item.id === openItemId)) return;
    setOpenItemId(null);
  }, [openItemId, visibleItems]);

  function toggleItem(itemId: string) {
    setOpenItemId((current) => (current === itemId ? null : itemId));
  }

  return (
    <section className={styles.faqList} aria-labelledby="faq-list-title">
      <h2 className="visually-hidden" id="faq-list-title">
        {copy.title}
      </h2>

      {visibleItems.length === 0 ? (
        <p className={styles.faqList__empty}>
          {copy.noResultsPrefix} “{query}”. {copy.noResultsSuffix}
        </p>
      ) : (
        <ul className={styles.faqList__list}>
          {visibleItems.map((item) => {
            const isOpen = openItemId === item.id;
            const triggerId = `faq-trigger-${item.id}`;
            const panelId = `faq-panel-${item.id}`;

            return (
              <li
                className={styles.faqList__item}
                key={item.id}
                data-open={isOpen}
              >
                <h3 className={styles.faqList__question}>
                  <button
                    type="button"
                    id={triggerId}
                    className={styles.faqList__trigger}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggleItem(item.id)}
                  >
                    <span className={styles.faqList__questionText}>
                      {item.question}
                    </span>
                    <PlusIcon className={styles.faqList__icon} />
                  </button>
                </h3>

                <section
                  id={panelId}
                  aria-labelledby={triggerId}
                  className={styles.faqList__answerWrap}
                  aria-hidden={!isOpen}
                >
                  <div className={styles.faqList__answerInner}>
                    <p className={styles.faqList__answer}>{item.answer}</p>
                  </div>
                </section>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
