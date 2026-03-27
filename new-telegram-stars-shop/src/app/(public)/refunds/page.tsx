import type { Metadata } from "next";
import { PAGES } from "@/config/pages.config";
import { withLocalizedAlternates } from "@/i18n/metadata";
import { getRequestLocale } from "@/i18n/server";
import type { Locale } from "@/i18n/types";
import LegalPage, { type LegalCopy } from "../legal-page";

const COPY: Record<Locale, LegalCopy> = {
  en: {
    metaTitle: "Refund Policy",
    metaDescription:
      "Refund policy for Telegram Stars purchases, unresolved payments, and failed deliveries.",
    kicker: "Legal",
    title: "Refund policy",
    subtitle:
      "This policy explains when a refund may be approved, what information support needs, and how review timelines depend on payment and delivery status.",
    updatedAt: "March 27, 2026",
    sections: [
      {
        id: "eligibility",
        title: "When refunds may be approved",
        list: [
          "Payment was captured, but Stars were not delivered.",
          "The order stayed unresolved beyond the normal support review window.",
          "A confirmed technical issue on our side prevented fulfillment.",
        ],
      },
      {
        id: "not-available",
        title: "When refunds are usually not available",
        list: [
          "Delivery completed to the @username submitted at checkout.",
          "The customer entered the wrong recipient details.",
          "The request is linked to abuse, fraud, or payment reversals.",
        ],
      },
      {
        id: "what-to-include",
        title: "What to include in a refund request",
        list: [
          "Your request ID.",
          "Payment confirmation or transaction reference.",
          "A concise description of what went wrong and when you paid.",
        ],
      },
      {
        id: "review",
        title: "How review works",
        body: "Support checks each request against payment, risk, and delivery logs. We may ask for extra details if the payment provider or our records do not clearly explain the order outcome.",
      },
      {
        id: "timing",
        title: "Timing and return path",
        body: "Review time depends on payment-provider confirmation windows and case complexity. Approved refunds are sent through the original payment route or the return method supported by the provider.",
      },
      {
        id: "before-you-pay",
        title: "Before you pay",
        body: "To reduce avoidable disputes, verify the @username and order details before confirming payment.",
      },
    ],
  },
  ru: {
    metaTitle: "Политика возвратов",
    metaDescription:
      "Политика возвратов для покупки звёзд Telegram, неурегулированных оплат и неуспешной доставки.",
    kicker: "Документы",
    title: "Политика возвратов",
    subtitle:
      "Здесь описано, когда возврат может быть одобрен, какие данные нужны поддержке и почему сроки рассмотрения зависят от статуса оплаты и доставки.",
    updatedAt: "27 марта 2026",
    sections: [
      {
        id: "eligibility",
        title: "Когда возврат может быть одобрен",
        list: [
          "Оплата была успешно списана, но звёзды не были доставлены.",
          "Заказ оставался неурегулированным дольше обычного окна проверки поддержки.",
          "Подтверждена техническая проблема на нашей стороне, которая помешала исполнению заказа.",
        ],
      },
      {
        id: "not-available",
        title: "Когда возврат обычно недоступен",
        list: [
          "Доставка успешно завершена на @username, указанный при оформлении.",
          "Пользователь ввёл неверные данные получателя.",
          "Запрос связан со злоупотреблением, мошенничеством или платёжным реверсом.",
        ],
      },
      {
        id: "what-to-include",
        title: "Что приложить к запросу на возврат",
        list: [
          "ID запроса.",
          "Подтверждение оплаты или идентификатор транзакции.",
          "Короткое описание проблемы и время, когда был произведён платёж.",
        ],
      },
      {
        id: "review",
        title: "Как проходит проверка",
        body: "Поддержка сверяет каждый запрос с платёжными, риск-логами и логами доставки. Мы можем запросить дополнительные детали, если у платёжного провайдера или в наших записях недостаточно информации о результате заказа.",
      },
      {
        id: "timing",
        title: "Сроки и способ возврата",
        body: "Срок рассмотрения зависит от окна подтверждения у платёжного провайдера и сложности кейса. Одобренные возвраты отправляются тем же платёжным маршрутом или способом возврата, который поддерживает провайдер.",
      },
      {
        id: "before-you-pay",
        title: "Перед оплатой",
        body: "Чтобы снизить количество спорных случаев, проверяйте @username и данные заказа до подтверждения платежа.",
      },
    ],
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = COPY[locale];

  return withLocalizedAlternates(
    {
      title: copy.metaTitle,
      description: copy.metaDescription,
    },
    PAGES.REFUNDS,
  );
}

export default async function RefundsPage() {
  const locale = await getRequestLocale();
  const copy = COPY[locale];

  return <LegalPage locale={locale} documentKey="refunds" copy={copy} />;
}
