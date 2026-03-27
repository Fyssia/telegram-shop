import type { Metadata } from "next";
import { PAGES } from "@/config/pages.config";
import { withLocalizedAlternates } from "@/i18n/metadata";
import { getRequestLocale } from "@/i18n/server";
import type { Locale } from "@/i18n/types";
import LegalPage, { type LegalCopy } from "../legal-page";

const COPY: Record<Locale, LegalCopy> = {
  en: {
    metaTitle: "Privacy Policy",
    metaDescription:
      "Privacy policy for Telegram Stars checkout, operational data, and support requests.",
    kicker: "Legal",
    title: "Privacy policy",
    subtitle:
      "This policy explains what operational data we process, why we process it, and how we use it to deliver orders and respond to support requests safely.",
    updatedAt: "March 27, 2026",
    sections: [
      {
        id: "data-we-collect",
        title: "Data we collect",
        list: [
          "Telegram @username entered for delivery.",
          "Order identifiers, timestamps, payment status, and delivery status.",
          "Messages and contact details you submit in support requests.",
        ],
      },
      {
        id: "how-we-use-data",
        title: "How we use data",
        list: [
          "Validate checkout input and complete delivery.",
          "Investigate failed orders, payment issues, and disputes.",
          "Operate support, fraud prevention, and basic service monitoring.",
        ],
      },
      {
        id: "sharing",
        title: "Sharing with providers",
        body: "We share only the data needed for payment processing, hosting, delivery operations, and security with providers involved in running the service.",
      },
      {
        id: "retention-protection",
        title: "Retention and protection",
        body: "Order and support records are retained only for operational, accounting, security, and dispute-resolution needs. Access is limited to the team members and providers who need it to run the service.",
      },
      {
        id: "privacy-requests",
        title: "Privacy requests",
        body: "If you need a correction or have a privacy-related request, contact support and include the order details needed to locate your record. Response options may depend on the data we must retain for operations or legal obligations.",
      },
      {
        id: "contact",
        title: "Contact",
        body: "For privacy questions, use support and include your request ID when available.",
      },
    ],
  },
  ru: {
    metaTitle: "Конфиденциальность",
    metaDescription:
      "Политика конфиденциальности для оформления заказов на звёзды Telegram, операционных данных и обращений в поддержку.",
    kicker: "Документы",
    title: "Политика конфиденциальности",
    subtitle:
      "В этой политике описано, какие операционные данные мы обрабатываем, зачем они нужны и как используются для безопасной доставки и обработки обращений в поддержку.",
    updatedAt: "27 марта 2026",
    sections: [
      {
        id: "data-we-collect",
        title: "Какие данные мы собираем",
        list: [
          "Telegram @username, указанный для доставки.",
          "Идентификаторы заказа, временные метки, статус оплаты и статус доставки.",
          "Сообщения и контактные данные, которые вы отправляете в поддержку.",
        ],
      },
      {
        id: "how-we-use-data",
        title: "Как мы используем данные",
        list: [
          "Проверяем данные заказа и завершаем доставку.",
          "Разбираем неуспешные заказы, платёжные проблемы и спорные случаи.",
          "Обеспечиваем поддержку, антифрод и базовый мониторинг сервиса.",
        ],
      },
      {
        id: "sharing",
        title: "Передача провайдерам",
        body: "Мы передаём только те данные, которые нужны для обработки платежей, хостинга, доставки и безопасности, провайдерам, участвующим в работе сервиса.",
      },
      {
        id: "retention-protection",
        title: "Хранение и защита",
        body: "Данные заказов и обращений хранятся только для операционных, бухгалтерских, защитных и спорных задач. Доступ к ним есть только у тех участников команды и провайдеров, которым это действительно нужно для работы сервиса.",
      },
      {
        id: "privacy-requests",
        title: "Запросы по конфиденциальности",
        body: "Если вам нужно внести исправление или отправить запрос по конфиденциальности, обратитесь в поддержку и приложите данные заказа, по которым можно найти вашу запись. Варианты ответа могут зависеть от того, какие данные мы обязаны хранить для работы сервиса или юридических обязательств.",
      },
      {
        id: "contact",
        title: "Контакты",
        body: "По вопросам конфиденциальности обращайтесь в поддержку и по возможности указывайте ID запроса.",
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
    PAGES.PRIVACY,
  );
}

export default async function PrivacyPage() {
  const locale = await getRequestLocale();
  const copy = COPY[locale];

  return <LegalPage locale={locale} documentKey="privacy" copy={copy} />;
}
