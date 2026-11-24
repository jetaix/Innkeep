import { Funnel_Display } from "next/font/google";

const display = Funnel_Display({ variable: "--font-funnel", subsets: ["latin", "latin-ext"] });

/** The public pages share one world: the brand tokens and the display face. */
export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return <div className={`brand min-h-dvh overflow-x-clip ${display.variable}`}>{children}</div>;
}
