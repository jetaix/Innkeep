import * as stylex from "@stylexjs/stylex";
import { useEffect, useSyncExternalStore } from "react";
import { useI18n } from "../i18n";
import { color, radius, shadow, text } from "../tokens.stylex";

/**
 * In the public demo the server refuses every change. `refused()` is called
 * when that happens (see `router.tsx`), and this says why at the bottom of the
 * screen, so a visitor who presses Save gets an answer instead of silence.
 */
let count = 0;
const listeners = new Set<() => void>();
const emit = () => {
  for (const listener of listeners) listener();
};

export function refused() {
  count += 1;
  emit();
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const styles = stylex.create({
  toast: {
    position: "fixed",
    insetInline: "1rem",
    bottom: "1rem",
    zIndex: 50,
    width: "fit-content",
    maxWidth: "calc(100% - 2rem)",
    margin: "0 auto",
    padding: "0.75rem 1rem",
    borderRadius: radius.lg,
    backgroundColor: color.ink,
    color: color.inverse,
    boxShadow: shadow.pop,
    fontSize: text.base,
    fontWeight: 500,
  },
  // Kept in the page while empty, so a screen reader announces the text when it arrives.
  quiet: {
    position: "absolute",
    width: 1,
    height: 1,
    margin: -1,
    overflow: "hidden",
    clipPath: "inset(50%)",
  },
});

export function RefusedNotice() {
  const { m } = useI18n();
  const shown = useSyncExternalStore(
    subscribe,
    () => count,
    () => 0,
  );

  useEffect(() => {
    if (!shown) return;
    const timer = setTimeout(() => {
      count = 0;
      emit();
    }, 4000);
    return () => clearTimeout(timer);
  }, [shown]);

  return (
    <p role="status" {...stylex.props(shown ? styles.toast : styles.quiet)}>
      {shown ? m.demo.refused : ""}
    </p>
  );
}
