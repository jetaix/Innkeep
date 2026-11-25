/**
 * The "Send to Innkeep" control shared by every supported page. A page
 * script says when it applies, what to collect and how to describe the
 * result. Data is sent when the host clicks, or as soon as the page shows
 * it if automatic sending is on in the settings.
 *
 * During a "read everything" run the background script walks one tab through
 * the host's pages. Page scripts behave the same; this file only makes sure
 * they send without waiting, never close that tab, and show where the run is.
 */
(() => {
  const ticks = [];
  /** The tab was opened from Innkeep, or is the tab of a run the host started. */
  let trusted = false;
  /** { index, total, label } while this tab is the run's tab. */
  let tour = null;
  let baseUrl = "";

  /**
   * Whether this page can still talk to the extension. When the extension is
   * reloaded or updated, pages already open keep the old script, and every
   * call from it fails with "Extension context invalidated".
   */
  const alive = () => Boolean(globalThis.chrome?.runtime?.id);

  /** Sends a message to the background script; null when the page has outlived the extension. */
  async function ask(message) {
    if (!alive()) return null;
    try {
      return await chrome.runtime.sendMessage(message);
    } catch {
      return null;
    }
  }

  async function stored(keys) {
    if (!alive()) return {};
    try {
      return await chrome.storage.local.get(keys);
    } catch {
      return {};
    }
  }

  const RELOAD = "The Innkeep extension was updated. Reload this page to use it here.";

  /**
   * How Innkeep looks on someone else's page: the white panel and ink pills of
   * its own pages, always light, in the system's font (a page script cannot
   * load the extension's). Colours are written out because the host page owns
   * the custom properties.
   */
  const INK = "#15171c";
  const FONT = "ui-sans-serif,system-ui,sans-serif";
  const FLOAT =
    "0 1px 0 rgba(255,255,255,.9) inset,0 22px 40px -22px rgba(21,23,28,.34)," +
    "0 8px 18px -12px rgba(21,23,28,.2),0 0 0 1px rgba(21,23,28,.06)";
  /** The ring around the box says how the last send went: plain, saved, or refused. */
  const RING = { neutral: "rgba(21,23,28,.06)", good: "#18794e", error: "#c62a2f" };

  /** The mark: two doorways, coral and blue, violet where they overlap. */
  function mark() {
    const NS = "http://www.w3.org/2000/svg";
    const arch = (x) =>
      `M${x + 1.5} 21a1.5 1.5 0 0 1-1.5-1.5V8.5a5.5 5.5 0 0 1 11 0v11a1.5 1.5 0 0 1-1.5 1.5Z`;
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.style.cssText = "flex:none;width:18px;height:18px";
    const path = (x, fill) => {
      const shape = document.createElementNS(NS, "path");
      shape.setAttribute("d", arch(x));
      shape.setAttribute("fill", fill);
      return shape;
    };
    // The overlap is the right doorway again, cut to the shape of the left one.
    const clip = document.createElementNS(NS, "clipPath");
    clip.id = "innkeep-mark";
    clip.append(path(2.5, "#000"));
    const overlap = path(10.5, "#4b2bbd");
    overlap.setAttribute("clip-path", "url(#innkeep-mark)");
    svg.append(path(2.5, "#ff5d73"), path(10.5, "#3d6df2"), clip, overlap);
    return svg;
  }

  /** One focus ring and one pressed state for Innkeep's own buttons, whatever the page does to buttons. */
  function ownStyles() {
    if (document.getElementById("innkeep-ui")) return;
    const style = document.createElement("style");
    style.id = "innkeep-ui";
    style.textContent =
      "[data-innkeep] button{transition:transform .2s cubic-bezier(.16,1,.3,1),background-color .2s}" +
      "[data-innkeep] button:focus-visible{outline:2px solid #4b2bbd;outline-offset:2px}" +
      "[data-innkeep] button:active{transform:scale(.97)}" +
      "@media (prefers-reduced-motion:reduce){[data-innkeep] button{transition:none}}";
    document.head.append(style);
  }

  const ready = (async () => {
    const [saved, status] = await Promise.all([stored("baseUrl"), ask({ type: "innkeep:tour-status" })]);
    baseUrl = saved.baseUrl ?? "";
    tour = status?.active && status.thisTab ? status : null;
    trusted = Boolean(tour) || (Boolean(baseUrl) && document.referrer.startsWith(baseUrl));
    if (tour) showTour();
    // Pages that were waiting to know whether they are trusted can now decide.
    ticks.forEach((tick) => tick());
  })();

  /** A small banner at the top while a run is going, with the way to stop it. */
  function showTour() {
    ownStyles();
    const banner = document.createElement("div");
    banner.setAttribute("role", "status");
    banner.dataset.innkeep = "";
    banner.style.cssText =
      "position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:2147483001;display:flex;" +
      "align-items:center;gap:10px;width:max-content;max-width:calc(100vw - 24px);padding:6px 6px 6px 12px;border-radius:999px;" +
      `background:#fff;color:${INK};font:500 13px/1.4 ${FONT};box-shadow:${FLOAT}`;
    const text = document.createElement("span");
    text.textContent = `Innkeep is reading your pages: ${tour.index + 1} of ${tour.total}`;
    const stop = document.createElement("button");
    stop.type = "button";
    stop.textContent = "Stop";
    stop.style.cssText =
      `flex:none;width:auto;height:28px;margin:0;padding:0 12px;border:0;white-space:nowrap;border-radius:999px;background:${INK};color:#fff;` +
      `font:500 12px ${FONT};cursor:pointer`;
    stop.addEventListener("click", () => {
      // Works even on a page that outlived the extension: the banner goes either way.
      void ask({ type: "innkeep:tour-stop" });
      banner.remove();
    });
    banner.append(mark(), text, stop);
    document.body.append(banner);
  }

  globalThis.InnkeepUI = {
    /** Whether this tab may be read without the host pressing anything on it. */
    trusted: () => trusted,

    /** Message the background script from a page script; safe on a page that outlived the extension. */
    ask,

    /**
     * @param {{ isActive: () => boolean, prompt?: string, button?: string,
     *           collect: () => { path: string, payload: object } | { error: string },
     *           autoKey?: () => string | null,
     *           keepOpen?: boolean | (() => boolean),
     *           quiet?: boolean,
     *           describe?: (result: any) => { text: string, tone?: "good" | "neutral" } }} page
     *   `quiet` pages have no control of their own: they are read in passing
     *   (automatic sending or a run), next to a page's main reader.
     */
    mount(page) {
      let pill;

      const setStatus = (text, tone = "neutral") => {
        if (!pill) return;
        pill.querySelector("[data-status]").textContent = text;
        pill.style.boxShadow = FLOAT.replace(RING.neutral, RING[tone] ?? RING.neutral);
      };

      /** The box's one button: send the page, or, when Innkeep refused the token, open the settings. */
      let action = "send";
      const setAction = (next) => {
        action = next;
        const button = pill?.querySelector("button");
        if (button) button.textContent = next === "reconnect" ? "Reconnect" : page.button;
      };

      async function send() {
        const collected = page.collect();
        if ("error" in collected) return (setStatus(collected.error, "error"), false);

        setStatus("Sending…");
        if (!alive()) return (setStatus(RELOAD, "error"), false);
        const result = await ask({ type: "innkeep:send", ...collected });
        setAction(result?.reconnect ? "reconnect" : "send");
        if (!result?.ok) return (setStatus(result?.error ?? "Sending failed.", "error"), false);
        const { text, tone } = page.describe?.(result) ?? { text: "Saved in Innkeep.", tone: "good" };
        setStatus(text, tone);
        return true;
      }

      /**
       * Sends without a click when the host turned that on (the default) or
       * started a run, once per set of data. A tab that Innkeep itself opened
       * is closed afterwards, so a button in Innkeep feels like one step.
       */
      let lastKey = null;
      let pendingKey = null;
      async function autoSend() {
        const key = page.autoKey?.();
        if (!key || key === lastKey) return;
        // Wait until the page stops changing: both sites fill their tables in steps.
        if (key !== pendingKey) {
          pendingKey = key;
          return void setTimeout(tick, 1200);
        }
        await ready;
        if (!alive()) return;
        const { autoSend: enabled = true } = await stored("autoSend");
        if ((!enabled && !tour) || !baseUrl) return;
        lastKey = key;
        const sent = await send();
        const keepOpen = typeof page.keepOpen === "function" ? page.keepOpen() : page.keepOpen;
        // A run's tab moves on by itself; only a tab opened from Innkeep is closed.
        if (sent && !keepOpen && !tour && document.referrer.startsWith(baseUrl)) {
          setTimeout(() => void ask({ type: "innkeep:close-tab" }), 1500);
        }
      }

      function render() {
        if (page.quiet) return;
        if (!page.isActive()) {
          pill?.remove();
          pill = undefined;
          return;
        }
        if (pill?.isConnected) return;

        ownStyles();
        pill = document.createElement("div");
        pill.setAttribute("role", "region");
        pill.setAttribute("aria-label", "Innkeep");
        pill.dataset.innkeep = "";
        pill.style.cssText =
          "position:fixed;right:16px;bottom:16px;z-index:2147483000;display:flex;align-items:center;gap:10px;" +
          "max-width:min(380px,calc(100vw - 32px));padding:8px 8px 8px 12px;border-radius:16px;background:#fff;" +
          `color:${INK};font:13px/1.4 ${FONT};box-shadow:${FLOAT};transition:box-shadow .2s`;

        const status = document.createElement("span");
        status.dataset.status = "";
        status.setAttribute("aria-live", "polite");
        status.textContent = page.prompt;

        const button = document.createElement("button");
        button.type = "button";
        button.textContent = page.button;
        button.style.cssText =
          `flex:none;width:auto;height:32px;margin:0;padding:0 14px;border:0;white-space:nowrap;border-radius:999px;background:${INK};color:#fff;` +
          `font:500 12px ${FONT};cursor:pointer`;
        button.addEventListener("click", () => {
          if (action !== "reconnect") return void send();
          // The settings open in a tab; once saved there, this button sends again.
          void ask({ type: "innkeep:open-settings" });
          setAction("send");
          setStatus("Paste the token from Innkeep in the settings tab, save, then send again.");
        });

        pill.append(mark(), status, button);
        document.body.append(pill);
      }

      function tick() {
        render();
        if (page.isActive()) void autoSend();
      }
      ticks.push(tick);

      // Both sites change pages without a full load, so watch for it.
      let scheduled = false;
      new MutationObserver(() => {
        if (scheduled) return;
        scheduled = true;
        setTimeout(() => {
          scheduled = false;
          tick();
        }, 500);
      }).observe(document.body, { childList: true, subtree: true });
      tick();
    },

    /** Shared behaviour for a reservations table. */
    reservations({ source, isActive, rowSelector, readRow, lang, listingId }) {
      this.mount({
        isActive: () => isActive() && document.querySelector(rowSelector) !== null,
        prompt: "Innkeep can add the reservations shown here.",
        // The rows on screen, so the same table is not sent twice.
        autoKey: () =>
          isActive()
            ? [...document.querySelectorAll(rowSelector)].map((row) => row.innerText.length).join(",") || null
            : null,
        button: "Send to Innkeep",
        collect() {
          const rows = [...document.querySelectorAll(rowSelector)];
          const parsed = rows
            .map((row) =>
              readRow(
                [...row.children].map((cell) => cell.innerText),
                lang(),
              ),
            )
            .filter(Boolean);
          if (parsed.length === 0) return { error: "Could not read any reservation on this page." };
          this.skipped = rows.length - parsed.length;
          return {
            path: "/api/ingest/reservations",
            payload: { source, listingId: listingId?.() ?? null, reservations: parsed },
          };
        },
        describe(result) {
          const parts = [`${result.updated} updated`];
          if (result.added) parts.push(`${result.added} past stays added`);
          if (result.unchanged) parts.push(`${result.unchanged} already up to date`);
          if (result.unmatched.length) parts.push(`${result.unmatched.length} not in your Innkeep calendar`);
          if (result.cancelled) parts.push(`${result.cancelled} cancelled`);
          if (this.skipped) parts.push(`${this.skipped} unreadable`);
          return { text: `${parts.join(", ")}.`, tone: result.unmatched.length ? "neutral" : "good" };
        },
      });
    },
  };
})();
