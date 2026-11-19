import Link from "next/link";
import type { ReactNode } from "react";
import { ConfirmButton, SubmitButton } from "@/components/ui/actions";
import { buttonClass } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Card, Kbd, Notice, SectionTitle, SourceBadge } from "@/components/ui/primitives";
import type { Property, Reservation } from "@/db/schema";
import { createReservation, deleteReservation, updateReservation } from "@/features/reservations/actions";
import type { Format } from "@/i18n/format";
import { getI18n } from "@/i18n/server";
import { addDays, diffDays } from "@/lib/dates";

async function Panel({
  title,
  closeHref,
  children,
}: {
  title: string;
  closeHref: string;
  children: ReactNode;
}) {
  const { m } = await getI18n();
  return (
    <Card className="w-full shrink-0 p-4 xl:w-80">
      <aside aria-label={title}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <SectionTitle>{title}</SectionTitle>
          <Link
            href={closeHref}
            data-shortcut="Escape"
            className={buttonClass({ variant: "ghost", size: "sm" })}
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
async function PlatformFacts({ stay, currency }: { stay: Reservation; currency: string }) {
  const { m, fmt } = await getI18n();
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
    <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
      {facts.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted">{label}</dt>
          <dd className="tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export async function StayPanel({
  stay,
  property,
  conflict,
  closeHref,
}: {
  stay: Reservation;
  property: Property;
  conflict: boolean;
  closeHref: string;
}) {
  const { m, fmt } = await getI18n();
  const t = m.calendar.panel;
  const nights = diffDays(stay.checkIn, stay.checkOut);
  const direct = stay.source === "direct";
  const estimate = property.basePrice * nights * 100;

  return (
    <Panel title={stay.kind === "block" ? t.blockedDates : t.reservation} closeHref={closeHref}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <SourceBadge source={stay.source} />
        <span className="font-medium">{property.name}</span>
      </div>
      <p>
        {t.range(longDate(fmt, stay.checkIn), longDate(fmt, stay.checkOut))}
        <span className="text-muted">
          , {m.common.count.nights(nights)}
          {stay.guests ? `, ${m.common.count.guests(stay.guests)}` : ""}
        </span>
      </p>
      {stay.externalCode && (
        <p className="mt-1 text-xs text-muted">
          {t.confirmationCode} <span className="font-mono text-ink">{stay.externalCode}</span>
        </p>
      )}
      <PlatformFacts stay={stay} currency={property.currency} />
      {conflict && (
        <Notice tone="critical" className="mt-3">
          {t.overlap}
        </Notice>
      )}
      {stay.channelInfo && (
        <p className="mt-2 text-xs break-words whitespace-pre-line text-muted">{stay.channelInfo}</p>
      )}

      {/* The key resets the fields when another stay is selected. */}
      <form
        key={stay.id}
        action={updateReservation.bind(null, stay.id, closeHref)}
        className="mt-4 space-y-3"
      >
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
          <div className="grid grid-cols-2 gap-2">
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
        <SubmitButton variant="primary" className="w-full" pendingLabel={t.saving}>
          {t.save}
        </SubmitButton>
      </form>

      {direct ? (
        <form action={deleteReservation.bind(null, stay.id, closeHref)} className="mt-2">
          <ConfirmButton message={t.deleteConfirm}>{t.delete}</ConfirmButton>
        </form>
      ) : (
        <p className="mt-3 text-xs text-muted">{t.datesFrom(m.common.sources[stay.source])}</p>
      )}
    </Panel>
  );
}

export async function NewStayPanel({
  properties,
  propertyId,
  date,
  closeHref,
}: {
  properties: Property[];
  propertyId: number;
  date: string;
  closeHref: string;
}) {
  const { m } = await getI18n();
  const t = m.calendar.create;
  const fields = m.calendar.panel;
  return (
    <Panel title={t.title} closeHref={closeHref}>
      {/* The key resets the fields when another day is clicked. */}
      <form
        key={`${propertyId}:${date}`}
        action={createReservation.bind(null, closeHref)}
        className="space-y-3"
      >
        <Field label={t.property} htmlFor="propertyId">
          <Select id="propertyId" name="propertyId" defaultValue={propertyId} autoFocus>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </Select>
        </Field>
        <fieldset>
          <legend className="mb-1 text-xs font-medium text-muted">{t.type}</legend>
          <div className="flex gap-4">
            <label className="flex items-center gap-1.5">
              <input type="radio" name="kind" value="reservation" defaultChecked /> {t.directBooking}
            </label>
            <label className="flex items-center gap-1.5">
              <input type="radio" name="kind" value="block" /> {t.blockDates}
            </label>
          </div>
        </fieldset>
        <div className="grid grid-cols-2 gap-2">
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
        <SubmitButton variant="primary" className="w-full" pendingLabel={t.adding}>
          {t.submit}
        </SubmitButton>
        <p className="text-xs text-muted">{t.note}</p>
      </form>
    </Panel>
  );
}
