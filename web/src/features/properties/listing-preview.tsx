import * as stylex from "@stylexjs/stylex";
import { ExternalLink, Star } from "lucide-react";
import type { OtaChannel } from "@/db/schema";
import { INTL_LOCALE } from "@/i18n/config";
import { useI18n } from "../../i18n";
import { color, radius, text } from "../../tokens.stylex";
import { buttonStyle } from "../../ui/button";
import { Card, Hidden, SectionTitle, SourceDot } from "../../ui/primitives";
import { figureStyle, washStyle } from "../../ui/slab";
import { type PreviewAnswer, sizedPhoto } from "./shared";

type Preview = NonNullable<PreviewAnswer["listings"][number]["preview"]>;
type Quote = PreviewAnswer["quotes"][number];

/** One platform's side of the comparison: what its public page shows and what a guest would pay. */
export type Side = {
  channel: OtaChannel;
  preview: Preview | null;
  readAt: number | null;
  quote: Quote | null;
};

const WIDE = "@media (min-width: 40rem)";

const styles = stylex.create({
  card: { overflow: "hidden" },
  head: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.5rem",
    padding: "0.75rem 1rem",
  },
  heading: { display: "flex", alignItems: "center", gap: "0.5rem" },
  tools: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" },
  small: { color: color.muted, fontSize: text.sm },
  empty: { padding: "2rem 1.25rem" },
  emptyTitle: { margin: 0, fontWeight: 500 },
  emptyBody: {
    maxWidth: "60ch",
    margin: "0.25rem 0 0",
    color: color.muted,
    fontSize: text.base,
    lineHeight: 1.625,
  },
  body: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "1.125rem",
    padding: "1.25rem",
  },
  stretch: { alignSelf: "stretch" },
  title: { margin: 0, fontSize: "1.0625rem", fontWeight: 600, lineHeight: 1.375, letterSpacing: "-0.02em" },
  meta: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: "0.5rem",
    rowGap: "0.125rem",
    margin: "0.25rem 0 0",
    color: color.muted,
    fontSize: text.base,
  },
  rating: { display: "inline-flex", alignItems: "center", gap: "0.25rem", color: color.ink },
  ratingValue: { fontWeight: 500, fontVariantNumeric: "tabular-nums" },
  summary: { margin: "0.25rem 0 0", fontSize: text.base },
  price: {
    padding: "0.75rem 0.875rem",
    borderRadius: radius.slab,
    backgroundColor: color.subtle,
  },
  priceTitle: { margin: 0, color: color.muted, fontSize: text.sm },
  priceLine: { margin: "0.125rem 0 0" },
  total: { fontSize: "1.5rem" },
  stay: { marginInlineStart: "0.5rem", color: color.muted, fontSize: text.sm },
  noPrice: { margin: "0.125rem 0 0", color: color.muted, fontSize: text.base },
  sub: { margin: 0, fontSize: text.base, fontWeight: 600 },
  lines: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    margin: "0.375rem 0 0",
    padding: 0,
    listStyle: "none",
    fontSize: text.base,
    lineHeight: 1.625,
  },
  long: { marginTop: "0.375rem", fontSize: text.base, lineHeight: 1.625 },
  more: { color: color.muted, textDecoration: "underline", textUnderlineOffset: 2, cursor: "pointer" },
  text: { margin: "0.375rem 0 0", fontSize: text.base, lineHeight: 1.625, whiteSpace: "pre-line" },
  textOpen: { margin: "0.5rem 0 0", whiteSpace: "pre-line" },
  amenities: {
    display: "grid",
    gridTemplateColumns: { default: "1fr", [WIDE]: "1fr 1fr" },
    columnGap: "1rem",
    rowGap: "0.25rem",
    margin: "0.375rem 0 0",
    padding: 0,
    listStyle: "none",
    fontSize: text.base,
  },
  real: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.25rem",
    color: { default: color.muted, ":hover": color.ink },
    fontSize: text.sm,
    textDecoration: "underline",
    textUnderlineOffset: 2,
  },
  // The photos
  noPhotos: {
    margin: 0,
    padding: "2.5rem 1rem",
    backgroundImage: `repeating-linear-gradient(135deg, transparent 0 5px, color-mix(in oklab, ${color.ink} 10%, transparent) 5px 6px)`,
    color: color.muted,
    fontSize: text.sm,
    textAlign: "center",
  },
  gallery: { position: "relative" },
  mosaic: { display: "grid", aspectRatio: "2 / 1", gap: 2 },
  halves: { gridTemplateColumns: "1fr 1fr" },
  rest: { display: "grid", minHeight: 0, gap: 2, gridTemplateRows: "1fr 1fr" },
  restFour: { gridTemplateColumns: "1fr 1fr" },
  cell: { position: "relative", minHeight: 0, overflow: "hidden", backgroundColor: color.sunken },
  photo: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" },
  count: {
    position: "absolute",
    right: "0.5rem",
    bottom: "0.5rem",
    padding: "0.125rem 0.5rem",
    borderRadius: radius.full,
    backgroundColor: color.panel,
    fontSize: text.sm,
    fontWeight: 500,
    fontVariantNumeric: "tabular-nums",
  },
  // Side by side
  compareHead: {
    padding: "0.75rem 1rem",
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: color.line,
  },
  subtitle: { margin: "0.125rem 0 0", color: color.muted, fontSize: text.sm },
  scroll: { position: "relative", overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "start" },
  column: {
    padding: "0.5rem 0.75rem",
    color: color.muted,
    fontSize: text.sm,
    fontWeight: 500,
    textAlign: "start",
  },
  first: { paddingInline: "1rem" },
  platform: { display: "inline-flex", alignItems: "center", gap: "0.375rem" },
  row: { borderTopWidth: 1, borderTopStyle: "solid", borderTopColor: color.line },
  label: {
    padding: "0.5rem 1rem",
    color: color.muted,
    fontSize: text.base,
    fontWeight: 400,
    textAlign: "start",
    whiteSpace: "nowrap",
  },
  value: { padding: "0.5rem 0.75rem", fontVariantNumeric: "tabular-nums" },
});

