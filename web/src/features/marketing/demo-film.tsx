import * as stylex from "@stylexjs/stylex";
import { Pause, Play } from "lucide-react";
import { type ReactNode, useEffect, useState, useSyncExternalStore } from "react";
import { useI18n } from "../../i18n";
import { color, font } from "../../tokens.stylex";
import { Badge } from "../../ui/primitives";
import { kit } from "./landing-kit";

// StyleX reads a media query only from the file that uses it.
const MD = "@media (min-width: 48rem)";
const SM = "@media (min-width: 40rem)";

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
const subscribeNever = () => () => {};

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

// Grain, so the colour reads as a material and not as a gradient.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E\")";

const settle = stylex.keyframes({ from: { opacity: 0, translate: "0 28px", filter: "blur(10px)" } });
const fill = stylex.keyframes({ from: { scale: "0 1" } });

const styles = stylex.create({
  film: {
    position: "relative",
    margin: 0,
    overflow: "hidden",
    borderRadius: "1.75rem",
    scrollMarginTop: "6rem",
  },
  head: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.75rem",
    paddingBlock: "0.75rem",
    paddingInline: { default: "1rem", [SM]: "1.5rem" },
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: color.line,
  },
  month: { fontSize: "0.8125rem", fontWeight: 500, textTransform: "capitalize" },
  clash: {
    padding: "0.25rem 0.625rem",
    borderRadius: "999px",
    backgroundColor: color.criticalBg,
    color: color.critical,
    fontSize: "0.75rem",
    fontWeight: 500,
    lineHeight: 1.3333,
    transitionProperty: "opacity, translate, filter",
    transitionDuration: "500ms",
    transitionTimingFunction: EASE,
  },
  clashAway: { opacity: 0, translate: "0 0.25rem", filter: "blur(8px)" },
  calendar: {
    position: "relative",
    display: "grid",
    gridTemplateColumns: { default: "minmax(0, 1fr)", [SM]: "9rem minmax(0, 1fr)" },
  },
  corner: {
    display: { default: "none", [SM]: "block" },
    borderInlineEndWidth: 1,
    borderInlineEndStyle: "solid",
    borderInlineEndColor: color.line,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: color.line,
  },
  days: {
    display: "grid",
    gridTemplateColumns: `repeat(${DAYS}, 1fr)`,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: color.line,
  },
  day: {
    paddingBlock: "0.5rem",
    color: color.muted,
    fontSize: "0.6875rem",
    fontVariantNumeric: "tabular-nums",
    textAlign: "center",
  },
  row: { display: "contents" },
  place: {
    display: "flex",
    alignItems: "center",
    paddingTop: { default: "0.75rem", [SM]: 0 },
    paddingInline: { default: "1rem", [SM]: "1.5rem" },
    borderInlineEndWidth: { default: 0, [SM]: 1 },
    borderInlineEndStyle: "solid",
    borderInlineEndColor: color.line,
    borderBottomWidth: { default: 0, [SM]: 1 },
    borderBottomStyle: "solid",
    borderBottomColor: color.line,
    color: { default: color.muted, [SM]: color.ink },
    fontSize: { default: "0.75rem", [SM]: "0.8125rem" },
    fontWeight: 500,
  },
  truncate: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  track: {
    position: "relative",
    height: { default: "4rem", [SM]: "5rem" },
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: color.line,
    backgroundImage: `linear-gradient(to right, ${color.line} 1px, transparent 1px)`,
    backgroundSize: `${100 / DAYS}% 100%`,
  },
  // A slab on the timeline, with the grain of the glass.
  slab: {
    position: "absolute",
    insetBlock: { default: "0.625rem", [SM]: "0.875rem" },
    borderRadius: "0.75rem",
    "::after": {
      content: '""',
      position: "absolute",
      inset: 0,
      borderRadius: "inherit",
      backgroundImage: GRAIN,
      mixBlendMode: "soft-light",
      opacity: 0.95,
      pointerEvents: "none",
    },
  },
  // The nights two bookings share.
  overlap: {
    zIndex: 10,
    left: percent(4.5),
    width: percent(1),
    backgroundColor: color.overlap,
    boxShadow: `inset 0 1.5px 0 ${color.glassHi}, 0 12px 20px -12px ${color.overlap}`,
    transitionProperty: "opacity, scale",
    transitionDuration: "500ms",
    transitionDelay: "300ms",
    transitionTimingFunction: EASE,
  },
  overlapAway: { opacity: 0, scale: "1 0.5", transitionDelay: "0ms" },
  bar: {
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
    paddingInline: { default: "0.625rem", [SM]: "0.75rem" },
    backgroundColor: `color-mix(in oklab, var(--g) 56%, ${color.panel})`,
    mixBlendMode: color.glassBlend,
    boxShadow: `inset 0 1.5px 0 ${color.glassHi}, inset 0 0 0 1px color-mix(in oklab, ${color.glassHi} 50%, transparent), 0 12px 20px -12px var(--g)`,
    fontSize: "0.75rem",
    fontWeight: 500,
    lineHeight: 1.3333,
    transitionProperty: "opacity, translate, filter",
    transitionDuration: "700ms",
    transitionTimingFunction: EASE,
  },
  span: (left: string, width: string) => ({ left, width }),
  // The bookings that are there from the start arrive one after the other.
  arrives: (delay: string) => ({
    animationName: settle,
    animationDuration: "0.9s",
    animationTimingFunction: EASE,
    animationDelay: delay,
    animationFillMode: "both",
  }),
  barAway: { opacity: 0, translate: "4rem 0", filter: "blur(12px)" },
  hatch: {
    backgroundImage: `repeating-linear-gradient(135deg, transparent 0 5px, color-mix(in oklab, ${color.ink} 10%, transparent) 5px 6px)`,
    color: color.muted,
  },
  lateLabel: { marginInlineStart: "25%" },
  short: { display: { default: "inline", [SM]: "none" } },
  long: { display: { default: "none", [SM]: "inline" } },
  reading: {
    display: "grid",
    gridColumn: { default: null, [SM]: "span 2 / span 2" },
    gridTemplateColumns: { default: "minmax(0, 1fr)", [MD]: "1fr minmax(0, 22rem)" },
    alignItems: "center",
    gap: "1.5rem",
    minHeight: { default: null, [SM]: "13rem" },
    padding: { default: "1.25rem", [SM]: "2rem" },
  },
  title: {
    margin: 0,
    fontFamily: font.display,
    fontSize: { default: "1.5rem", [SM]: "1.875rem" },
    lineHeight: 1.25,
    letterSpacing: "-0.02em",
    textWrap: "balance",
  },
  caption: {
    maxWidth: "46ch",
    margin: "0.5rem 0 0",
    color: color.muted,
    fontSize: "0.9375rem",
    lineHeight: 1.625,
  },
  figures: { position: "relative", minHeight: "9rem" },
  figure: {
    paddingInlineStart: { default: 0, [MD]: "2rem" },
    borderInlineStartWidth: { default: 0, [MD]: 1 },
    borderInlineStartStyle: "solid",
    borderInlineStartColor: color.line,
    fontSize: "0.8125rem",
    transitionProperty: "opacity, translate, filter",
    transitionDuration: "500ms",
    transitionTimingFunction: EASE,
  },
  figureShown: { position: "relative" },
  figureAway: {
    position: "absolute",
    insetInline: 0,
    top: 0,
    opacity: 0,
    translate: "0 0.75rem",
    filter: "blur(8px)",
    pointerEvents: "none",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "0.625rem",
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
  item: { display: "flex", alignItems: "center", gap: "0.625rem" },
  tight: { gap: "0.5rem" },
  dot: {
    flexShrink: 0,
    width: "0.625rem",
    height: "0.625rem",
    borderRadius: "999px",
    backgroundColor: "var(--g)",
  },
  name: { flexGrow: 1, flexShrink: 1, flexBasis: "0%", fontWeight: 500 },
  strong: { fontWeight: 500 },
  muted: { color: color.muted },
  flagged: { display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 },
  nights: {
    margin: "0.75rem 0 0",
    color: color.muted,
    fontVariantNumeric: "tabular-nums",
    lineHeight: 1.625,
  },
  sums: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    rowGap: "0.375rem",
    margin: 0,
    fontVariantNumeric: "tabular-nums",
  },
  amount: { margin: 0, textAlign: "right" },
  total: {
    marginTop: "0.25rem",
    paddingTop: "0.5rem",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.line,
  },
  net: { fontSize: "1rem", fontWeight: 600 },
  controls: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "0.75rem",
    paddingBlock: "0.75rem",
    paddingInline: { default: "1rem", [SM]: "1.5rem" },
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.line,
  },
  play: {
    display: "flex",
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    width: "2.25rem",
    height: "2.25rem",
    padding: 0,
    borderWidth: 0,
    borderRadius: "999px",
    backgroundColor: color.ink,
    color: color.inverse,
    cursor: "pointer",
    scale: { default: null, ":hover": "1.05", ":active": "0.95" },
    transitionProperty: "scale",
    transitionDuration: "200ms",
  },
  // The triangle looks centred one pixel to the right of where it is.
  nudge: { translate: "1px 0" },
  scenes: { display: "flex", flexGrow: 1, flexShrink: 1, flexBasis: "0%", gap: "0.375rem", minWidth: 0 },
  scene: {
    // The line inside thickens under the pointer.
    "--line-height": { default: "0.25rem", ":hover": "0.375rem" },
    display: "flex",
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "0%",
    alignItems: "center",
    minWidth: 0,
    height: "2.25rem",
    padding: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
    cursor: "pointer",
  },
  line: {
    position: "relative",
    width: "100%",
    height: "var(--line-height)",
    overflow: "hidden",
    borderRadius: "999px",
    backgroundColor: color.sunken,
    transitionProperty: "height",
    transitionDuration: "200ms",
  },
  progress: {
    position: "absolute",
    inset: 0,
    borderRadius: "999px",
    backgroundColor: color.ink,
    transformOrigin: "left",
  },
  ahead: { scale: "0 1" },
  running: {
    animationName: fill,
    animationDuration: `${SCENE_MS}ms`,
    animationTimingFunction: "linear",
    animationFillMode: "both",
  },
  example: { color: color.muted, fontSize: "0.75rem", lineHeight: 1.3333 },
});

