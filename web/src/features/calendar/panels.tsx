import * as stylex from "@stylexjs/stylex";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import type { FormEvent, ReactNode } from "react";
import type { Property, Reservation } from "@/db/schema";
import type { Format } from "@/i18n/format";
import { addDays, diffDays } from "@/lib/dates";
import { createStay, deleteStay, updateStay } from "../../api/mutations";
import { useI18n } from "../../i18n";
import { color, font, text } from "../../tokens.stylex";
import { ConfirmButton, SubmitButton } from "../../ui/actions";
import { buttonStyle } from "../../ui/button";
import { Field, Input, Select, Textarea } from "../../ui/form";
import { Card, Kbd, Notice, SectionTitle, SourceBadge } from "../../ui/primitives";
import type { Search } from "./period";

const styles = stylex.create({
  panel: {
    flexShrink: 0,
    width: { default: "100%", "@media (min-width: 80rem)": "20rem" },
    padding: "1rem",
  },
  head: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.5rem",
    marginBottom: "0.75rem",
  },
  where: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" },
  strong: { fontWeight: 500 },
  line: { margin: 0 },
  muted: { color: color.muted },
  code: { margin: "0.25rem 0 0", color: color.muted, fontSize: text.sm },
  mono: { color: color.ink, fontFamily: font.mono },
  facts: {
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    columnGap: "0.75rem",
    rowGap: "0.125rem",
    margin: "0.5rem 0 0",
    fontSize: text.sm,
  },
  fact: { display: "contents" },
  value: { margin: 0, fontVariantNumeric: "tabular-nums" },
  overlap: { marginTop: "0.75rem" },
  info: {
    margin: "0.5rem 0 0",
    color: color.muted,
    fontSize: text.sm,
    overflowWrap: "break-word",
    whiteSpace: "pre-line",
  },
  form: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  edit: { marginTop: "1rem" },
  two: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: "0.5rem" },
  wide: { width: "100%" },
  remove: { marginTop: "0.5rem" },
  note: { margin: "0.75rem 0 0", color: color.muted, fontSize: text.sm },
  kinds: { minWidth: 0, margin: 0, padding: 0, borderWidth: 0 },
  legend: { marginBottom: "0.25rem", padding: 0, color: color.muted, fontSize: text.sm, fontWeight: 500 },
  choices: { display: "flex", flexWrap: "wrap", columnGap: "1rem", rowGap: "0.25rem" },
  choice: { display: "flex", alignItems: "center", gap: "0.375rem" },
  small: { margin: 0, color: color.muted, fontSize: text.sm },
});

function Panel({ title, close, children }: { title: string; close: Search; children: ReactNode }) {
  const { m } = useI18n();
  return (
    <Card xstyle={styles.panel}>
      <aside aria-label={title}>
        <div {...stylex.props(styles.head)}>
          <SectionTitle>{title}</SectionTitle>
          <Link
            to="/calendar"
            search={close}
            data-shortcut="Escape"
            {...stylex.props(buttonStyle({ variant: "ghost", size: "sm" }))}
          >
            {m.common.actions.close} <Kbd>Esc</Kbd>
          </Link>
        </div>
        {children}
      </aside>
    </Card>
  );
}

const longDate = (fmt: Format, date: string) =>
  fmt.date(date, { weekday: "short", day: "numeric", month: "short" });

