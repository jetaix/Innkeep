import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { ConfirmButton, CopyButton, SubmitButton } from "@/components/ui/actions";
import { AutoSubmitSelect, PrintButton } from "@/components/ui/auto-submit";
import { buttonClass } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Loading } from "@/components/ui/loading";
import { Modal } from "@/components/ui/modal";
import { Badge, Card, EmptyState, PageHeader, SectionTitle } from "@/components/ui/primitives";
import { CLEANING_REQUESTS, type Cleaner, type Property } from "@/db/schema";
import {
  addCleaner,
  addManualCleaning,
  assignCleaner,
  deleteCleaner,
  removeManualCleaning,
  setCleaningEnabled,
  setCleaningRequest,
  setCleaningStatus,
  updateCleaning,
} from "@/features/cleaning/actions";
import { unassigned, type Cleaning } from "@/features/cleaning/compute";
import { getCleaning } from "@/features/cleaning/queries";
import { cleaningDay, cleaningLines, cleaningRequest, cleaningWindow } from "@/features/cleaning/text";
import { getI18n } from "@/i18n/server";
import { addDays } from "@/lib/dates";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).m.cleaning.title };
}

export default async function CleaningPage() {
  const t = (await getI18n()).m.cleaning;
  return (
    <>
      <PageHeader title={t.title} description={t.description} />
      <Suspense fallback={<Loading />}>
        <CleaningView />
      </Suspense>
    </>
  );
}

