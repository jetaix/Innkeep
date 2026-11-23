import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { desc, eq } from "drizzle-orm";
import { ExternalLink, Star } from "lucide-react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { CHANNELS } from "@/channels";
import { buttonClass } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { Card, PageHeader, SectionTitle, SourceDot } from "@/components/ui/primitives";
import {
  getDb,
  guestQuotes,
  listings,
  OTA_CHANNELS,
  properties,
  type GuestQuote,
  type OtaChannel,
} from "@/db";
import { adminPhotos } from "@/features/properties/pages";
import { readPreview, type Preview } from "@/features/properties/preview";
import { publicPageLinks } from "@/features/reservations/platform-links";
import { INTL_LOCALE } from "@/i18n/config";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).m.preview.title };
}

export default async function PreviewPage({ params }: PageProps<"/properties/[id]/preview">) {
  const t = (await getI18n()).m.preview;
  return (
    <>
      <PageHeader title={t.title} description={t.description} />
      <Suspense fallback={<Loading />}>
        <Previews params={params} />
      </Suspense>
    </>
  );
}

type Side = { channel: OtaChannel; preview: Preview | null; readAt: number | null; quote: GuestQuote | null };

async function Previews({ params }: Pick<PageProps<"/properties/[id]/preview">, "params">) {
  await connection();
  const { m } = await getI18n();
  const t = m.preview;
  const id = Number((await params).id);
  const db = getDb();
  const property = Number.isInteger(id)
    ? await db.select().from(properties).where(eq(properties.id, id)).get()
    : undefined;
  if (!property) notFound();

  const rows = await db.select().from(listings).where(eq(listings.propertyId, id)).all();
  const quotes = await db
    .select()
    .from(guestQuotes)
    .where(eq(guestQuotes.propertyId, id))
    .orderBy(desc(guestQuotes.seenAt))
    .all();
  // The stay most recently checked on both platforms makes the fairest price comparison.
  const shared = quotes.find((quote) =>
    quotes.some(
      (other) =>
        other.source !== quote.source && other.checkIn === quote.checkIn && other.checkOut === quote.checkOut,
    ),
  );
  const quoteFor = (channel: OtaChannel) =>
    (shared
      ? quotes.find(
          (quote) =>
            quote.source === channel &&
            quote.checkIn === shared.checkIn &&
            quote.checkOut === shared.checkOut,
        )
      : quotes.find((quote) => quote.source === channel)) ?? null;

  const sides: Side[] = await Promise.all(
    OTA_CHANNELS.map(async (channel) => {
      const listing = rows.find((row) => row.channel === channel);
      return {
        channel,
        preview: await withAdminPhotos(listing ? readPreview(listing) : null, id, channel),
        readAt: listing?.publicPreviewAt ?? null,
        quote: quoteFor(channel),
      };
    }),
  );
  const links = await publicPageLinks(id);
  const canRead = Boolean(process.env.EXTENSION_TOKEN);

  return (
    <div className="max-w-6xl space-y-6">
      <p className="text-xs">
        <Link href={`/properties/${id}`} className="text-muted underline-offset-2 hover:underline">
          {t.back}: {property.name}
        </Link>
      </p>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        {sides.map((side) => (
          <ListingCard
            key={side.channel}
            side={side}
            link={links[side.channel] ?? null}
            canRead={canRead}
            currency={property.currency}
          />
        ))}
      </div>
      <Comparison sides={sides} currency={property.currency} />
      <p className="max-w-[80ch] text-xs leading-relaxed text-muted">{t.note}</p>
    </div>
  );
}

/** When the public page's gallery was not read, the photos from the platform's admin stand in. */
async function withAdminPhotos(
  preview: Preview | null,
  propertyId: number,
  channel: OtaChannel,
): Promise<Preview | null> {
  if (!preview || preview.images.length > 0) return preview;
  return { ...preview, images: (await adminPhotos(propertyId, channel)).slice(0, 12) };
}

