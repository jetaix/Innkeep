import * as stylex from "@stylexjs/stylex";
import { useMutation } from "@tanstack/react-query";
import type { Loan, Property } from "@/db/schema";
import { formatMonth } from "@/features/revenue/compute";
import { loanState } from "@/features/revenue/loans";
import { INTL_LOCALE } from "@/i18n/config";
import { today } from "@/lib/dates";
import { addLoan, deleteLoan } from "../../api/mutations";
import { useI18n } from "../../i18n";
import { color, radius, text } from "../../tokens.stylex";
import { ConfirmButton, SubmitButton } from "../../ui/actions";
import { Field, Input, Select } from "../../ui/form";
import { Badge, Notice } from "../../ui/primitives";

const styles = stylex.create({
  item: {
    display: "flex",
    flexDirection: "column",
    gap: "0.625rem",
    paddingBlock: "0.875rem",
    borderTopWidth: { default: 1, ":first-child": 0 },
    borderTopStyle: "solid",
    borderTopColor: color.line,
  },
  top: { display: "flex", alignItems: "flex-start", gap: "0.75rem" },
  what: { flexBasis: 0, flexGrow: 1, flexShrink: 1, minWidth: 0 },
  name: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "0.5rem",
    margin: 0,
    fontWeight: 500,
  },
  terms: { margin: 0, color: color.muted, fontSize: text.sm },
  pays: { textAlign: "end", fontVariantNumeric: "tabular-nums" },
  payment: { margin: 0, fontWeight: 500, whiteSpace: "nowrap" },
  small: { margin: 0, color: color.muted, fontSize: text.sm },
  meter: { height: "0.375rem", overflow: "hidden", borderRadius: radius.full, backgroundColor: color.sunken },
  fill: { height: "100%", borderRadius: radius.full, backgroundColor: color.ink },
  width: (ratio: number) => ({ width: `${ratio * 100}%` }),
  facts: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    margin: 0,
    fontSize: text.sm,
    fontVariantNumeric: "tabular-nums",
  },
  fact: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "1rem" },
  term: { color: color.muted },
  value: { margin: 0, textAlign: "end" },
  owed: { fontSize: text.md, fontWeight: 500 },
  month: { "::first-letter": { textTransform: "uppercase" } },
  below: { display: "block", color: color.muted },
  remove: { alignSelf: "flex-start" },
  form: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "0.75rem",
    paddingTop: "1.25rem",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.lineStrong,
  },
  formTitle: { margin: 0, fontSize: text.md, fontWeight: 600, letterSpacing: "-0.01em" },
  fields: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    columnGap: "0.75rem",
    rowGap: "0.875rem",
    alignSelf: "stretch",
  },
  both: { gridColumnStart: "span 2" },
  stretch: { alignSelf: "stretch" },
});

