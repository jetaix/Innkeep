import * as stylex from "@stylexjs/stylex";
import { useMutation } from "@tanstack/react-query";
import { Circle, CircleCheck, CircleSlash } from "lucide-react";
import type { Cleaner, CleaningRequest, CleaningStatus, Property } from "@/db/schema";
import type { Cleaning } from "@/features/cleaning/compute";
import { cleaningDay, cleaningRequest, cleaningWindow } from "@/features/cleaning/text";
import type { Messages } from "@/i18n/messages";
import { removeManualCleaning, updateCleaning } from "../../api/mutations";
import { useI18n } from "../../i18n";
import { color, radius, text } from "../../tokens.stylex";
import { figureStyle, slabStyle } from "../../ui/slab";
import { ConfirmButton, CopyButton, SubmitButton } from "../../ui/actions";
import { Button, buttonStyle } from "../../ui/button";
import { Field, Select, Textarea } from "../../ui/form";
import { Badge, Hidden, Notice } from "../../ui/primitives";

const WIDE = "@media (min-width: 40rem)";
const PRINT = "@media print";

const styles = stylex.create({
  row: { padding: "1rem 1.125rem" },
  top: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: "1rem",
    rowGap: "0.5rem",
  },
  about: { minWidth: 0 },
  line: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem", margin: 0 },
  // Done, skipped or still to do is drawn as a mark as well as written.
  mark: { color: color.muted },
  markDone: { color: color.good },
  markOverdue: { color: color.critical },
  day: { fontSize: text.md, fontWeight: 600, fontVariantNumeric: "tabular-nums" },
  overdue: { color: color.critical },
  muted: { color: color.muted },

  /*
   * The turnover: the stay that ends, the time there is, the stay that begins.
   * One line on a wide screen, three on a phone.
   */
  turnover: {
    display: "grid",
    gridTemplateColumns: { default: "minmax(0, 1fr)", [WIDE]: "minmax(0, 1fr) auto minmax(0, 1fr)" },
    alignItems: "stretch",
    gap: { default: "0.375rem", [WIDE]: "0.5rem" },
    maxWidth: "44rem",
    margin: "0.75rem 0 0",
  },
  end: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    minWidth: 0,
    minHeight: "3rem",
    padding: "0.375rem 0.75rem",
    fontSize: text.base,
    lineHeight: 1.35,
  },
  endTitle: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 },
  // On a slab the second line is ink too, a little lighter by weight alone.
  endDetail: { fontSize: text.sm },
  // Nobody is booked after: an outline where a slab would be.
  open: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: color.lineStrong,
    borderRadius: radius.slab,
    color: color.muted,
  },
  gap: {
    display: "flex",
    flexDirection: { default: "row", [WIDE]: "column" },
    alignItems: { default: "baseline", [WIDE]: "center" },
    justifyContent: "center",
    columnGap: "0.5rem",
    minWidth: { default: 0, [WIDE]: "8.5rem" },
    padding: { default: "0.125rem 0.75rem", [WIDE]: "0 0.5rem" },
    borderRadius: radius.slab,
    textAlign: "center",
  },
  // A few hours between two guests: the window itself carries the warning.
  tight: { backgroundColor: color.warnBg, color: color.warn },
  figure: { fontSize: "1.5rem", whiteSpace: "nowrap" },
  caption: { color: color.muted, fontSize: text.sm, whiteSpace: "nowrap" },
  captionTight: { color: color.warn },

  who: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "0.5rem",
    margin: "0.625rem 0 0",
    fontSize: text.base,
  },
  notes: { maxWidth: "60ch", margin: "0.375rem 0 0", fontSize: text.base, whiteSpace: "pre-line" },
  actions: {
    display: { default: "flex", [PRINT]: "none" },
    flexWrap: "wrap",
    alignItems: "center",
    gap: "0.375rem",
  },
  // The message for the cleaner opens under the turnover, on the same panel: no box inside the box.
  request: {
    display: { default: "block", [PRINT]: "none" },
    maxWidth: "44rem",
    marginTop: "0.75rem",
    paddingTop: "0.625rem",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.line,
  },
  requestBody: { paddingTop: "0.5rem" },
  requestHead: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.5rem",
  },
  label: { margin: 0, color: color.muted, fontSize: text.sm, fontWeight: 500 },
  message: {
    maxWidth: "60ch",
    margin: "0.5rem 0 0",
    fontSize: text.base,
    lineHeight: 1.625,
    whiteSpace: "pre-line",
  },
  hint: { margin: "0.5rem 0 0", color: color.muted, fontSize: text.sm },
  status: { minWidth: 0, margin: "0.75rem 0 0", padding: 0, borderWidth: 0 },
  // Read by a screen reader as the group's name; the same words are drawn just below.
  legend: {
    position: "absolute",
    width: 1,
    height: 1,
    margin: -1,
    padding: 0,
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
  },
  statusLabel: { marginBottom: "0.375rem" },
  choices: { display: "flex", flexWrap: "wrap", gap: "0.375rem" },
  details: { display: { default: "block", [PRINT]: "none" }, marginTop: "0.5rem" },
  summary: {
    width: "fit-content",
    borderRadius: radius.sm,
    color: { default: color.muted, ":hover": color.ink },
    fontSize: text.sm,
    fontWeight: 500,
    textDecoration: "underline",
    textDecorationColor: color.lineStrong,
    textUnderlineOffset: 3,
    cursor: "pointer",
    transitionProperty: "color",
    transitionDuration: "150ms",
  },
  edit: {
    display: "grid",
    gridTemplateColumns: { default: "1fr", [WIDE]: "1fr 12rem" },
    gap: "0.75rem",
    maxWidth: "36rem",
    marginTop: "0.5rem",
  },
  whole: { gridColumnEnd: { default: "auto", [WIDE]: "span 2" } },
  problem: { marginTop: "0.5rem" },
});

