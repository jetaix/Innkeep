import {
  CalendarDays,
  ClipboardList,
  Home,
  type LucideIcon,
  Lightbulb,
  Building2,
  Settings,
  SprayCan,
  Star,
  Tags,
  Wallet,
} from "lucide-react";

/** Key of the label in `messages/common.ts` (`nav.<id>`). */
export type NavId =
  | "overview"
  | "calendar"
  | "reservations"
  | "cleaning"
  | "reviews"
  | "revenue"
  | "pricing"
  | "suggestions"
  | "properties"
  | "settings";

export type NavItem = {
  /** Every page of the menu lives at the address of its own name. */
  href: `/${NavId}`;
  id: NavId;
  icon: LucideIcon;
  /** Second key of the "g then …" shortcut. */
  key: string;
};

export const NAV: NavItem[] = [
  { href: "/overview", id: "overview", icon: Home, key: "o" },
  { href: "/calendar", id: "calendar", icon: CalendarDays, key: "c" },
  { href: "/reservations", id: "reservations", icon: ClipboardList, key: "r" },
  { href: "/properties", id: "properties", icon: Building2, key: "p" },
  { href: "/cleaning", id: "cleaning", icon: SprayCan, key: "m" },
  { href: "/reviews", id: "reviews", icon: Star, key: "w" },
  { href: "/revenue", id: "revenue", icon: Wallet, key: "v" },
  { href: "/pricing", id: "pricing", icon: Tags, key: "t" },
  { href: "/suggestions", id: "suggestions", icon: Lightbulb, key: "s" },
  { href: "/settings", id: "settings", icon: Settings, key: "," },
];