/** A platform's public listing as guests see it, or how to get it read. */
export function ListingCard({
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
  const { locale, m, fmt } = useI18n("preview");
  const t = m.preview;
  const { channel, preview, quote } = side;
  const label = m.common.sources[channel];
  const headingId = `preview-${channel}`;

  const readButton =
    link && canRead ? (
      // Not `noreferrer`: the extension recognises a tab opened from Innkeep by its referrer.
      <a
        href={link}
        target="_blank"
        rel="noopener"
        title={t.hint}
        {...stylex.props(buttonStyle({ size: "sm" }))}
      >
        {preview ? t.readAgain : t.read(label)}
        <ExternalLink aria-hidden size={14} />
        <Hidden>{m.common.actions.newTab}</Hidden>
      </a>
    ) : null;

  return (
    <Card xstyle={styles.card}>
      <section aria-labelledby={headingId}>
        <div {...stylex.props(washStyle(channel), styles.head)}>
          <SectionTitle id={headingId} xstyle={styles.heading}>
            <SourceDot source={channel} />
            {label}
          </SectionTitle>
          <div {...stylex.props(styles.tools)}>
            {side.readAt && <span {...stylex.props(styles.small)}>{t.readAt(fmt.timeAgo(side.readAt))}</span>}
            {readButton}
          </div>
        </div>

        {!preview ? (
          <div {...stylex.props(styles.empty)}>
            <p {...stylex.props(styles.emptyTitle)}>{t.empty.title(label)}</p>
            <p {...stylex.props(styles.emptyBody)}>
              {!canRead ? t.empty.noExtension : link ? t.empty.body : t.empty.noLink(label)}
            </p>
          </div>
        ) : (
          <>
            <Photos preview={preview} />
            <div {...stylex.props(styles.body)}>
              <div {...stylex.props(styles.stretch)}>
                <h3 {...stylex.props(styles.title)}>{preview.title}</h3>
                <p {...stylex.props(styles.meta)}>
                  {preview.rating != null && (
                    <span {...stylex.props(styles.rating)}>
                      <Star aria-hidden size={14} fill="currentColor" />
                      <span {...stylex.props(styles.ratingValue)}>
                        {t.rating(preview.rating.toLocaleString(INTL_LOCALE[locale]), preview.ratingScale)}
                      </span>
                    </span>
                  )}
                  {preview.reviews != null && <span>{t.reviews(preview.reviews)}</span>}
                  {preview.location && <span>{preview.location}</span>}
                </p>
                {preview.summary.map((line) => (
                  <p key={line} {...stylex.props(styles.summary)}>
                    {line}
                  </p>
                ))}
              </div>

              <div {...stylex.props(styles.price, styles.stretch)}>
                <p {...stylex.props(styles.priceTitle)}>{t.price.title}</p>
                {quote ? (
                  <p {...stylex.props(styles.priceLine)}>
                    <span {...stylex.props(figureStyle, styles.total)}>
                      {fmt.money(quote.total, currency, { cents: false })}
                    </span>
                    <span {...stylex.props(styles.stay)}>
                      {t.price.stay(fmt.date(quote.checkIn), fmt.date(quote.checkOut), quote.guests)}
                      {quote.original
                        ? `, ${t.price.was(fmt.money(quote.original, currency, { cents: false }))}`
                        : ""}
                    </span>
                  </p>
                ) : (
                  <p {...stylex.props(styles.noPrice)}>{t.price.none}</p>
                )}
              </div>

              {preview.highlights.length > 0 && (
                <div {...stylex.props(styles.stretch)}>
                  <h4 {...stylex.props(styles.sub)}>{t.highlights}</h4>
                  <ul {...stylex.props(styles.lines)}>
                    {preview.highlights.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              )}

              {preview.description && (
                <div {...stylex.props(styles.stretch)}>
                  <h4 {...stylex.props(styles.sub)}>{t.about}</h4>
                  {preview.description.length > 420 ? (
                    <details {...stylex.props(styles.long)}>
                      <summary {...stylex.props(styles.more)}>{t.showAll}</summary>
                      <p {...stylex.props(styles.textOpen)}>{preview.description.trim()}</p>
                    </details>
                  ) : (
                    <p {...stylex.props(styles.text)}>{preview.description.trim()}</p>
                  )}
                </div>
              )}

              {preview.amenities.length > 0 && (
                <div {...stylex.props(styles.stretch)}>
                  <h4 {...stylex.props(styles.sub)}>{t.amenities}</h4>
                  <ul {...stylex.props(styles.amenities)}>
                    {preview.amenities.map((amenity) => (
                      <li key={amenity}>{amenity}</li>
                    ))}
                  </ul>
                </div>
              )}

              {link && (
                <a href={link} target="_blank" rel="noreferrer" {...stylex.props(styles.real)}>
                  {t.open}
                  <Hidden> {m.common.actions.newTab}</Hidden>
                </a>
              )}
            </div>
          </>
        )}
      </section>
    </Card>
  );
}

/** One large photo and up to four small ones, the way both platforms open a listing. */
function Photos({ preview }: { preview: Preview }) {
  const t = useI18n("preview").m.preview;
  const [cover, ...rest] = preview.images;
  if (cover === undefined) return <p {...stylex.props(styles.noPhotos)}>{t.noPhotos}</p>;
  const small = rest.slice(0, 4);
  // Each photo fills a fixed cell, so the mosaic keeps its shape whatever the photos' own proportions.
  const photo = (url: string, index: number, width: number) => (
    <div key={url} {...stylex.props(styles.cell)}>
      <img
        src={sizedPhoto(url, width)}
        alt={t.photoAlt(index + 1, preview.title)}
        loading="lazy"
        referrerPolicy="no-referrer"
        {...stylex.props(styles.photo)}
      />
    </div>
  );
  return (
    <div {...stylex.props(styles.gallery)}>
      <div {...stylex.props(styles.mosaic, small.length > 0 && styles.halves)}>
        {photo(cover, 0, 960)}
        {small.length > 0 && (
          <div {...stylex.props(styles.rest, small.length > 2 && styles.restFour)}>
            {small.map((image, index) => photo(image, index + 1, 480))}
          </div>
        )}
      </div>
      <span {...stylex.props(styles.count)}>{t.photos(preview.images.length)}</span>
    </div>
  );
}

/** Where the two listings differ, one line per thing a guest compares. */
export function Comparison({ sides, currency }: { sides: Side[]; currency: string }) {
  const { locale, m, fmt } = useI18n("preview");
  const t = m.preview.compare;
  const [first, second] = sides;
  if (!first?.preview && !second?.preview) return null;

  const sameStay =
    first?.quote && second?.quote && first.quote.checkIn === second.quote.checkIn
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
      <div {...stylex.props(styles.compareHead)}>
        <SectionTitle>{t.title}</SectionTitle>
        <p {...stylex.props(styles.subtitle)}>{t.subtitle}</p>
      </div>
      <div {...stylex.props(styles.scroll)}>
        <table {...stylex.props(styles.table)}>
          <thead>
            <tr>
              <th scope="col" {...stylex.props(styles.column, styles.first)}>
                {t.field}
              </th>
              {sides.map((side) => (
                <th key={side.channel} scope="col" {...stylex.props(styles.column)}>
                  <span {...stylex.props(styles.platform)}>
                    <SourceDot source={side.channel} />
                    {m.common.sources[side.channel]}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} {...stylex.props(styles.row)}>
                <th scope="row" {...stylex.props(styles.label)}>
                  {row.label}
                </th>
                {row.values.map((value, index) => (
                  <td key={sides[index]?.channel} {...stylex.props(styles.value)}>
                    {value ?? <span {...stylex.props(styles.small)}>{t.missing}</span>}
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
