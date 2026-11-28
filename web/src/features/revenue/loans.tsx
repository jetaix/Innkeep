import * as stylex from "@stylexjs/stylex";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import type { Loan, LoanPayment, Property } from "@/db/schema";
import { formatMonth } from "@/features/revenue/compute";
import { loanState } from "@/features/revenue/loans";
import { INTL_LOCALE } from "@/i18n/config";
import { today } from "@/lib/dates";
import { addLoan, clearSchedule, deleteLoan, importSchedule, updateLoan } from "../../api/mutations";
import { useI18n } from "../../i18n";
import { color, font, radius, text } from "../../tokens.stylex";
import { ConfirmButton, SubmitButton } from "../../ui/actions";
import { Button } from "../../ui/button";
import { Field, Input, Select, Textarea } from "../../ui/form";
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
  table: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  tableForm: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  // Figures in columns read best in a face where every digit is as wide as the next.
  pasted: { fontFamily: font.mono, fontSize: { default: text.field, "@media (min-width: 48rem)": text.sm } },
  file: { maxWidth: "100%", fontSize: text.sm },
  actions: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" },
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

/** A loan with the lines of its bank's table, when one was imported. */
export type LoanWithTable = Loan & { schedule: LoanPayment[] };

/** One loan: its terms, what it takes each month, and how far the repayment is. */
export function LoanRow({
  loan,
  properties,
  currency,
}: {
  loan: LoanWithTable;
  properties: Property[];
  currency: string;
}) {
  const { locale, m, fmt } = useI18n("revenue");
  const t = m.revenue.loans;
  const remove = useMutation(deleteLoan);
  const [editing, setEditing] = useState(false);
  const now = today();
  const state = loanState(loan, now, loan.schedule);
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
            {t.terms(fmt.money(loan.principal, currency, { cents: false }), rate, t.duration(state.total))}
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
              ? t.paidOf(state.paid, state.total)
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
      <ScheduleImport loan={loan} />
      {editing ? (
        <LoanForm
          properties={properties}
          loan={loan}
          payment={state.monthlyCost}
          onDone={() => setEditing(false)}
        />
      ) : (
        <div {...stylex.props(styles.actions)}>
          <Button size="sm" onClick={() => setEditing(true)}>
            {t.edit}
          </Button>
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
      )}
      {remove.error && (
        <Notice tone="critical" role="alert">
          {remove.error.message}
        </Notice>
      )}
    </li>
  );
}

/**
 * The bank's own amortisation table for a loan: pasted or read from a file,
 * sent as text, and read on the server. Once imported it replaces the
 * computed payments in every figure.
 */
function ScheduleImport({ loan }: { loan: LoanWithTable }) {
  const { m, fmt } = useI18n("revenue");
  const t = m.revenue.loans.table;
  const [open, setOpen] = useState(false);
  const [table, setTable] = useState("");
  const send = useMutation(importSchedule);
  const clear = useMutation(clearSchedule);
  const [unreadable, setUnreadable] = useState(false);
  const fullDate = { day: "numeric", month: "short", year: "numeric" } as const;
  const lines = loan.schedule;

  /** Puts the file's lines in the field, for the host to see before importing. A PDF is read here, in the browser. */
  async function read(file: File) {
    setUnreadable(false);
    try {
      const pdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
      setTable(pdf ? await (await import("./pdf-text")).pdfText(file) : await file.text());
    } catch {
      setUnreadable(true);
    }
  }
  const field = `loan-${loan.id}-table`;
  // The server names what it could not do; anything else is said as it came.
  const problem = send.error
    ? send.error.message.includes("table-empty")
      ? t.problem.empty
      : send.error.message.includes("table-columns")
        ? t.problem.columns
        : send.error.message
    : unreadable
      ? t.problem.file
      : clear.error?.message;

  return (
    <div {...stylex.props(styles.table)}>
      {lines.length > 0 && (
        <p {...stylex.props(styles.small)}>
          {t.imported(
            lines.length,
            fmt.date(lines[0].date, fullDate),
            fmt.date(lines[lines.length - 1].date, fullDate),
          )}
        </p>
      )}
      {open ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            send.mutate(
              { loan: loan.id, table },
              {
                onSuccess: () => {
                  setTable("");
                  setOpen(false);
                },
              },
            );
          }}
          {...stylex.props(styles.tableForm)}
        >
          <Field label={t.label} htmlFor={field} hint={t.hint}>
            <Textarea
              id={field}
              rows={6}
              required
              value={table}
              placeholder={t.placeholder}
              onChange={(event) => setTable(event.currentTarget.value)}
              xstyle={styles.pasted}
            />
          </Field>
          <Field label={t.file} htmlFor={`${field}-file`}>
            <input
              id={`${field}-file`}
              type="file"
              accept=".pdf,.csv,.tsv,.txt,application/pdf,text/csv,text/plain"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (file) void read(file);
              }}
              {...stylex.props(styles.file)}
            />
          </Field>
          <div {...stylex.props(styles.actions)}>
            <SubmitButton variant="primary" size="sm" pending={send.isPending} pendingLabel={t.submitting}>
              {t.submit}
            </SubmitButton>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              {t.cancel}
            </Button>
          </div>
        </form>
      ) : (
        <div {...stylex.props(styles.actions)}>
          <Button size="sm" title={t.why} onClick={() => setOpen(true)}>
            {lines.length > 0 ? t.replace : t.import}
          </Button>
          {lines.length > 0 && (
            <ConfirmButton
              variant="ghost"
              size="sm"
              message={t.confirmClear(loan.label)}
              pending={clear.isPending}
              onConfirm={() => clear.mutate(loan.id)}
            >
              {t.clear}
            </ConfirmButton>
          )}
        </div>
      )}
      {problem && (
        <Notice tone="critical" role="alert">
          {problem}
        </Notice>
      )}
    </div>
  );
}

