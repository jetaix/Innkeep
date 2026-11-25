import * as stylex from "@stylexjs/stylex";
import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import type { OtaChannel } from "@/db/schema";
import type { Night, PriceSuggestion } from "@/features/pricing/compute";
import type { Pricing } from "@/features/pricing/queries";
import { useI18n } from "../../i18n";
import { color, text } from "../../tokens.stylex";
import { buttonStyle } from "../../ui/button";
import { Card, Hidden, SectionTitle, SourceDot } from "../../ui/primitives";
import { cheaperOf } from "./gap";

const WIDE = "@media (min-width: 40rem)";

const styles = stylex.create({
  head: {
    padding: "0.875rem 1.25rem",
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: color.line,
  },
  subtitle: {
    maxWidth: "75ch",
    margin: "0.25rem 0 0",
    color: color.muted,
    fontSize: text.base,
    lineHeight: 1.5,
    textWrap: "pretty",
  },
  none: { margin: 0, padding: "1rem 1.25rem", color: color.muted, fontSize: text.base },
  foot: {
    margin: 0,
    padding: "0.75rem 1.25rem",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.line,
    color: color.muted,
    fontSize: text.sm,
  },
  // A wide table scrolls inside its own frame, never the page.
  scroll: { position: "relative", overflowX: "auto" },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "start",
    fontVariantNumeric: "tabular-nums",
  },
  th: { color: color.muted, fontSize: text.sm, fontWeight: 500, textAlign: "start", verticalAlign: "bottom" },
  row: { borderTopWidth: 1, borderTopStyle: "solid", borderTopColor: color.line },
  takenRow: { color: color.muted },
  // Wide enough for its five columns: on a phone it scrolls inside its frame.
  roomy: { minWidth: "46rem" },
  edge: { padding: "0.5rem 1.25rem" },
  cell: { padding: "0.5rem 0.75rem" },
  end: { textAlign: "end" },
  nowrap: { whiteSpace: "nowrap" },
  channel: { display: "inline-flex", alignItems: "center", gap: "0.375rem" },
  strong: { fontWeight: 500 },
  muted: { color: color.muted },
  faint: { color: color.faint },
  // The lower of two prices: heavier, and said in words.
  lower: { fontWeight: 600 },
  lowerLabel: { marginInlineEnd: "0.5rem", color: color.muted, fontSize: text.sm, fontWeight: 400 },
  small: { fontSize: text.sm },
  below: { display: "block", color: color.muted, fontSize: text.sm },
  note: { marginInlineStart: "0.5rem", color: color.muted, fontSize: text.sm },
  misaligned: { color: color.warn, fontWeight: 500 },
  advice: { fontSize: text.base },
  checks: { display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: "0.375rem" },
  // The nights to adjust
  list: { margin: 0, padding: 0, listStyle: "none" },
  item: {
    display: "grid",
    gridTemplateColumns: { default: "1fr", [WIDE]: "14rem 1fr" },
    columnGap: "1rem",
    rowGap: "0.125rem",
    padding: "0.6875rem 1.25rem",
    borderTopWidth: { default: 1, ":first-child": 0 },
    borderTopStyle: "solid",
    borderTopColor: color.line,
    fontSize: text.base,
  },
  when: { color: color.muted, fontVariantNumeric: "tabular-nums" },
});

const CHANNELS = ["airbnb", "booking"] as const;

/**
 * A few sample stays, comparing the calendar's nightly prices with the total
 * each platform shows a guest. Each check is one page the host opens; Innkeep
 * never loads Airbnb or Booking.com by itself.
 */
