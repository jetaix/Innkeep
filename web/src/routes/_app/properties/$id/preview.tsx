import * as stylex from "@stylexjs/stylex";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import type { OtaChannel } from "@/db/schema";
import { ApiError } from "../../../../api/client";
import { propertyPreviewQuery } from "../../../../api/queries";
import { Comparison, ListingCard, type Side } from "../../../../features/properties/listing-preview";
import { PLATFORMS } from "../../../../features/properties/shared";
import { loadMessages, useI18n } from "../../../../i18n";
import { color, text } from "../../../../tokens.stylex";
import { PageHeader } from "../../../../ui/primitives";

export const Route = createFileRoute("/_app/properties/$id/preview")({
  params: { parse: (raw) => ({ id: Number(raw.id) }), stringify: (params) => ({ id: String(params.id) }) },
  loader: ({ context: { queryClient }, params }) => {
    void loadMessages("preview");
    return queryClient.ensureQueryData(propertyPreviewQuery(params.id)).catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 404) throw notFound();
      throw error;
    });
  },
  component: PreviewPage,
});

const DESK = "@media (min-width: 64rem)";

const styles = stylex.create({
  page: { display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "72rem" },
  crumb: { margin: 0, fontSize: text.base },
  back: {
    color: color.muted,
    textDecoration: { default: "none", ":hover": "underline" },
    textUnderlineOffset: 2,
  },
  sides: {
    display: "grid",
    gridTemplateColumns: { default: "minmax(0, 1fr)", [DESK]: "minmax(0, 1fr) minmax(0, 1fr)" },
    alignItems: "start",
    gap: "1.5rem",
  },
  note: { maxWidth: "70ch", margin: 0, color: color.muted, fontSize: text.base, lineHeight: 1.625 },
});

function PreviewPage() {
  const t = useI18n("preview").m.preview;
  return (
    <>
      <PageHeader title={t.title} description={t.description} />
      <Previews />
    </>
  );
}

function Previews() {
  const t = useI18n("preview").m.preview;
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(propertyPreviewQuery(id));
  const { property } = data;

  // Most recently read first.
  const quotes = [...data.quotes].sort((a, b) => b.seenAt - a.seenAt);
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

  const sides: Side[] = PLATFORMS.map((channel) => {
    const listing = data.listings.find((row) => row.channel === channel);
    const preview = listing?.preview ?? null;
    return {
      channel,
      // When the public page's gallery was not read, the photos from the platform's admin stand in.
      preview:
        preview && preview.images.length === 0
          ? { ...preview, images: (data.adminPhotos[channel] ?? []).slice(0, 12) }
          : preview,
      readAt: listing?.publicPreviewAt ?? null,
      quote: quoteFor(channel),
    };
  });

  return (
    <div {...stylex.props(styles.page)}>
      <p {...stylex.props(styles.crumb)}>
        <Link to="/properties/$id" params={{ id: property.id }} {...stylex.props(styles.back)}>
          {t.back}: {property.name}
        </Link>
      </p>
      <div {...stylex.props(styles.sides)}>
        {sides.map((side) => (
          <ListingCard
            key={side.channel}
            side={side}
            link={data.publicLinks[side.channel] ?? null}
            canRead={data.extensionOn}
            currency={property.currency}
          />
        ))}
      </div>
      <Comparison sides={sides} currency={property.currency} />
      <p {...stylex.props(styles.note)}>{t.note}</p>
    </div>
  );
}