/** One loan: its terms, what it takes each month, and how far the repayment is. */
export function LoanRow({
  loan,
  properties,
  currency,
}: {
  loan: Loan;
  properties: Property[];
  currency: string;
}) {
  const { locale, m, fmt } = useI18n("revenue");
  const t = m.revenue.loans;
  const remove = useMutation(deleteLoan);
  const now = today();
  const state = loanState(loan, now);
  const fullDate = { day: "numeric", month: "short", year: "numeric" } as const;
  const rate = `${new Intl.NumberFormat(INTL_LOCALE[locale], { maximumFractionDigits: 2 }).format(
    loan.rate / 100,
  )}${locale === "fr" ? " %" : "%"}`;
  const repaid = loan.principal > 0 ? 1 - state.remaining / loan.principal : 0;

  return (
    <li {...stylex.props(styles.item)}>
      <div {...stylex.props(styles.top)}>
        <div {...stylex.props(styles.what)}>
          <p {...stylex.props(styles.name)}>
            {loan.label}
            {state.finished && <Badge tone="good">{t.finished}</Badge>}
          </p>
          <p {...stylex.props(styles.terms)}>
            {t.terms(fmt.money(loan.principal, currency, { cents: false }), rate, t.duration(loan.months))}
            {", "}
            {loan.propertyId
              ? properties.find((place) => place.id === loan.propertyId)?.name
              : m.revenue.charges.allProperties}
          </p>
        </div>
        <div {...stylex.props(styles.pays)}>
          <p {...stylex.props(styles.payment)}>{t.perMonth(fmt.money(state.monthlyCost, currency))}</p>
          {loan.insurance > 0 && (
            <p {...stylex.props(styles.small)}>{t.insurance(fmt.money(loan.insurance, currency))}</p>
          )}
        </div>
      </div>
      <div
        role="meter"
        aria-label={`${t.progress}, ${loan.label}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(repaid * 100)}
        {...stylex.props(styles.meter)}
      >
        <div {...stylex.props(styles.fill, styles.width(repaid))} />
      </div>
      <dl {...stylex.props(styles.facts)}>
        <div {...stylex.props(styles.fact)}>
          <dt {...stylex.props(styles.term)}>{t.remaining}</dt>
          <dd {...stylex.props(styles.value, styles.owed)}>{fmt.money(state.remaining, currency)}</dd>
        </div>
        <div {...stylex.props(styles.fact)}>
          <dt {...stylex.props(styles.term)}>{t.paid}</dt>
          <dd {...stylex.props(styles.value)}>
            {loan.startsOn <= now
              ? t.paidOf(state.paid, loan.months)
              : t.notStarted(fmt.date(loan.startsOn, fullDate))}
          </dd>
        </div>
        {state.capitalNow > 0 && (
          <div {...stylex.props(styles.fact)}>
            <dt {...stylex.props(styles.term)}>{t.thisMonth}</dt>
            <dd {...stylex.props(styles.value)}>
              {t.split(fmt.money(state.interestNow, currency), fmt.money(state.capitalNow, currency))}
            </dd>
          </div>
        )}
        <div {...stylex.props(styles.fact)}>
          <dt {...stylex.props(styles.term)}>{t.lastPayment}</dt>
          <dd {...stylex.props(styles.value, styles.month)}>
            {formatMonth(state.lastMonth, "long", INTL_LOCALE[locale])}
          </dd>
        </div>
        <div {...stylex.props(styles.fact)}>
          <dt {...stylex.props(styles.term)}>{t.cost}</dt>
          <dd {...stylex.props(styles.value)}>
            {fmt.money(state.cost, currency, { cents: false })}
            <span {...stylex.props(styles.below)}>{t.costNote}</span>
          </dd>
        </div>
      </dl>
      <div {...stylex.props(styles.remove)}>
        <ConfirmButton
          variant="ghost"
          size="sm"
          message={t.confirmRemove(loan.label)}
          pending={remove.isPending}
          onConfirm={() => remove.mutate(loan.id)}
        >
          {t.remove}
        </ConfirmButton>
      </div>
      {remove.error && (
        <Notice tone="critical" role="alert">
          {remove.error.message}
        </Notice>
      )}
    </li>
  );
}

export function LoanForm({ properties }: { properties: Property[] }) {
  const { m } = useI18n("revenue");
  const form = m.revenue.loans.form;
  const add = useMutation(addLoan);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const sent = event.currentTarget;
        // Amounts, the rate and the years go as typed: the server turns them into what is stored.
        add.mutate(Object.fromEntries(new FormData(sent)), { onSuccess: () => sent.reset() });
      }}
      {...stylex.props(styles.form)}
    >
      <h3 {...stylex.props(styles.formTitle)}>{form.title}</h3>
      <div {...stylex.props(styles.fields)}>
        <Field label={form.name} htmlFor="loan-label" xstyle={styles.both}>
          <Input id="loan-label" name="label" required placeholder={form.namePlaceholder} />
        </Field>
        <Field label={form.principal} htmlFor="loan-principal" xstyle={styles.both}>
          <Input id="loan-principal" name="principal" required inputMode="decimal" placeholder="200000" />
        </Field>
        <Field label={form.rate} htmlFor="loan-rate" hint={form.rateHint}>
          <Input id="loan-rate" name="rate" required inputMode="decimal" placeholder="3.85" />
        </Field>
        <Field label={form.years} htmlFor="loan-years" hint={form.yearsHint}>
          <Input id="loan-years" name="years" required inputMode="decimal" placeholder="20" />
        </Field>
        <Field label={form.startsOn} htmlFor="loan-startsOn">
          <Input id="loan-startsOn" name="startsOn" type="date" required defaultValue={today()} />
        </Field>
        <Field label={form.insurance} htmlFor="loan-insurance">
          <Input id="loan-insurance" name="insurance" inputMode="decimal" placeholder="30" />
        </Field>
        <Field label={form.property} htmlFor="loan-propertyId" xstyle={styles.both}>
          <Select id="loan-propertyId" name="propertyId" defaultValue="">
            <option value="">{m.revenue.charges.allProperties}</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {add.error && (
        <Notice tone="critical" role="alert" xstyle={styles.stretch}>
          {add.error.message}
        </Notice>
      )}
      <SubmitButton variant="primary" pending={add.isPending} pendingLabel={form.submitting}>
        {form.submit}
      </SubmitButton>
    </form>
  );
}
