"use client";

import { Command } from "cmdk";
import { CalendarPlus, RefreshCw, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NAV } from "@/config/navigation";
import { Kbd } from "@/components/ui/primitives";
import { useI18n } from "@/i18n/client";

/**
 * Keyboard layer for the whole app.
 *
 * - ⌘K / Ctrl+K (or ?) opens the command menu.
 * - "g" then a letter jumps to a page (see `NAV`).
 * - Any element with `data-shortcut="x"` is activated by pressing x, so pages
 *   declare their own shortcuts in markup with no extra wiring.
 */
export function CommandMenu({ syncAction }: { syncAction: () => Promise<void> }) {
  const router = useRouter();
  const { m } = useI18n();
  const c = m.common.command;
  const [open, setOpen] = useState(false);
  const awaitingGo = useRef(false);

  useEffect(() => {
    let goTimer: ReturnType<typeof setTimeout>;

    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target as HTMLElement;
      const typing = target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      // Escape still works from a field, so a panel can always be closed.
      if (typing && event.key !== "Escape") return;
      if (document.querySelector("[cmdk-root]")) return;

      if (awaitingGo.current) {
        awaitingGo.current = false;
        const item = NAV.find((entry) => entry.key === event.key.toLowerCase());
        if (item) {
          event.preventDefault();
          router.push(item.href);
        }
        return;
      }
      if (event.key === "g") {
        awaitingGo.current = true;
        clearTimeout(goTimer);
        goTimer = setTimeout(() => (awaitingGo.current = false), 1200);
        return;
      }
      if (event.key === "?") {
        event.preventDefault();
        setOpen(true);
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
  }, [router]);

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  const itemClass =
    "flex h-9 cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-[13px] text-ink data-[selected=true]:bg-sunken [&_svg]:size-4 [&_svg]:text-muted";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-8 w-full items-center gap-2 rounded-md border border-line bg-bg px-2.5 text-[13px] text-muted transition-colors hover:border-line-strong hover:text-ink pointer-coarse:h-10"
      >
        <Search aria-hidden className="size-3.5" />
        <span className="flex-1 text-left">{c.open}</span>
        <Kbd>⌘K</Kbd>
      </button>

      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label={c.label}
        overlayClassName="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
        contentClassName="fixed top-[18vh] left-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-xl bg-bg shadow-pop"
      >
        <Command.Input
          placeholder={c.placeholder}
          className="h-12 w-full border-b border-line bg-transparent px-4 text-base outline-none placeholder:text-faint md:text-sm"
        />
        <Command.List className="max-h-[50vh] overflow-y-auto p-1.5">
          <Command.Empty className="px-3 py-6 text-center text-[13px] text-muted">{c.empty}</Command.Empty>

          <Command.Group
            heading={c.goTo}
            className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-muted"
          >
            {NAV.map((item) => (
              <Command.Item
                key={item.href}
                onSelect={() => run(() => router.push(item.href))}
                className={itemClass}
              >
                <item.icon aria-hidden />
                <span className="flex-1">{m.common.nav[item.id]}</span>
                <span className="flex gap-1">
                  <Kbd>G</Kbd>
                  <Kbd>{item.key.toUpperCase()}</Kbd>
                </span>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group
            heading={c.actions}
            className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-muted"
          >
            <Command.Item
              keywords={["new", "block", "booking", "reservation", "ajouter", "bloquer", "réservation"]}
              onSelect={() => run(() => router.push("/calendar?new=1"))}
              className={itemClass}
            >
              <CalendarPlus aria-hidden />
              <span className="flex-1">{c.addBooking}</span>
            </Command.Item>
            <Command.Item
              keywords={["refresh", "import", "ical", "synchroniser", "calendrier"]}
              onSelect={() => run(() => void syncAction())}
              className={itemClass}
            >
              <RefreshCw aria-hidden />
              <span className="flex-1">{c.syncAll}</span>
            </Command.Item>
          </Command.Group>
        </Command.List>
        <p className="flex items-center gap-3 border-t border-line px-4 py-2 text-xs text-muted">
          <span className="flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> {c.toMove}
          </span>
          <span className="flex items-center gap-1">
            <Kbd>↵</Kbd> {c.toOpen}
          </span>
          <span className="flex items-center gap-1">
            <Kbd>Esc</Kbd> {c.toClose}
          </span>
        </p>
      </Command.Dialog>
    </>
  );
}
