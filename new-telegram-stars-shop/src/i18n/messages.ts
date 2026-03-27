import { formatPackPriceUsd } from "../shared/pricing";
import type { Locale } from "./types";

const PACK_PRICE_10000 = formatPackPriceUsd(10_000);
const PACK_PRICE_15000 = formatPackPriceUsd(15_000);
const PACK_PRICE_20000 = formatPackPriceUsd(20_000);
const PACK_PRICE_25000 = formatPackPriceUsd(25_000);

const en = {
  common: {
    brandName: "Quack Stars",
    languageShort: {
      ru: "RU",
      en: "EN",
    },
    requestIdPrefix: "request",
  },
  metadata: {
    site: {
      title: "Quack Stars",
      description:
        "Buy Telegram Stars with secure checkout, instant delivery, and transparent rates.",
    },
    pages: {
      home: {
        title: "Buy Telegram Stars in seconds",
        description:
          "Choose a pack, pay securely, and receive Stars instantly. Built for giveaways, rewards, and other Telegram activities.",
      },
      packs: {
        title: "Rates & packs",
        description:
          "Compare Telegram Stars packs, preview reporting, and learn about payment options before checkout.",
      },
      howItWorks: {
        title: "How it works",
        description:
          "Learn how Telegram Stars checkout works: enter a username, choose a pack, pay securely, and receive confirmation in Telegram.",
      },
      faq: {
        title: "FAQ",
        description:
          "Quick answers about Stars delivery, payment methods, and troubleshooting.",
      },
      support: {
        title: "Support",
        description:
          "Need help with a Stars top-up? Send us a message — we’ll respond as quickly as possible.",
      },
      notFound: {
        title: "404 — Page not found",
        description:
          "The page you’re looking for doesn’t exist or was moved. Check the URL or go back home.",
      },
    },
  },
  header: {
    menu: {
      rates: "Rates",
      howItWorks: "How it works",
      faq: "FAQ",
      support: "Support",
    },
    menuAria: "Primary navigation",
    openMenu: "Open navigation menu",
    closeMenu: "Close navigation menu",
    buyStars: "Start checkout",
  },
  footer: {
    brandDesc:
      "Fast Stars top-ups for creators, communities, and giveaways. Send Stars to any @username in seconds.",
    trust: {
      label: "Trust badges",
      instant: "Instant delivery",
      support: "Help when you need it",
    },
    columns: {
      footerLabel: "Footer",
      product: "Product",
      telegram: "Telegram",
      legal: "Legal",
    },
    links: {
      buyStars: "Buy Stars",
      ratesPacks: "Rates & packs",
      referralProgram: "Referral program",
      openBot: "Open bot",
      joinChannel: "Join channel",
      support: "Support",
      terms: "Terms",
      privacy: "Privacy",
      refunds: "Refunds",
    },
    copyright: "© 2026 Quack Stars. All rights reserved.",
    social: {
      label: "Social links",
      telegram: "Telegram",
      support: "Support",
      email: "Email",
    },
  },
  checkoutForm: {
    labels: {
      purchaseKind: "Purchase type",
      telegramUsername: "Telegram username",
      paymentCurrency: "Payment currency",
      amount: "Amount",
      chooseAmount: "Choose amount",
      premiumDuration: "Premium duration",
      months: "months",
      status: "status",
      closeDialog: "Close dialog",
    },
    placeholders: {
      telegramUsername: "Enter Telegram username",
    },
    purchaseKinds: {
      stars: "Stars",
      premium: "Telegram Premium",
    },
    paymentMethods: {
      fiat: "SBP, CARD",
      tonWallet: "TON Wallet",
      cryptoBot: "CryptoBot",
      usdtTon: "USDT (TON)",
      ton: "TON",
      tonDev: "TON DEV (instant)",
      usdtTrc20: "USDT (TRC20)",
    },
    button: {
      buy: "Buy Stars",
      buyPremium: "Buy Telegram Premium",
      openInvoice: "Open invoice",
      processing: "Processing...",
    },
    helper: {
      waitingUsernameCheck: "Enter a valid @username to continue.",
    },
    messages: {
      invalidUsernameBeforePurchase:
        "Enter a valid Telegram username before checkout.",
      waitForUsernameCheck: "Finish username verification before checkout.",
      checkingUsername: "Checking username...",
      invalidAmount: "Choose an amount from 50 to 25,000 Stars.",
      invalidPremiumDuration: "Choose 3, 6, or 12 months for Premium gift.",
      checkingBalance: "Checking available balance...",
      creatingInvoice: "Creating payment invoice...",
      cryptoBotInvoiceCreateFailed:
        "CryptoBot couldn’t create the payment invoice. Please try again.",
      creatingTonOrder: "Preparing TON Wallet payment...",
      tonWalletConnect: "Connect TON Wallet to continue payment.",
      tonWalletPaymentFailed:
        "TON Wallet didn’t complete the payment request. Open the wallet and try again.",
      tonWalletRejected: "Payment was cancelled in TON Wallet.",
      tonWalletInsufficientFunds:
        "There are not enough funds in your wallet for this payment. Top up the wallet and try again.",
      tonWalletOpenAndConfirm:
        "Transaction prepared. Confirm payment in your TON Wallet.",
      tonWalletTransactionSubmitted:
        "Transaction submitted. Waiting for blockchain confirmation...",
      tonWalletSwitchToMainnet: "Switch TON Wallet to mainnet and try again.",
      tonWalletSwitchToTestnet: "Switch TON Wallet to testnet and try again.",
      tonWalletStatusCheckFailed:
        "Couldn’t verify TON Wallet payment status. If you already sent the transaction, wait a bit and refresh.",
      invoiceCreatedOpenPayment:
        "Invoice created. Complete payment in CryptoBot window.",
      invoiceCreatedNoLink:
        "Invoice created. Open CryptoBot and complete the payment.",
      awaitingPaymentConfirmation: "Waiting for payment confirmation...",
      paymentReceivedProcessingDelivery:
        "Payment received. Waiting for Telegram delivery...",
      paymentFailedStatusPrefix: "Payment status",
      paymentTimeout:
        "Payment check timed out. If you already paid, wait a bit and refresh.",
      invoiceStatusCheckFailed:
        "Couldn’t verify payment status. If you already paid, wait a bit and refresh.",
      invalidInvoiceResponse: "Invalid invoice response from payment provider.",
      submitting: "Creating order...",
      submittingPremium: "Creating Telegram Premium gift...",
      confirmed: "Order confirmed. Stars are being delivered.",
      confirmedPremium: "Order confirmed. Telegram Premium is being delivered.",
      insufficientBalance:
        "This order can’t be created right now because the service balance is insufficient. Please try again later.",
      balanceCheckUnavailable:
        "Couldn’t verify available balance right now. Please try again.",
      paymentProviderUnavailable:
        "Payment service is temporarily unavailable. Please try again.",
      requestFailed: "Couldn’t create order. Please try again.",
      invalidUsernameFormat:
        "Use 5-32 characters: letters, numbers, underscore.",
      usernameNotFound: "This username was not found.",
      usernameIsBot: "Bots can’t receive Stars. Enter a user account.",
      usernameNotUser: "Only personal accounts can receive Stars.",
      usernameAlreadyPremium:
        "This user already has Telegram Premium. Choose another recipient.",
      premiumCheckUnavailable:
        "Couldn’t verify Telegram Premium status right now. Try again.",
      requestFailedGeneric: "Couldn’t verify username. Try again.",
      errorStatusPrefix: "Order status",
    },
    text: {
      amountUsdPlaceholder: "(— $)",
    },
  },
  home: {
    hero: {
      titleStart: "Buy Telegram Stars",
      titleAccent: "in seconds.",
      subtitle:
        "Choose a pack, pay securely, and receive Stars instantly. Built for giveaways, rewards, and other Telegram activities.",
      buyStars: "Start checkout",
      buyPremium: "View packs",
      badges: {
        instant: "Instant delivery",
        secure: "Secure checkout",
        support: "24/7 support",
      },
    },
    split: {
      header: {
        title: "Interactive checkout",
        subtitle:
          "Pick Stars, enter a username, and pay securely — all in one block.",
      },
      buyCard: {
        title: "Buy Telegram Stars",
        instant: "Instant",
        subtitle: "Top up Stars balance for yourself or your friends.",
      },
      telegramCard: {
        title: "Telegram Bot & Channel",
        badge: "Official",
        desc: "Track orders, grab promo codes, generate referral links, and get support — right inside Telegram.",
        openBot: "Open Bot",
        joinChannel: "Join Channel",
        phoneBotTitle: "Stars Bot",
        phoneCommand: "/buy 5000 stars",
        phoneImageAlt: "Duck image",
      },
      referral: {
        title: "Referral program",
        badge: "Earn up to 40%",
        desc: "Get a commission from every transaction made by your referrals. Copy your link, share it in your channel, and earn automatically.",
        copyLink: "Copy referral link",
        copied: "Copied",
        learnMore: "How referrals work",
      },
    },
    packsSection: {
      title: "Choose your Stars pack",
      subtitle:
        "Instant delivery, transparent rates, and secure checkout — built for Telegram communities.",
      buyPack: "Buy pack",
      packs: [
        {
          stars: "10,000 Stars",
          tag: "Starter",
          price: PACK_PRICE_10000,
          bonus: "No hidden fees",
          description:
            "Perfect for recurring tips, giveaways, and team rewards. Delivered instantly after checkout.",
        },
        {
          stars: "15,000 Stars",
          tag: "Popular",
          price: PACK_PRICE_15000,
          bonus: "+5% bonus",
          description:
            "Great for active creators and frequent campaigns. A balanced pack for steady usage.",
        },
        {
          stars: "20,000 Stars",
          tag: "Best value",
          price: PACK_PRICE_20000,
          bonus: "+10% bonus",
          description:
            "Built for channels and communities with regular volume. Better value at scale.",
        },
        {
          stars: "25,000 Stars",
          tag: "Creator",
          price: PACK_PRICE_25000,
          bonus: "Priority support",
          description:
            "For power users and businesses. Optimized for bulk purchases and frequent sending.",
        },
      ],
    },
    howItWorksSection: {
      title1: "How it works",
      title2: "in 30 seconds",
      body: "Enter your Telegram username, choose a Stars pack, pay securely, and get Stars delivered instantly — with receipts and support if you need it.",
      steps: [
        {
          title: "Enter Telegram",
          sub: "Paste your @username or t.me link",
        },
        {
          title: "Choose a pack",
          sub: "Pick 10,000–25,000 Stars (bonus available)",
        },
        {
          title: "Pay securely",
          sub: "Card payments and more — protected checkout",
        },
        {
          title: "Receive Stars",
          sub: "Instant delivery + receipt for your records",
        },
      ],
      preview: {
        topTitle: "Telegram",
        topTag: "Stars",
        delivered: "Delivered",
        incomingTitle: "You will receive 10,000 Stars",
        incomingSub: "Delivering to @yourusername",
        orderConfirmed: "Order #1072 confirmed",
        paymentReceived: "Secure payment received",
        checkoutSummary: "Checkout summary",
        packLabel: "Pack",
        packValue: "10,000 Stars",
        totalLabel: "Total",
      },
    },
    comparisonSection: {
      title: "Why you should buy Stars here",
      subtitle:
        "A Telegram-first experience: transparent rates, instant delivery, and support you can reach.",
      randomSellers: "Random sellers",
      ourStore: "Quack Stars",
      recommended: "RECOMMENDED",
      traditionalPoints: [
        "Hidden fees & unclear rates",
        "Delays or partial delivery",
        "Payment risk & chargebacks",
        "No receipts for accounting",
        "Support disappears after payment",
      ],
      ourPoints: [
        "Instant delivery",
        "Transparent rates",
        "Secure checkout",
        "Receipts & invoices",
        "24/7 human support",
      ],
    },
    ctaSection: {
      title1: "Stop waiting.",
      title2: "Start sending Stars.",
      subtitle:
        "Power up your Telegram community with Stars for tips, giveaways, and premium content — delivered instantly after checkout.",
      buyStars: "Start checkout",
      readFaq: "View FAQ",
    },
  },
  rates: {
    hero: {
      kicker: "Simple pricing",
      title: "Rates & packs",
      subtitle:
        "Choose a pack for quick top-ups — or request bulk Stars for campaigns, creators, and giveaways.",
    },
    notice: {
      ariaNotice: "Notice",
      text: "Estimated USD pricing is shown for transparency. Final total is confirmed in checkout before payment.",
    },
    featuredPacks: {
      title: "Featured packs",
      subtitle: "Transparent pricing • Bonus tiers for bulk orders",
      instantDelivery: "Transparent pricing",
      selectPack: "Choose pack",
      detailsSuffix: "details",
      barLabels: {
        tips: "Tips",
        events: "Events",
        value: "Value",
        savings: "Savings",
      },
      topRow: [
        {
          title: "10,000 Stars",
          pill: "Popular",
          price: PACK_PRICE_10000,
          priceNote: "approx.",
          priceMeta: "includes bonus",
          features: [
            "Great for giveaways",
            "Best value tier",
            "Simple checkout flow",
          ],
        },
        {
          title: "15,000 Stars",
          pill: "Quick",
          price: PACK_PRICE_15000,
          priceNote: "approx.",
          priceMeta: "includes bonus",
          features: [
            "Best for tips & small rewards",
            "Balanced monthly top-ups",
            "Send to any @username",
          ],
        },
      ],
      bottomRow: [
        {
          title: "20,000 Stars",
          pill: "Events",
          price: PACK_PRICE_20000,
          priceNote: "approx.",
          priceMeta: "includes bonus",
          features: [
            "Perfect for events",
            "Flexible payment options",
            "Priority support",
          ],
        },
        {
          title: "25,000 Stars",
          pill: "Bulk",
          price: PACK_PRICE_25000,
          priceNote: "approx.",
          priceMeta: "includes bonus",
          features: [
            "Campaign-ready pack",
            "Reporting-friendly receipts",
            "Bulk friendly",
          ],
        },
      ],
    },
    reportingPreview: {
      title: "Reporting preview",
      exportCsv: "Export CSV",
      subtitle:
        "Preview how delivery stats and receipts are tracked per order in one dashboard.",
      cards: {
        deliverySuccess: "Delivery success",
        live: "Live",
        last24h: "last 24h",
        paymentMix: "Payment mix",
        secure: "Secure",
        tonSharePlaceholder: "TON share",
        legend: "Legend",
        legendCard: "Card",
        legendOther: "Other",
        packPopularity: "Pack popularity",
        last7Days: "Last 7 days",
        packs: "Packs",
      },
    },
    supportRow: {
      supportAria: "Support",
      paymentMethods: {
        title: "Payment methods",
        note: "Secure and transparent",
        methods: [
          {
            title: "Card",
            description: "Pay with bank cards (3DS where supported).",
          },
          {
            title: "Crypto",
            description: "USDT and TON with clear network selection.",
          },
          {
            title: "Telegram",
            description: "Confirm payment inside Telegram in one flow.",
          },
        ],
      },
      faqPreview: {
        title: "Common questions",
        viewAll: "View all",
        ariaLabel: "FAQ preview",
        questions: [
          "Do Stars arrive instantly?",
          "Can I send Stars to a friend?",
          "What if I typed the wrong @username?",
        ],
      },
    },
    bottomCta: {
      title: "Ready to buy Stars?",
      text: "Open home checkout to choose amount, pay, and track status in one flow.",
      button: "Start checkout",
    },
  },
  howItWorksPage: {
    hero: {
      kicker: "From @username to Stars",
      title: "How it works",
      subtitle:
        "One flow: choose Stars, enter a Telegram username, pay, and receive confirmation — all inside Telegram.",
    },
    stepsCard: {
      title: "Checkout in 4 steps",
      subtitle: "Simple, Telegram-first flow",
      fast: "Fast",
      ariaSteps: "Checkout steps",
      steps: [
        "Enter a Telegram username (or paste a link).",
        "Select the amount of Stars and payment method.",
        "Pay securely and confirm the transfer in Telegram.",
        "Receive confirmation and a receipt in Telegram.",
      ],
    },
    statusTimeline: {
      title: "Order status timeline",
      typical: "Typical: under 1 min",
      subtitle:
        "A transparent, step-by-step flow — you always know what happens next.",
      ariaTimelineSteps: "Timeline steps",
      ariaHighlights: "Highlights",
      steps: [
        { title: "Created", description: "Checkout started" },
        { title: "Paid", description: "Payment confirmed" },
        { title: "Sent", description: "Stars delivered" },
        { title: "Completed", description: "Receipt available" },
      ],
      highlights: {
        telegramConfirmation: "Confirmation inside Telegram",
        receiptIncluded: "Receipt included",
      },
    },
    safetyCard: {
      title: "Built-in safety checks",
      desc: "Before payment, we validate @username and show a clear confirmation summary.",
      ariaChecks: "Safety checks",
      checks: [
        "Format validation",
        "Clear confirmation step",
        "Receipt & order reference",
      ],
    },
    bottomCta: {
      title: "Want the fastest checkout?",
      text: "Go to home checkout to choose amount, pay, and track status in one flow.",
      button: "Start checkout",
    },
  },
  faq: {
    hero: {
      title: "FAQ",
      subtitle:
        "Quick answers about Stars delivery, payment methods, and troubleshooting.",
    },
    filters: {
      searchAndCategories: "Search and categories",
      searchFaq: "Search FAQ",
      searchPlaceholder: "Search: delivery, payments, refunds…",
      searchSubmit: "Search",
      categoriesLabel: "FAQ categories",
      categories: {
        delivery: "Delivery",
        payments: "Payments",
        refunds: "Refunds",
        troubleshooting: "Troubleshooting",
      },
    },
    list: {
      title: "Frequently asked questions",
      noResultsPrefix: "No results for",
      noResultsSuffix: "Try a different search term.",
      items: [
        {
          id: "stars-delivery-speed",
          question: "How fast are Stars delivered?",
          answer:
            "Most orders are delivered within 10-60 seconds after payment confirmation. During peak load it can take up to 5 minutes.",
        },
        {
          id: "send-stars-to-others",
          question: "Can I send Stars to someone else?",
          answer:
            "Yes. Enter the recipient's @username in checkout before payment. We validate the username and send Stars directly to that account.",
        },
        {
          id: "wrong-username",
          question: "What if I entered the wrong username?",
          answer:
            "If payment is not completed yet, just correct the username and continue. If Stars were already delivered to a valid but wrong username, the transfer cannot be reversed. Contact support with your order ID.",
        },
        {
          id: "payment-methods",
          question: "Which payment methods are supported?",
          answer:
            "Supported methods include bank cards and selected crypto options (such as TON and USDT on available networks). The exact list is shown in checkout based on availability.",
        },
        {
          id: "track-order",
          question: "How do I track my order?",
          answer:
            "After checkout, you receive a request/order ID in the status block. Share this ID with support to get current order status and delivery details.",
        },
        {
          id: "refunds",
          question: "Do you offer refunds?",
          answer:
            "Refunds are possible only when an order fails and Stars were not delivered. Successful deliveries are usually non-refundable due to instant transfer.",
        },
        {
          id: "bulk-stars",
          question: "Can I buy Stars in bulk for a channel?",
          answer:
            "Yes. For regular or large-volume purchases, contact support with your target volume and frequency. We can prepare a custom offer and priority processing.",
        },
        {
          id: "stars-not-arrived",
          question: "Payment succeeded but Stars didn’t arrive — what now?",
          answer:
            "First check the order status in checkout. If it stays pending for more than 5 minutes, contact support and provide your order ID, payment receipt, and approximate payment time.",
        },
      ],
    },
    supportCta: {
      title: "Still need help?",
      text: "Message support and include your order ID for faster help.",
      button: "Open support",
    },
  },
  support: {
    hero: {
      kicker: "Support center",
      title: "Support",
      subtitle:
        "Need help with a Stars top-up? Send us a message — we’ll respond as quickly as possible.",
    },
    channels: {
      title: "Support channels",
      desc: "Telegram is fastest. Include your order ID to get help quicker.",
      telegram: "Telegram chat (recommended)",
      email: "Email support",
      faqFirst: "Check the FAQ first",
    },
    contactCard: {
      title: "Contact us",
      statusSubmitted: "Request received. We’ll reply shortly.",
      statusInvalid: "Enter a valid email and a message (10+ characters).",
      statusSubmitting: "Sending request...",
      statusUnavailable:
        "Support form is temporarily unavailable. Use Telegram or email below.",
      statusDeliveryFailed:
        "Couldn’t send request right now. Please try again or use Telegram.",
      labels: {
        email: "Email address",
        issue: "Describe your issue",
      },
      placeholders: {
        email: "Email address",
        issue: "Describe what happened and include order ID",
      },
      sendMessage: "Send request",
      sendMessagePending: "Sending...",
    },
    quickLinks: {
      title: "Quick links",
      paymentsReceipts: "Payments and receipts",
      reportProblem: "Report delivery issue",
      deliveryConfirmation: "Delivery times and confirmation",
    },
    telegramCta: {
      title: "Prefer Telegram support?",
      text: "Open Telegram and include your order ID to speed things up.",
      button: "Open Telegram chat",
    },
  },
  notFound: {
    navLabel: "404 navigation",
    backToHome: "Back to Home",
    buyStars: "Start checkout",
    title: "Oops, page not found",
    description:
      "The page you’re looking for doesn’t exist or was moved. Check the URL or go back home.",
    contactSupport: "Contact support",
    ctaTitle: "Buy Telegram Stars in seconds",
    ctaText:
      "Instant delivery to any @username. Secure checkout and transparent rates.",
  },
};

