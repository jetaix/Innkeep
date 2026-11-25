import * as stylex from "@stylexjs/stylex";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bath, BedDouble, MapPin, Star, Users } from "lucide-react";
import type { Source } from "@/db/schema";
import { addMonths, monthOf, monthStart, nightsWithin, summariseMonth } from "@/features/revenue/compute";
import { INTL_LOCALE } from "@/i18n/config";
import { diffDays, today } from "@/lib/dates";
import { createProperty } from "../../../api/mutations";
import { propertiesQuery, staysQuery } from "../../../api/queries";
import { LogoMark } from "../../../brand/logo";
import { PLATFORMS, sizedPhoto } from "../../../features/properties/shared";
import { loadMessages, useI18n } from "../../../i18n";
import { color, font, radius, shadow, text } from "../../../tokens.stylex";
import { SubmitButton } from "../../../ui/actions";
import { buttonStyle } from "../../../ui/button";
import { Field, Input } from "../../../ui/form";
import { Modal } from "../../../ui/modal";
import { Badge, Card, EmptyState, Hidden, Notice, PageHeader, SourceDot } from "../../../ui/primitives";
import { slabStyle } from "../../../ui/slab";

/** The stays of this month and after: who is there now, who comes next, how full the month is. */
const stays = () => staysQuery({ from: monthStart(monthOf(today())) });

export const Route = createFileRoute("/_app/properties/")({
  loader: ({ context: { queryClient } }) => {
    void loadMessages("properties");
    return Promise.all([queryClient.ensureQueryData(propertiesQuery), queryClient.ensureQueryData(stays())]);
  },
  component: PropertiesPage,
});

const SOURCES = ["airbnb", "booking", "direct"] as const satisfies readonly Source[];

const styles = stylex.create({
  form: { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.75rem" },
  field: { alignSelf: "stretch" },
  failed: { marginBottom: "1rem", maxWidth: "72rem" },
  // As many doorways side by side as fit: three on a wide screen, one on a phone.
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 17.5rem), 1fr))",
    gap: "1.25rem",
    maxWidth: "72rem",
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
  card: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    padding: "0.75rem",
    borderRadius: "1.75rem",
    boxShadow: { default: shadow.card, ":hover": shadow.panel, ":focus-within": shadow.panel },
    transitionProperty: "box-shadow",
    transitionDuration: "200ms",
  },
  // Each place is a doorway: the cover has the arch of the mark.
  media: {
    position: "relative",
    aspectRatio: "6 / 5",
    overflow: "hidden",
    // Radii the browser scales down together, so the foot of the doorway keeps its corners.
    borderRadius: "12rem 12rem 1.5rem 1.5rem",
    backgroundColor: color.sunken,
  },
  photo: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" },
  noPhoto: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
    padding: "3.5rem 2rem 3rem",
    color: color.muted,
    fontSize: text.sm,
    lineHeight: 1.5,
    textAlign: "center",
    textWrap: "balance",
  },
  mark: { width: "2.25rem", height: "2.25rem", color: color.faint },
  price: {
    position: "absolute",
    bottom: "0.625rem",
    left: "0.625rem",
    margin: 0,
    padding: "0.25rem 0.625rem",
    borderRadius: radius.full,
    backgroundColor: color.panel,
    boxShadow: shadow.card,
    fontSize: text.sm,
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums",
  },
  body: {
    display: "flex",
    flexGrow: 1,
    flexDirection: "column",
    gap: "0.875rem",
    padding: "1rem 0.5rem 0.5rem",
  },
  head: { minWidth: 0 },
  name: {
    margin: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontFamily: font.display,
    fontSize: "1.375rem",
    fontWeight: 400,
    letterSpacing: "-0.02em",
    lineHeight: 1.25,
  },
  // Stretched over the card, so a click anywhere on it opens the property.
  open: {
    color: color.ink,
    textDecoration: "none",
    "::after": { content: '""', position: "absolute", inset: 0 },
  },
  title: {
    margin: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: color.muted,
    fontSize: text.base,
  },
  address: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    margin: "0.25rem 0 0",
    color: color.muted,
    fontSize: text.sm,
  },
  still: { flexShrink: 0 },
  clip: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  facts: {
    display: "flex",
    flexWrap: "wrap",
    columnGap: "1rem",
    rowGap: "0.25rem",
    margin: 0,
    padding: 0,
    listStyle: "none",
    fontSize: text.base,
  },
  numbers: { fontVariantNumeric: "tabular-nums" },
  fact: { display: "flex", alignItems: "center", gap: "0.375rem" },
  muted: { color: color.muted },
  score: { display: "flex", alignItems: "center", gap: "0.25rem" },
  strong: { fontWeight: 500 },
  month: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    justifyContent: "space-between",
    columnGap: "1rem",
    rowGap: "0.25rem",
    fontSize: text.sm,
  },
  booked: { margin: 0, fontWeight: 500, fontVariantNumeric: "tabular-nums" },
  arrival: { margin: 0, color: color.muted },
  // The month as a track; the booked nights lie in it as glass, one slab per source.
  meter: {
    display: "flex",
    gap: 2,
    height: "0.75rem",
    marginTop: "0.5rem",
    padding: 2,
    borderRadius: radius.full,
    backgroundColor: color.sunken,
  },
  fill: { minWidth: "0.5rem", height: "100%", borderRadius: radius.full },
  width: (ratio: number) => ({ width: `${ratio * 100}%` }),
  badges: { display: "flex", flexWrap: "wrap", gap: "0.375rem", margin: 0, padding: 0, listStyle: "none" },
  off: { backgroundColor: color.lineStrong },
  actions: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    marginTop: "auto",
    paddingTop: "0.25rem",
  },
});

