import * as stylex from "@stylexjs/stylex";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ApiError } from "../../../../api/client";
import { deleteProperty, updateProperty } from "../../../../api/mutations";
import { propertyQuery } from "../../../../api/queries";
import { ChannelCard, CopyField } from "../../../../features/properties/channel-card";
import { PLATFORMS, type PropertyAnswer } from "../../../../features/properties/shared";
import { loadMessages, useI18n } from "../../../../i18n";
import { color, font, text } from "../../../../tokens.stylex";
import { ConfirmButton, SubmitButton } from "../../../../ui/actions";
import { buttonStyle } from "../../../../ui/button";
import { Field, Input, Textarea } from "../../../../ui/form";
import { Card, Notice, SectionTitle } from "../../../../ui/primitives";

export const Route = createFileRoute("/_app/properties/$id/")({
  // An address that is not a number is not a property.
  params: { parse: (raw) => ({ id: Number(raw.id) }), stringify: (params) => ({ id: String(params.id) }) },
  loader: ({ context: { queryClient }, params }) => {
    void loadMessages("properties", "preview");
    return queryClient.ensureQueryData(propertyQuery(params.id)).catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 404) throw notFound();
      throw error;
    });
  },
  component: PropertyPage,
});

const WIDE = "@media (min-width: 40rem)";
const DESK = "@media (min-width: 80rem)";

const styles = stylex.create({
  page: { maxWidth: "72rem" },
  crumb: { margin: "0 0 0.375rem", fontSize: text.base },
  back: {
    color: color.muted,
    textDecoration: { default: "none", ":hover": "underline" },
    textUnderlineOffset: 2,
  },
  faint: { color: color.muted },
  head: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.75rem",
    marginBottom: "1.75rem",
  },
  name: {
    margin: 0,
    fontFamily: font.display,
    fontSize: text.title,
    fontWeight: 400,
    letterSpacing: "-0.025em",
    lineHeight: 1.15,
  },
  columns: {
    display: "grid",
    gridTemplateColumns: { default: "minmax(0, 1fr)", [DESK]: "minmax(0, 1fr) minmax(0, 1.1fr)" },
    alignItems: "start",
    gap: "1.5rem",
  },
  card: { padding: "1.25rem" },
  intro: { margin: "0.25rem 0 1.125rem", color: color.muted, fontSize: text.base },
  body: { margin: "0.25rem 0 0.875rem", color: color.muted, fontSize: text.base },
  channels: { display: "flex", flexDirection: "column", gap: "1.5rem" },
  form: { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.75rem" },
  stretch: { alignSelf: "stretch" },
  two: {
    display: "grid",
    gridTemplateColumns: { default: "1fr", [WIDE]: "1fr 1fr" },
    gap: "0.75rem",
    alignSelf: "stretch",
  },
  three: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "0.75rem",
    alignSelf: "stretch",
  },
  four: {
    display: "grid",
    gridTemplateColumns: { default: "repeat(2, minmax(0, 1fr))", [WIDE]: "repeat(4, minmax(0, 1fr))" },
    gap: "0.75rem",
    alignSelf: "stretch",
  },
  remove: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "0.75rem",
    marginTop: "2.5rem",
    paddingTop: "1.25rem",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.line,
  },
});

