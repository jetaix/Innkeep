import * as stylex from "@stylexjs/stylex";
import { useMutation } from "@tanstack/react-query";
import type { Charge, Property } from "@/db/schema";
import { CHARGE_CATEGORIES, CHARGE_FREQUENCIES } from "../../lists";
import { today } from "@/lib/dates";
import { addCharge, deleteCharge } from "../../api/mutations";
import { useI18n } from "../../i18n";
import { color, text } from "../../tokens.stylex";
import { ConfirmButton, SubmitButton } from "../../ui/actions";
import { Field, Input, Select } from "../../ui/form";
import { Notice } from "../../ui/primitives";

const styles = stylex.create({
  item: {
    paddingBlock: "0.6875rem",
    borderTopWidth: { default: 1, ":first-child": 0 },
    borderTopStyle: "solid",
    borderTopColor: color.line,
  },
  row: { display: "flex", alignItems: "center", gap: "0.75rem" },
  what: { flexBasis: 0, flexGrow: 1, flexShrink: 1, minWidth: 0 },
  name: {
    margin: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontWeight: 500,
  },
  scope: {
    margin: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: color.muted,
    fontSize: text.sm,
  },
  amount: { fontWeight: 500, fontVariantNumeric: "tabular-nums" },
  problem: { marginTop: "0.5rem" },
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

export function ChargeRow({
  charge,
  properties,
  currency,
}: {
  charge: Charge;
  properties: Property[];
  currency: string;
}) {
  const { m, fmt } = useI18n("revenue");
  const t = m.revenue;
  const remove = useMutation(deleteCharge);
  const fullDate = { day: "numeric", month: "short", year: "numeric" } as const;
  const scope = [
    t.frequency[charge.frequency],
    charge.frequency === "once" && fmt.date(charge.startsOn, fullDate),
    charge.appliesTo !== "all" && t.charges.only(m.common.sources[charge.appliesTo]),
    charge.propertyId ? properties.find((p) => p.id === charge.propertyId)?.name : t.charges.allProperties,
    charge.endsOn && t.charges.until(fmt.date(charge.endsOn, fullDate)),
  ].filter(Boolean);

  return (
    <li {...stylex.props(styles.item)}>
      <div {...stylex.props(styles.row)}>
        <div {...stylex.props(styles.what)}>
          <p {...stylex.props(styles.name)}>{charge.label}</p>
          <p {...stylex.props(styles.scope)}>{scope.join(", ")}</p>
        </div>
        <span {...stylex.props(styles.amount)}>
          {charge.frequency === "percent" ? `${charge.amount / 100}%` : fmt.money(charge.amount, currency)}
        </span>
        <ConfirmButton
          variant="ghost"
          size="sm"
          message={t.charges.confirmRemove(charge.label)}
          pending={remove.isPending}
          onConfirm={() => remove.mutate(charge.id)}
        >
          {t.charges.remove}
        </ConfirmButton>
      </div>
      {remove.error && (
        <Notice tone="critical" role="alert" xstyle={styles.problem}>
          {remove.error.message}
        </Notice>
      )}
    </li>
  );
}

export function ChargeForm({ properties }: { properties: Property[] }) {
  const { m } = useI18n("revenue");
  const t = m.revenue;
  const form = t.form;
  const add = useMutation(addCharge);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const sent = event.currentTarget;
        // The amount goes as typed ("55" = 55.00, or 15 = 15%): the server turns it into minor units.
        add.mutate(Object.fromEntries(new FormData(sent)), { onSuccess: () => sent.reset() });
      }}
      {...stylex.props(styles.form)}
    >
      <h3 {...stylex.props(styles.formTitle)}>{form.title}</h3>
      <div {...stylex.props(styles.fields)}>
        <Field label={form.name} htmlFor="label" xstyle={styles.both}>
          <Input id="label" name="label" required placeholder={form.namePlaceholder} />
        </Field>
        <Field label={form.frequency} htmlFor="frequency">
          <Select id="frequency" name="frequency" defaultValue="per_stay">
            {CHARGE_FREQUENCIES.map((value) => (
              <option key={value} value={value}>
                {t.frequency[value]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={form.amount} htmlFor="amount" hint={form.amountHint}>
          <Input id="amount" name="amount" required inputMode="decimal" placeholder="55" />
        </Field>
        <Field label={form.category} htmlFor="category">
          <Select id="category" name="category" defaultValue="cleaning">
            {CHARGE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {t.category[category]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={form.appliesTo} htmlFor="appliesTo">
          <Select id="appliesTo" name="appliesTo" defaultValue="all">
            <option value="all">{form.everyChannel}</option>
            <option value="airbnb">{t.charges.only(m.common.sources.airbnb)}</option>
            <option value="booking">{t.charges.only(m.common.sources.booking)}</option>
            <option value="direct">{t.charges.only(m.common.sources.direct)}</option>
          </Select>
        </Field>
        <Field label={form.property} htmlFor="propertyId" xstyle={styles.both}>
          <Select id="propertyId" name="propertyId" defaultValue="">
            <option value="">{t.charges.allProperties}</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={form.startsOn} htmlFor="startsOn">
          <Input
            id="startsOn"
            name="startsOn"
            type="date"
            required
            defaultValue={`${today().slice(0, 8)}01`}
          />
        </Field>
        <Field label={form.endsOn} htmlFor="endsOn">
          <Input id="endsOn" name="endsOn" type="date" />
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
