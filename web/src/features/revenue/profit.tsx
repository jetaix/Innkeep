import * as stylex from "@stylexjs/stylex";
import type { Property, Reservation } from "@/db/schema";
import type { Cost } from "@/features/revenue/compute";
import { propertyProfit } from "@/features/revenue/profit";
import { today } from "@/lib/dates";
import { useI18n } from "../../i18n";
import { color, radius, text } from "../../tokens.stylex";
import { Badge, Card, SectionTitle } from "../../ui/primitives";
import { figureStyle } from "../../ui/slab";

const WIDE = "@media (min-width: 40rem)";

const styles = stylex.create({
  section: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  title: { paddingInline: "0.25rem" },
  cards: {
    display: "grid",
    gridTemplateColumns: { default: "minmax(0, 1fr)", [WIDE]: "repeat(auto-fit, minmax(18rem, 1fr))" },
    gap: "1rem",
  },
  card: { display: "flex", flexDirection: "column", gap: "1rem", padding: "1.125rem 1.25rem 1.25rem" },
  head: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.5rem",
  },
  name: { margin: 0, fontSize: text.md, fontWeight: 600 },
  verdict: { margin: 0, fontWeight: 400 },
  figure: { display: "block", fontSize: { default: "2.25rem", [WIDE]: "2.75rem" } },
  loss: { color: color.critical },
  sentence: { display: "block", marginTop: "0.125rem", fontSize: text.md },
  over: { display: "block", marginTop: "0.25rem", color: color.muted, fontSize: text.sm },
  lines: { display: "flex", flexDirection: "column", gap: "0.5rem", margin: 0 },
  line: {
    display: "grid",
    gridTemplateColumns: "4.5rem minmax(0, 1fr) auto",
    alignItems: "center",
    columnGap: "0.75rem",
  },
  term: { color: color.muted, fontSize: text.sm },
  track: { height: "0.625rem", borderRadius: radius.full, backgroundColor: color.sunken },
  bar: { height: "100%", minWidth: 2, borderRadius: radius.full },
  width: (ratio: number) => ({ width: `${ratio * 100}%` }),
  income: { backgroundColor: color.ink },
  // What goes out is drawn lighter than what comes in: two tones of ink, no colour.
  out: { backgroundColor: `color-mix(in oklab, ${color.ink} 38%, ${color.panel})` },
  amount: { margin: 0, fontVariantNumeric: "tabular-nums", textAlign: "end", whiteSpace: "nowrap" },
  total: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: "1rem",
    paddingTop: "0.75rem",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.line,
    fontWeight: 600,
  },
  unknown: { margin: 0, color: color.muted, lineHeight: 1.55 },
});

/**
 * The page's first answer, one card per property: does it pay for itself?
 * A verdict, what an average month leaves or costs, and the three amounts
 * behind it (income, charges, loan) as bars on one scale.
 */
export function ProfitCards({
  properties,
  stays,
  costs,
  currency,
}: {
  properties: Property[];
  stays: Reservation[];
  costs: Cost[];
  currency: string;
}) {
  const { m, fmt } = useI18n("revenue");
  const t = m.revenue.profit;
  const now = today();
  const money = (amount: number) => fmt.money(amount, currency, { cents: false });

  return (
    <section aria-labelledby="profit-heading" {...stylex.props(styles.section)}>
      <SectionTitle id="profit-heading" xstyle={styles.title}>
        {t.title}
      </SectionTitle>
      <div {...stylex.props(styles.cards)}>
        {properties.map((property) => {
          const profit = propertyProfit({ today: now, property, properties, stays, costs });
          const { monthly } = profit;
          const scale = Math.max(1, monthly.income, monthly.charges, monthly.loan);
          const rows = [
            { key: "income", label: t.income, amount: monthly.income, sign: "", tone: styles.income },
            { key: "charges", label: t.charges, amount: monthly.charges, sign: "−", tone: styles.out },
            { key: "loan", label: t.loan, amount: monthly.loan, sign: "−", tone: styles.out },
          ] as const;
          return (
            <Card key={property.id} xstyle={styles.card}>
              <div {...stylex.props(styles.head)}>
                <h3 {...stylex.props(styles.name)}>{property.name}</h3>
                {profit.profitable !== null && (
                  <Badge tone={profit.profitable ? "good" : "critical"}>
                    {profit.profitable ? t.yes : t.no}
                  </Badge>
                )}
              </div>
              {profit.profitable === null ? (
                <p {...stylex.props(styles.unknown)}>
                  <strong>{t.unknown}.</strong> {t.unknownBody}
                </p>
              ) : (
                <>
                  <p {...stylex.props(styles.verdict)}>
                    <span {...stylex.props(figureStyle, styles.figure, !profit.profitable && styles.loss)}>
                      {profit.profitable ? "+" : ""}
                      {money(profit.profitable ? monthly.net : Math.abs(monthly.net))}
                    </span>
                    <span {...stylex.props(styles.sentence)}>{profit.profitable ? t.leaves : t.costs}</span>
                    <span {...stylex.props(styles.over)}>{t.over(profit.months)}</span>
                  </p>
                  <dl
                    aria-label={t.bars(money(monthly.income), money(monthly.charges), money(monthly.loan))}
                    {...stylex.props(styles.lines)}
                  >
                    {rows.map((row) => (
                      <div key={row.key} {...stylex.props(styles.line)}>
                        <dt {...stylex.props(styles.term)}>{row.label}</dt>
                        <div aria-hidden {...stylex.props(styles.track)}>
                          {row.amount > 0 && (
                            <div {...stylex.props(styles.bar, row.tone, styles.width(row.amount / scale))} />
                          )}
                        </div>
                        <dd {...stylex.props(styles.amount)}>
                          {row.amount > 0 ? row.sign : ""}
                          {money(row.amount)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <p {...stylex.props(styles.total)}>
                    <span>{monthly.net < 0 ? t.short : t.left}</span>
                    <span {...stylex.props(styles.amount, monthly.net < 0 && styles.loss)}>
                      {money(Math.abs(monthly.net))}
                    </span>
                  </p>
                </>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}
