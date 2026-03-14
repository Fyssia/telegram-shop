"use client";

import { useEffect, useRef, useState } from "react";

type CopyReferralButtonProps = {
  className: string;
  label: string;
  copiedLabel: string;
};

export default function CopyReferralButton({
  className,
  label,
  copiedLabel,
}: CopyReferralButtonProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (!timerRef.current) return;
      clearTimeout(timerRef.current);
    };
  }, []);

  async function onCopyClick() {
    const referralLink = `${window.location.origin}${window.location.pathname}#referral`;

    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        setCopied(false);
      }, 1700);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      className={className}
      onClick={onCopyClick}
      data-copied={copied}
      aria-live="polite"
    >
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
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
      <span>{copied ? copiedLabel : label}</span>
    </button>
  );
}
