"use client";

import { useSyncExternalStore, useTransition } from "react";
import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { setLocale } from "@/i18n/actions";
import { useI18n } from "@/i18n/client";
import { LOCALE_NAMES, LOCALES, THEME_KEY, THEMES, type Theme } from "@/i18n/config";
import { cn } from "@/lib/cn";

/** A small set of mutually exclusive choices, shown side by side. */
function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  busy,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; short?: string; icon?: LucideIcon }[];
  onChange: (value: T) => void;
  busy?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-busy={busy}
      className="flex h-7 rounded-md border border-line bg-bg p-0.5"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.label}
            title={option.label}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded px-2 text-xs font-medium transition-colors",
              selected ? "bg-sunken text-ink" : "text-muted hover:text-ink",
            )}
          >
            {option.icon ? <option.icon aria-hidden className="size-3.5" strokeWidth={1.75} /> : null}
            {option.short ?? (option.icon ? null : option.label)}
          </button>
        );
      })}
    </div>
  );
}

const themeListeners = new Set<() => void>();

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

function writeTheme(theme: Theme) {
  try {
    if (theme === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage can be refused (private window); the choice then lasts for this page only.
  }
  // The same attribute the script in the root layout sets before first paint.
  if (theme === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  themeListeners.forEach((listener) => listener());
}

function subscribeTheme(listener: () => void) {
  themeListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    themeListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

const THEME_ICON: Record<Theme, LucideIcon> = { system: Monitor, light: Sun, dark: Moon };

/** System, light or dark. Kept in this browser; "system" follows the device. */
export function ThemeSwitch({ withLabels = false }: { withLabels?: boolean }) {
  const { m } = useI18n();
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "system" as const);
  return (
    <Segmented
      label={m.common.preferences.theme}
      value={theme}
      onChange={writeTheme}
      options={THEMES.map((value) => ({
        value,
        label: m.common.preferences[value],
        icon: THEME_ICON[value],
        short: withLabels ? m.common.preferences[value] : undefined,
      }))}
    />
  );
}

/** English or French. Kept in a cookie so the server writes the page in it. */
export function LanguageSwitch({ withLabels = false }: { withLabels?: boolean }) {
  const { m, locale } = useI18n();
  const [pending, startTransition] = useTransition();
  return (
    <Segmented
      label={m.common.preferences.language}
      value={locale}
      busy={pending}
      onChange={(next) => {
        if (next === locale) return;
        // Set at once so the page's `lang` is right even before the server answers.
        document.documentElement.lang = next;
        startTransition(() => setLocale(next));
      }}
      options={LOCALES.map((value) => ({
        value,
        label: LOCALE_NAMES[value],
        short: withLabels ? LOCALE_NAMES[value] : value.toUpperCase(),
      }))}
    />
  );
}
