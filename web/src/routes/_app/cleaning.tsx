import * as stylex from "@stylexjs/stylex";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { Cleaner, CleanerAssignment, Property } from "@/db/schema";
import { unassigned } from "@/features/cleaning/compute";
import { cleaningLines } from "@/features/cleaning/text";
import type { Messages } from "@/i18n/messages";
import { addDays } from "@/lib/dates";
import {
  addCleaner,
  addManualCleaning,
  assignCleaner,
  deleteCleaner,
  setCleaningEnabled,
} from "../../api/mutations";
import { cleaningQuery } from "../../api/queries";
import { Row } from "../../features/cleaning/row";
import { loadMessages, useI18n } from "../../i18n";
import { color, font, text } from "../../tokens.stylex";
import { ConfirmButton, CopyButton, SubmitButton } from "../../ui/actions";
import { Button } from "../../ui/button";
import { Field, Input, Select } from "../../ui/form";
import { Modal } from "../../ui/modal";
import { Badge, Card, EmptyState, Notice, PageHeader, SectionTitle } from "../../ui/primitives";

export const Route = createFileRoute("/_app/cleaning")({
  // Started while this route's code downloads; the components read the same query.
  loader: ({ context: { queryClient } }) => {
    void loadMessages("cleaning");
    return queryClient.ensureQueryData(cleaningQuery);
  },
  component: CleaningPage,
});

const WIDE = "@media (min-width: 40rem)";
const TWO = "@media (min-width: 80rem)";
const PRINT = "@media print";

const styles = stylex.create({
  page: {
    display: "grid",
    gridTemplateColumns: { default: "1fr", [TWO]: "minmax(0, 1.6fr) minmax(0, 1fr)" },
    alignItems: "start",
    gap: "1.5rem",
    maxWidth: "72rem",
  },
  column: { display: "flex", flexDirection: "column", gap: "1.5rem", minWidth: 0 },
  side: { display: { default: "flex", [PRINT]: "none" } },
  summary: {
    display: { default: "flex", [PRINT]: "none" },
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.75rem",
  },
  line: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem", margin: 0 },
  form: { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.75rem" },
  whole: { alignSelf: "stretch" },
  // A period of the schedule, in the display face.
  title: {
    marginBottom: "0.625rem",
    paddingInline: "0.25rem",
    fontFamily: font.display,
    fontSize: "1.375rem",
    fontWeight: 400,
    letterSpacing: "-0.02em",
    lineHeight: 1.2,
  },
  list: { margin: 0, padding: 0, listStyle: "none" },
  item: {
    borderTopWidth: { default: 1, ":first-child": 0 },
    borderTopStyle: "solid",
    borderTopColor: color.line,
  },
  head: {
    padding: "0.875rem 1.25rem",
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: color.line,
  },
  between: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "0.75rem",
  },
  headText: { minWidth: 0 },
  hint: { margin: "0.125rem 0 0", color: color.muted, fontSize: text.sm },
  none: { margin: 0, padding: "1rem 1.25rem", color: color.muted, fontSize: text.base },
  cleaner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.75rem",
    padding: "0.625rem 1.25rem",
  },
  strong: { fontWeight: 500 },
  phone: {
    marginInlineStart: "0.5rem",
    color: color.muted,
    fontSize: text.sm,
    fontVariantNumeric: "tabular-nums",
  },
  place: { display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1rem 1.25rem" },
  placeHead: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.5rem",
  },
  assign: { display: "grid", gridTemplateColumns: { default: "1fr", [WIDE]: "1fr 1fr" }, gap: "0.75rem" },
  off: { margin: 0, color: color.muted, fontSize: text.sm },
  problem: { marginInline: "1.25rem", marginBottom: "1rem" },
});

function CleaningPage() {
  const t = useI18n("cleaning").m.cleaning;
  return (
    <>
      <PageHeader title={t.title} description={t.description} />
      <CleaningView />
    </>
  );
}

