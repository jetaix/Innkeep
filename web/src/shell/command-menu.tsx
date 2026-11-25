import * as stylex from "@stylexjs/stylex";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { CalendarPlus, type LucideIcon, RefreshCw, Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { NAV } from "@/config/navigation";
import { sync } from "../api/mutations";
import { useI18n } from "../i18n";
import { color, radius, shadow, text } from "../tokens.stylex";
import { Kbd } from "../ui/primitives";

const WIDE = "@media (min-width: 48rem)";
const COARSE = "@media (pointer: coarse)";

const styles = stylex.create({
  trigger: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    width: "100%",
    height: { default: "2rem", [COARSE]: "2.5rem" },
    paddingInline: "0.625rem",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: { default: color.line, ":hover": color.lineStrong },
    borderRadius: radius.md,
    backgroundColor: color.bg,
    color: { default: color.muted, ":hover": color.ink },
    fontFamily: "inherit",
    fontSize: text.base,
    cursor: "pointer",
    transitionProperty: "border-color, color",
    transitionDuration: "150ms",
  },
  triggerLabel: { flexGrow: 1, textAlign: "start" },
  dialog: {
    width: "calc(100vw - 2rem)",
    maxWidth: "32rem",
    margin: "18vh auto auto",
    padding: 0,
    overflow: "hidden",
    borderWidth: 0,
    borderRadius: radius.xl,
    backgroundColor: color.bg,
    color: color.ink,
    boxShadow: shadow.pop,
    "::backdrop": { backgroundColor: "rgb(0 0 0 / 0.3)", backdropFilter: "blur(2px)" },
  },
  input: {
    display: "block",
    width: "100%",
    height: "3rem",
    paddingInline: "1rem",
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: color.line,
    backgroundColor: "transparent",
    color: { default: color.ink, "::placeholder": color.faint },
    fontFamily: "inherit",
    fontSize: { default: text.field, [WIDE]: text.md },
    // The whole dialog is the field: the ring would only repeat its edge.
    outlineStyle: "none",
  },
  list: { maxHeight: "50vh", overflowY: "auto", padding: "0.375rem" },
  heading: { padding: "0.375rem 0.625rem", color: color.muted, fontSize: text.sm },
  item: {
    display: "flex",
    alignItems: "center",
    gap: "0.625rem",
    height: { default: "2.25rem", [COARSE]: "2.75rem" },
    paddingInline: "0.625rem",
    borderRadius: radius.md,
    color: color.ink,
    fontSize: text.base,
    cursor: "pointer",
  },
  active: { backgroundColor: color.sunken },
  icon: { color: color.muted },
  itemLabel: { flexGrow: 1 },
  keys: { display: "flex", gap: "0.25rem" },
  empty: {
    margin: 0,
    padding: "1.5rem 0.75rem",
    color: color.muted,
    fontSize: text.base,
    textAlign: "center",
  },
  foot: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: "0.75rem",
    rowGap: "0.25rem",
    margin: 0,
    padding: "0.5rem 1rem",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.line,
    color: color.muted,
    fontSize: text.sm,
  },
  hint: { display: "flex", alignItems: "center", gap: "0.25rem" },
});

type Entry = {
  id: string;
  group: "goTo" | "actions";
  label: string;
  /** Other words that find it, in both languages. */
  keywords?: string[];
  icon: LucideIcon;
  keys?: string[];
  run: () => void;
};

/** Lower case and without accents, so "reglages" finds "Réglages". */
const plain = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/**
 * Keyboard layer for the whole app.
 *
 * - ⌘K / Ctrl+K (or ?) opens the command menu.
 * - "g" then a letter jumps to a page (see `NAV`).
 * - Any element with `data-shortcut="x"` is activated by pressing x, so pages
 *   declare their own shortcuts in markup with no extra wiring.
 *
 * The menu is the browser's own `<dialog>` around a filtered list: it traps
 * focus, closes on Escape and hands focus back on its own.
 */