/** An amount as it is typed in a field: 123456 minor units is "1234.56", and 120000 is "1200". */
const typed = (amount: number) => String(amount / 100);

/**
 * Adds a loan, or changes the one given. The monthly payment is the
 * borrower's to type: `payment` is only what an older loan shows to start from.
 */
export function LoanForm({
  properties,
  loan,
  payment,
  onDone,
}: {
  properties: Property[];
  loan?: Loan;
  payment?: number;
  onDone?: () => void;
}) {
  const { m } = useI18n("revenue");
  const form = m.revenue.loans.form;
  const add = useMutation(addLoan);
  const update = useMutation(updateLoan);
  const saving = loan ? update : add;
  // Two forms can be on the page at once: each field's id names its loan.
  const id = (name: string) => `loan-${loan?.id ?? "new"}-${name}`;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const sent = event.currentTarget;
        // Amounts, the rate and the years go as typed: the server turns them into what is stored.
        const json = Object.fromEntries(new FormData(sent));
        if (loan) update.mutate({ loan: loan.id, json }, { onSuccess: onDone });
        else add.mutate(json, { onSuccess: () => sent.reset() });
      }}
      {...stylex.props(styles.form)}
    >
      <h3 {...stylex.props(styles.formTitle)}>{loan ? form.editTitle(loan.label) : form.title}</h3>
      <div {...stylex.props(styles.fields)}>
        <Field label={form.name} htmlFor={id("label")} xstyle={styles.both}>
          <Input
            id={id("label")}
            name="label"
            required
            defaultValue={loan?.label}
            placeholder={form.namePlaceholder}
          />
        </Field>
        <Field label={form.principal} htmlFor={id("principal")} xstyle={styles.both}>
          <Input
            id={id("principal")}
            name="principal"
            required
            inputMode="decimal"
            defaultValue={loan && typed(loan.principal)}
            placeholder="200000"
          />
        </Field>
        <Field label={form.payment} htmlFor={id("payment")} hint={form.paymentHint} xstyle={styles.both}>
          <Input
            id={id("payment")}
            name="payment"
            required
            inputMode="decimal"
            defaultValue={payment != null ? typed(payment) : undefined}
            placeholder="1230"
          />
        </Field>
        <Field label={form.insurance} htmlFor={id("insurance")} xstyle={styles.both}>
          <Input
            id={id("insurance")}
            name="insurance"
            inputMode="decimal"
            defaultValue={loan && loan.insurance > 0 ? typed(loan.insurance) : undefined}
            placeholder="30"
          />
        </Field>
        <Field label={form.rate} htmlFor={id("rate")} hint={form.rateHint}>
          <Input
            id={id("rate")}
            name="rate"
            required
            inputMode="decimal"
            defaultValue={loan && String(loan.rate / 100)}
            placeholder="3.85"
          />
        </Field>
        <Field label={form.years} htmlFor={id("years")} hint={form.yearsHint}>
          <Input
            id={id("years")}
            name="years"
            required
            inputMode="decimal"
            defaultValue={loan && String(Math.round((loan.months / 12) * 1000) / 1000)}
            placeholder="20"
          />
        </Field>
        <Field label={form.startsOn} htmlFor={id("startsOn")} xstyle={styles.both}>
          <Input
            id={id("startsOn")}
            name="startsOn"
            type="date"
            required
            defaultValue={loan?.startsOn ?? today()}
          />
        </Field>
        <Field label={form.property} htmlFor={id("propertyId")} xstyle={styles.both}>
          <Select id={id("propertyId")} name="propertyId" defaultValue={loan?.propertyId ?? ""}>
            <option value="">{m.revenue.charges.allProperties}</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {saving.error && (
        <Notice tone="critical" role="alert" xstyle={styles.stretch}>
          {saving.error.message}
        </Notice>
      )}
      <div {...stylex.props(styles.actions)}>
        <SubmitButton
          variant="primary"
          pending={saving.isPending}
          pendingLabel={loan ? form.saving : form.submitting}
        >
          {loan ? form.save : form.submit}
        </SubmitButton>
        {loan && (
          <Button variant="ghost" onClick={onDone}>
            {form.cancel}
          </Button>
        )}
      </div>
    </form>
  );
}
