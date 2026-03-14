"use client";

import { type FormEvent, useMemo, useState } from "react";
import {
  MailIcon,
  MessageCircleIcon,
  PencilIcon,
  SendIcon,
} from "@/components/support/icons";
import { useI18n } from "@/i18n/client";
import styles from "./supportContactCard.module.scss";

type SubmitState = "idle" | "submitting" | "success" | "error";

type SupportApiResponse = {
  ok?: boolean;
  code?: string;
  requestId?: string;
};

function validateEmail(email: string): boolean {
  return (
    email.length > 3 &&
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}

function validateMessage(message: string): boolean {
  return message.length >= 10 && message.length <= 2000;
}

export default function SupportContactCard() {
  const { messages } = useI18n();
  const copy = messages.support.contactCard;
  const common = messages.common;
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);

  const isSubmitting = submitState === "submitting";
  const canSubmit = useMemo(
    () => validateEmail(email.trim()) && validateMessage(message.trim()),
    [email, message],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const emailValue = email.trim();
    const messageValue = message.trim();

    if (!validateEmail(emailValue) || !validateMessage(messageValue)) {
      setSubmitState("error");
      setSubmitMessage(copy.statusInvalid);
      setRequestId(null);
      return;
    }

    setSubmitState("submitting");
    setSubmitMessage(copy.statusSubmitting);
    setRequestId(null);

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: emailValue,
          message: messageValue,
        }),
      });

      const payload = ((await response.json().catch(() => null)) ??
        null) as SupportApiResponse | null;
      const responseCode = payload?.code ?? "";
      const responseRequestId =
        typeof payload?.requestId === "string" ? payload.requestId : null;

      if (response.ok && payload?.ok) {
        setSubmitState("success");
        setSubmitMessage(copy.statusSubmitted);
        setRequestId(responseRequestId);
        setMessage("");
        return;
      }

      setSubmitState("error");
      setRequestId(responseRequestId);
      if (responseCode === "VALIDATION_ERROR") {
        setSubmitMessage(copy.statusInvalid);
        return;
      }

      if (responseCode === "SUPPORT_UNAVAILABLE") {
        setSubmitMessage(copy.statusUnavailable);
        return;
      }

      setSubmitMessage(copy.statusDeliveryFailed);
    } catch {
      setSubmitState("error");
      setSubmitMessage(copy.statusDeliveryFailed);
      setRequestId(null);
    }
  }

  return (
    <section
      className={styles.supportContact}
      aria-labelledby="support-contact-title"
      id="support-contact"
    >
      <div className={styles.supportContact__titleRow}>
        <MessageCircleIcon className={styles.supportContact__titleIcon} />
        <h2 className={styles.supportContact__title} id="support-contact-title">
          {copy.title}
        </h2>
      </div>

      <output
        className={styles.supportContact__status}
        data-tone={
          submitState === "success"
            ? "success"
            : submitState === "error"
              ? "error"
              : submitState === "submitting"
                ? "info"
                : undefined
        }
        aria-live="polite"
      >
        {submitMessage}
        {requestId ? ` • ${common.requestIdPrefix}: ${requestId}` : ""}
      </output>

      <form className={styles.supportContact__form} onSubmit={onSubmit}>
        <label htmlFor="support-email" className="visually-hidden">
          {copy.labels.email}
        </label>
        <div className={styles.supportContact__field}>
          <MailIcon className={styles.supportContact__fieldIcon} />
          <input
            id="support-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            maxLength={254}
            className={styles.supportContact__input}
            placeholder={copy.placeholders.email}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (submitState !== "idle") {
                setSubmitState("idle");
                setSubmitMessage("");
                setRequestId(null);
              }
            }}
          />
        </div>

        <label htmlFor="support-message" className="visually-hidden">
          {copy.labels.issue}
        </label>
        <div
          className={`${styles.supportContact__field} ${styles["supportContact__field--textarea"]}`}
        >
          <PencilIcon className={styles.supportContact__fieldIcon} />
          <textarea
            id="support-message"
            name="message"
            required
            minLength={10}
            maxLength={2000}
            className={styles.supportContact__textarea}
            placeholder={copy.placeholders.issue}
            value={message}
            onChange={(event) => {
              setMessage(event.target.value);
              if (submitState !== "idle") {
                setSubmitState("idle");
                setSubmitMessage("");
                setRequestId(null);
              }
            }}
          />
        </div>

        <button
          type="submit"
          className={styles.supportContact__button}
          disabled={!canSubmit || isSubmitting}
        >
          <SendIcon className={styles.supportContact__buttonIcon} />
          <span>
            {isSubmitting ? copy.sendMessagePending : copy.sendMessage}
          </span>
        </button>
      </form>
    </section>
  );
}
