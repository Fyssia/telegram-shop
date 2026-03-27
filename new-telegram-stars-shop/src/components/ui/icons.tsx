import type { Icon, IconProps } from "@phosphor-icons/react/lib";
import { ArrowCounterClockwiseIcon as PhArrowCounterClockwiseIcon } from "@phosphor-icons/react/dist/ssr/ArrowCounterClockwise";
import { ArrowRightIcon as PhArrowRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { ArrowsClockwiseIcon as PhArrowsClockwiseIcon } from "@phosphor-icons/react/dist/ssr/ArrowsClockwise";
import { AtIcon as PhAtIcon } from "@phosphor-icons/react/dist/ssr/At";
import { BugIcon as PhBugIcon } from "@phosphor-icons/react/dist/ssr/Bug";
import { CalendarBlankIcon as PhCalendarBlankIcon } from "@phosphor-icons/react/dist/ssr/CalendarBlank";
import { ChartBarIcon as PhChartBarIcon } from "@phosphor-icons/react/dist/ssr/ChartBar";
import { ChartPieSliceIcon as PhChartPieSliceIcon } from "@phosphor-icons/react/dist/ssr/ChartPieSlice";
import { ChatCenteredTextIcon as PhChatCenteredTextIcon } from "@phosphor-icons/react/dist/ssr/ChatCenteredText";
import { CheckCircleIcon as PhCheckCircleIcon } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { CheckIcon as PhCheckIcon } from "@phosphor-icons/react/dist/ssr/Check";
import { ClockIcon as PhClockIcon } from "@phosphor-icons/react/dist/ssr/Clock";
import { CoinsIcon as PhCoinsIcon } from "@phosphor-icons/react/dist/ssr/Coins";
import { CreditCardIcon as PhCreditCardIcon } from "@phosphor-icons/react/dist/ssr/CreditCard";
import { CrownSimpleIcon as PhCrownSimpleIcon } from "@phosphor-icons/react/dist/ssr/CrownSimple";
import { CurrencyDollarSimpleIcon as PhCurrencyDollarSimpleIcon } from "@phosphor-icons/react/dist/ssr/CurrencyDollarSimple";
import { DotsThreeVerticalIcon as PhDotsThreeVerticalIcon } from "@phosphor-icons/react/dist/ssr/DotsThreeVertical";
import { DownloadSimpleIcon as PhDownloadSimpleIcon } from "@phosphor-icons/react/dist/ssr/DownloadSimple";
import { EnvelopeSimpleIcon as PhEnvelopeSimpleIcon } from "@phosphor-icons/react/dist/ssr/EnvelopeSimple";
import { FileTextIcon as PhFileTextIcon } from "@phosphor-icons/react/dist/ssr/FileText";
import { HeadsetIcon as PhHeadsetIcon } from "@phosphor-icons/react/dist/ssr/Headset";
import { HouseLineIcon as PhHouseLineIcon } from "@phosphor-icons/react/dist/ssr/HouseLine";
import { LayoutIcon as PhLayoutIcon } from "@phosphor-icons/react/dist/ssr/Layout";
import { LifebuoyIcon as PhLifebuoyIcon } from "@phosphor-icons/react/dist/ssr/Lifebuoy";
import { LightningIcon as PhLightningIcon } from "@phosphor-icons/react/dist/ssr/Lightning";
import { LinkSimpleIcon as PhLinkSimpleIcon } from "@phosphor-icons/react/dist/ssr/LinkSimple";
import { LockSimpleIcon as PhLockSimpleIcon } from "@phosphor-icons/react/dist/ssr/LockSimple";
import { MagicWandIcon as PhMagicWandIcon } from "@phosphor-icons/react/dist/ssr/MagicWand";
import { MagnifyingGlassIcon as PhMagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { PaperPlaneTiltIcon as PhPaperPlaneTiltIcon } from "@phosphor-icons/react/dist/ssr/PaperPlaneTilt";
import { PathIcon as PhPathIcon } from "@phosphor-icons/react/dist/ssr/Path";
import { PencilSimpleLineIcon as PhPencilSimpleLineIcon } from "@phosphor-icons/react/dist/ssr/PencilSimpleLine";
import { PlusIcon as PhPlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { QuestionIcon as PhQuestionIcon } from "@phosphor-icons/react/dist/ssr/Question";
import { ReceiptIcon as PhReceiptIcon } from "@phosphor-icons/react/dist/ssr/Receipt";
import { RobotIcon as PhRobotIcon } from "@phosphor-icons/react/dist/ssr/Robot";
import { RocketLaunchIcon as PhRocketLaunchIcon } from "@phosphor-icons/react/dist/ssr/RocketLaunch";
import { SealCheckIcon as PhSealCheckIcon } from "@phosphor-icons/react/dist/ssr/SealCheck";
import { SealPercentIcon as PhSealPercentIcon } from "@phosphor-icons/react/dist/ssr/SealPercent";
import { ShieldCheckIcon as PhShieldCheckIcon } from "@phosphor-icons/react/dist/ssr/ShieldCheck";
import { ShoppingCartSimpleIcon as PhShoppingCartSimpleIcon } from "@phosphor-icons/react/dist/ssr/ShoppingCartSimple";
import { SlidersHorizontalIcon as PhSlidersHorizontalIcon } from "@phosphor-icons/react/dist/ssr/SlidersHorizontal";
import { SparkleIcon as PhSparkleIcon } from "@phosphor-icons/react/dist/ssr/Sparkle";
import { StarIcon as PhStarIcon } from "@phosphor-icons/react/dist/ssr/Star";
import { TelegramLogoIcon as PhTelegramLogoIcon } from "@phosphor-icons/react/dist/ssr/TelegramLogo";
import { TrendUpIcon as PhTrendUpIcon } from "@phosphor-icons/react/dist/ssr/TrendUp";
import { UsersThreeIcon as PhUsersThreeIcon } from "@phosphor-icons/react/dist/ssr/UsersThree";
import { WalletIcon as PhWalletIcon } from "@phosphor-icons/react/dist/ssr/Wallet";

export type AppIconProps = IconProps;

function createIcon(IconComponent: Icon) {
  return function AppIcon({
    "aria-hidden": ariaHidden = true,
    focusable = false,
    size = 24,
    weight = "regular",
    ...props
  }: IconProps) {
    return (
      <IconComponent
        aria-hidden={ariaHidden}
        focusable={focusable}
        size={size}
        weight={weight}
        {...props}
      />
    );
  };
}

export const ActivityIcon = createIcon(PhTrendUpIcon);
export const ArrowCounterClockwiseIcon = createIcon(
  PhArrowCounterClockwiseIcon,
);
export const ArrowRightIcon = createIcon(PhArrowRightIcon);
export const AtSignIcon = createIcon(PhAtIcon);
export const BadgePercentIcon = createIcon(PhSealPercentIcon);
export const BarChartIcon = createIcon(PhChartBarIcon);
export const BugIcon = createIcon(PhBugIcon);
export const CalendarBlankIcon = createIcon(PhCalendarBlankIcon);
export const CalendarIcon = CalendarBlankIcon;
export const CheckBadgeIcon = createIcon(PhSealCheckIcon);
export const CheckCircleIcon = createIcon(PhCheckCircleIcon);
export const CheckIcon = createIcon(PhCheckIcon);
export const ClockIcon = createIcon(PhClockIcon);
export const CoinsIcon = createIcon(PhCoinsIcon);
export const CreditCardIcon = createIcon(PhCreditCardIcon);
export const CrownIcon = createIcon(PhCrownSimpleIcon);
export const CurrencyDollarSimpleIcon = createIcon(PhCurrencyDollarSimpleIcon);
export const DotsMenuIcon = createIcon(PhDotsThreeVerticalIcon);
export const DownloadIcon = createIcon(PhDownloadSimpleIcon);
export const FileTextIcon = createIcon(PhFileTextIcon);
export const HeadsetIcon = createIcon(PhHeadsetIcon);
export const HelpCircleIcon = createIcon(PhQuestionIcon);
export const HomeIcon = createIcon(PhHouseLineIcon);
export const LayoutDashboardIcon = createIcon(PhLayoutIcon);
export const LifeBuoyIcon = createIcon(PhLifebuoyIcon);
export const LinkIcon = createIcon(PhLinkSimpleIcon);
export const LockIcon = createIcon(PhLockSimpleIcon);
export const MailIcon = createIcon(PhEnvelopeSimpleIcon);
export const MessageCircleIcon = createIcon(PhChatCenteredTextIcon);
export const PencilIcon = createIcon(PhPencilSimpleLineIcon);
export const PieChartIcon = createIcon(PhChartPieSliceIcon);
export const PlusIcon = createIcon(PhPlusIcon);
export const ReceiptIcon = createIcon(PhReceiptIcon);
export const RefreshCwIcon = createIcon(PhArrowsClockwiseIcon);
export const RobotIcon = createIcon(PhRobotIcon);
export const RocketIcon = createIcon(PhRocketLaunchIcon);
export const RouteIcon = createIcon(PhPathIcon);
export const SearchIcon = createIcon(PhMagnifyingGlassIcon);
export const SendIcon = createIcon(PhPaperPlaneTiltIcon);
export const ShieldCheckIcon = createIcon(PhShieldCheckIcon);
export const ShieldIcon = ShieldCheckIcon;
export const ShoppingCartIcon = createIcon(PhShoppingCartSimpleIcon);
export const SlidersIcon = createIcon(PhSlidersHorizontalIcon);
export const SparklesIcon = createIcon(PhSparkleIcon);
export const StarIcon = createIcon(PhStarIcon);
export const TelegramIcon = createIcon(PhTelegramLogoIcon);
export const TrendUpIcon = createIcon(PhTrendUpIcon);
export const UsersIcon = createIcon(PhUsersThreeIcon);
export const WalletIcon = createIcon(PhWalletIcon);
export const WandIcon = createIcon(PhMagicWandIcon);
export const ZapIcon = createIcon(PhLightningIcon);