async function CleaningView() {
  await connection();
  const { m, fmt } = await getI18n();
  const t = m.cleaning;
  const { today, properties, cleaners, assignments, schedule } = await getCleaning();
  if (properties.length === 0) return <EmptyState title={t.noProperty.title}>{t.noProperty.body}</EmptyState>;

  const names = new Map(properties.map((property) => [property.id, property]));
  const weekEnd = addDays(today, 7);
  const open = schedule.filter((entry) => entry.status === "pending");
  const groups = [
    { title: t.groups.now, rows: open.filter((entry) => entry.date <= today) },
    { title: t.groups.week, rows: open.filter((entry) => entry.date > today && entry.date < weekEnd) },
    { title: t.groups.later, rows: open.filter((entry) => entry.date >= weekEnd) },
    { title: t.groups.closed, rows: schedule.filter((entry) => entry.status !== "pending").reverse() },
  ].filter((group) => group.rows.length > 0);

  const thisWeek = open.filter((entry) => entry.date < weekEnd).length;
  const nobody = unassigned(schedule).length;
  const clashes = open.filter((entry) => entry.clash).length;
  const day = (date: string) => cleaningDay(date, fmt);

  // What the host sends to the cleaner: dates, places and times. No guest names, no prices.
  const toShare = open.filter((entry) => entry.date >= today);
  const shareText = [
    t.share.heading(fmt.date(today, { day: "numeric", month: "long" })),
    "",
    ...(toShare.length === 0
      ? [t.share.nothing]
      : toShare.flatMap((entry) => [...cleaningLines(entry, names.get(entry.propertyId)!, m, fmt), ""])),
  ]
    .join("\n")
    .trim();

  return (
    <div className="grid grid-cols-1 max-w-6xl items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <Card className="flex flex-wrap items-center justify-between gap-3 p-4 print:hidden">
          <p className="flex flex-wrap items-center gap-2">
            <Badge tone={thisWeek ? "neutral" : "good"}>
              {thisWeek ? t.summary.week(thisWeek) : t.summary.none}
            </Badge>
            {nobody > 0 && <Badge tone="warn">{t.summary.unassigned(nobody)}</Badge>}
            {clashes > 0 && <Badge tone="critical">{t.summary.clashes(clashes)}</Badge>}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Modal
              label={t.manual.open}
              title={t.manual.title}
              description={t.manual.hint}
              variant="primary"
              size="sm"
            >
              <form action={addManualCleaning} className="space-y-3">
                {properties.length > 1 ? (
                  <Field label={t.manual.property} htmlFor="manual-property">
                    <Select id="manual-property" name="propertyId" defaultValue={properties[0].id}>
                      {properties.map((property) => (
                        <option key={property.id} value={property.id}>
                          {property.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : (
                  <input type="hidden" name="propertyId" value={properties[0].id} />
                )}
                <Field label={t.manual.date} htmlFor="manual-date">
                  <Input id="manual-date" name="date" type="date" required defaultValue={today} min={today} />
                </Field>
                <Field label={t.manual.notes} htmlFor="manual-notes">
                  <Input id="manual-notes" name="notes" maxLength={500} />
                </Field>
                <SubmitButton>{t.manual.submit}</SubmitButton>
              </form>
            </Modal>
            <CopyButton value={shareText} label={t.share.copy} />
            <PrintButton className={buttonClass({ size: "sm" })}>{t.share.print}</PrintButton>
          </div>
        </Card>

        {groups.length === 0 ? (
          <EmptyState title={t.empty.title}>
            {properties.some((property) => property.cleaningEnabled) ? t.empty.body : t.empty.off}
          </EmptyState>
        ) : (
          groups.map((group) => (
            <section key={group.title} aria-labelledby={`group-${group.title}`}>
              <SectionTitle id={`group-${group.title}`} className="mb-2 px-1">
                {group.title}
              </SectionTitle>
              <Card>
                <ul className="divide-y divide-line">
                  {group.rows.map((entry) => (
                    <li key={`${entry.propertyId}-${entry.date}`}>
                      <Row
                        entry={entry}
                        place={names.get(entry.propertyId)!}
                        named={properties.length > 1}
                        cleaners={cleaners}
                        overdue={entry.status === "pending" && entry.date < today}
                        day={day}
                      />
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          ))
        )}
      </div>

      <div className="space-y-6 print:hidden">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-3">
            <div className="min-w-0">
              <SectionTitle>{t.team.title}</SectionTitle>
              <p className="mt-0.5 text-xs text-muted">{t.team.hint}</p>
            </div>
            <Modal label={t.team.add} title={t.team.add} size="sm">
              <form action={addCleaner} className="space-y-3">
                <Field label={t.team.name} htmlFor="cleaner-name">
                  <Input id="cleaner-name" name="name" required maxLength={80} autoComplete="off" />
                </Field>
                <Field label={t.team.phone} htmlFor="cleaner-phone">
                  <Input id="cleaner-phone" name="phone" type="tel" maxLength={40} autoComplete="off" />
                </Field>
                <SubmitButton variant="primary">{t.team.add}</SubmitButton>
              </form>
            </Modal>
          </div>
          {cleaners.length === 0 ? (
            <p className="px-5 py-4 text-[13px] text-muted">{t.team.none}</p>
          ) : (
            <ul className="divide-y divide-line">
              {cleaners.map((cleaner) => (
                <li key={cleaner.id} className="flex items-center justify-between gap-3 px-5 py-2.5">
                  <span className="min-w-0">
                    <span className="font-medium">{cleaner.name}</span>
                    {cleaner.phone && (
                      <a href={`tel:${cleaner.phone}`} className="ml-2 text-xs text-muted tabular-nums">
                        {cleaner.phone}
                      </a>
                    )}
                  </span>
                  <form action={deleteCleaner.bind(null, cleaner.id)}>
                    <ConfirmButton size="sm" message={t.team.removeConfirm(cleaner.name)}>
                      {t.team.remove}
                    </ConfirmButton>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="border-b border-line px-5 py-3">
            <SectionTitle>{t.places.title}</SectionTitle>
          </div>
          <ul className="divide-y divide-line">
            {properties.map((property) => {
              const assigned = (priority: number) =>
                assignments.find((a) => a.propertyId === property.id && a.priority === priority)?.cleanerId ??
                "";
              return (
                <li key={property.id} className="space-y-3 px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{property.name}</span>
                    <form action={setCleaningEnabled.bind(null, property.id, !property.cleaningEnabled)}>
                      <SubmitButton size="sm">
                        {property.cleaningEnabled ? t.places.switchOff : t.places.switchOn}
                      </SubmitButton>
                    </form>
                  </div>
                  {property.cleaningEnabled ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {([0, 1] as const).map((priority) => {
                        const id = `assign-${property.id}-${priority}`;
                        return (
                          // The key remounts the field once saved, so it shows the stored choice.
                          <form
                            key={`${priority}-${assigned(priority)}`}
                            action={assignCleaner.bind(null, property.id, priority)}
                          >
                            <Field label={priority === 0 ? t.places.usual : t.places.backup} htmlFor={id}>
                              <AutoSubmitSelect id={id} name="cleanerId" defaultValue={assigned(priority)}>
                                <option value="">{t.places.nobody}</option>
                                {cleaners.map((cleaner) => (
                                  <option key={cleaner.id} value={cleaner.id}>
                                    {cleaner.name}
                                  </option>
                                ))}
                              </AutoSubmitSelect>
                            </Field>
                          </form>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted">{t.places.offHint}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}

const REQUEST_TONE = { none: "neutral", asked: "warn", confirmed: "good" } as const;

async function Row({
  entry,
  place,
  named,
  cleaners,
  overdue,
  day,
}: {
  entry: Cleaning;
  place: Property;
  /** Whether the message to the cleaner names the place: only with several. */
  named: boolean;
  cleaners: Cleaner[];
  overdue: boolean;
  day: (date: string) => string;
}) {
  const { m, fmt } = await getI18n();
  const t = m.cleaning.row;
  const r = m.cleaning.request;
  const request = cleaningRequest(entry, place, m, fmt, named);
  const key = `${entry.propertyId}-${entry.date}`;
  const setStatus = (status: string) => setCleaningStatus.bind(null, entry.propertyId, entry.date, status);

  return (
    <div className="px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            <span className={`font-medium tabular-nums ${overdue ? "text-critical" : ""}`}>
              {day(entry.date)}
            </span>
            <span className="text-muted">{place.name}</span>
            {entry.status === "done" && <Badge tone="good">{t.done}</Badge>}
            {entry.status === "skipped" && <Badge>{t.skipped}</Badge>}
            {entry.status === "pending" && (
              <Badge tone={REQUEST_TONE[entry.request]}>{r.status[entry.request]}</Badge>
            )}
            {entry.sameDay && entry.status === "pending" && (
              <Badge tone="warn">{cleaningWindow(entry, place, t)}</Badge>
            )}
          </p>
          <p className="mt-1 text-[13px] text-muted">
            {entry.kind === "manual"
              ? t.manual
              : entry.after?.guestName
                ? t.after(entry.after.guestName)
                : t.afterUnknown}
            {" · "}
            {entry.next
              ? t.next(
                  day(entry.next.checkIn),
                  entry.next.guests ? m.common.count.guests(entry.next.guests) : null,
                )
              : t.noNext}
          </p>
          {!entry.sameDay && <p className="mt-0.5 text-xs text-muted">{cleaningWindow(entry, place, t)}</p>}
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px]">
            {entry.cleaner ? (
              <span>
                {entry.cleaner.name}
                {entry.reassigned && <span className="text-muted"> ({t.reassigned})</span>}
              </span>
            ) : (
              entry.status === "pending" && <Badge tone="warn">{t.nobody}</Badge>
            )}
            {entry.clash && entry.cleaner && (
              <Badge tone="critical">
                {t.clash(entry.cleaner.name)}. {entry.backup ? t.backupFree(entry.backup.name) : t.noBackup}
              </Badge>
            )}
          </p>
          {entry.notes && (
            <p className="mt-1.5 max-w-[60ch] text-[13px] whitespace-pre-line">{entry.notes}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 print:hidden">
          {entry.status === "pending" ? (
            <>
              <form action={setStatus("done")}>
                <SubmitButton size="sm" variant="primary">
                  {t.markDone}
                </SubmitButton>
              </form>
              <form action={setStatus("skipped")}>
                <SubmitButton size="sm">{t.skip}</SubmitButton>
              </form>
            </>
          ) : (
            <form action={setStatus("pending")}>
              <SubmitButton size="sm">{t.reopen}</SubmitButton>
            </form>
          )}
          {entry.kind === "manual" && (
            <form action={removeManualCleaning.bind(null, entry.propertyId, entry.date)}>
              <ConfirmButton size="sm" message={t.removeConfirm}>
                {t.remove}
              </ConfirmButton>
            </form>
          )}
        </div>
      </div>

      {entry.status === "pending" && (
        <div className="mt-3 max-w-xl rounded-md border border-line bg-subtle p-3 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted">{r.title}</p>
            <div className="flex flex-wrap items-center gap-2">
              {entry.cleaner?.phone && (
                // Opens the phone's or the Mac's Messages app on a new message to the cleaner.
                <a
                  href={`sms:${entry.cleaner.phone.replace(/[^\d+]/g, "")}?&body=${encodeURIComponent(request)}`}
                  className={buttonClass({ size: "sm" })}
                >
                  {r.send}
                </a>
              )}
              <CopyButton value={request} label={r.copy} />
            </div>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed whitespace-pre-line">{request}</p>
          <p className="mt-2 text-xs text-muted">{r.hint}</p>
          <fieldset className="mt-3 border-t border-line pt-3">
            <legend className="sr-only">{r.status.label}</legend>
            <p aria-hidden className="mb-1.5 text-xs font-medium text-muted">
              {r.status.label}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {CLEANING_REQUESTS.map((option) => (
                <form
                  key={option}
                  action={setCleaningRequest.bind(null, entry.propertyId, entry.date, option)}
                >
                  <SubmitButton
                    size="sm"
                    variant={option === entry.request ? "primary" : "secondary"}
                    aria-pressed={option === entry.request}
                  >
                    {r.status[option]}
                  </SubmitButton>
                </form>
              ))}
            </div>
          </fieldset>
        </div>
      )}

      <details className="mt-2 print:hidden">
        <summary className="cursor-pointer text-xs text-muted underline underline-offset-2">{t.edit}</summary>
        <form
          key={`${entry.notes}-${entry.reassigned ? entry.cleaner?.id : ""}`}
          action={updateCleaning.bind(null, entry.propertyId, entry.date)}
          className="mt-2 grid grid-cols-1 max-w-xl gap-3 sm:grid-cols-[1fr_12rem]"
        >
          <Field label={t.notes} htmlFor={`notes-${key}`}>
            <Textarea
              id={`notes-${key}`}
              name="notes"
              rows={2}
              maxLength={500}
              defaultValue={entry.notes}
              placeholder={t.notesPlaceholder}
            />
          </Field>
          <Field label={t.cleaner} htmlFor={`cleaner-${key}`}>
            <Select
              id={`cleaner-${key}`}
              name="cleanerId"
              defaultValue={entry.reassigned ? entry.cleaner?.id : ""}
            >
              <option value="">{t.usual}</option>
              {cleaners.map((cleaner) => (
                <option key={cleaner.id} value={cleaner.id}>
                  {cleaner.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <SubmitButton size="sm">{t.save}</SubmitButton>
          </div>
        </form>
      </details>
    </div>
  );
}