function PropertyPage() {
  const { m } = useI18n("properties", "preview");
  const t = m.properties;
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(propertyQuery(id));
  const { property, listings, origin } = data;
  const navigate = useNavigate();
  const remove = useMutation(deleteProperty);

  return (
    <div {...stylex.props(styles.page)}>
      <p {...stylex.props(styles.crumb)}>
        <Link to="/properties" {...stylex.props(styles.back)}>
          {t.title}
        </Link>
        <span {...stylex.props(styles.faint)}> / </span>
      </p>
      <div {...stylex.props(styles.head)}>
        <h1 {...stylex.props(styles.name)}>{property.name}</h1>
        <Link to="/properties/$id/preview" params={{ id: property.id }} {...stylex.props(buttonStyle())}>
          {m.preview.link}
        </Link>
      </div>

      <div {...stylex.props(styles.columns)}>
        <Card xstyle={styles.card}>
          <section aria-labelledby="details-heading">
            <SectionTitle id="details-heading">{t.details.heading}</SectionTitle>
            <p {...stylex.props(styles.intro)}>{t.details.intro}</p>
            <DetailsForm key={property.id} property={property} />
          </section>
        </Card>

        <div {...stylex.props(styles.channels)}>
          {PLATFORMS.map((channel) => (
            <ChannelCard
              key={`${property.id}-${channel}`}
              channel={channel}
              property={property}
              listing={listings.find((l) => l.channel === channel)}
              exportUrl={`${origin}/api/ical/${property.icalToken}/${channel}.ics`}
              unreachable={data.unreachable}
              otherListing={listings.find((l) => l.channel !== channel)}
              pushesContent={data.pushesContent[channel] ?? false}
              extensionOn={data.extensionOn}
            />
          ))}
          <Card xstyle={styles.card}>
            <SectionTitle>{t.fullCalendar.heading}</SectionTitle>
            <p {...stylex.props(styles.body)}>{t.fullCalendar.body}</p>
            <CopyField
              value={`${origin}/api/ical/${property.icalToken}/all.ics`}
              label={t.fullCalendar.heading}
            />
          </Card>
        </div>
      </div>

      <div {...stylex.props(styles.remove)}>
        {remove.error && (
          <Notice tone="critical" role="alert">
            {remove.error.message}
          </Notice>
        )}
        <ConfirmButton
          message={t.property.confirmDelete(property.name)}
          pending={remove.isPending}
          onConfirm={() =>
            remove.mutate(property.id, { onSuccess: () => void navigate({ to: "/properties" }) })
          }
        >
          {t.property.delete}
        </ConfirmButton>
      </div>
    </div>
  );
}

function DetailsForm({ property }: { property: PropertyAnswer["property"] }) {
  const { m } = useI18n("properties");
  const t = m.properties.details;
  const save = useMutation(updateProperty);
  return (
    <form
      {...stylex.props(styles.form)}
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate({ id: property.id, fields: Object.fromEntries(new FormData(event.currentTarget)) });
      }}
    >
      <div {...stylex.props(styles.two)}>
        <Field label={t.name} htmlFor="name">
          <Input id="name" name="name" defaultValue={property.name} required />
        </Field>
        <Field label={t.address} htmlFor="address">
          <Input id="address" name="address" defaultValue={property.address} autoComplete="off" />
        </Field>
      </div>
      <Field label={t.listingTitle} htmlFor="title" hint={t.listingTitleHint} xstyle={styles.stretch}>
        <Input id="title" name="title" defaultValue={property.title} maxLength={255} />
      </Field>
      <Field label={t.description} htmlFor="description" xstyle={styles.stretch}>
        <Textarea id="description" name="description" rows={6} defaultValue={property.description} />
      </Field>
      <div {...stylex.props(styles.three)}>
        <Field label={t.guests} htmlFor="maxGuests">
          <Input id="maxGuests" name="maxGuests" type="number" min={1} defaultValue={property.maxGuests} />
        </Field>
        <Field label={t.bedrooms} htmlFor="bedrooms">
          <Input id="bedrooms" name="bedrooms" type="number" min={0} defaultValue={property.bedrooms} />
        </Field>
        <Field label={t.bathrooms} htmlFor="bathrooms">
          <Input id="bathrooms" name="bathrooms" type="number" min={0} defaultValue={property.bathrooms} />
        </Field>
      </div>
      <div {...stylex.props(styles.four)}>
        <Field label={t.nightlyRate} htmlFor="basePrice">
          <Input id="basePrice" name="basePrice" type="number" min={0} defaultValue={property.basePrice} />
        </Field>
        <Field label={t.currency} htmlFor="currency">
          <Input id="currency" name="currency" defaultValue={property.currency} minLength={3} maxLength={3} />
        </Field>
        <Field label={t.checkInFrom} htmlFor="checkInTime">
          <Input id="checkInTime" name="checkInTime" type="time" defaultValue={property.checkInTime} />
        </Field>
        <Field label={t.checkOutBy} htmlFor="checkOutTime">
          <Input id="checkOutTime" name="checkOutTime" type="time" defaultValue={property.checkOutTime} />
        </Field>
      </div>
      <Field label={t.houseRules} htmlFor="houseRules" xstyle={styles.stretch}>
        <Textarea id="houseRules" name="houseRules" rows={3} defaultValue={property.houseRules} />
      </Field>
      {save.error && (
        <Notice tone="critical" role="alert" xstyle={styles.stretch}>
          {save.error.message}
        </Notice>
      )}
      <SubmitButton variant="primary" pending={save.isPending} pendingLabel={m.properties.property.saving}>
        {t.save}
      </SubmitButton>
    </form>
  );
}
