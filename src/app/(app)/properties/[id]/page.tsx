import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { CHANNELS, type ChannelAdapter } from "@/channels";
import { effectiveContent, publishState } from "@/channels/content";
import { ConfirmButton, CopyButton, SubmitButton } from "@/components/ui/actions";
import { buttonClass } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Badge, Card, SectionTitle, SourceDot } from "@/components/ui/primitives";
import { Loading } from "@/components/ui/loading";
import { getDb, listings, OTA_CHANNELS, properties, type Listing, type Property } from "@/db";
import {
  deleteProperty,
  markPublished,
  saveListing,
  syncListingAction,
  updateProperty,
} from "@/features/properties/actions";
import { parseChannelDetails } from "@/features/properties/ingest";
import { getPages } from "@/features/properties/pages";
import { getI18n } from "@/i18n/server";
import { isPrivateAddress } from "@/lib/net";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).m.properties.property.title };
}

export default function PropertyPage({ params }: PageProps<"/properties/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <PropertyDetail params={params} />
    </Suspense>
  );
}

async function PropertyDetail({ params }: Pick<PageProps<"/properties/[id]">, "params">) {
  await connection();
  const { m } = await getI18n();
  const t = m.properties;
  const id = Number((await params).id);
  const db = getDb();
  const property = Number.isInteger(id)
    ? await db.select().from(properties).where(eq(properties.id, id)).get()
    : undefined;
  if (!property) notFound();
  const propertyListings = await db.select().from(listings).where(eq(listings.propertyId, id)).all();

  const requestHeaders = await headers();
  const origin =
    process.env.APP_URL?.replace(/\/$/, "") ??
    `${requestHeaders.get("x-forwarded-proto") ?? "http"}://${requestHeaders.get("host")}`;

  return (
    <div className="max-w-6xl">
      <p className="mb-1 text-xs">
        <Link href="/properties" className="text-muted underline-offset-2 hover:underline">
          {t.title}
        </Link>
        <span className="text-faint"> / </span>
      </p>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold tracking-tight">{property.name}</h1>
        <Link href={`/properties/${property.id}/preview`} className={buttonClass({ size: "sm" })}>
          {m.preview.link}
        </Link>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Card className="p-5">
          <section aria-labelledby="details-heading">
            <SectionTitle id="details-heading">{t.details.heading}</SectionTitle>
            <p className="mt-0.5 mb-4 text-xs text-muted">{t.details.intro}</p>
            <DetailsForm property={property} />
          </section>
        </Card>

        <div className="space-y-6">
          {OTA_CHANNELS.map((channel) => (
            <ChannelCard
              key={channel}
              adapter={CHANNELS[channel]}
              property={property}
              listing={propertyListings.find((l) => l.channel === channel)}
              exportUrl={`${origin}/api/ical/${property.icalToken}/${channel}.ics`}
              unreachable={isPrivateAddress(origin)}
              otherListing={propertyListings.find((l) => l.channel !== channel)}
            />
          ))}
          <Card className="p-5">
            <SectionTitle>{t.fullCalendar.heading}</SectionTitle>
            <p className="mt-0.5 mb-3 text-xs text-muted">{t.fullCalendar.body}</p>
            <CopyField
              value={`${origin}/api/ical/${property.icalToken}/all.ics`}
              label={t.fullCalendar.heading}
            />
          </Card>
        </div>
      </div>

      <form action={deleteProperty.bind(null, property.id)} className="mt-10 border-t border-line pt-5">
        <ConfirmButton message={t.property.confirmDelete(property.name)}>{t.property.delete}</ConfirmButton>
      </form>
    </div>
  );
}

async function DetailsForm({ property }: { property: Property }) {
  const { m } = await getI18n();
  const t = m.properties.details;
  return (
    <form action={updateProperty.bind(null, property.id)} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.name} htmlFor="name">
          <Input id="name" name="name" defaultValue={property.name} required />
        </Field>
        <Field label={t.address} htmlFor="address">
          <Input id="address" name="address" defaultValue={property.address} autoComplete="off" />
        </Field>
      </div>
      <Field label={t.listingTitle} htmlFor="title" hint={t.listingTitleHint}>
        <Input id="title" name="title" defaultValue={property.title} maxLength={255} />
      </Field>
      <Field label={t.description} htmlFor="description">
        <Textarea id="description" name="description" rows={6} defaultValue={property.description} />
      </Field>
      <div className="grid grid-cols-3 gap-3">
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
      <Field label={t.houseRules} htmlFor="houseRules">
        <Textarea id="houseRules" name="houseRules" rows={3} defaultValue={property.houseRules} />
      </Field>
      <SubmitButton variant="primary" pendingLabel={m.properties.property.saving}>
        {t.save}
      </SubmitButton>
    </form>
  );
}

function CopyField({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <Input readOnly value={value} aria-label={label} className="font-mono text-xs" />
      <CopyButton value={value} />
    </div>
  );
}

