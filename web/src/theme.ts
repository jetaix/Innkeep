import { useSyncExternalStore } from "react";
import { THEME_KEY, type Theme } from "@/i18n/config";

/**
 * The host's choice of system, light or dark, kept in this browser.
 * "system" stores nothing and follows the device.
 *
 * The choice is also written to `data-theme` on the page, which the script in
 * `index.html` sets before anything is drawn, so the ground under the app is
 * already the right colour while the code loads.
 */
const listeners = new Set<() => void>();

function read(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

export function setTheme(theme: Theme) {
  try {
    if (theme === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage can be refused (private window); the choice then lasts for this page only.
  }
  if (theme === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab changed it.
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, read, () => "system" as const);
}