function CleaningView() {
  const { m, fmt } = useI18n("cleaning");
  const t = m.cleaning;
  const { today, properties, cleaners, assignments, schedule } = useSuspenseQuery(cleaningQuery).data;
  const manual = useMutation(addManualCleaning);
  if (properties.length === 0) return <EmptyState title={t.noProperty.title}>{t.noProperty.body}</EmptyState>;

  const names = new Map(properties.map((property) => [property.id, property]));
  const weekEnd = addDays(today, 7);
  const open = schedule.filter((entry) => entry.status === "pending");
  const groups = [
    { title: t.groups.now, near: true, rows: open.filter((entry) => entry.date <= today) },
    {
      title: t.groups.week,
      near: true,
      rows: open.filter((entry) => entry.date > today && entry.date < weekEnd),
    },
    { title: t.groups.later, rows: open.filter((entry) => entry.date >= weekEnd) },
    { title: t.groups.closed, rows: schedule.filter((entry) => entry.status !== "pending").reverse() },
  ].filter((group) => group.rows.length > 0);

  const thisWeek = open.filter((entry) => entry.date < weekEnd).length;
  const nobody = unassigned(schedule).length;
  const clashes = open.filter((entry) => entry.clash).length;

  // What the host sends to the cleaner: dates, places and times. No guest names, no prices.
  const toShare = open.filter((entry) => entry.date >= today);
  const shareText = [
    t.share.heading(fmt.date(today, { day: "numeric", month: "long" })),
    "",
    ...(toShare.length === 0
      ? [t.share.nothing]
      : toShare.flatMap((entry) => {
          const place = names.get(entry.propertyId);
          // The text helpers take every area's words and read only the cleaning and the common ones.
          return place ? [...cleaningLines(entry, place, m as Messages, fmt), ""] : [];
        })),
  ]
    .join("\n")
    .trim();

  return (
    <div {...stylex.props(styles.page)}>
      <div {...stylex.props(styles.column)}>
        {/* The page's own bar stands on the ground: the panels below are the schedule. */}
        <div {...stylex.props(styles.summary)}>
          <p {...stylex.props(styles.line)}>
            <Badge tone={thisWeek ? "neutral" : "good"}>
              {thisWeek ? t.summary.week(thisWeek) : t.summary.none}
            </Badge>
            {nobody > 0 && <Badge tone="warn">{t.summary.unassigned(nobody)}</Badge>}
            {clashes > 0 && <Badge tone="clash">{t.summary.clashes(clashes)}</Badge>}
          </p>
          <div {...stylex.props(styles.line)}>
            <Modal
              label={t.manual.open}
              title={t.manual.title}
              description={t.manual.hint}
              variant="primary"
              size="sm"
            >
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = event.currentTarget;
                  const sent = new FormData(form);
                  manual.mutate(
                    {
                      propertyId: Number(sent.get("propertyId")),
                      date: String(sent.get("date")),
                      notes: String(sent.get("notes") ?? ""),
                    },
                    { onSuccess: () => form.reset() },
                  );
                }}
                {...stylex.props(styles.form)}
              >
                {properties.length > 1 ? (
                  <Field label={t.manual.property} htmlFor="manual-property" xstyle={styles.whole}>
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
                <Field label={t.manual.date} htmlFor="manual-date" xstyle={styles.whole}>
                  <Input id="manual-date" name="date" type="date" required defaultValue={today} min={today} />
                </Field>
                <Field label={t.manual.notes} htmlFor="manual-notes" xstyle={styles.whole}>
                  <Input id="manual-notes" name="notes" maxLength={500} />
                </Field>
                <SubmitButton pending={manual.isPending}>{t.manual.submit}</SubmitButton>
              </form>
            </Modal>
            <CopyButton value={shareText} label={t.share.copy} />
            <Button size="sm" onClick={() => window.print()}>
              {t.share.print}
            </Button>
          </div>
          {manual.error && (
            <Notice tone="critical" role="alert" xstyle={styles.whole}>
              {manual.error.message}
            </Notice>
          )}
        </div>

        {groups.length === 0 ? (
          <EmptyState title={t.empty.title}>
            {properties.some((property) => property.cleaningEnabled) ? t.empty.body : t.empty.off}
          </EmptyState>
        ) : (
          groups.map((group) => (
            <section key={group.title} aria-labelledby={`group-${group.title}`}>
              <SectionTitle id={`group-${group.title}`} xstyle={styles.title}>
                {group.title}
              </SectionTitle>
              <Card>
                <ul {...stylex.props(styles.list)}>
                  {group.rows.map((entry) => {
                    const place = names.get(entry.propertyId);
                    return (
                      place && (
                        <li key={`${entry.propertyId}-${entry.date}`} {...stylex.props(styles.item)}>
                          <Row
                            entry={entry}
                            place={place}
                            named={properties.length > 1}
                            cleaners={cleaners}
                            overdue={entry.status === "pending" && entry.date < today}
                            open={Boolean(group.near)}
                          />
                        </li>
                      )
                    );
                  })}
                </ul>
              </Card>
            </section>
          ))
        )}
      </div>

      <div {...stylex.props(styles.column, styles.side)}>
        <Team cleaners={cleaners} />
        <Card>
          <div {...stylex.props(styles.head)}>
            <SectionTitle>{t.places.title}</SectionTitle>
          </div>
          <ul {...stylex.props(styles.list)}>
            {properties.map((property) => (
              <li key={property.id} {...stylex.props(styles.item)}>
                <Place property={property} cleaners={cleaners} assignments={assignments} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

/** The people who clean: contacts to assign cleanings to. */
function Team({ cleaners }: { cleaners: Cleaner[] }) {
  const t = useI18n("cleaning").m.cleaning.team;
  const add = useMutation(addCleaner);
  const remove = useMutation(deleteCleaner);
  const failed = add.error ?? remove.error;

  return (
    <Card>
      <div {...stylex.props(styles.head, styles.between)}>
        <div {...stylex.props(styles.headText)}>
          <SectionTitle>{t.title}</SectionTitle>
          <p {...stylex.props(styles.hint)}>{t.hint}</p>
        </div>
        <Modal label={t.add} title={t.add} size="sm">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const sent = new FormData(form);
              add.mutate(
                { name: String(sent.get("name") ?? ""), phone: String(sent.get("phone") ?? "") },
                { onSuccess: () => form.reset() },
              );
            }}
            {...stylex.props(styles.form)}
          >
            <Field label={t.name} htmlFor="cleaner-name" xstyle={styles.whole}>
              <Input id="cleaner-name" name="name" required maxLength={80} autoComplete="off" />
            </Field>
            <Field label={t.phone} htmlFor="cleaner-phone" xstyle={styles.whole}>
              <Input id="cleaner-phone" name="phone" type="tel" maxLength={40} autoComplete="off" />
            </Field>
            <SubmitButton variant="primary" pending={add.isPending}>
              {t.add}
            </SubmitButton>
          </form>
        </Modal>
      </div>
      {cleaners.length === 0 ? (
        <p {...stylex.props(styles.none)}>{t.none}</p>
      ) : (
        <ul {...stylex.props(styles.list)}>
          {cleaners.map((cleaner) => (
            <li key={cleaner.id} {...stylex.props(styles.item, styles.cleaner)}>
              <span {...stylex.props(styles.headText)}>
                <span {...stylex.props(styles.strong)}>{cleaner.name}</span>
                {cleaner.phone && (
                  <a href={`tel:${cleaner.phone}`} {...stylex.props(styles.phone)}>
                    {cleaner.phone}
                  </a>
                )}
              </span>
              <ConfirmButton
                size="sm"
                message={t.removeConfirm(cleaner.name)}
                pending={remove.isPending && remove.variables === cleaner.id}
                onConfirm={() => remove.mutate(cleaner.id)}
              >
                {t.remove}
              </ConfirmButton>
            </li>
          ))}
        </ul>
      )}
      {failed && (
        <Notice tone="critical" role="alert" xstyle={styles.problem}>
          {failed.message}
        </Notice>
      )}
    </Card>
  );
}

/** One property: whether its cleanings are planned, and who does them. */
function Place({
  property,
  cleaners,
  assignments,
}: {
  property: Property;
  cleaners: Cleaner[];
  assignments: CleanerAssignment[];
}) {
  const t = useI18n("cleaning").m.cleaning.places;
  const plan = useMutation(setCleaningEnabled);
  const assign = useMutation(assignCleaner);
  const failed = plan.error ?? assign.error;
  const assigned = (priority: number) =>
    assignments.find((a) => a.propertyId === property.id && a.priority === priority)?.cleanerId ?? "";

  return (
    <div {...stylex.props(styles.place)}>
      <div {...stylex.props(styles.placeHead)}>
        <span {...stylex.props(styles.strong)}>{property.name}</span>
        <Button
          size="sm"
          disabled={plan.isPending}
          aria-busy={plan.isPending}
          onClick={() => plan.mutate({ property: property.id, enabled: !property.cleaningEnabled })}
        >
          {property.cleaningEnabled ? t.switchOff : t.switchOn}
        </Button>
      </div>
      {property.cleaningEnabled ? (
        <div {...stylex.props(styles.assign)}>
          {([0, 1] as const).map((priority) => {
            const id = `assign-${property.id}-${priority}`;
            return (
              // The key remounts the field once saved, so it shows the stored choice.
              <Field
                key={`${priority}-${assigned(priority)}`}
                label={priority === 0 ? t.usual : t.backup}
                htmlFor={id}
              >
                {/* Saves as soon as a choice is made. */}
                <Select
                  id={id}
                  name="cleanerId"
                  defaultValue={assigned(priority)}
                  onChange={(event) => {
                    const chosen = event.currentTarget.value;
                    assign.mutate({
                      property: property.id,
                      priority,
                      cleanerId: chosen === "" ? "" : Number(chosen),
                    });
                  }}
                >
                  <option value="">{t.nobody}</option>
                  {cleaners.map((cleaner) => (
                    <option key={cleaner.id} value={cleaner.id}>
                      {cleaner.name}
                    </option>
                  ))}
                </Select>
              </Field>
            );
          })}
        </div>
      ) : (
        <p {...stylex.props(styles.off)}>{t.offHint}</p>
      )}
      {failed && (
        <Notice tone="critical" role="alert">
          {failed.message}
        </Notice>
      )}
    </div>
  );
}