export function CommandMenu({ canSync }: { canSync: boolean }) {
  const navigate = useNavigate();
  const { m } = useI18n();
  const c = m.common.command;
  const syncAll = useMutation(sync);
  const dialog = useRef<HTMLDialogElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const open = () => {
    if (!dialog.current?.open) dialog.current?.showModal();
  };

  useEffect(() => {
    let awaitingGo = false;
    let goTimer: ReturnType<typeof setTimeout>;

    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (dialog.current?.open) dialog.current.close();
        else dialog.current?.showModal();
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target as HTMLElement;
      const typing = target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      // Escape still works from a field, so a panel can always be closed.
      if (typing && event.key !== "Escape") return;
      // An open dialog owns the keyboard.
      if (document.querySelector("dialog[open]")) return;

      if (awaitingGo) {
        awaitingGo = false;
        const item = NAV.find((entry) => entry.key === event.key.toLowerCase());
        if (item) {
          event.preventDefault();
          void navigate({ to: item.href });
        }
        return;
      }
      if (event.key === "g") {
        awaitingGo = true;
        clearTimeout(goTimer);
        goTimer = setTimeout(() => {
          awaitingGo = false;
        }, 1200);
        return;
      }
      if (event.key === "?") {
        event.preventDefault();
        dialog.current?.showModal();
        return;
      }

      const shortcut = document.querySelector<HTMLElement>(`[data-shortcut="${CSS.escape(event.key)}"]`);
      if (shortcut) {
        event.preventDefault();
        shortcut.click();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      clearTimeout(goTimer);
    };
  }, [navigate]);

  const entries: Entry[] = [
    ...NAV.map(
      (item): Entry => ({
        id: item.id,
        group: "goTo",
        label: m.common.nav[item.id],
        icon: item.icon,
        keys: ["G", item.key.toUpperCase()],
        run: () => void navigate({ to: item.href }),
      }),
    ),
    {
      id: "add-booking",
      group: "actions",
      label: c.addBooking,
      keywords: ["new", "block", "booking", "reservation", "ajouter", "bloquer", "réservation"],
      icon: CalendarPlus,
      run: () => void navigate({ to: "/calendar", search: { new: true } }),
    },
    ...(canSync
      ? [
          {
            id: "sync",
            group: "actions",
            label: c.syncAll,
            keywords: ["refresh", "import", "ical", "synchroniser", "calendrier"],
            icon: RefreshCw,
            run: () => syncAll.mutate(false),
          } satisfies Entry,
        ]
      : []),
  ];

  const words = plain(query).split(/\s+/).filter(Boolean);
  const found = entries.filter((entry) => {
    const text = plain([entry.label, ...(entry.keywords ?? [])].join(" "));
    return words.every((word) => text.includes(word));
  });
  const current = found[Math.min(active, found.length - 1)];
  const optionId = (entry: Entry) => `${listId}-${entry.id}`;

  const run = (entry: Entry) => {
    dialog.current?.close();
    entry.run();
  };

  const move = (by: number) => {
    if (found.length === 0) return;
    const next = (Math.min(active, found.length - 1) + by + found.length) % found.length;
    setActive(next);
    const entry = found[next];
    if (entry) document.getElementById(optionId(entry))?.scrollIntoView({ block: "nearest" });
  };

  return (
    <>
      <button type="button" onClick={open} {...stylex.props(styles.trigger)}>
        <Search aria-hidden size={14} />
        <span {...stylex.props(styles.triggerLabel)}>{c.open}</span>
        <Kbd>⌘K</Kbd>
      </button>

      {/* biome-ignore lint/a11y/useKeyWithClickEvents: the keyboard closes it with Escape */}
      <dialog
        ref={dialog}
        aria-label={c.label}
        {...stylex.props(styles.dialog)}
        // A click on the backdrop lands on the dialog element itself.
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        onClose={() => {
          setQuery("");
          setActive(0);
        }}
      >
        <input
          role="combobox"
          aria-expanded
          aria-controls={listId}
          aria-activedescendant={current ? optionId(current) : undefined}
          aria-autocomplete="list"
          aria-label={c.label}
          placeholder={c.placeholder}
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(event) => {
            setQuery(event.currentTarget.value);
            setActive(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              move(1);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              move(-1);
            } else if (event.key === "Enter" && current) {
              event.preventDefault();
              run(current);
            }
          }}
          {...stylex.props(styles.input)}
        />
        <div id={listId} role="listbox" aria-label={c.label} {...stylex.props(styles.list)}>
          {found.length === 0 && <p {...stylex.props(styles.empty)}>{c.empty}</p>}
          {(["goTo", "actions"] as const).map((group) => {
            const items = found.filter((entry) => entry.group === group);
            if (items.length === 0) return null;
            return (
              <div key={group} role="group" aria-label={c[group]}>
                <div aria-hidden {...stylex.props(styles.heading)}>
                  {c[group]}
                </div>
                {items.map((entry) => (
                  // biome-ignore lint/a11y/useKeyWithClickEvents: the field above handles the keyboard for every option
                  <div
                    key={entry.id}
                    id={optionId(entry)}
                    role="option"
                    tabIndex={-1}
                    aria-selected={entry === current}
                    onClick={() => run(entry)}
                    onPointerMove={() => setActive(found.indexOf(entry))}
                    {...stylex.props(styles.item, entry === current && styles.active)}
                  >
                    <entry.icon aria-hidden size={16} {...stylex.props(styles.icon)} />
                    <span {...stylex.props(styles.itemLabel)}>{entry.label}</span>
                    {entry.keys && (
                      <span {...stylex.props(styles.keys)}>
                        {entry.keys.map((key) => (
                          <Kbd key={key}>{key}</Kbd>
                        ))}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        <p {...stylex.props(styles.foot)}>
          <span {...stylex.props(styles.hint)}>
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> {c.toMove}
          </span>
          <span {...stylex.props(styles.hint)}>
            <Kbd>↵</Kbd> {c.toOpen}
          </span>
          <span {...stylex.props(styles.hint)}>
            <Kbd>Esc</Kbd> {c.toClose}
          </span>
        </p>
      </dialog>
    </>
  );
}
