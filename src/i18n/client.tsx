"use client";

import { createContext, use, useMemo, type ReactNode } from "react";
import { DEFAULT_LOCALE, type Locale } from "./config";
import { createFormat } from "./format";
import { MESSAGES } from "./messages";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

/** Hands the request's language to client components. Rendered once, in the root layout. */
export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext value={locale}>{children}</LocaleContext>;
}

/** The client-side twin of `getI18n()`. */
export function useI18n() {
  const locale = use(LocaleContext);
  return useMemo(() => ({ locale, m: MESSAGES[locale], fmt: createFormat(locale) }), [locale]);
}
