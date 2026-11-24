"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Pause, Play } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/cn";

/**
 * The landing page's demo: the product played as a short film, in code.
 *
 * Four scenes run on a loop over one calendar. Bookings are slabs of tinted
 * glass that blend with what is under them, so the two that share nights at
 * Harbour Studio darken where they overlap: the double booking is visible
 * before the flag names it. Everything shown is example data.
 */

const DAYS = 14;
const FIRST_DATE = "2026-11-09"; // a Monday
const FIRST_DAY = 9;
const SCENE_MS = 5200;

type Tone = "airbnb" | "booking" | "direct" | "block";
type Bar = { label: string; tone: Tone; from: number; to: number; order: number; late?: boolean };

const TONE: Record<Tone, string> = {
  airbnb: "[--g:var(--airbnb)]",
  booking: "[--g:var(--booking)]",
  direct: "[--g:var(--direct)]",
  block: "[--g:var(--block)]",
};

const ROWS: { name: string; bars: Bar[] }[] = [
  {
    name: "Canal Loft",
    bars: [
      { label: "Léa Martin", tone: "airbnb", from: 0, to: 3, order: 0 },
      { label: "J. Novak", tone: "booking", from: 3, to: 7, order: 2 },
      { label: "Claire Fontaine", tone: "direct", from: 8, to: 12, order: 4 },
    ],
  },
  {
    name: "Harbour Studio",
    bars: [
      { label: "Sam Wright", tone: "airbnb", from: 1, to: 5, order: 1 },
      { label: "Ines Ferreira", tone: "booking", from: 4, to: 8, order: 0, late: true },
      { label: "", tone: "block", from: 10, to: 12, order: 5 },
    ],
  },
];

const percent = (days: number) => `${(days / DAYS) * 100}%`;

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (notify: () => void) => {
  const query = window.matchMedia(REDUCED);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};