export function GuestChecks({
  pricing,
  currency,
  links,
  canOpen,
}: {
  pricing: Pick<Pricing, "coverage" | "guestChecks">;
  currency: string;
  /** The public listing for each sample stay, in the order of `pricing.guestChecks`. */
  links: Partial<Record<OtaChannel, string>>[];
  /** Whether the extension is switched on, so a page opened from here is read. */
  canOpen: boolean;
}) {
  const { m, fmt } = useI18n("pricing");
  const t = m.pricing.guest;
  if (!pricing.coverage.airbnb) return null;
  const money = (amount: number) => fmt.money(amount, currency, { cents: false });
  const rows = pricing.guestChecks.map((check, index) => ({ ...check, links: links[index] ?? {} }));

  return (
    <Card>
      <div {...stylex.props(styles.head)}>
        <SectionTitle>{t.title}</SectionTitle>
        <p {...stylex.props(styles.subtitle)}>{t.subtitle}</p>
      </div>
      {rows.length === 0 ? (
        <p {...stylex.props(styles.none)}>{t.none}</p>
      ) : (
        <div {...stylex.props(styles.scroll)}>
          <table {...stylex.props(styles.table, styles.roomy)}>
            <thead>
              <tr>
                <th scope="col" {...stylex.props(styles.th, styles.edge)}>
                  {t.stay}
                </th>
                <th scope="col" {...stylex.props(styles.th, styles.cell, styles.end)}>
                  {t.nightly}
                </th>
                {CHANNELS.map((channel) => (
                  <th key={channel} scope="col" {...stylex.props(styles.th, styles.cell, styles.end)}>
                    <span {...stylex.props(styles.channel)}>
                      <SourceDot source={channel} />
                      {t.shown(m.common.sources[channel])}
                    </span>
                  </th>
                ))}
                <th scope="col" {...stylex.props(styles.th, styles.cell, styles.end)}>
                  {t.difference}
                </th>
                <td {...stylex.props(styles.edge)} />
              </tr>
            </thead>
            <tbody>
              {rows.map((check) => {
                const { airbnb, booking } = check.quotes;
                const gap = airbnb && booking ? booking.total - airbnb.total : null;
                const cheaper = cheaperOf(airbnb?.total ?? null, booking?.total ?? null);
                return (
                  <tr key={check.checkIn} {...stylex.props(styles.row)}>
                    <td {...stylex.props(styles.edge, styles.nowrap)}>
                      {m.pricing.table.range(fmt.date(check.checkIn), fmt.date(check.checkOut))}
                    </td>
                    <td {...stylex.props(styles.cell, styles.end)}>
                      <span {...stylex.props(styles.strong)}>{money(check.nightly)}</span>
                      <span {...stylex.props(styles.below)}>{t.perNight(money(check.nightly / 3))}</span>
                    </td>
                    {CHANNELS.map((channel) => {
                      const quote = check.quotes[channel];
                      return (
                        <td key={channel} {...stylex.props(styles.cell, styles.end)}>
                          {quote ? (
                            <>
                              {cheaper === channel && (
                                <span {...stylex.props(styles.lowerLabel)}>{m.pricing.gap.lower}</span>
                              )}
                              <span {...stylex.props(cheaper === channel ? styles.lower : styles.strong)}>
                                {money(quote.total)}
                              </span>
                              <span {...stylex.props(styles.below)}>
                                {t.perNight(money(quote.total / 3))}
                              </span>
                              <span {...stylex.props(styles.below)}>
                                {quote.original ? `${t.was(money(quote.original))}, ` : ""}
                                {t.read(fmt.timeAgo(quote.seenAt))}
                              </span>
                            </>
                          ) : (
                            <span {...stylex.props(styles.muted, styles.small)}>{t.notChecked}</span>
                          )}
                        </td>
                      );
                    })}
                    <td {...stylex.props(styles.cell, styles.end, styles.nowrap, styles.muted)}>
                      {gap == null || !airbnb ? (
                        <span {...stylex.props(styles.faint)}>–</span>
                      ) : (
                        <>
                          {gap >= 0 ? "+" : "−"}
                          {money(Math.abs(gap))} ({gap >= 0 ? "+" : "−"}
                          {fmt.percent(Math.abs(gap) / airbnb.total)})
                        </>
                      )}
                    </td>
                    <td {...stylex.props(styles.edge)}>
                      <span {...stylex.props(styles.checks)}>
                        {CHANNELS.map((channel) =>
                          check.links[channel] ? (
                            <a
                              key={channel}
                              href={check.links[channel]}
                              target="_blank"
                              rel="noopener"
                              title={t.hint}
                              {...stylex.props(buttonStyle({ size: "sm" }))}
                            >
                              {t.check(m.common.sources[channel])}
                              <ExternalLink aria-hidden size={14} />
                              <Hidden>{m.common.actions.newTab}</Hidden>
                            </a>
                          ) : null,
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {canOpen && rows.length > 0 && !rows[0].links.booking && (
        <p {...stylex.props(styles.foot)}>{t.noBookingLink}</p>
      )}
    </Card>
  );
}

type Advice = { title: string; why?: string };

/** A suggestion in words: what to do and, when it helps, why. */
function useSuggestionText(currency: string) {
  const { m, fmt } = useI18n("pricing");
  const s = m.pricing.suggestion;
  const money = (amount: number) => fmt.money(amount, currency, { cents: false });
  return (suggestion: PriceSuggestion, night: Night): Advice => {
    switch (suggestion.kind) {
      case "align":
        return suggestion.direction === "raise"
          ? { title: s.raise(money(suggestion.target)), why: s.raiseWhy(money(night.airbnbNet ?? 0)) }
          : { title: s.lower(money(suggestion.target)), why: s.lowerWhy };
      case "lastMinute":
        return { title: s.lastMinute(fmt.percent(suggestion.percent)) };
      case "orphan":
        return { title: s.orphan(suggestion.nights) };
      case "belowHistory":
        return { title: s.belowHistory(money(suggestion.earned)) };
    }
  };
}

const TODO_LIMIT = 10;

/** The free nights worth a change, with nights in a row that call for the same thing shown as one line. */
export function ToAdjust({ nights, currency }: { nights: Night[]; currency: string }) {
  const { m, fmt } = useI18n("pricing");
  const t = m.pricing.todo;
  const describe = useSuggestionText(currency);
  const day = (date: string) => fmt.date(date, { weekday: "short", day: "numeric", month: "short" });

  const groups: ({ first: string; last: string; nights: number } & Advice)[] = [];
  nights.forEach((night, index) => {
    if (night.takenBy || !night.suggestion) return;
    const advice = describe(night.suggestion, night);
    const previous = groups.at(-1);
    if (previous && previous.title === advice.title && nights[index - 1]?.date === previous.last) {
      previous.last = night.date;
      previous.nights++;
    } else groups.push({ first: night.date, last: night.date, nights: 1, ...advice });
  });

  return (
    <Card>
      <div {...stylex.props(styles.head)}>
        <SectionTitle>{t.title}</SectionTitle>
        <p {...stylex.props(styles.subtitle)}>{t.subtitle}</p>
      </div>
      {groups.length === 0 ? (
        <p {...stylex.props(styles.none)}>{t.none}</p>
      ) : (
        <ul {...stylex.props(styles.list)}>
          {groups.slice(0, TODO_LIMIT).map((group) => (
            <li key={group.first} {...stylex.props(styles.item)}>
              <span {...stylex.props(styles.when)}>
                {group.nights === 1
                  ? day(group.first)
                  : `${m.pricing.table.range(day(group.first), day(group.last))} (${m.common.count.nights(group.nights)})`}
              </span>
              <span>
                <span {...stylex.props(styles.strong)}>{group.title}</span>
                {group.why && <span {...stylex.props(styles.muted)}>, {group.why}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
      {groups.length > TODO_LIMIT && (
        <p {...stylex.props(styles.foot)}>{t.more(groups.length - TODO_LIMIT)}</p>
      )}
    </Card>
  );
}

/** Consecutive taken nights held by the same source become one row; free nights stay one each. */
type Row =
  | { kind: "free"; night: Night }
  | { kind: "taken"; by: NonNullable<Night["takenBy"]>; first: Night; last: Night; nights: number };

function toRows(nights: Night[]): Row[] {
  const rows: Row[] = [];
  for (const night of nights) {
    const previous = rows.at(-1);
    if (!night.takenBy) rows.push({ kind: "free", night });
    else if (previous?.kind === "taken" && previous.by === night.takenBy) {
      previous.last = night;
      previous.nights++;
    } else rows.push({ kind: "taken", by: night.takenBy, first: night, last: night, nights: 1 });
  }
  return rows;
}

/** Every night of the period: the figures the chart draws, as text. */
export function NightTable({ nights, currency }: { nights: Night[]; currency: string }) {
  const { m, fmt } = useI18n("pricing");
  const t = m.pricing.table;
  const money = (amount: number | null) =>
    amount == null ? (
      <span {...stylex.props(styles.faint)}>–</span>
    ) : (
      fmt.money(amount, currency, { cents: false })
    );
  const day = (date: string) => fmt.date(date, { weekday: "short", day: "numeric", month: "short" });

  const describe = useSuggestionText(currency);

  return (
    <Card>
      <div {...stylex.props(styles.scroll)}>
        <table {...stylex.props(styles.table)}>
          <thead>
            <tr>
              <th scope="col" {...stylex.props(styles.th, styles.edge)}>
                {t.night}
              </th>
              {CHANNELS.map((channel) => (
                <th key={channel} scope="col" {...stylex.props(styles.th, styles.cell, styles.end)}>
                  <span {...stylex.props(styles.channel)}>
                    <SourceDot source={channel} />
                    {m.common.sources[channel]}
                  </span>
                </th>
              ))}
              <th scope="col" {...stylex.props(styles.th, styles.cell, styles.end)}>
                {t.gap}
              </th>
              <th scope="col" {...stylex.props(styles.th, styles.edge)}>
                {t.suggestion}
              </th>
            </tr>
          </thead>
          <tbody>
            {toRows(nights).map((row) =>
              row.kind === "taken" ? (
                <tr key={row.first.date} {...stylex.props(styles.row, styles.takenRow)}>
                  <td {...stylex.props(styles.edge, styles.nowrap)}>
                    {row.nights === 1
                      ? day(row.first.date)
                      : t.range(day(row.first.date), day(row.last.date))}
                  </td>
                  <td colSpan={4} {...stylex.props(styles.cell, styles.small)}>
                    {t.taken[row.by]}, {m.common.count.nights(row.nights)}
                  </td>
                </tr>
              ) : (
                <FreeNight
                  key={row.night.date}
                  night={row.night}
                  day={day}
                  money={money}
                  advice={row.night.suggestion ? describe(row.night.suggestion, row.night) : null}
                />
              ),
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function FreeNight({
  night,
  day,
  money,
  advice,
}: {
  night: Night;
  day: (date: string) => string;
  money: (amount: number | null) => ReactNode;
  advice: Advice | null;
}) {
  const { m } = useI18n("pricing");
  const priced = night.airbnb != null || night.booking != null;
  const cheaper = cheaperOf(night.airbnb, night.booking);
  return (
    <tr {...stylex.props(styles.row)}>
      <td {...stylex.props(styles.edge, styles.nowrap)}>
        {day(night.date)}
        {night.note && <span {...stylex.props(styles.note)}>{night.note}</span>}
      </td>
      {CHANNELS.map((channel) => (
        <td key={channel} {...stylex.props(styles.cell, styles.end, styles.nowrap)}>
          {cheaper === channel && <span {...stylex.props(styles.lowerLabel)}>{m.pricing.gap.lower}</span>}
          <span {...stylex.props(cheaper === channel && styles.lower)}>{money(night[channel])}</span>
        </td>
      ))}
      <td
        {...stylex.props(
          styles.cell,
          styles.end,
          styles.nowrap,
          night.suggestion?.kind === "align" ? styles.misaligned : styles.muted,
        )}
      >
        {night.gap == null ? (
          <span {...stylex.props(styles.faint, styles.small)}>{priced ? "–" : m.pricing.table.noPrice}</span>
        ) : (
          <>
            {night.gap > 0 ? "+" : night.gap < 0 ? "−" : ""}
            {money(Math.abs(night.gap))}
          </>
        )}
      </td>
      <td {...stylex.props(styles.edge, styles.advice)}>
        {advice ? (
          <>
            <span {...stylex.props(styles.strong)}>{advice.title}</span>
            {advice.why && <span {...stylex.props(styles.muted)}>, {advice.why}</span>}
          </>
        ) : null}
      </td>
    </tr>
  );
}