const REQUESTS = ["none", "asked", "confirmed"] as const satisfies readonly CleaningRequest[];
const REQUEST_TONE = { none: "neutral", asked: "warn", confirmed: "good" } as const;

/** One cleaning day: when, where, who, the message for the cleaner and what the host can do about it. */
export function Row({
  entry,
  place,
  named,
  cleaners,
  overdue,
  open = false,
  statusOnly = false,
}: {
  entry: Cleaning;
  place: Property;
  /** Whether the message to the cleaner names the place: only with several. */
  named: boolean;
  cleaners: Cleaner[];
  overdue: boolean;
  /** Whether the message for the cleaner starts open: for the cleanings that are close. */
  open?: boolean;
  /** For someone who may only say a cleaning is done: the message, the note and the removal are left out. */
  statusOnly?: boolean;
}) {
  const { m, fmt } = useI18n("cleaning");
  const t = m.cleaning.row;
  const r = m.cleaning.request;
  const line = m.cleaning.timeline;
  const pending = entry.status === "pending";
  const Mark = entry.status === "done" ? CircleCheck : entry.status === "skipped" ? CircleSlash : Circle;
  const tight = entry.sameDay && pending;
  // The text helpers take every area's words and read only the cleaning and the common ones.
  const request = cleaningRequest(entry, place, m as Messages, fmt, named);
  const key = `${entry.propertyId}-${entry.date}`;
  const day = { property: entry.propertyId, date: entry.date };

  const status = useMutation(updateCleaning);
  const asked = useMutation(updateCleaning);
  const edit = useMutation(updateCleaning);
  const remove = useMutation(removeManualCleaning);
  const failed = status.error ?? asked.error ?? edit.error ?? remove.error;

  const statusButton = (to: CleaningStatus, label: string, variant?: "primary") => (
    <Button
      size="sm"
      variant={variant}
      disabled={status.isPending}
      aria-busy={status.isPending && status.variables.fields.status === to}
      onClick={() => status.mutate({ ...day, fields: { status: to } })}
    >
      {label}
    </Button>
  );

  return (
    <div {...stylex.props(styles.row)}>
      <div {...stylex.props(styles.top)}>
        <div {...stylex.props(styles.about)}>
          <p {...stylex.props(styles.line)}>
            <Mark
              aria-hidden
              size={18}
              {...stylex.props(
                styles.mark,
                entry.status === "done" && styles.markDone,
                overdue && styles.markOverdue,
              )}
            />
            <span {...stylex.props(styles.day, overdue && styles.overdue)}>
              {cleaningDay(entry.date, fmt)}
            </span>
            <span {...stylex.props(styles.muted)}>{place.name}</span>
            {entry.status === "done" && <Badge tone="good">{t.done}</Badge>}
            {entry.status === "skipped" && <Badge>{t.skipped}</Badge>}
            {pending && <Badge tone={REQUEST_TONE[entry.request]}>{r.status[entry.request]}</Badge>}
          </p>
        </div>

        <div {...stylex.props(styles.actions)}>
          {pending ? (
            <>
              {statusButton("done", t.markDone, "primary")}
              {statusButton("skipped", t.skip)}
            </>
          ) : (
            statusButton("pending", t.reopen)
          )}
          {entry.kind === "manual" && !statusOnly && (
            <ConfirmButton
              size="sm"
              message={t.removeConfirm}
              pending={remove.isPending}
              onConfirm={() => remove.mutate(day)}
            >
              {t.remove}
            </ConfirmButton>
          )}
        </div>
      </div>

      <div {...stylex.props(styles.turnover)}>
        <div {...stylex.props(styles.end, slabStyle(entry.after ? entry.after.source : "block"))}>
          <span {...stylex.props(styles.endTitle)}>
            {entry.kind === "manual"
              ? t.manual
              : entry.after?.guestName
                ? t.after(entry.after.guestName)
                : t.afterUnknown}
          </span>
          <span {...stylex.props(styles.endDetail)}>
            {entry.after ? `${m.common.sources[entry.after.source]} · ` : ""}
            {t.from(entry.from)}
          </span>
        </div>
        <div {...stylex.props(styles.gap, tight && styles.tight)}>
          {/* Said in words for a screen reader; the figure is the same thing for the eye. */}
          <Hidden>{cleaningWindow(entry, place, t)}</Hidden>
          <span aria-hidden {...stylex.props(figureStyle, styles.figure)}>
            {entry.hours == null
              ? line.open
              : entry.hours < 48
                ? line.hours(entry.hours)
                : line.days(Math.floor(entry.hours / 24))}
          </span>
          <span aria-hidden {...stylex.props(styles.caption, tight && styles.captionTight)}>
            {line.toClean}
          </span>
        </div>
        {entry.next ? (
          <div {...stylex.props(styles.end, slabStyle(entry.next.source))}>
            <span {...stylex.props(styles.endTitle)}>
              {t.next(
                cleaningDay(entry.next.checkIn, fmt),
                entry.next.guests ? m.common.count.guests(entry.next.guests) : null,
              )}
            </span>
            <span {...stylex.props(styles.endDetail)}>
              {m.common.sources[entry.next.source]} · {line.arrival(place.checkInTime)}
            </span>
          </div>
        ) : (
          <div {...stylex.props(styles.end, styles.open)}>{t.noNext}</div>
        )}
      </div>

      <div>
        <div>
          <p {...stylex.props(styles.who)}>
            {entry.cleaner ? (
              <span>
                {entry.cleaner.name}
                {entry.reassigned && <span {...stylex.props(styles.muted)}> ({t.reassigned})</span>}
              </span>
            ) : (
              pending && <Badge tone="warn">{t.nobody}</Badge>
            )}
            {entry.clash && entry.cleaner && (
              <Badge tone="clash">
                {t.clash(entry.cleaner.name)}. {entry.backup ? t.backupFree(entry.backup.name) : t.noBackup}
              </Badge>
            )}
          </p>
          {entry.notes && <p {...stylex.props(styles.notes)}>{entry.notes}</p>}
        </div>
      </div>

      {pending && !statusOnly && (
        <details open={open} {...stylex.props(styles.request)}>
          <summary {...stylex.props(styles.summary)}>{r.title}</summary>
          <div {...stylex.props(styles.requestHead, styles.requestBody)}>
            <p {...stylex.props(styles.hint)}>{r.hint}</p>
            <div {...stylex.props(styles.line)}>
              {entry.cleaner?.phone && (
                // Opens the phone's or the Mac's Messages app on a new message to the cleaner.
                <a
                  href={`sms:${entry.cleaner.phone.replace(/[^\d+]/g, "")}?&body=${encodeURIComponent(request)}`}
                  {...stylex.props(buttonStyle({ size: "sm" }))}
                >
                  {r.send}
                </a>
              )}
              <CopyButton value={request} label={r.copy} />
            </div>
          </div>
          <p {...stylex.props(styles.message)}>{request}</p>
          <fieldset {...stylex.props(styles.status)}>
            <legend {...stylex.props(styles.legend)}>{r.status.label}</legend>
            <p aria-hidden {...stylex.props(styles.label, styles.statusLabel)}>
              {r.status.label}
            </p>
            <div {...stylex.props(styles.choices)}>
              {REQUESTS.map((option) => (
                <Button
                  key={option}
                  size="sm"
                  variant={option === entry.request ? "primary" : "secondary"}
                  aria-pressed={option === entry.request}
                  disabled={asked.isPending}
                  aria-busy={asked.isPending && asked.variables.fields.request === option}
                  onClick={() => asked.mutate({ ...day, fields: { request: option } })}
                >
                  {r.status[option]}
                </Button>
              ))}
            </div>
          </fieldset>
        </details>
      )}

      {!statusOnly && (
        <details {...stylex.props(styles.details)}>
          <summary {...stylex.props(styles.summary)}>{t.edit}</summary>
          <form
            // The key remounts the fields once saved, so they show what is stored.
            key={`${entry.notes}-${entry.reassigned ? entry.cleaner?.id : ""}`}
            onSubmit={(event) => {
              event.preventDefault();
              const sent = new FormData(event.currentTarget);
              const cleanerId = String(sent.get("cleanerId") ?? "");
              edit.mutate({
                ...day,
                fields: {
                  notes: String(sent.get("notes") ?? ""),
                  cleanerId: cleanerId === "" ? "" : Number(cleanerId),
                },
              });
            }}
            {...stylex.props(styles.edit)}
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
            <div {...stylex.props(styles.whole)}>
              <SubmitButton size="sm" pending={edit.isPending}>
                {t.save}
              </SubmitButton>
            </div>
          </form>
        </details>
      )}

      {failed && (
        <Notice tone="critical" role="alert" xstyle={styles.problem}>
          {failed.message}
        </Notice>
      )}
    </div>
  );
}
