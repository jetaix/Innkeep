import type { Metadata } from "next";

/** Guides that take the whole screen, without the sidebar. Still the host's own pages. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function SetupLayout({ children }: LayoutProps<"/">) {
  return children;
}
