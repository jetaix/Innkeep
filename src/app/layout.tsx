import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { site } from "@/config/site";
import { LocaleProvider } from "@/i18n/client";
import { LOCALE_COOKIE, THEME_KEY } from "@/i18n/config";
import { getLocale } from "@/i18n/server";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  // On Vercel the production address is known without configuration.
  metadataBase: new URL(
    process.env.APP_URL ??
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "http://localhost:3000"),
  ),
  title: { default: `${site.name} · ${site.tagline}`, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  openGraph: { title: site.name, description: site.description, type: "website", siteName: site.name },
  twitter: { card: "summary_large_image", title: site.name, description: site.description },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f11" },
  ],
};

/**
 * Runs before the first paint: applies the theme the host chose in this
 * browser, and the language from their cookie, so neither flashes.
 */
const BEFORE_PAINT = `try{var d=document.documentElement,t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")d.dataset.theme=t;var l=document.cookie.match(/(?:^|; )${LOCALE_COOKIE}=(en|fr)/);d.lang=l?l[1]:(navigator.language||"").slice(0,2)==="fr"?"fr":"en"}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // The script above may change `lang` and `data-theme` before React hydrates.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: BEFORE_PAINT }} />
      </head>
      <body className="min-h-full font-sans text-sm">
        {/* The language is read from the request, so everything below renders per request. */}
        <Suspense>
          <WithLocale>{children}</WithLocale>
        </Suspense>
      </body>
    </html>
  );
}

async function WithLocale({ children }: { children: React.ReactNode }) {
  return <LocaleProvider locale={await getLocale()}>{children}</LocaleProvider>;
}