function PropertiesPage() {
  const t = useI18n("properties").m.properties;
  const navigate = useNavigate();
  const create = useMutation(createProperty);
  return (
    <>
      <PageHeader title={t.title} description={t.description}>
        <Modal label={t.create.open} title={t.create.open} variant="primary">
          <form
            {...stylex.props(styles.form)}
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              create.mutate(String(new FormData(form).get("name") ?? ""), {
                onSuccess: ({ id }) => {
                  form.reset();
                  void navigate({ to: "/properties/$id", params: { id } });
                },
              });
            }}
          >
            <Field label={t.create.label} htmlFor="name" xstyle={styles.field}>
              <Input id="name" name="name" required placeholder={t.create.placeholder} autoComplete="off" />
            </Field>
            <SubmitButton variant="primary" pending={create.isPending} pendingLabel={t.property.saving}>
              {t.create.open}
            </SubmitButton>
          </form>
        </Modal>
      </PageHeader>
      {create.error && (
        <Notice tone="critical" role="alert" xstyle={styles.failed}>
          {create.error.message}
        </Notice>
      )}
      <PropertyList />
    </>
  );
}

function PropertyList() {
  const { locale, m, fmt } = useI18n("properties");
  const t = m.properties;
  const { properties, listings } = useSuspenseQuery(propertiesQuery).data;
  const { data } = useSuspenseQuery(stays());
  if (properties.length === 0) return <EmptyState title={t.list.empty.title}>{t.list.empty.body}</EmptyState>;

  const now = today();
  const guests = data.stays.filter((stay) => stay.kind === "reservation");
  const number = (value: number) =>
    value.toLocaleString(INTL_LOCALE[locale], { maximumFractionDigits: 2, minimumFractionDigits: 1 });

  return (
    <ul {...stylex.props(styles.grid)}>
      {properties.map((property) => {
        const own = PLATFORMS.map((channel) => ({
          channel,
          listing: listings.find((l) => l.propertyId === property.id && l.channel === channel),
        }));
        const previews = own.flatMap(({ channel, listing }) =>
          listing?.preview ? [{ channel, preview: listing.preview }] : [],
        );
        const cover = previews.find(({ preview }) => preview.images.length > 0)?.preview.images[0];
        const location = previews.find(({ preview }) => preview.location)?.preview.location;
        const booked = guests.filter((stay) => stay.propertyId === property.id);
        const staying = booked.some((stay) => stay.checkIn <= now && stay.checkOut > now);
        const next = booked.find((stay) => stay.checkIn > now);
        const month = summariseMonth(monthOf(now), booked, [], [property]);
        const from = monthStart(monthOf(now));
        const to = monthStart(addMonths(monthOf(now), 1));
        const nightsBy = SOURCES.map((source) => ({
          source,
          nights: booked
            .filter((stay) => stay.source === source)
            .reduce((sum, stay) => sum + nightsWithin(stay, from, to), 0),
        })).filter((part) => part.nights > 0);

        return (
          <li key={property.id}>
            <Card xstyle={styles.card}>
              <div {...stylex.props(styles.media)}>
                {cover ? (
                  // biome-ignore lint/performance/noImgElement: photos come from the platforms' own servers
                  <img
                    src={sizedPhoto(cover, 720)}
                    alt={t.list.photoAlt(property.name)}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    {...stylex.props(styles.photo)}
                  />
                ) : (
                  <div {...stylex.props(styles.noPhoto)}>
                    <LogoMark xstyle={styles.mark} />
                    {t.list.noPhoto}
                  </div>
                )}
                <p {...stylex.props(styles.price)}>
                  {t.list.perNight(fmt.money(property.basePrice * 100, property.currency, { cents: false }))}
                </p>
              </div>

              <div {...stylex.props(styles.body)}>
                <div {...stylex.props(styles.head)}>
                  <h2 {...stylex.props(styles.name)}>
                    {/* The whole card opens the property; the buttons below sit above this link. */}
                    <Link to="/properties/$id" params={{ id: property.id }} {...stylex.props(styles.open)}>
                      {property.name}
                    </Link>
                  </h2>
                  {property.title && property.title !== property.name && (
                    <p {...stylex.props(styles.title)}>{property.title}</p>
                  )}
                  <p {...stylex.props(styles.address)}>
                    <MapPin aria-hidden size={14} {...stylex.props(styles.still)} />
                    <span {...stylex.props(styles.clip)}>
                      {property.address || location || t.list.noAddress}
                    </span>
                  </p>
                </div>

                <ul {...stylex.props(styles.facts)}>
                  <li {...stylex.props(styles.fact)}>
                    <Users aria-hidden size={14} {...stylex.props(styles.muted)} />
                    {m.common.count.guests(property.maxGuests)}
                  </li>
                  <li {...stylex.props(styles.fact)}>
                    <BedDouble aria-hidden size={14} {...stylex.props(styles.muted)} />
                    {t.list.bedrooms(property.bedrooms)}
                  </li>
                  <li {...stylex.props(styles.fact)}>
                    <Bath aria-hidden size={14} {...stylex.props(styles.muted)} />
                    {t.list.bathrooms(property.bathrooms)}
                  </li>
                </ul>

                {previews.some(({ preview }) => preview.rating != null) && (
                  <ul {...stylex.props(styles.facts, styles.numbers)}>
                    {previews.map(({ channel, preview }) => {
                      if (preview.rating == null) return null;
                      const spoken = t.list.rating(
                        m.common.sources[channel],
                        number(preview.rating),
                        preview.ratingScale,
                        preview.reviews ?? null,
                      );
                      return (
                        <li key={channel} title={spoken} {...stylex.props(styles.fact)}>
                          <SourceDot source={channel} />
                          <Hidden>{spoken}</Hidden>
                          <span aria-hidden {...stylex.props(styles.score)}>
                            <Star size={14} />
                            <span {...stylex.props(styles.strong)}>{number(preview.rating)}</span>
                            <span {...stylex.props(styles.muted)}>
                              /{preview.ratingScale}
                              {preview.reviews == null ? "" : ` (${preview.reviews})`}
                            </span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <div>
                  <div {...stylex.props(styles.month)}>
                    <p {...stylex.props(styles.booked)}>{t.list.occupancy(fmt.percent(month.occupancy))}</p>
                    <p {...stylex.props(styles.arrival)}>
                      {staying
                        ? t.list.stayingNow
                        : next
                          ? t.list.nextArrival(fmt.date(next.checkIn))
                          : t.list.noArrival}
                    </p>
                  </div>
                  <div {...stylex.props(styles.meter)}>
                    {nightsBy.map(({ source, nights }) => {
                      const spoken = t.list.nightsFrom(
                        m.common.sources[source],
                        m.common.count.nights(nights),
                      );
                      return (
                        <div
                          key={source}
                          title={spoken}
                          {...stylex.props(
                            slabStyle(source),
                            styles.fill,
                            styles.width(Math.min(1, nights / diffDays(from, to))),
                          )}
                        >
                          <Hidden>{spoken}</Hidden>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <ul {...stylex.props(styles.badges)}>
                  {own.map(({ channel, listing }) => {
                    const status = !listing?.icalUrl
                      ? ({ text: t.list.status.notConnected, tone: "neutral" } as const)
                      : listing.lastSyncError
                        ? ({ text: t.list.status.notSyncing, tone: "critical" } as const)
                        : listing.state === "outdated"
                          ? ({ text: t.list.status.detailsChanged, tone: "warn" } as const)
                          : ({ text: t.list.status.connected, tone: "neutral" } as const);
                    return (
                      <li key={channel}>
                        <Badge tone={status.tone}>
                          <SourceDot source={channel} xstyle={listing?.icalUrl ? undefined : styles.off} />
                          {t.list.badge(m.common.sources[channel], status.text)}
                        </Badge>
                      </li>
                    );
                  })}
                </ul>

                <div {...stylex.props(styles.actions)}>
                  <Link
                    to="/properties/$id/preview"
                    params={{ id: property.id }}
                    {...stylex.props(buttonStyle({ variant: "primary" }))}
                  >
                    {t.list.view}
                  </Link>
                  <Link to="/properties/$id" params={{ id: property.id }} {...stylex.props(buttonStyle())}>
                    {t.list.manage}
                  </Link>
                </div>
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
