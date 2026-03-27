"use client";

import { LinkIcon } from "@/components/ui/icons";
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
      <LinkIcon size={20} />
      <span>{copied ? copiedLabel : label}</span>
    </button>
  );
}
