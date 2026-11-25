import { BedDouble, Bath, ImageOff, MapPin, Star, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { CHANNELS } from "@/channels";
import { publishState } from "@/channels/content";
import { buttonClass } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { Badge, Card, EmptyState, PageHeader, SourceDot } from "@/components/ui/primitives";
import { getDb, listings, OTA_CHANNELS } from "@/db";
import { readPreview, sizedPhoto } from "@/features/properties/preview";
import { getProperties, getStays } from "@/features/reservations/queries";
import { monthOf, summariseMonth } from "@/features/revenue/compute";
import { INTL_LOCALE } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { today } from "@/lib/dates";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).m.properties.title };
}

export default async function PropertiesPage() {
  const { m } = await getI18n();
  const t = m.properties;
  return (
    <>
      <PageHeader title={t.title} description={t.description}>
        <Link href="/properties/new" className={buttonClass({ variant: "primary" })}>
          {t.create.open}
        </Link>
      </PageHeader>
      <Suspense fallback={<Loading />}>
        <PropertyList />
      </Suspense>
    </>
  );
}

async function PropertyList() {
  await connection();
  const { locale, m, fmt } = await getI18n();
  const t = m.properties;
  const properties = await getProperties();
  if (properties.length === 0) return <EmptyState title={t.list.empty.title}>{t.list.empty.body}</EmptyState>;

  const allListings = await getDb().select().from(listings).all();
  const now = today();
  const guests = (await getStays(`${monthOf(now)}-01`)).filter((stay) => stay.kind === "reservation");
  const number = (value: number) =>
    value.toLocaleString(INTL_LOCALE[locale], { maximumFractionDigits: 2, minimumFractionDigits: 1 });

  return (
    <ul className="grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2">
      {properties.map((property) => {
        const own = OTA_CHANNELS.map((channel) => ({
          channel,
          listing: allListings.find((l) => l.propertyId === property.id && l.channel === channel),
        }));
        const previews = own.flatMap(({ channel, listing }) => {
          const preview = listing ? readPreview(listing) : null;
          return preview ? [{ channel, preview }] : [];
        });
        const cover = previews.find(({ preview }) => preview.images.length > 0)?.preview.images[0];
        const location = previews.find(({ preview }) => preview.location)?.preview.location;
        const stays = guests.filter((stay) => stay.propertyId === property.id);
        const staying = stays.some((stay) => stay.checkIn <= now && stay.checkOut > now);
        const next = stays.find((stay) => stay.checkIn > now);
        const month = summariseMonth(monthOf(now), stays, [], [property]);

        return (
          <li key={property.id}>
            <Card className="group relative flex h-full flex-col overflow-hidden transition-shadow focus-within:shadow-pop hover:shadow-pop">
              <div className="relative aspect-[16/9] bg-sunken">
                {cover ? (
                  // biome-ignore lint/performance/noImgElement: photos come from the platforms' own servers
                  <img
                    src={sizedPhoto(cover, 720)}
                    alt={t.list.photoAlt(property.name)}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 size-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-xs text-muted">
                    <ImageOff aria-hidden className="size-6 text-faint" />
                    {t.list.noPhoto}
                  </div>
                )}
                <p className="absolute bottom-2 left-2 rounded-md bg-bg/90 px-2 py-1 text-xs font-semibold tabular-nums">
                  {t.list.perNight(fmt.money(property.basePrice * 100, property.currency, { cents: false }))}
                </p>
              </div>

              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold tracking-tight">
                    {/* The whole card opens the property; the buttons below sit above this link. */}
                    <Link href={`/properties/${property.id}`} className="after:absolute after:inset-0">
                      {property.name}
                    </Link>
                  </h2>
                  {property.title && property.title !== property.name && (
                    <p className="truncate text-[13px] text-muted">{property.title}</p>
                  )}
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                    <MapPin aria-hidden className="size-3.5 shrink-0" />
                    <span className="truncate">{property.address || location || t.list.noAddress}</span>
                  </p>
                </div>

                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
                  <li className="flex items-center gap-1.5">
                    <Users aria-hidden className="size-3.5 text-muted" />
                    {m.common.count.guests(property.maxGuests)}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <BedDouble aria-hidden className="size-3.5 text-muted" />
                    {t.list.bedrooms(property.bedrooms)}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Bath aria-hidden className="size-3.5 text-muted" />
                    {t.list.bathrooms(property.bathrooms)}
                  </li>
                </ul>

                {previews.some(({ preview }) => preview.rating != null) && (
                  <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] tabular-nums">
                    {previews.map(({ channel, preview }) =>
                      preview.rating == null ? null : (
                        <li
                          key={channel}
                          className="flex items-center gap-1.5"
                          title={t.list.rating(
                            CHANNELS[channel].label,
                            number(preview.rating),
                            preview.ratingScale,
                            preview.reviews ?? null,
                          )}
                        >
                          <SourceDot source={channel} />
                          <span className="sr-only">
                            {t.list.rating(
                              CHANNELS[channel].label,
                              number(preview.rating),
                              preview.ratingScale,
                              preview.reviews ?? null,
                            )}
                          </span>
                          <span aria-hidden className="flex items-center gap-1">
                            <Star className="size-3.5" />
                            <span className="font-medium">{number(preview.rating)}</span>
                            <span className="text-muted">
                              /{preview.ratingScale}
                              {preview.reviews == null ? "" : ` (${preview.reviews})`}
                            </span>
                          </span>
                        </li>
                      ),
                    )}
                  </ul>
                )}

                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs">
                    <p className="font-medium tabular-nums">
                      {t.list.occupancy(fmt.percent(month.occupancy))}
                    </p>
                    <p className="text-muted">
                      {staying
                        ? t.list.stayingNow
                        : next
                          ? t.list.nextArrival(fmt.date(next.checkIn))
                          : t.list.noArrival}
                    </p>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sunken">
                    <div
                      className="h-full rounded-full bg-ink"
                      style={{ width: `${Math.min(1, month.occupancy) * 100}%` }}
                    />
                  </div>
                </div>

                <ul className="flex flex-wrap gap-1.5">
                  {own.map(({ channel, listing }) => {
                    const status = !listing?.icalUrl
                      ? ({ text: t.list.status.notConnected, tone: "neutral" } as const)
                      : listing.lastSyncError
                        ? ({ text: t.list.status.notSyncing, tone: "critical" } as const)
                        : publishState(property, listing) === "outdated"
                          ? ({ text: t.list.status.detailsChanged, tone: "warn" } as const)
                          : ({ text: t.list.status.connected, tone: "neutral" } as const);
                    return (
                      <li key={channel}>
                        <Badge tone={status.tone}>
                          <SourceDot
                            source={channel}
                            className={listing?.icalUrl ? undefined : "bg-line-strong"}
                          />
                          {t.list.badge(CHANNELS[channel].label, status.text)}
                        </Badge>
                      </li>
                    );
                  })}
                </ul>

                <div className="relative z-10 mt-auto flex flex-wrap gap-2 pt-1">
                  <Link
                    href={`/properties/${property.id}/preview`}
                    className={buttonClass({ variant: "primary" })}
                  >
                    {t.list.view}
                  </Link>
                  <Link href={`/properties/${property.id}`} className={buttonClass()}>
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