export function DemoFilm() {
  const { m, fmt } = useI18n();
  const t = m.marketing;
  const scenes = t.demo.scenesList;
  const count = scenes.length;
  const reduced = useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );
  const [scene, setScene] = useState(0);
  // "auto" plays unless the visitor prefers reduced motion; a press on play or pause is always obeyed.
  const [mode, setMode] = useState<"auto" | "playing" | "paused">("auto");
  const playing = mode === "playing" || (mode === "auto" && !reduced);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setScene((current) => (current + 1) % count), SCENE_MS);
    return () => clearInterval(timer);
  }, [playing, count]);

  // With reduced motion nothing plays; the film rests on the scene that shows the idea.
  const shown = reduced && mode === "auto" ? 1 : scene;
  const night = (offset: number) =>
    fmt.date(new Date(Date.UTC(2026, 10, FIRST_DAY + offset)).toISOString().slice(0, 10), {
      day: "numeric",
      month: "short",
    });
  const euros = (amount: number) => fmt.money(amount * 100, "EUR", { cents: false });
  const month = fmt.date(FIRST_DATE, { month: "long" });

  return (
    <figure
      id="demo"
      aria-label={t.demo.label}
      data-scene={shown}
      className="panel relative scroll-mt-24 overflow-hidden rounded-[1.75rem]"
    >
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-6">
        <span className="text-[13px] font-medium capitalize">{month}</span>
        <span
          aria-hidden={shown < 1}
          className={cn(
            "rounded-full bg-critical-bg px-2.5 py-1 text-xs font-medium text-critical transition-[opacity,translate,filter] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
            shown < 1 && "translate-y-1 opacity-0 blur-sm",
          )}
        >
          {t.preview.clash}
        </span>
      </div>

      <div className="relative grid sm:grid-cols-[9rem_1fr]">
        <div className="border-r border-b border-line max-sm:hidden" />
        <div className="grid border-b border-line" style={{ gridTemplateColumns: `repeat(${DAYS}, 1fr)` }}>
          {Array.from({ length: DAYS }, (_, day) => (
            <span key={day} className="py-2 text-center text-[11px] text-muted tabular-nums">
              {FIRST_DAY + day}
            </span>
          ))}
        </div>

        {ROWS.map((row) => (
          <div key={row.name} className="contents">
            <div className="flex items-center px-4 pt-3 text-xs font-medium text-muted sm:border-r sm:border-b sm:border-line sm:px-6 sm:pt-0 sm:text-[13px] sm:text-ink">
              <span className="truncate">{row.name}</span>
            </div>
            <div
              className="relative h-16 border-b border-line sm:h-20"
              style={{
                backgroundImage: "linear-gradient(to right, var(--line) 1px, transparent 1px)",
                backgroundSize: `${100 / DAYS}% 100%`,
              }}
            >
              {row.bars.some((bar) => bar.late) && (
                <span
                  aria-hidden
                  className={cn(
                    "grain absolute inset-y-2.5 z-10 rounded-xl bg-overlap shadow-[inset_0_1.5px_0_var(--glass-hi),0_12px_20px_-12px_var(--overlap)] transition-[opacity,scale] delay-300 duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:inset-y-3.5",
                    shown < 1 && "scale-y-50 opacity-0 delay-0",
                  )}
                  style={{ left: percent(4.5), width: percent(1) }}
                />
              )}
              {row.bars.map((bar) => {
                const visible = bar.late ? shown >= 1 : true;
                return (
                  <span
                    key={bar.label || bar.tone}
                    className={cn(
                      "grain absolute inset-y-2.5 flex items-center overflow-hidden rounded-xl px-2.5 text-xs font-medium sm:inset-y-3.5 sm:px-3",
                      "bg-[color-mix(in_oklab,var(--g)_56%,var(--panel))] [mix-blend-mode:var(--glass-blend)]",
                      "shadow-[inset_0_1.5px_0_var(--glass-hi),inset_0_0_0_1px_color-mix(in_oklab,var(--glass-hi)_50%,transparent),0_12px_20px_-12px_var(--g)]",

                      "transition-[opacity,translate,filter] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                      bar.tone === "block" && "hatch text-muted",
                      TONE[bar.tone],
                      !visible && "translate-x-16 opacity-0 blur-md",
                    )}
                    style={{
                      left: percent(bar.from + 0.5),
                      width: percent(bar.to - bar.from),
                      animation: bar.late
                        ? undefined
                        : `settle 0.9s cubic-bezier(0.16,1,0.3,1) ${bar.order * 140}ms both`,
                    }}
                  >
                    <span className={cn("truncate", bar.late && "ml-[25%]")}>
                      <span className="sm:hidden">{(bar.label || t.preview.plumber).split(" ")[0]}</span>
                      <span className="max-sm:hidden">{bar.label || t.preview.plumber}</span>
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        ))}

        {/* The reading for the scene: one figure, on its own card. */}
        <div className="grid items-center gap-6 p-5 sm:col-span-2 sm:min-h-52 sm:p-8 md:grid-cols-[1fr_minmax(0,22rem)]">
          <div aria-live="polite">
            <p className="font-display text-2xl leading-tight tracking-[-0.02em] text-balance sm:text-3xl">
              {scenes[shown].title}
            </p>
            <p className="mt-2 max-w-[46ch] text-[15px] leading-relaxed text-muted">
              {scenes[shown].caption}
            </p>
          </div>

          <div className="relative min-h-36">
            <Reading show={shown === 0}>
              <ul className="space-y-2.5 text-[13px]">
                {(["airbnb", "booking", "direct"] as const).map((tone) => (
                  <li key={tone} className="flex items-center gap-2.5">
                    <span aria-hidden className={cn("size-2.5 rounded-full bg-(--g)", TONE[tone])} />
                    <span className="flex-1 font-medium">
                      {tone === "direct" ? t.features.sync.direct : m.common.sources[tone]}
                    </span>
                    <span className="text-muted">
                      {tone === "direct"
                        ? t.features.sync.shared
                        : t.features.sync.synced(fmt.timeAgo(0, 4 * 60_000))}
                    </span>
                  </li>
                ))}
              </ul>
            </Reading>
            <Reading show={shown === 1}>
              <p className="flex items-center gap-2 text-[13px]">
                <Badge tone="critical">{t.features.suggestions.rows[0].label}</Badge>
                <span className="font-medium">{t.features.suggestions.rows[0].text}</span>
              </p>
              <p className="mt-3 text-[13px] leading-relaxed text-muted tabular-nums">
                Sam Wright · {m.common.sources.airbnb} · {night(1)} – {night(5)}
                <br />
                Ines Ferreira · {m.common.sources.booking} · {night(4)} – {night(8)}
              </p>
            </Reading>
            <Reading show={shown === 2}>
              <dl className="grid grid-cols-[1fr_auto] gap-y-1.5 text-[13px] tabular-nums">
                <dt className="text-muted">{t.features.money.revenue(m.common.count.nights(28))}</dt>
                <dd className="text-right">{euros(4609)}</dd>
                <dt className="text-muted">{t.features.money.cleaning(m.common.count.stays(9))}</dt>
                <dd className="text-right">−{euros(495)}</dd>
                <dt className="text-muted">{t.features.money.commission}</dt>
                <dd className="text-right">−{euros(324)}</dd>
                <dt className="text-muted">{t.features.money.bills}</dt>
                <dd className="text-right">−{euros(250)}</dd>
                <dt className="mt-1 border-t border-line pt-2 font-medium">{t.demo.net}</dt>
                <dd className="mt-1 border-t border-line pt-2 text-right text-base font-semibold">
                  {euros(3540)}
                </dd>
              </dl>
            </Reading>
            <Reading show={shown === 3}>
              <ul className="space-y-2.5 text-[13px]">
                {t.features.suggestions.rows.map((row) => (
                  <li key={row.text} className="flex items-center gap-2">
                    <Badge tone={row.tone}>{row.label}</Badge>
                    <span className="truncate">{row.text}</span>
                  </li>
                ))}
              </ul>
            </Reading>
          </div>
        </div>
      </div>

      <figcaption className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => setMode(playing ? "paused" : "playing")}
          aria-label={playing ? t.demo.pause : t.demo.play}
          title={playing ? t.demo.pause : t.demo.play}
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-ink text-inverse transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          {playing ? (
            <Pause aria-hidden className="size-4" fill="currentColor" strokeWidth={0} />
          ) : (
            <Play aria-hidden className="size-4 translate-x-px" fill="currentColor" strokeWidth={0} />
          )}
        </button>
        <div role="tablist" aria-label={t.demo.scenes} className="flex min-w-0 flex-1 gap-1.5">
          {scenes.map((item, index) => (
            <button
              key={item.title}
              type="button"
              role="tab"
              aria-selected={index === shown}
              aria-label={item.title}
              title={item.title}
              onClick={() => {
                setScene(index);
                setMode("paused");
              }}
              className="group flex h-9 min-w-0 flex-1 cursor-pointer items-center"
            >
              <span className="relative h-1 w-full overflow-hidden rounded-full bg-sunken transition-[height] duration-200 group-hover:h-1.5">
                <span
                  key={`${shown}-${playing}`}
                  className={cn(
                    "absolute inset-0 origin-left rounded-full bg-ink",
                    index > shown && "scale-x-0",
                    index === shown && playing && "animate-[fill_linear_both]",
                  )}
                  style={index === shown && playing ? { animationDuration: `${SCENE_MS}ms` } : undefined}
                />
              </span>
            </button>
          ))}
        </div>
        <span className="text-xs text-muted">{t.preview.example}</span>
      </figcaption>
    </figure>
  );
}

function Reading({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <div
      aria-hidden={!show}
      inert={!show}
      className={cn(
        "transition-[opacity,translate,filter] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:border-l md:border-line md:pl-8",
        show ? "relative" : "pointer-events-none absolute inset-x-0 top-0 translate-y-3 opacity-0 blur-sm",
      )}
    >
      {children}
    </div>
  );
}