/** What the platform's own reservations page says about this stay, when the extension read it. */
function PlatformFacts({ stay, currency }: { stay: Reservation; currency: string }) {
  const { m, fmt } = useI18n("calendar");
  const t = m.calendar.panel;
  const money = (amount: number) => fmt.money(amount, currency, { cents: true });
  const facts = [
    stay.channelStatus && [t.statusOn(m.common.sources[stay.source]), stay.channelStatus],
    stay.bookedOn && [
      t.bookedOn,
      fmt.date(stay.bookedOn, { day: "numeric", month: "short", year: "numeric" }),
    ],
    stay.grossAmount != null && [t.guestPaid, money(stay.grossAmount)],
    stay.channelFees != null && [t.fees, money(stay.channelFees)],
  ].filter((fact): fact is [string, string] => Boolean(fact));
  if (facts.length === 0) return null;

  return (
    <dl {...stylex.props(styles.facts)}>
      {facts.map(([label, value]) => (
        <div key={label} {...stylex.props(styles.fact)}>
          <dt {...stylex.props(styles.muted)}>{label}</dt>
          <dd {...stylex.props(styles.value)}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** An open stay: what is known about it, the fields the host may change, and its removal. */
export function StayPanel({
  stay,
  property,
  conflict,
  close,
}: {
  stay: Reservation;
  property: Property;
  conflict: boolean;
  close: Search;
}) {
  const { m, fmt } = useI18n("calendar");
  const t = m.calendar.panel;
  const navigate = useNavigate();
  const update = useMutation(updateStay);
  const remove = useMutation(deleteStay);
  const nights = diffDays(stay.checkIn, stay.checkOut);
  const direct = stay.source === "direct";
  const estimate = property.basePrice * nights * 100;
  // Awaited rather than left to a callback: once the stay is gone from the data, this panel is too.
  const done = () => navigate({ to: "/calendar", search: close });
  const failed = update.error ?? remove.error;

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    update.mutateAsync({ id: stay.id, fields }).then(done, () => {});
  }

  return (
    <Panel title={stay.kind === "block" ? t.blockedDates : t.reservation} close={close}>
      <div {...stylex.props(styles.where)}>
        <SourceBadge source={stay.source} />
        <span {...stylex.props(styles.strong)}>{property.name}</span>
      </div>
      <p {...stylex.props(styles.line)}>
        {t.range(longDate(fmt, stay.checkIn), longDate(fmt, stay.checkOut))}
        <span {...stylex.props(styles.muted)}>
          , {m.common.count.nights(nights)}
          {stay.guests ? `, ${m.common.count.guests(stay.guests)}` : ""}
        </span>
      </p>
      {stay.externalCode && (
        <p {...stylex.props(styles.code)}>
          {t.confirmationCode} <span {...stylex.props(styles.mono)}>{stay.externalCode}</span>
        </p>
      )}
      <PlatformFacts stay={stay} currency={property.currency} />
      {conflict && (
        <Notice tone="critical" xstyle={styles.overlap}>
          {t.overlap}
        </Notice>
      )}
      {stay.channelInfo && <p {...stylex.props(styles.info)}>{stay.channelInfo}</p>}

      {/* The key resets the fields when another stay is selected. */}
      <form key={stay.id} onSubmit={save} {...stylex.props(styles.form, styles.edit)}>
        {stay.kind === "reservation" && (
          <>
            <Field label={t.guestName} htmlFor="guestName">
              <Input
                id="guestName"
                name="guestName"
                defaultValue={stay.guestName}
                placeholder={direct ? undefined : t.guestNamePlaceholder}
              />
            </Field>
            <Field
              label={t.payoutIn(property.currency)}
              htmlFor="amount"
              hint={t.payoutHint(fmt.money(estimate, property.currency))}
            >
              <Input
                id="amount"
                name="amount"
                inputMode="decimal"
                defaultValue={stay.amount != null ? (stay.amount / 100).toString() : ""}
              />
            </Field>
          </>
        )}
        {direct && (
          <div {...stylex.props(styles.two)}>
            <Field label={t.checkIn} htmlFor="checkIn">
              <Input id="checkIn" name="checkIn" type="date" required defaultValue={stay.checkIn} />
            </Field>
            <Field label={t.checkOut} htmlFor="checkOut">
              <Input id="checkOut" name="checkOut" type="date" required defaultValue={stay.checkOut} />
            </Field>
          </div>
        )}
        <Field label={t.notes} htmlFor="notes">
          <Textarea id="notes" name="notes" rows={3} defaultValue={stay.notes} />
        </Field>
        {failed && (
          <Notice tone="critical" role="alert">
            {failed.message}
          </Notice>
        )}
        <SubmitButton
          variant="primary"
          xstyle={styles.wide}
          pending={update.isPending}
          pendingLabel={t.saving}
        >
          {t.save}
        </SubmitButton>
      </form>

      {direct ? (
        <div {...stylex.props(styles.remove)}>
          <ConfirmButton
            message={t.deleteConfirm}
            pending={remove.isPending}
            onConfirm={() => remove.mutateAsync(stay.id).then(done, () => {})}
          >
            {t.delete}
          </ConfirmButton>
        </div>
      ) : (
        <p {...stylex.props(styles.note)}>{t.datesFrom(m.common.sources[stay.source])}</p>
      )}
    </Panel>
  );
}

/** The form that adds a direct booking or blocks dates. */
export function NewStayPanel({
  properties,
  propertyId,
  date,
  close,
}: {
  properties: Property[];
  propertyId: number;
  date: string;
  close: Search;
}) {
  const { m } = useI18n("calendar");
  const t = m.calendar.create;
  const fields = m.calendar.panel;
  const navigate = useNavigate();
  const create = useMutation(createStay);

  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    create.mutateAsync(Object.fromEntries(new FormData(event.currentTarget))).then(
      () => navigate({ to: "/calendar", search: close }),
      () => {},
    );
  }

  return (
    <Panel title={t.title} close={close}>
      {/* The key resets the fields when another day is clicked. */}
      <form key={`${propertyId}:${date}`} onSubmit={add} {...stylex.props(styles.form)}>
        <Field label={t.property} htmlFor="propertyId">
          <Select id="propertyId" name="propertyId" defaultValue={propertyId} autoFocus>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </Select>
        </Field>
        <fieldset {...stylex.props(styles.kinds)}>
          <legend {...stylex.props(styles.legend)}>{t.type}</legend>
          <div {...stylex.props(styles.choices)}>
            <label {...stylex.props(styles.choice)}>
              <input type="radio" name="kind" value="reservation" defaultChecked /> {t.directBooking}
            </label>
            <label {...stylex.props(styles.choice)}>
              <input type="radio" name="kind" value="block" /> {t.blockDates}
            </label>
          </div>
        </fieldset>
        <div {...stylex.props(styles.two)}>
          <Field label={fields.checkIn} htmlFor="checkIn">
            <Input id="checkIn" name="checkIn" type="date" required defaultValue={date} />
          </Field>
          <Field label={fields.checkOut} htmlFor="checkOut">
            <Input id="checkOut" name="checkOut" type="date" required defaultValue={addDays(date, 2)} />
          </Field>
        </div>
        <Field label={fields.guestName} htmlFor="guestName" hint={t.bookingsOnly}>
          <Input id="guestName" name="guestName" />
        </Field>
        <Field label={t.payout} htmlFor="amount" hint={t.payoutHint}>
          <Input id="amount" name="amount" inputMode="decimal" />
        </Field>
        <Field label={fields.notes} htmlFor="notes">
          <Textarea id="notes" name="notes" rows={2} />
        </Field>
        {create.error && (
          <Notice tone="critical" role="alert">
            {create.error.message}
          </Notice>
        )}
        <SubmitButton
          variant="primary"
          xstyle={styles.wide}
          pending={create.isPending}
          pendingLabel={t.adding}
        >
          {t.submit}
        </SubmitButton>
        <p {...stylex.props(styles.small)}>{t.note}</p>
      </form>
    </Panel>
  );
}