async function ChannelCard({
  adapter,
  property,
  listing,
  exportUrl,
  unreachable,
  otherListing,
}: {
  adapter: ChannelAdapter;
  property: Property;
  listing: Listing | undefined;
  exportUrl: string;
  /** Innkeep runs on an address the platforms cannot open (this computer, a home network). */
  unreachable: boolean;
  /** The same property's listing on the other platform. */
  otherListing: Listing | undefined;
}) {
  const { m, fmt } = await getI18n();
  const t = m.properties.channel;
  const content = effectiveContent(property, listing);
  const state = listing ? publishState(property, listing) : "never";
  const id = (name: string) => `${adapter.id}-${name}`;

  return (
    <Card className="p-5">
      <section aria-labelledby={id("heading")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionTitle id={id("heading")} className="flex items-center gap-2">
            <SourceDot source={adapter.id} />
            {adapter.label}
          </SectionTitle>
          {listing?.listingUrl && (
            <a
              href={listing.listingUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-muted underline underline-offset-2 hover:text-ink"
            >
              {t.openListing}
              <span className="sr-only"> {m.common.actions.newTab}</span>
            </a>
          )}
        </div>

        <form action={saveListing.bind(null, property.id, adapter.id)} className="mt-4 space-y-3">
          <Field
            label={t.importLabel(adapter.label)}
            htmlFor={id("icalUrl")}
            hint={<SyncStatus listing={listing} />}
          >
            <Input
              id={id("icalUrl")}
              name="icalUrl"
              defaultValue={listing?.icalUrl ?? ""}
              placeholder="https://…ics"
              className="font-mono text-xs"
              spellCheck={false}
            />
          </Field>
          {unreachable ? (
            // The platform would answer "invalid link": say why, and give the link that does work.
            <div className="rounded-md bg-warn-bg px-3 py-2.5 text-[13px] leading-relaxed text-warn">
              <p className="font-medium">{t.local.title(adapter.label)}</p>
              <p className="mt-1">{t.local.why(adapter.label)}</p>
              {otherListing?.icalUrl ? (
                <>
                  <p className="mt-2 mb-1">
                    {t.local.instead(CHANNELS[otherListing.channel].label, t.calendarHelp[adapter.id])}
                  </p>
                  <CopyField
                    value={otherListing.icalUrl}
                    label={t.local.copyLabel(CHANNELS[otherListing.channel].label)}
                  />
                </>
              ) : (
                <p className="mt-2">
                  {t.local.missing(CHANNELS[adapter.id === "airbnb" ? "booking" : "airbnb"].label)}
                </p>
              )}
            </div>
          ) : (
            <div>
              <p className="mb-1 text-xs font-medium text-muted">
                {t.exportHint(t.calendarHelp[adapter.id])}
              </p>
              <CopyField value={exportUrl} label={t.exportLabel(adapter.label)} />
            </div>
          )}

          <div className="border-t border-line pt-3">
            <p className="mb-3 text-xs font-semibold">{t.shownOn(adapter.label)}</p>
            <div className="space-y-3">
              <Field label={t.listingUrl} htmlFor={id("listingUrl")}>
                <Input
                  id={id("listingUrl")}
                  name="listingUrl"
                  type="url"
                  defaultValue={listing?.listingUrl ?? ""}
                  placeholder="https://…"
                />
              </Field>
              <Field label={t.titleOverride} htmlFor={id("titleOverride")}>
                <Input
                  id={id("titleOverride")}
                  name="titleOverride"
                  defaultValue={listing?.titleOverride ?? ""}
                  placeholder={property.title || t.titleOverridePlaceholder}
                />
              </Field>
              <Field label={t.descriptionOverride} htmlFor={id("descriptionOverride")}>
                <Textarea
                  id={id("descriptionOverride")}
                  name="descriptionOverride"
                  rows={3}
                  defaultValue={listing?.descriptionOverride ?? ""}
                  placeholder={t.descriptionOverridePlaceholder}
                />
              </Field>
            </div>
          </div>
          <SubmitButton variant="primary" pendingLabel={m.properties.property.saving}>
            {t.save(adapter.label)}
          </SubmitButton>
        </form>

        {listing && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
            {listing.icalUrl && (
              <form action={syncListingAction.bind(null, listing.id)}>
                <SubmitButton size="sm" pendingLabel={t.syncing}>
                  {t.syncNow}
                </SubmitButton>
              </form>
            )}
            <Badge tone={state === "outdated" ? "warn" : state === "current" ? "good" : "neutral"}>
              {state === "current" && t.published(fmt.timeAgo(listing.publishedAt ?? 0))}
              {state === "outdated" && t.outdated}
              {state === "never" && t.neverPublished}
            </Badge>
            {state !== "current" && (
              <>
                <CopyButton value={content.title} label={t.copyTitle} />
                <CopyButton value={content.description} label={t.copyDescription} />
                <form action={markPublished.bind(null, listing.id)}>
                  <SubmitButton size="sm" pendingLabel={m.properties.property.saving}>
                    {adapter.capabilities.content ? t.publishTo(adapter.label) : t.markPublished}
                  </SubmitButton>
                </form>
                {!adapter.capabilities.content && (
                  <p className="w-full text-xs leading-relaxed text-muted">{t.manualNote(adapter.label)}</p>
                )}
              </>
            )}
          </div>
        )}
        {listing && <ChannelFacts adapter={adapter} listing={listing} />}
        {listing && <AdminPages adapter={adapter} listing={listing} />}
      </section>
    </Card>
  );
}

/**
 * The listing as the platform's own editor describes it, read by the browser
 * extension. Reference only: headings and values stay in the host's language.
 */
async function ChannelFacts({ adapter, listing }: { adapter: ChannelAdapter; listing: Listing }) {
  const { m, fmt } = await getI18n();
  const t = m.properties.facts;
  const cards = Object.values(parseChannelDetails(listing.channelDetails));
  // Only Airbnb's editor is read today, and only once the extension is switched on.
  const editor =
    adapter.id === "airbnb" && listing.externalId && process.env.EXTENSION_TOKEN
      ? `${URL.canParse(listing.listingUrl) ? new URL(listing.listingUrl).origin : "https://www.airbnb.com"}/hosting/listings/editor/${listing.externalId}/details`
      : null;
  if (cards.length === 0 && !editor) return null;

  return (
    <div className="mt-4 border-t border-line pt-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-semibold">{t.heading(adapter.label)}</p>
        {editor && (
          <a
            href={editor}
            target="_blank"
            rel="noopener"
            className="text-xs text-muted underline underline-offset-2 hover:text-ink"
          >
            {cards.length ? t.readAgain : t.readWithExtension}
            <span className="sr-only"> {t.opensEditor(adapter.label)}</span>
          </a>
        )}
      </div>
      {cards.length === 0 ? (
        <p className="mt-1 text-xs text-muted">{t.empty}</p>
      ) : (
        <>
          <dl className="mt-2 grid gap-x-4 gap-y-2 text-xs sm:grid-cols-[minmax(0,10rem)_1fr]">
            {cards.map(([heading, ...values]) => (
              <div key={heading} className="contents">
                <dt className="text-muted">{heading}</dt>
                <dd className="whitespace-pre-line">{values.join("\n")}</dd>
              </div>
            ))}
          </dl>
          {listing.channelDetailsAt && (
            <p className="mt-2 text-xs text-faint">{t.readAt(fmt.timeAgo(listing.channelDetailsAt))}</p>
          )}
        </>
      )}
    </div>
  );
}

async function SyncStatus({ listing }: { listing: Listing | undefined }) {
  const { m, fmt } = await getI18n();
  const t = m.properties.sync;
  if (!listing?.icalUrl) return t.paste;
  if (listing.lastSyncError) {
    return (
      <span className="text-critical" role="alert">
        {t.failed(listing.lastSyncError)}
        {listing.lastSyncedAt ? t.lastSuccess(fmt.timeAgo(listing.lastSyncedAt)) : ""}
      </span>
    );
  }
  return listing.lastSyncedAt ? t.lastSynced(fmt.timeAgo(listing.lastSyncedAt)) : t.never;
}

/**
 * Admin pages of the platform kept as shown by the extension: every amenity,
 * every photo, the policies. Reference only, in the host's own language.
 */
async function AdminPages({ adapter, listing }: { adapter: ChannelAdapter; listing: Listing }) {
  const pages = await getPages(listing.id);
  if (pages.length === 0) return null;
  const { m, fmt } = await getI18n();
  const t = m.properties.adminPages;

  return (
    <div className="mt-4 border-t border-line pt-3">
      <p className="text-xs font-semibold">{t.title(adapter.label)}</p>
      <p className="mt-0.5 text-xs text-muted">{t.hint}</p>
      <ul className="mt-2 space-y-1">
        {pages.map((page) => (
          <li key={page.key}>
            <details className="group rounded-md border border-line">
              <summary className="flex cursor-pointer flex-wrap items-baseline justify-between gap-2 px-3 py-2 text-[13px]">
                <span className="font-medium">{page.title || page.key}</span>
                <span className="text-xs text-muted">
                  {[
                    page.images.length ? t.photos(page.images.length) : null,
                    t.read(fmt.timeAgo(page.seenAt)),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </summary>
              <div className="border-t border-line px-3 py-2">
                {page.images.length > 0 && (
                  <div className="mb-2 grid grid-cols-4 gap-1 sm:grid-cols-6">
                    {page.images.slice(0, 24).map((image) => (
                      // Photos load from the platform's own image servers.
                      // biome-ignore lint/performance/noImgElement: photos come from the platforms' own servers
                      <img
                        key={image}
                        src={image}
                        alt=""
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="aspect-square w-full rounded object-cover"
                      />
                    ))}
                  </div>
                )}
                <p className="max-h-72 overflow-y-auto text-xs leading-relaxed whitespace-pre-line text-muted">
                  {page.lines.join("\n")}
                </p>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