export type Messages = typeof en;

const ru: Messages = {
  common: {
    brandName: "Quack Stars",
    languageShort: {
      ru: "RU",
      en: "EN",
    },
    requestIdPrefix: "запрос",
  },
  metadata: {
    site: {
      title: "Quack Stars",
      description:
        "Покупайте звёзды Telegram с безопасной оплатой, быстрой доставкой и прозрачными тарифами.",
    },
    pages: {
      home: {
        title: "Купить звёзды Telegram за секунды",
        description:
          "Выберите пакет, безопасно оплатите заказ и получите звёзды Telegram мгновенно. Подходит для розыгрышей, бонусов и других активностей в Telegram.",
      },
      packs: {
        title: "Тарифы и пакеты",
        description:
          "Сравните пакеты звёзд Telegram, посмотрите пример отчётности и выберите удобный способ оплаты.",
      },
      howItWorks: {
        title: "Как это работает",
        description:
          "Узнайте, как проходит покупка звёзд Telegram: введите @username, выберите пакет, оплатите и получите подтверждение в Telegram.",
      },
      faq: {
        title: "FAQ",
        description:
          "Короткие ответы о доставке звёзд, способах оплаты и типовых проблемах.",
      },
      support: {
        title: "Поддержка",
        description:
          "Нужна помощь с покупкой звёзд Telegram? Напишите нам — ответим как можно быстрее.",
      },
      notFound: {
        title: "404 — Страница не найдена",
        description:
          "Страница, которую вы ищете, не существует или была перемещена. Проверьте адрес страницы или вернитесь на главную.",
      },
    },
  },
  header: {
    menu: {
      rates: "Тарифы",
      howItWorks: "Как это работает",
      faq: "FAQ",
      support: "Поддержка",
    },
    menuAria: "Основная навигация",
    openMenu: "Открыть меню навигации",
    closeMenu: "Закрыть меню навигации",
    buyStars: "Перейти к оплате",
  },
  footer: {
    brandDesc:
      "Быстрое пополнение звёзд Telegram для авторов, сообществ и розыгрышей. Отправляйте звёзды на любой @username за секунды.",
    trust: {
      label: "Знаки доверия",
      instant: "Мгновенная доставка",
      support: "Помощь, когда она нужна",
    },
    columns: {
      footerLabel: "Подвал",
      product: "Продукт",
      telegram: "Telegram",
      legal: "Документы",
    },
    links: {
      buyStars: "Купить звёзды",
      ratesPacks: "Тарифы и пакеты",
      referralProgram: "Реферальная программа",
      openBot: "Открыть бота",
      joinChannel: "Перейти в канал",
      support: "Поддержка",
      terms: "Условия",
      privacy: "Конфиденциальность",
      refunds: "Возвраты",
    },
    copyright: "© 2026 Quack Stars. Все права защищены.",
    social: {
      label: "Социальные ссылки",
      telegram: "Telegram",
      support: "Поддержка",
      email: "Электронная почта",
    },
  },
  checkoutForm: {
    labels: {
      purchaseKind: "Тип покупки",
      telegramUsername: "Имя пользователя в Telegram",
      paymentCurrency: "Способ оплаты",
      amount: "Количество",
      chooseAmount: "Выберите количество",
      premiumDuration: "Срок Premium-подписки",
      months: "мес.",
      status: "Статус",
      closeDialog: "Закрыть окно",
    },
    placeholders: {
      telegramUsername: "Введите имя пользователя в Telegram",
    },
    purchaseKinds: {
      stars: "Звёзды",
      premium: "Telegram Premium",
    },
    paymentMethods: {
      fiat: "СБП, КАРТА",
      tonWallet: "TON Wallet",
      cryptoBot: "CryptoBot",
      usdtTon: "USDT (TON)",
      ton: "TON",
      tonDev: "TON DEV (мгновенно)",
      usdtTrc20: "USDT (TRC20)",
    },
    button: {
      buy: "Купить звёзды",
      buyPremium: "Купить Telegram Premium",
      openInvoice: "Открыть инвойс",
      processing: "Обработка...",
    },
    helper: {
      waitingUsernameCheck: "Введите корректный @username, чтобы продолжить.",
    },
    messages: {
      invalidUsernameBeforePurchase:
        "Введите корректный @username перед оплатой.",
      waitForUsernameCheck:
        "Дождитесь завершения проверки @username перед оплатой.",
      checkingUsername: "Проверяем @username...",
      invalidAmount: "Выберите количество от 50 до 25 000 звёзд.",
      invalidPremiumDuration:
        "Выберите срок подарка Premium: 3, 6 или 12 месяцев.",
      checkingBalance: "Проверяем доступный баланс...",
      creatingInvoice: "Создаём счёт на оплату...",
      cryptoBotInvoiceCreateFailed:
        "CryptoBot не смог создать счёт на оплату. Попробуйте ещё раз.",
      creatingTonOrder: "Подготавливаем оплату через TON Wallet...",
      tonWalletConnect: "Подключите TON Wallet, чтобы продолжить оплату.",
      tonWalletPaymentFailed:
        "TON Wallet не завершил запрос на оплату. Откройте кошелёк и попробуйте снова.",
      tonWalletRejected: "Оплата была отменена в TON Wallet.",
      tonWalletInsufficientFunds:
        "На кошельке недостаточно средств для этой оплаты. Пополните кошелёк и попробуйте снова.",
      tonWalletOpenAndConfirm:
        "Транзакция подготовлена. Подтвердите оплату в TON Wallet.",
      tonWalletTransactionSubmitted:
        "Транзакция отправлена. Ждём подтверждение в блокчейне...",
      tonWalletSwitchToMainnet:
        "Переключите TON Wallet на mainnet и попробуйте снова.",
      tonWalletSwitchToTestnet:
        "Переключите TON Wallet на testnet и попробуйте снова.",
      tonWalletStatusCheckFailed:
        "Не удалось проверить статус оплаты в TON Wallet. Если транзакция уже отправлена, подождите немного и обновите страницу.",
      invoiceCreatedOpenPayment:
        "Инвойс создан. Завершите оплату в окне CryptoBot.",
      invoiceCreatedNoLink:
        "Инвойс создан. Откройте CryptoBot и завершите оплату.",
      awaitingPaymentConfirmation: "Ожидаем подтверждение оплаты...",
      paymentReceivedProcessingDelivery:
        "Оплата получена. Ожидаем доставку звёзд в Telegram...",
      paymentFailedStatusPrefix: "Статус оплаты",
      paymentTimeout:
        "Проверка оплаты превысила лимит ожидания. Если вы уже оплатили, подождите и обновите страницу.",
      invoiceStatusCheckFailed:
        "Не удалось проверить статус оплаты. Если вы уже оплатили, подождите немного и обновите страницу.",
      invalidInvoiceResponse: "Некорректный ответ от платежного провайдера.",
      submitting: "Создаём заказ...",
      submittingPremium: "Создаём подарок Telegram Premium...",
      confirmed: "Заказ подтверждён. Звёзды уже отправляются.",
      confirmedPremium: "Заказ подтверждён. Telegram Premium уже отправляется.",
      insufficientBalance:
        "Сейчас невозможно создать заказ из-за недостаточного баланса сервиса. Попробуйте позже.",
      balanceCheckUnavailable:
        "Сейчас не удалось проверить доступный баланс. Попробуйте ещё раз.",
      paymentProviderUnavailable:
        "Платёжный сервис сейчас недоступен. Попробуйте ещё раз.",
      requestFailed: "Не удалось создать заказ. Попробуйте ещё раз.",
      invalidUsernameFormat:
        "Используйте от 5 до 32 символов: буквы, цифры и подчёркивание.",
      usernameNotFound: "Пользователь с таким именем не найден.",
      usernameIsBot: "Ботам нельзя отправлять звёзды. Укажите личный аккаунт.",
      usernameNotUser: "Звёзды можно отправлять только личным аккаунтам.",
      usernameAlreadyPremium:
        "У этого пользователя уже есть Telegram Premium. Укажите другого получателя.",
      premiumCheckUnavailable:
        "Не удалось проверить статус Telegram Premium. Попробуйте ещё раз.",
      requestFailedGeneric:
        "Не удалось проверить @username. Попробуйте ещё раз.",
      errorStatusPrefix: "Статус заказа",
    },
    text: {
      amountUsdPlaceholder: "(— $)",
    },
  },
  home: {
    hero: {
      titleStart: "Купить звёзды Telegram",
      titleAccent: "за секунды.",
      subtitle:
        "Выберите пакет, безопасно оплатите заказ и получите звёзды Telegram мгновенно. Подходит для розыгрышей, бонусов и других активностей в Telegram.",
      buyStars: "Перейти к оплате",
      buyPremium: "Смотреть пакеты",
      badges: {
        instant: "Мгновенная доставка",
        secure: "Безопасная оплата",
        support: "Поддержка 24/7",
      },
    },
    split: {
      header: {
        title: "Интерактивное оформление заказа",
        subtitle:
          "Выберите количество звёзд, введите имя пользователя и оплатите заказ — всё в одной форме.",
      },
      buyCard: {
        title: "Купить звёзды Telegram",
        instant: "Мгновенно",
        subtitle: "Пополните баланс звёзд себе или друзьям.",
      },
      telegramCard: {
        title: "Бот и канал в Telegram",
        badge: "Официально",
        desc: "Отслеживайте заказы, забирайте промокоды, создавайте реферальные ссылки и получайте поддержку — прямо в Telegram.",
        openBot: "Открыть бота",
        joinChannel: "Перейти в канал",
        phoneBotTitle: "Stars Bot",
        phoneCommand: "/buy 5000 stars",
        phoneImageAlt: "Изображение утки",
      },
      referral: {
        title: "Реферальная программа",
        badge: "До 40% дохода",
        desc: "Получайте комиссию с каждой транзакции ваших рефералов. Скопируйте ссылку, поделитесь в канале и зарабатывайте автоматически.",
        copyLink: "Скопировать реферальную ссылку",
        copied: "Скопировано",
        learnMore: "Как это работает",
      },
    },
    packsSection: {
      title: "Выберите пакет звёзд",
      subtitle:
        "Мгновенная доставка, прозрачные тарифы и безопасная оплата — для Telegram-сообществ.",
      buyPack: "Купить пакет",
      packs: [
        {
          stars: "10 000 звёзд",
          tag: "Старт",
          price: PACK_PRICE_10000,
          bonus: "Без скрытых комиссий",
          description:
            "Подходит для регулярной поддержки авторов, розыгрышей и наград команде. Доставка — сразу после оплаты.",
        },
        {
          stars: "15 000 звёзд",
          tag: "Популярный",
          price: PACK_PRICE_15000,
          bonus: "+5% бонус",
          description:
            "Отличный выбор для активных авторов и частых кампаний. Сбалансированный пакет для постоянного использования.",
        },
        {
          stars: "20 000 звёзд",
          tag: "Лучшая цена",
          price: PACK_PRICE_20000,
          bonus: "+10% бонус",
          description:
            "Хороший вариант для каналов и сообществ с регулярной активностью. Чем больше объём, тем выгоднее цена.",
        },
        {
          stars: "25 000 звёзд",
          tag: "Для авторов",
          price: PACK_PRICE_25000,
          bonus: "Приоритетная поддержка",
          description:
            "Для активных авторов и команд. Оптимален для крупных и регулярных покупок.",
        },
      ],
    },
    howItWorksSection: {
      title1: "Как это работает",
      title2: "за 30 секунд",
      body: "Введите имя пользователя в Telegram, выберите пакет, оплатите заказ и получите звёзды почти мгновенно — с чеком и поддержкой при необходимости.",
      steps: [
        {
          title: "Укажите получателя",
          sub: "Вставьте @username или ссылку t.me",
        },
        {
          title: "Выберите пакет",
          sub: "Выберите пакет от 10 000 до 25 000 звёзд (доступны бонусы)",
        },
        {
          title: "Оплатите безопасно",
          sub: "Карта и другие способы — безопасная оплата",
        },
        {
          title: "Получите звёзды",
          sub: "Быстрая доставка и чек для отчётности",
        },
      ],
      preview: {
        topTitle: "Telegram",
        topTag: "Звёзды",
        delivered: "Доставлено",
        incomingTitle: "Вы получите 10 000 звёзд",
        incomingSub: "Доставка на @username",
        orderConfirmed: "Заказ #1072 подтвержден",
        paymentReceived: "Безопасная оплата получена",
        checkoutSummary: "Итог заказа",
        packLabel: "Пакет",
        packValue: "10 000 звёзд",
        totalLabel: "Итого",
      },
    },
    comparisonSection: {
      title: "Почему нужно покупать звёзды у нас",
      subtitle:
        "Опыт, ориентированный на Telegram: прозрачные тарифы, мгновенная доставка и доступная поддержка.",
      randomSellers: "Случайные продавцы",
      ourStore: "Quack Stars",
      recommended: "РЕКОМЕНДУЕМ",
      traditionalPoints: [
        "Скрытые комиссии и непонятные тарифы",
        "Задержки или частичная доставка",
        "Риск оплаты и чарджбэков",
        "Нет чеков для бухгалтерии",
        "Поддержка исчезает после оплаты",
      ],
      ourPoints: [
        "Мгновенная доставка",
        "Прозрачные тарифы",
        "Безопасная оплата",
        "Чеки и инвойсы",
        "Живая поддержка 24/7",
      ],
    },
    ctaSection: {
      title1: "Хватит ждать.",
      title2: "Начните отправлять звёзды.",
      subtitle:
        "Развивайте Telegram-сообщество с помощью звёзд для поддержки авторов, розыгрышей и платного контента — с быстрой доставкой после оплаты.",
      buyStars: "Перейти к оплате",
      readFaq: "Смотреть FAQ",
    },
  },
  rates: {
    hero: {
      kicker: "Простые цены",
      title: "Тарифы и пакеты",
      subtitle:
        "Выберите пакет для быстрого пополнения — или запросите крупный объём звёзд для кампаний, авторов и розыгрышей.",
    },
    notice: {
      ariaNotice: "Примечание",
      text: "Для прозрачности показана ориентировочная цена в USD. Финальная сумма подтверждается в форме оформления заказа перед оплатой.",
    },
    featuredPacks: {
      title: "Рекомендуемые пакеты",
      subtitle: "Прозрачные цены • Бонусы для крупных заказов",
      instantDelivery: "Прозрачные цены",
      selectPack: "Выбрать пакет",
      detailsSuffix: "детали",
      barLabels: {
        tips: "Поддержка",
        events: "Активности",
        value: "Выгода",
        savings: "Экономия",
      },
      topRow: [
        {
          title: "10 000 звёзд",
          pill: "Популярный",
          price: PACK_PRICE_10000,
          priceNote: "примерно",
          priceMeta: "включая бонус",
          features: [
            "Отлично для розыгрышей",
            "Лучший уровень цены",
            "Простой и понятный процесс оплаты",
          ],
        },
        {
          title: "15 000 звёзд",
          pill: "Быстро",
          price: PACK_PRICE_15000,
          priceNote: "примерно",
          priceMeta: "включая бонус",
          features: [
            "Лучше всего для поддержки авторов и небольших наград",
            "Сбалансировано для регулярных пополнений",
            "Отправка на любой @username",
          ],
        },
      ],
      bottomRow: [
        {
          title: "20 000 звёзд",
          pill: "События",
          price: PACK_PRICE_20000,
          priceNote: "примерно",
          priceMeta: "включая бонус",
          features: [
            "Идеально для событий",
            "Гибкие способы оплаты",
            "Приоритетная поддержка",
          ],
        },
        {
          title: "25 000 звёзд",
          pill: "Опт",
          price: PACK_PRICE_25000,
          priceNote: "примерно",
          priceMeta: "включая бонус",
          features: [
            "Пакет для кампаний",
            "Чеки удобны для отчётности",
            "Удобно для больших объёмов",
          ],
        },
      ],
    },
    reportingPreview: {
      title: "Предпросмотр отчётности",
      exportCsv: "Экспорт в CSV",
      subtitle:
        "Посмотрите, как в едином дашборде отображаются чеки, статусы заказов и статистика доставки.",
      cards: {
        deliverySuccess: "Успешная доставка",
        live: "Онлайн",
        last24h: "последние 24 ч",
        paymentMix: "Структура оплат",
        secure: "Безопасно",
        tonSharePlaceholder: "Доля TON",
        legend: "Легенда",
        legendCard: "Карта",
        legendOther: "Другое",
        packPopularity: "Популярность пакетов",
        last7Days: "Последние 7 дней",
        packs: "Пакеты",
      },
    },
    supportRow: {
      supportAria: "Поддержка",
      paymentMethods: {
        title: "Способы оплаты",
        note: "Безопасно и прозрачно",
        methods: [
          {
            title: "Карта",
            description:
              "Оплата банковскими картами (3DS, где поддерживается).",
          },
          {
            title: "Крипто",
            description: "USDT и TON с понятным выбором сети.",
          },
          {
            title: "Telegram",
            description:
              "Подтверждайте оплату внутри Telegram в одном сценарии.",
          },
        ],
      },
      faqPreview: {
        title: "Частые вопросы",
        viewAll: "Смотреть все",
        ariaLabel: "Превью FAQ",
        questions: [
          "Звёзды приходят мгновенно?",
          "Можно отправить звёзды другу?",
          "Что делать, если я ошибся в @username?",
        ],
      },
    },
    bottomCta: {
      title: "Готовы купить звёзды?",
      text: "Откройте форму заказа на главной: выберите количество, оплатите и отслеживайте статус в одном месте.",
      button: "Перейти к оплате",
    },
  },
  howItWorksPage: {
    hero: {
      kicker: "От @username до звёзд",
      title: "Как это работает",
      subtitle:
        "Один понятный сценарий: выберите звёзды, введите имя пользователя в Telegram, оплатите и получите подтверждение — всё внутри Telegram.",
    },
    stepsCard: {
      title: "Оформление заказа в 4 шага",
      subtitle: "Простой сценарий для Telegram",
      fast: "Быстро",
      ariaSteps: "Шаги оформления заказа",
      steps: [
        "Введите @username в Telegram (или вставьте ссылку).",
        "Выберите количество звёзд и способ оплаты.",
        "Оплатите заказ и подтвердите платёж в Telegram.",
        "Получите подтверждение и чек в Telegram.",
      ],
    },
    statusTimeline: {
      title: "Таймлайн статуса заказа",
      typical: "Обычно: меньше 1 минуты",
      subtitle:
        "Понятный пошаговый процесс — вы всегда понимаете, что происходит дальше.",
      ariaTimelineSteps: "Шаги таймлайна",
      ariaHighlights: "Ключевые преимущества",
      steps: [
        { title: "Создан", description: "Оформление начато" },
        { title: "Оплачен", description: "Оплата подтверждена" },
        { title: "Отправлен", description: "Звёзды доставлены" },
        { title: "Завершён", description: "Чек доступен" },
      ],
      highlights: {
        telegramConfirmation: "Подтверждение внутри Telegram",
        receiptIncluded: "Чек включен",
      },
    },
    safetyCard: {
      title: "Встроенные проверки безопасности",
      desc: "Перед оплатой мы проверяем @username и показываем понятное подтверждение заказа.",
      ariaChecks: "Проверки безопасности",
      checks: [
        "Проверка формата",
        "Понятный шаг подтверждения",
        "Чек и номер заказа",
      ],
    },
    bottomCta: {
      title: "Хотите оформить заказ быстрее?",
      text: "Откройте форму заказа на главной: выберите количество, оплатите и отслеживайте статус в одном месте.",
      button: "Перейти к оплате",
    },
  },
  faq: {
    hero: {
      title: "FAQ",
      subtitle:
        "Короткие ответы о доставке звёзд, способах оплаты и решении проблем.",
    },
    filters: {
      searchAndCategories: "Поиск и категории",
      searchFaq: "Поиск по FAQ",
      searchPlaceholder: "Поиск: доставка, оплата, возврат…",
      searchSubmit: "Найти",
      categoriesLabel: "Категории FAQ",
      categories: {
        delivery: "Доставка",
        payments: "Оплата",
        refunds: "Возвраты",
        troubleshooting: "Проблемы",
      },
    },
    list: {
      title: "Часто задаваемые вопросы",
      noResultsPrefix: "Ничего не найдено по запросу",
      noResultsSuffix: "Попробуйте другой поисковый запрос.",
      items: [
        {
          id: "stars-delivery-speed",
          question: "Как быстро приходят звёзды?",
          answer:
            "Большинство заказов доставляется в течение 10–60 секунд после подтверждения оплаты. В пиковую нагрузку это может занять до 5 минут.",
        },
        {
          id: "send-stars-to-others",
          question: "Можно отправить звёзды другому человеку?",
          answer:
            "Да. До оплаты укажите @username получателя в форме заказа. Мы проверяем имя пользователя и отправляем звёзды напрямую на этот аккаунт.",
        },
        {
          id: "wrong-username",
          question: "Что делать, если я указал неправильный @username?",
          answer:
            "Если оплата ещё не завершена, исправьте @username и продолжайте. Если звёзды уже доставлены на другой корректный аккаунт, отмена перевода невозможна. Напишите в поддержку и укажите ID заказа.",
        },
        {
          id: "payment-methods",
          question: "Какие способы оплаты поддерживаются?",
          answer:
            "Доступны банковские карты и выбранные криптовалюты (например TON и USDT в поддерживаемых сетях). Актуальный список доступен в форме заказа.",
        },
        {
          id: "track-order",
          question: "Как отследить заказ?",
          answer:
            "После оформления заказа вы получаете ID запроса/заказа в блоке статуса. Передайте этот ID в поддержку, чтобы получить текущий статус и детали доставки.",
        },
        {
          id: "refunds",
          question: "Есть ли возвраты?",
          answer:
            "Возврат возможен только если заказ завершился ошибкой и звёзды не были доставлены. Успешные доставки обычно не подлежат возврату из-за мгновенного перевода.",
        },
        {
          id: "bulk-stars",
          question: "Можно купить звёзды крупным объёмом для канала?",
          answer:
            "Да. Для регулярных или крупных объёмов напишите в поддержку и укажите желаемый объём и частоту покупок. Мы предложим индивидуальные условия и приоритетную обработку.",
        },
        {
          id: "stars-not-arrived",
          question: "Оплата прошла, но звёзды не пришли — что делать?",
          answer:
            "Сначала проверьте статус заказа в форме. Если статус «в ожидании» держится дольше 5 минут, напишите в поддержку и приложите ID заказа, чек и примерное время оплаты.",
        },
      ],
    },
    supportCta: {
      title: "Нужна помощь?",
      text: "Напишите в поддержку и укажите ID заказа — так мы решим вопрос быстрее.",
      button: "Открыть поддержку",
    },
  },
  support: {
    hero: {
      kicker: "Центр поддержки",
      title: "Поддержка",
      subtitle:
        "Нужна помощь с покупкой звёзд? Напишите нам — ответим как можно быстрее.",
    },
    channels: {
      title: "Каналы поддержки",
      desc: "Быстрее всего отвечаем в Telegram. Добавьте ID заказа, чтобы ускорить ответ.",
      telegram: "Чат в Telegram (рекомендуем)",
      email: "Поддержка по электронной почте",
      faqFirst: "Сначала проверьте FAQ",
    },
    contactCard: {
      title: "Связаться с нами",
      statusSubmitted: "Запрос получен. Ответим в ближайшее время.",
      statusInvalid:
        "Введите корректный адрес электронной почты и сообщение (от 10 символов).",
      statusSubmitting: "Отправляем запрос...",
      statusUnavailable:
        "Форма поддержки временно недоступна. Используйте Telegram или электронную почту ниже.",
      statusDeliveryFailed:
        "Не удалось отправить запрос. Попробуйте снова или напишите в Telegram.",
      labels: {
        email: "Электронная почта",
        issue: "Опишите проблему",
      },
      placeholders: {
        email: "Электронная почта",
        issue: "Опишите, что произошло, и добавьте ID заказа",
      },
      sendMessage: "Отправить запрос",
      sendMessagePending: "Отправка...",
    },
    quickLinks: {
      title: "Быстрые ссылки",
      paymentsReceipts: "Оплаты и чеки",
      reportProblem: "Сообщить о проблеме с доставкой",
      deliveryConfirmation: "Сроки доставки и подтверждение",
    },
    telegramCta: {
      title: "Предпочитаете поддержку в Telegram?",
      text: "Откройте Telegram и укажите ID заказа, чтобы ускорить решение.",
      button: "Открыть чат в Telegram",
    },
  },
  notFound: {
    navLabel: "Навигация 404",
    backToHome: "На главную",
    buyStars: "Перейти к оплате",
    title: "Упс, страница не найдена",
    description:
      "Страница, которую вы ищете, не существует или была перемещена. Проверьте адрес страницы или вернитесь на главную.",
    contactSupport: "Связаться с поддержкой",
    ctaTitle: "Купить звёзды Telegram за секунды",
    ctaText:
      "Быстрая доставка на любой @username. Безопасная оплата и прозрачные тарифы.",
  },
};

export const dictionaries: Record<Locale, Messages> = {
  en,
  ru,
};
