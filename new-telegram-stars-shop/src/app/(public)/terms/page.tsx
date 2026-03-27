import type { Metadata } from "next";
import { PAGES } from "@/config/pages.config";
import { withLocalizedAlternates } from "@/i18n/metadata";
import { getRequestLocale } from "@/i18n/server";
import type { Locale } from "@/i18n/types";
import LegalPage, { type LegalCopy } from "../legal-page";

const COPY: Record<Locale, LegalCopy> = {
  en: {
    metaTitle: "Terms of Service",
    metaDescription:
      "Terms for Telegram Stars checkout, order processing, delivery confirmation, and support.",
    kicker: "Legal",
    title: "Terms of service",
    subtitle:
      "These terms explain how checkout, delivery confirmation, support, and misuse prevention work when you buy Telegram Stars through the service.",
    updatedAt: "March 27, 2026",
    sections: [
      {
        id: "service-scope",
        title: "Service scope",
        body: "The service provides Telegram Stars top-ups and related order support. We may update availability, pricing, payment routes, or processing rules when required for operations, risk control, or provider changes.",
      },
      {
        id: "delivery",
        title: "Order details and delivery",
        body: "You must verify the Telegram @username before confirming payment. Delivery to the username submitted at checkout is treated as completed once our records show a successful transfer.",
      },
      {
        id: "payments",
        title: "Payment and order review",
        list: [
          "Orders move into processing only after payment confirmation.",
          "Pricing and fees shown at checkout apply to that order at the moment of payment.",
          "We may pause, reject, or cancel orders that fail validation or trigger risk checks.",
        ],
      },
      {
        id: "timing",
        title: "Timing and availability",
        list: [
          "Most deliveries complete quickly, but delays can happen during provider congestion, maintenance, or manual review.",
          "After submission, the service provides an order status and request ID.",
          "If your order remains unresolved, contact support with the request ID and a short description of the issue.",
        ],
      },
      {
        id: "prohibited-use",
        title: "Prohibited use",
        list: [
          "Fraudulent payments, chargeback abuse, or false claims.",
          "Automated abuse of checkout, referral, or support flows.",
          "Attempts to probe, overload, or disrupt service availability.",
        ],
      },
      {
        id: "support-disputes",
        title: "Support and disputes",
        body: "Support reviews disputes against payment, risk, and delivery logs. If the logs show a successful transfer to the submitted username, the order is usually treated as fulfilled.",
      },
    ],
  },
  ru: {
    metaTitle: "Условия использования",
    metaDescription:
      "Условия для оформления заказов на звёзды Telegram, подтверждения оплаты, доставки и поддержки.",
    kicker: "Документы",
    title: "Условия использования",
    subtitle:
      "Здесь описано, как работают оформление заказа, подтверждение доставки, поддержка и защита от злоупотреблений при покупке звёзд Telegram через сервис.",
    updatedAt: "27 марта 2026",
    sections: [
      {
        id: "service-scope",
        title: "Объём сервиса",
        body: "Сервис предоставляет покупку звёзд Telegram и сопровождение по заказам. Мы можем обновлять доступность, цены, платёжные маршруты и правила обработки, если это требуется для работы сервиса, контроля рисков или изменений у провайдеров.",
      },
      {
        id: "delivery",
        title: "Данные заказа и доставка",
        body: "Перед подтверждением оплаты вы должны проверить Telegram @username. Доставка на @username, указанный при оформлении, считается завершённой, как только наши записи подтверждают успешный перевод.",
      },
      {
        id: "payments",
        title: "Оплата и проверка заказа",
        list: [
          "Заказ переходит в обработку только после подтверждения оплаты.",
          "Цена и комиссии, показанные в момент оформления, применяются к конкретному заказу в момент оплаты.",
          "Мы можем приостановить, отклонить или отменить заказ, если он не проходит валидацию или попадает в риск-проверки.",
        ],
      },
      {
        id: "timing",
        title: "Сроки и доступность",
        list: [
          "Большинство доставок завершается быстро, но задержки возможны из-за нагрузки у провайдера, техработ или ручной проверки.",
          "После отправки сервис показывает статус заказа и ID запроса.",
          "Если заказ долго остаётся неурегулированным, обратитесь в поддержку и приложите ID запроса с коротким описанием проблемы.",
        ],
      },
      {
        id: "prohibited-use",
        title: "Запрещённое использование",
        list: [
          "Мошеннические оплаты, злоупотребление чарджбэками и ложные претензии.",
          "Автоматизированные злоупотребления формой заказа, поддержкой или реферальными сценариями.",
          "Попытки исследовать, перегружать или нарушать доступность сервиса.",
        ],
      },
      {
        id: "support-disputes",
        title: "Поддержка и споры",
        body: "Поддержка проверяет спорные случаи по платёжным, риск-логам и логам доставки. Если логи подтверждают успешный перевод на указанный @username, заказ обычно считается исполненным.",
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
    PAGES.TERMS,
  );
}

export default async function TermsPage() {
  const locale = await getRequestLocale();
  const copy = COPY[locale];

  return <LegalPage locale={locale} documentKey="terms" copy={copy} />;
}
