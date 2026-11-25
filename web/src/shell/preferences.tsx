import * as stylex from "@stylexjs/stylex";
import { type LucideIcon, Monitor, Moon, Sun } from "lucide-react";
import { LOCALE_NAMES, LOCALES, THEMES, type Theme } from "@/i18n/config";
import { setLocale, useI18n } from "../i18n";
import { setTheme, useTheme } from "../theme";
import { color, radius, shadow, text } from "../tokens.stylex";

const COARSE = "@media (pointer: coarse)";

const styles = stylex.create({
  group: {
    display: "flex",
    height: { default: "1.75rem", [COARSE]: "2.5rem" },
    padding: "0.125rem",
    borderRadius: radius.full,
    backgroundColor: color.sunken,
  },
  option: {
    display: "flex",
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: "0.375rem",
    paddingInline: "0.5rem",
    borderWidth: 0,
    borderRadius: radius.full,
    backgroundColor: "transparent",
    color: { default: color.muted, ":hover": color.ink },
    fontFamily: "inherit",
    fontSize: text.sm,
    fontWeight: 500,
    cursor: "pointer",
    transitionProperty: "background-color, color",
    transitionDuration: "150ms",
  },
  selected: { backgroundColor: color.panel, color: color.ink, boxShadow: shadow.card },
});

/** A small set of mutually exclusive choices, shown side by side. */
function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; short?: string; icon?: LucideIcon }[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} {...stylex.props(styles.group)}>
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
            {...stylex.props(styles.option, selected && styles.selected)}
          >
            {option.icon ? <option.icon aria-hidden size={14} strokeWidth={1.75} /> : null}
            {option.short ?? (option.icon ? null : option.label)}
          </button>
        );
      })}
    </div>
  );
}

const THEME_ICON: Record<Theme, LucideIcon> = { system: Monitor, light: Sun, dark: Moon };

/** System, light or dark. Kept in this browser; "system" follows the device. */
export function ThemeSwitch({ withLabels = false }: { withLabels?: boolean }) {
  const { m } = useI18n();
  const theme = useTheme();
  return (
    <Segmented
      label={m.common.preferences.theme}
      value={theme}
      onChange={setTheme}
      options={THEMES.map((value) => ({
        value,
        label: m.common.preferences[value],
        icon: THEME_ICON[value],
        short: withLabels ? m.common.preferences[value] : undefined,
      }))}
    />
  );
}

/** English or French. Kept in a cookie, so the server can answer in it too. */
export function LanguageSwitch({ withLabels = false }: { withLabels?: boolean }) {
  const { m, locale } = useI18n();
  return (
    <Segmented
      label={m.common.preferences.language}
      value={locale}
      onChange={setLocale}
      options={LOCALES.map((value) => ({
        value,
        label: LOCALE_NAMES[value],
        short: withLabels ? LOCALE_NAMES[value] : value.toUpperCase(),
      }))}
    />
  );
}