const tones = stylex.create({
  airbnb: { "--g": color.airbnb },
  booking: { "--g": color.booking },
  direct: { "--g": color.direct },
  block: { "--g": color.block },
});

export function DemoFilm() {
  const { m, fmt } = useI18n("marketing");
  const t = m.marketing;
  const scenes = t.demo.scenesList;
  const count = scenes.length;
  const reduced = useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );
  // False in the page as it is written to a file and until the browser has taken it over: that
  // picture is the first scene, complete and still, and the progress line waits for its timer.
  const live = useSyncExternalStore(
    subscribeNever,
    () => true,
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
    <figure id="demo" aria-label={t.demo.label} data-scene={shown} {...stylex.props(kit.panel, styles.film)}>
      <div {...stylex.props(styles.head)}>
        <span {...stylex.props(styles.month)}>{month}</span>
        <span aria-hidden={shown < 1} {...stylex.props(styles.clash, shown < 1 && styles.clashAway)}>
          {t.preview.clash}
        </span>
      </div>

      <div {...stylex.props(styles.calendar)}>
        <div {...stylex.props(styles.corner)} />
        <div {...stylex.props(styles.days)}>
          {Array.from({ length: DAYS }, (_, day) => (
            <span key={day} {...stylex.props(styles.day)}>
              {FIRST_DAY + day}
            </span>
          ))}
        </div>

        {ROWS.map((row) => (
          <div key={row.name} {...stylex.props(styles.row)}>
            <div {...stylex.props(styles.place)}>
              <span {...stylex.props(styles.truncate)}>{row.name}</span>
            </div>
            <div {...stylex.props(styles.track)}>
              {row.bars.some((bar) => bar.late) && (
                <span
                  aria-hidden
                  {...stylex.props(styles.slab, styles.overlap, shown < 1 && styles.overlapAway)}
                />
              )}
              {row.bars.map((bar) => {
                const visible = bar.late ? shown >= 1 : true;
                return (
                  <span
                    key={bar.label || bar.tone}
                    {...stylex.props(
                      styles.slab,
                      styles.bar,
                      bar.tone === "block" && styles.hatch,
                      tones[bar.tone],
                      styles.span(percent(bar.from + 0.5), percent(bar.to - bar.from)),
                      !bar.late && styles.arrives(`${bar.order * 140}ms`),
                      !visible && styles.barAway,
                    )}
                  >
                    <span {...stylex.props(styles.truncate, bar.late && styles.lateLabel)}>
                      <span {...stylex.props(styles.short)}>
                        {(bar.label || t.preview.plumber).split(" ")[0]}
                      </span>
                      <span {...stylex.props(styles.long)}>{bar.label || t.preview.plumber}</span>
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        ))}

        {/* The reading for the scene: one figure, on its own card. */}
        <div {...stylex.props(styles.reading)}>
          <div aria-live="polite">
            <p {...stylex.props(styles.title)}>{scenes[shown].title}</p>
            <p {...stylex.props(styles.caption)}>{scenes[shown].caption}</p>
          </div>

          <div {...stylex.props(styles.figures)}>
            <Reading show={shown === 0}>
              <ul {...stylex.props(styles.list)}>
                {(["airbnb", "booking", "direct"] as const).map((tone) => (
                  <li key={tone} {...stylex.props(styles.item)}>
                    <span aria-hidden {...stylex.props(styles.dot, tones[tone])} />
                    <span {...stylex.props(styles.name)}>
                      {tone === "direct" ? t.features.sync.direct : m.common.sources[tone]}
                    </span>
                    <span {...stylex.props(styles.muted)}>
                      {tone === "direct"
                        ? t.features.sync.shared
                        : t.features.sync.synced(fmt.timeAgo(0, 4 * 60_000))}
                    </span>
                  </li>
                ))}
              </ul>
            </Reading>
            <Reading show={shown === 1}>
              <p {...stylex.props(styles.flagged)}>
                <Badge tone="critical">{t.features.suggestions.rows[0].label}</Badge>
                <span {...stylex.props(styles.strong)}>{t.features.suggestions.rows[0].text}</span>
              </p>
              <p {...stylex.props(styles.nights)}>
                Sam Wright · {m.common.sources.airbnb} · {night(1)} – {night(5)}
                <br />
                Ines Ferreira · {m.common.sources.booking} · {night(4)} – {night(8)}
              </p>
            </Reading>
            <Reading show={shown === 2}>
              <dl {...stylex.props(styles.sums)}>
                <dt {...stylex.props(styles.muted)}>{t.features.money.revenue(m.common.count.nights(28))}</dt>
                <dd {...stylex.props(styles.amount)}>{euros(4609)}</dd>
                <dt {...stylex.props(styles.muted)}>{t.features.money.cleaning(m.common.count.stays(9))}</dt>
                <dd {...stylex.props(styles.amount)}>−{euros(495)}</dd>
                <dt {...stylex.props(styles.muted)}>{t.features.money.commission}</dt>
                <dd {...stylex.props(styles.amount)}>−{euros(324)}</dd>
                <dt {...stylex.props(styles.muted)}>{t.features.money.bills}</dt>
                <dd {...stylex.props(styles.amount)}>−{euros(250)}</dd>
                <dt {...stylex.props(styles.total, styles.strong)}>{t.demo.net}</dt>
                <dd {...stylex.props(styles.amount, styles.total, styles.net)}>{euros(3540)}</dd>
              </dl>
            </Reading>
            <Reading show={shown === 3}>
              <ul {...stylex.props(styles.list)}>
                {t.features.suggestions.rows.map((row) => (
                  <li key={row.text} {...stylex.props(styles.item, styles.tight)}>
                    <Badge tone={row.tone}>{row.label}</Badge>
                    <span {...stylex.props(styles.truncate)}>{row.text}</span>
                  </li>
                ))}
              </ul>
            </Reading>
          </div>
        </div>
      </div>

      <figcaption {...stylex.props(styles.controls)}>
        <button
          type="button"
          onClick={() => setMode(playing ? "paused" : "playing")}
          aria-label={playing ? t.demo.pause : t.demo.play}
          title={playing ? t.demo.pause : t.demo.play}
          {...stylex.props(styles.play)}
        >
          {playing ? (
            <Pause aria-hidden size={16} fill="currentColor" strokeWidth={0} />
          ) : (
            <Play aria-hidden size={16} fill="currentColor" strokeWidth={0} {...stylex.props(styles.nudge)} />
          )}
        </button>
        <div role="tablist" aria-label={t.demo.scenes} {...stylex.props(styles.scenes)}>
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
              {...stylex.props(styles.scene)}
            >
              <span {...stylex.props(styles.line)}>
                <span
                  key={`${shown}-${playing}-${live}`}
                  {...stylex.props(
                    styles.progress,
                    index > shown && styles.ahead,
                    index === shown && playing && live && styles.running,
                  )}
                />
              </span>
            </button>
          ))}
        </div>
        <span {...stylex.props(styles.example)}>{t.preview.example}</span>
      </figcaption>
    </figure>
  );
}

function Reading({ show, children }: { show: boolean; children: ReactNode }) {
  return (
    <div
      aria-hidden={!show}
      inert={!show}
      {...stylex.props(styles.figure, show ? styles.figureShown : styles.figureAway)}
    >
      {children}
    </div>
  );
}
