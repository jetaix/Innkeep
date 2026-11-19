import {
  CalendarDays,
  ClipboardList,
  Home,
  type LucideIcon,
  MessageSquare,
  RefreshCw,
  Lightbulb,
  Building2,
  Settings,
  Sparkles,
  Star,
  Tags,
  Wallet,
} from "lucide-react";

export type NavItem = {
  href: string;
  /** Key of the label in `messages/common.ts` (`nav.<id>`). */
  id:
    | "overview"
    | "calendar"
    | "reservations"
    | "inbox"
    | "reviews"
    | "revenue"
    | "pricing"
    | "suggestions"
    | "assistant"
    | "properties"
    | "data"
    | "settings";
  icon: LucideIcon;
  /** Second key of the "g then …" shortcut. */
  key: string;
};

export const NAV: NavItem[] = [
  { href: "/overview", id: "overview", icon: Home, key: "o" },
  { href: "/calendar", id: "calendar", icon: CalendarDays, key: "c" },
  { href: "/reservations", id: "reservations", icon: ClipboardList, key: "r" },
  { href: "/inbox", id: "inbox", icon: MessageSquare, key: "i" },
  { href: "/reviews", id: "reviews", icon: Star, key: "w" },
  { href: "/revenue", id: "revenue", icon: Wallet, key: "v" },
  { href: "/pricing", id: "pricing", icon: Tags, key: "t" },
  { href: "/suggestions", id: "suggestions", icon: Lightbulb, key: "s" },
  { href: "/assistant", id: "assistant", icon: Sparkles, key: "a" },
  { href: "/properties", id: "properties", icon: Building2, key: "p" },
  { href: "/data", id: "data", icon: RefreshCw, key: "d" },
  { href: "/settings", id: "settings", icon: Settings, key: "," },
];