async function ListingCard({
  side,
  link,
  canRead,
  currency,
}: {
  side: Side;
  link: string | null;
  canRead: boolean;
  currency: string;
}) {
  const { locale, m, fmt } = await getI18n();
  const t = m.preview;
  const { channel, preview, quote } = side;
  const label = CHANNELS[channel].label;
  const headingId = `preview-${channel}`;

  const readButton =
    link && canRead ? (
      // Not `noreferrer`: the extension recognises a tab opened from Innkeep by its referrer.
      <a href={link} target="_blank" rel="noopener" title={t.hint} className={buttonClass({ size: "sm" })}>
        {preview ? t.readAgain : t.read(label)}
        <ExternalLink aria-hidden />
        <span className="sr-only">{m.common.actions.newTab}</span>
      </a>
    ) : null;

  return (
    <Card className="overflow-hidden">
      <section aria-labelledby={headingId}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <SectionTitle id={headingId} className="flex items-center gap-2">
            <SourceDot source={channel} />
            {label}
          </SectionTitle>
          <div className="flex flex-wrap items-center gap-2">
            {side.readAt && <span className="text-xs text-muted">{t.readAt(fmt.timeAgo(side.readAt))}</span>}
            {readButton}
          </div>
        </div>

        {!preview ? (
          <div className="px-4 py-8">
            <p className="font-medium">{t.empty.title(label)}</p>
            <p className="mt-1 max-w-[60ch] text-[13px] leading-relaxed text-muted">
              {!canRead ? t.empty.noExtension : link ? t.empty.body : t.empty.noLink(label)}
            </p>
          </div>
        ) : (
          <>
            <Photos preview={preview} />
            <div className="space-y-4 px-4 py-4">
              <div>
                <h3 className="text-base leading-snug font-semibold tracking-tight">{preview.title}</h3>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-muted">
                  {preview.rating != null && (
                    <span className="inline-flex items-center gap-1 text-ink">
                      <Star aria-hidden className="size-3.5 fill-current" />
                      <span className="font-medium tabular-nums">
                        {t.rating(preview.rating.toLocaleString(INTL_LOCALE[locale]), preview.ratingScale)}
                      </span>
                    </span>
                  )}
                  {preview.reviews != null && <span>{t.reviews(preview.reviews)}</span>}
                  {preview.location && <span>{preview.location}</span>}
                </p>
                {preview.summary.map((line) => (
                  <p key={line} className="mt-1 text-[13px]">
                    {line}
                  </p>
                ))}
              </div>

              <div className="rounded-md border border-line px-3 py-2.5">
                <p className="text-xs text-muted">{t.price.title}</p>
                {quote ? (
                  <p className="mt-0.5">
                    <span className="text-base font-semibold tabular-nums">
                      {fmt.money(quote.total, currency, { cents: false })}
                    </span>
                    <span className="ml-2 text-xs text-muted">
                      {t.price.stay(fmt.date(quote.checkIn), fmt.date(quote.checkOut), quote.guests)}
                      {quote.original
                        ? `, ${t.price.was(fmt.money(quote.original, currency, { cents: false }))}`
                        : ""}
                    </span>
                  </p>
                ) : (
                  <p className="mt-0.5 text-[13px] text-muted">{t.price.none}</p>
                )}
              </div>

              {preview.highlights.length > 0 && (
                <div>
                  <h4 className="text-[13px] font-semibold">{t.highlights}</h4>
                  <ul className="mt-1.5 space-y-1 text-[13px] leading-relaxed">
                    {preview.highlights.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              )}

              {preview.description && (
                <div>
                  <h4 className="text-[13px] font-semibold">{t.about}</h4>
                  {preview.description.length > 420 ? (
                    <details className="mt-1.5 text-[13px] leading-relaxed">
                      <summary className="cursor-pointer text-muted underline underline-offset-2">
                        {t.showAll}
                      </summary>
                      <p className="mt-2 whitespace-pre-line">{preview.description.trim()}</p>
                    </details>
                  ) : (
                    <p className="mt-1.5 text-[13px] leading-relaxed whitespace-pre-line">
                      {preview.description.trim()}
                    </p>
                  )}
                </div>
              )}

              {preview.amenities.length > 0 && (
                <div>
                  <h4 className="text-[13px] font-semibold">{t.amenities}</h4>
                  <ul className="mt-1.5 grid gap-x-4 gap-y-1 text-[13px] sm:grid-cols-2">
                    {preview.amenities.map((amenity) => (
                      <li key={amenity}>{amenity}</li>
                    ))}
                  </ul>
                </div>
              )}

              {link && (
                <a
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted underline underline-offset-2 hover:text-ink"
                >
                  {t.open}
                  <span className="sr-only"> {m.common.actions.newTab}</span>
                </a>
              )}
            </div>
          </>
        )}
      </section>
    </Card>
  );
}

/** Airbnb's image server resizes on request; asking for a sensible width keeps the page light. */
function sized(url: string, width: number): string {
  const parsed = new URL(url);
  if (parsed.hostname.endsWith("muscache.com") && !parsed.search)
    parsed.searchParams.set("im_w", String(width));
  return parsed.toString();
}

/** One large photo and up to four small ones, the way both platforms open a listing. */
async function Photos({ preview }: { preview: Preview }) {
  const t = (await getI18n()).m.preview;
  if (preview.images.length === 0) {
    return <p className="hatch px-4 py-10 text-center text-xs text-muted">{t.noPhotos}</p>;
  }
  const [cover, ...rest] = preview.images;
  const small = rest.slice(0, 4);
  // Each photo fills a fixed cell, so the mosaic keeps its shape whatever the photos' own proportions.
  const photo = (url: string, index: number, width: number) => (
    <div key={url} className="relative min-h-0 overflow-hidden bg-sunken">
      {/* Photos come from the platforms' own image servers, which next/image is not set up for. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={sized(url, width)}
        alt={t.photoAlt(index + 1, preview.title)}
        referrerPolicy="no-referrer"
        className="absolute inset-0 size-full object-cover"
      />
    </div>
  );
  return (
    <div className="relative">
      <div className={`grid aspect-[2/1] gap-0.5 ${small.length ? "grid-cols-2" : ""}`}>
        {photo(cover, 0, 960)}
        {small.length > 0 && (
          <div
            className={`grid min-h-0 gap-0.5 ${small.length > 2 ? "grid-cols-2 grid-rows-2" : "grid-rows-2"}`}
          >
            {small.map((image, index) => photo(image, index + 1, 480))}
          </div>
        )}
      </div>
      <span className="absolute right-2 bottom-2 rounded-md bg-bg/90 px-2 py-0.5 text-xs font-medium tabular-nums">
        {t.photos(preview.images.length)}
      </span>
    </div>
  );
}

async function Comparison({ sides, currency }: { sides: Side[]; currency: string }) {
  const { locale, m, fmt } = await getI18n();
  const t = m.preview.compare;
  const [first, second] = sides;
  if (!first.preview && !second.preview) return null;

  const sameStay =
    first.quote && second.quote && first.quote.checkIn === second.quote.checkIn
      ? [first.quote, second.quote]
      : null;
  const rows: { label: string; values: (string | null)[] }[] = [
    { label: t.titleRow, values: sides.map((side) => side.preview?.title ?? null) },
    {
      label: t.photos,
      // No photo at all means the gallery was not read, not that the listing has none.
      values: sides.map((side) =>
        side.preview?.images.length ? m.preview.photos(side.preview.images.length) : null,
      ),
    },
    {
      label: t.rating,
      values: sides.map((side) =>
        side.preview?.rating != null
          ? m.preview.rating(
              side.preview.rating.toLocaleString(INTL_LOCALE[locale]),
              side.preview.ratingScale,
            )
          : null,
      ),
    },
    {
      label: t.reviews,
      values: sides.map((side) =>
        side.preview?.reviews != null ? m.preview.reviews(side.preview.reviews) : null,
      ),
    },
    {
      label: t.descriptionLength,
      values: sides.map((side) =>
        side.preview ? t.characters(side.preview.description.trim().length) : null,
      ),
    },
    {
      label: t.amenities,
      values: sides.map((side) => (side.preview ? String(side.preview.amenities.length) : null)),
    },
    ...(sameStay
      ? [
          {
            label: t.price,
            values: sameStay.map((quote) => fmt.money(quote.total, currency, { cents: false })),
          },
        ]
      : []),
  ];

  return (
    <Card>
      <div className="border-b border-line px-4 py-3">
        <SectionTitle>{t.title}</SectionTitle>
        <p className="mt-0.5 text-xs text-muted">{t.subtitle}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="text-xs text-muted">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium">
                {t.field}
              </th>
              {sides.map((side) => (
                <th key={side.channel} scope="col" className="px-3 py-2 font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <SourceDot source={side.channel} />
                    {CHANNELS[side.channel].label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line border-t border-line">
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row" className="px-4 py-2 text-[13px] font-normal whitespace-nowrap text-muted">
                  {row.label}
                </th>
                {row.values.map((value, index) => (
                  <td key={index} className="px-3 py-2 tabular-nums">
                    {value ?? <span className="text-xs text-muted">{t.missing}</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
