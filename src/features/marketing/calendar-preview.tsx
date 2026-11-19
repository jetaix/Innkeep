import type { Messages } from "@/i18n/messages";
import { getI18n } from "@/i18n/server";
import { cn } from "@/lib/cn";

/**
 * A static, illustrative slice of the calendar for the landing page. Built
 * from the same visual language as the real one (tinted bar, solid channel
 * edge) so the page shows the product, not a drawing of it.
 */

const DAYS = 14;
const FIRST_DATE = "2026-03-09"; // a Monday
const FIRST_DAY = 9;

const TONE = {
  airbnb: "border-airbnb bg-[color-mix(in_oklab,var(--airbnb)_18%,var(--bg))]",
  booking: "border-booking bg-[color-mix(in_oklab,var(--booking)_18%,var(--bg))]",
  direct: "border-direct bg-[color-mix(in_oklab,var(--direct)_18%,var(--bg))]",
  block: "border-block bg-sunken hatch text-muted",
} as const;

type Bar = { label: string; tone: keyof typeof TONE; from: number; to: number; clash?: boolean };

const rows = (t: Messages["marketing"]["preview"]): { name: string; bars: Bar[] }[] => [
  {
    name: "Canal Loft",
    bars: [
      { label: "Léa Martin", tone: "airbnb", from: 0, to: 3 },
      { label: "J. Novak", tone: "booking", from: 3, to: 7 },
      { label: "Claire Fontaine", tone: "direct", from: 8, to: 12 },
    ],
  },
  {
    name: "Harbour Studio",
    bars: [
      { label: "Sam Wright", tone: "airbnb", from: 1, to: 5, clash: true },
      { label: "Ines Ferreira", tone: "booking", from: 4, to: 8, clash: true },
      { label: t.plumber, tone: "block", from: 10, to: 12 },
    ],
  },
];

const percent = (days: number) => `${(days / DAYS) * 100}%`;

export async function CalendarPreview() {
  const { m, fmt } = await getI18n();
  const t = m.marketing.preview;
  const ROWS = rows(t);
  const month = fmt.date(FIRST_DATE, { month: "long" });
  const legend = { ...m.common.sources, block: t.blocked };
  return (
    <figure className="overflow-hidden rounded-xl border border-line bg-bg shadow-pop">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5 text-xs">
        <span className="font-semibold">{month.charAt(0).toUpperCase() + month.slice(1)}</span>
        <span className="animate-rise rounded-full bg-critical-bg px-2 py-0.5 font-medium text-critical [animation-delay:1.3s]">
          {t.clash}
        </span>
      </div>

      <div className="grid grid-cols-[5.5rem_1fr] sm:grid-cols-[9rem_1fr]">
        <div className="border-r border-line" />
        <div className="flex border-b border-line text-center text-[11px] text-muted" aria-hidden>
          {Array.from({ length: DAYS }, (_, index) => (
            <span key={index} className={cn("flex-1 py-1.5 tabular-nums", index % 7 >= 5 && "bg-subtle")}>
              {FIRST_DAY + index}
            </span>
          ))}
        </div>

        {ROWS.map((row, rowIndex) => (
          <div key={row.name} className="contents">
            <div className="flex h-14 items-center border-r border-line px-3 text-xs font-medium not-last:border-b sm:text-[13px]">
              <span className="truncate">{row.name}</span>
            </div>
            <div className={cn("relative h-14", rowIndex < ROWS.length - 1 && "border-b border-line")}>
              <div className="absolute inset-0 flex" aria-hidden>
                {Array.from({ length: DAYS }, (_, index) => (
                  <span
                    key={index}
                    className={cn(
                      "flex-1 border-r border-line/60 last:border-r-0",
                      index % 7 >= 5 && "bg-subtle",
                    )}
                  />
                ))}
              </div>
              {row.bars.map((bar, barIndex) => (
                <span
                  key={bar.label}
                  style={{
                    left: `calc(${percent(bar.from + 0.5)} + 1px)`,
                    width: `calc(${percent(bar.to - bar.from)} - 2px)`,
                    animationDelay: `${0.25 + (rowIndex * 3 + barIndex) * 0.12}s`,
                  }}
                  className={cn(
                    "absolute top-2.5 flex h-9 origin-left animate-grow items-center overflow-hidden rounded-[5px] border-l-[3px] px-2 text-xs font-medium",
                    TONE[bar.tone],
                    bar.clash && "ring-2 ring-critical",
                  )}
                >
                  <span className="truncate">{bar.label}</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <figcaption className="flex flex-wrap gap-x-5 gap-y-1 border-t border-line px-4 py-2.5 text-xs text-muted">
        {(["airbnb", "booking", "direct", "block"] as const).map((tone) => (
          <span key={tone} className="flex items-center gap-1.5">
            <span aria-hidden className={cn("h-3 w-3.5 rounded-[3px] border-l-[3px]", TONE[tone])} />
            {legend[tone]}
          </span>
        ))}
        <span className="ml-auto">{t.example}</span>
      </figcaption>
    </figure>
  );
}
