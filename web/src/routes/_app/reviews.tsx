import * as stylex from "@stylexjs/stylex";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Star } from "lucide-react";
import type { OtaChannel } from "@/db/schema";
import { OTA_CHANNELS } from "../../lists";
import { isLow, newestFirst, reviewStats, STARS, stars } from "@/features/reviews/compute";
import { INTL_LOCALE } from "@/i18n/config";
import { propertiesQuery, reviewsQuery } from "../../api/queries";
import { ReviewCard } from "../../features/reviews/review-card";
import { SyncCta } from "../../features/extension/sync-cta";
import { loadMessages, useI18n } from "../../i18n";
import { color, radius, shadow, text } from "../../tokens.stylex";
import { buttonStyle } from "../../ui/button";
import { Card, EmptyState, Hidden, PageHeader, SourceDot } from "../../ui/primitives";
import { figureStyle, slabStyle } from "../../ui/slab";

const SHOW = ["all", "unanswered", "low"] as const;
type Show = (typeof SHOW)[number];
type Stars = (typeof STARS)[number];

/** Which reviews are listed. Everything is the default, so it is left out of the address. */
export type ReviewsSearch = { show?: Exclude<Show, "all">; platform?: OtaChannel; stars?: Stars };

export const Route = createFileRoute("/_app/reviews")({
  validateSearch: (search: Record<string, unknown>): ReviewsSearch => ({
    show: search.show === "unanswered" || search.show === "low" ? search.show : undefined,
    platform: OTA_CHANNELS.find((channel) => channel === search.platform),
    stars: STARS.find((value) => value === Number(search.stars)),
  }),
  // Started while this route's code downloads; the components read the same queries.
  loader: ({ context: { queryClient } }) => {
    void loadMessages("reviews", "extension");
    return Promise.all([
      queryClient.ensureQueryData(reviewsQuery),
      queryClient.ensureQueryData(propertiesQuery),
    ]);
  },
  component: ReviewsPage,
});

const WIDE = "@media (min-width: 40rem)";

const styles = stylex.create({
  page: { display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "56rem" },
  // The rating as one figure, and beside it how each platform's guests scored the place.
  score: {
    display: "grid",
    gridTemplateColumns: { default: "minmax(0, 1fr)", [WIDE]: "minmax(0, 15rem) minmax(0, 1fr)" },
    columnGap: "2.5rem",
    rowGap: "1.25rem",
    alignItems: "center",
    padding: { default: "1.25rem 1rem", [WIDE]: "1.5rem" },
  },
  overall: { margin: 0, display: "flex", alignItems: "baseline", gap: "0.5rem" },
  figure: { fontSize: { default: "3.5rem", [WIDE]: "4.5rem" } },
  noFigure: { margin: 0, fontSize: "1.5rem", lineHeight: 1.2, letterSpacing: "-0.02em", textWrap: "balance" },
  outOf: { color: color.muted, fontSize: text.md },
  overallNote: { margin: "0.375rem 0 0", color: color.muted, fontSize: text.sm, lineHeight: 1.5 },
  places: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    padding: "0.875rem 1rem",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.line,
  },
  read: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" },
  small: { color: color.muted, fontSize: text.sm },
  setUp: {
    color: color.ink,
    fontSize: text.sm,
    textDecorationLine: "underline",
    textDecorationColor: color.lineStrong,
    textUnderlineOffset: 3,
  },
  stats: { display: "flex", flexDirection: "column", gap: "1.125rem", margin: 0 },
  stat: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    alignItems: "baseline",
    columnGap: "1rem",
    rowGap: "0.375rem",
  },
  platform: { display: "flex", alignItems: "center", gap: "0.375rem", fontSize: text.base, fontWeight: 500 },
  average: { margin: 0, fontSize: text.base, fontWeight: 500, fontVariantNumeric: "tabular-nums" },
  // A bar of the platform's own glass: its length is the average on that platform's scale.
  bar: {
    gridColumn: "1 / -1",
    margin: 0,
    height: "0.875rem",
    borderRadius: radius.full,
    backgroundColor: color.sunken,
  },
  fill: { display: "block", height: "100%", minWidth: "0.875rem", borderRadius: radius.full },
  width: (share: number) => ({ width: `${share * 100}%` }),
  detail: { gridColumn: "1 / -1", margin: 0, color: color.muted, fontSize: text.sm, lineHeight: 1.5 },
  cta: { gridColumn: "1 / -1", margin: "0.25rem 0 0" },
  filters: { display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: "1.5rem", rowGap: "0.5rem" },
  count: {
    margin: 0,
    marginInlineStart: "auto",
    color: color.muted,
    fontSize: text.sm,
    fontVariantNumeric: "tabular-nums",
  },
  nothing: { margin: 0, color: color.muted, fontSize: text.base },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
  note: { margin: 0, maxWidth: "80ch", color: color.muted, fontSize: text.sm, lineHeight: 1.625 },
  // One row of choices
  choice: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.375rem" },
  choiceLabel: { marginInlineEnd: "0.25rem", color: color.muted, fontSize: text.sm },
  option: {
    display: "flex",
    alignItems: "center",
    height: "1.75rem",
    gap: "0.25rem",
    paddingInline: "0.75rem",
    borderRadius: radius.full,
    backgroundColor: { default: "transparent", ":hover": color.sunken },
    color: { default: color.muted, ":hover": color.ink },
    fontVariantNumeric: "tabular-nums",
    fontSize: text.sm,
    fontWeight: 500,
    textDecoration: "none",
    transitionProperty: "color, background-color, box-shadow",
    transitionDuration: "150ms",
  },
  chosen: {
    backgroundColor: { default: color.panel, ":hover": color.panel },
    color: color.ink,
    boxShadow: shadow.card,
  },
});

function ReviewsPage() {
  const t = useI18n("reviews").m.reviews;
  return (
    <>
      <PageHeader title={t.title} description={t.description} />
      <Reviews />
    </>
  );
}

function Reviews() {
  const { locale, m, fmt } = useI18n("reviews");
  const t = m.reviews;
  const search = Route.useSearch();
  const { properties } = useSuspenseQuery(propertiesQuery).data;
  const { reviews: all, links: pageLinks, extension } = useSuspenseQuery(reviewsQuery).data;
  if (properties.length === 0) return <EmptyState title={t.empty.title}>{t.empty.noProperty}</EmptyState>;

  const show = search.show ?? "all";
  const platform = search.platform ?? null;
  const star = search.stars ?? null;
  const shown = newestFirst(all).filter(
    (review) =>
      (!platform || review.source === platform) &&
      (star == null || stars(review) === star) &&
      (show === "all" || (show === "unanswered" ? !review.reply : isLow(review))),
  );
  // The address of the list with one filter changed and the others kept.
  const to = (next: { show?: Show; platform?: OtaChannel | null; stars?: Stars | null }): ReviewsSearch => {
    const nextShow = next.show ?? show;
    const nextPlatform = next.platform === undefined ? platform : next.platform;
    const nextStars = next.stars === undefined ? star : next.stars;
    return {
      show: nextShow === "all" ? undefined : nextShow,
      platform: nextPlatform ?? undefined,
      stars: nextStars ?? undefined,
    };
  };
  const number = (value: number) =>
    value.toLocaleString(INTL_LOCALE[locale], { maximumFractionDigits: 2, minimumFractionDigits: 1 });
  const canRead = extension === "ready" || extension === "outdated";
  const names = new Map(properties.map((property) => [property.id, property.name]));
  // Every rating on a scale of five, so the two platforms can share one figure.
  const rated = all.flatMap((review) =>
    review.rating == null || review.scale <= 0 ? [] : [(review.rating / review.scale) * 5],
  );
  const overall = rated.length ? rated.reduce((sum, rating) => sum + rating, 0) / rated.length : null;

  return (
    <div {...stylex.props(styles.page)}>
      <Card>
        <div {...stylex.props(styles.score)}>
          <div>
            {overall == null ? (
              <p {...stylex.props(figureStyle, styles.noFigure)}>{t.stats.overallNone}</p>
            ) : (
              <>
                <p {...stylex.props(styles.overall)}>
                  <span {...stylex.props(figureStyle, styles.figure)}>{number(overall)}</span>
                  <span {...stylex.props(styles.outOf)}>{t.stats.outOf(5)}</span>
                </p>
                <p {...stylex.props(styles.overallNote)}>{t.stats.overall(rated.length)}</p>
              </>
            )}
          </div>
          <dl {...stylex.props(styles.stats)}>
            {OTA_CHANNELS.map((channel) => {
              const stats = reviewStats(all, channel);
              const lastSeen = Math.max(
                0,
                ...all.filter((review) => review.source === channel).map((review) => review.seenAt),
              );
              return (
                <div key={channel} {...stylex.props(styles.stat)}>
                  <dt {...stylex.props(styles.platform)}>
                    <SourceDot source={channel} />
                    {m.common.sources[channel]}
                  </dt>
                  <dd {...stylex.props(styles.average)}>
                    {stats.average == null ? "–" : t.stats.average(number(stats.average), stats.scale)}
                  </dd>
                  <dd aria-hidden {...stylex.props(styles.bar)}>
                    {stats.average != null && (
                      <span
                        {...stylex.props(
                          slabStyle(channel),
                          styles.fill,
                          styles.width(Math.min(1, stats.average / stats.scale)),
                        )}
                      />
                    )}
                  </dd>
                  <dd {...stylex.props(styles.detail)}>
                    {stats.count === 0
                      ? t.stats.none
                      : [
                          t.stats.reviews(stats.count),
                          stats.unanswered ? t.stats.unanswered(stats.unanswered) : null,
                          stats.low ? t.stats.low(stats.low) : null,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                    {". "}
                    {lastSeen
                      ? t.read.readAt(m.common.sources[channel], fmt.timeAgo(lastSeen))
                      : t.read.never(m.common.sources[channel])}
                  </dd>
                  {!lastSeen && (
                    <dd {...stylex.props(styles.cta)}>
                      <SyncCta state={extension} variant="secondary" />
                    </dd>
                  )}
                </div>
              );
            })}
          </dl>
        </div>
        <div {...stylex.props(styles.places)}>
          {properties.map((property) => {
            const links = pageLinks[property.id] ?? {};
            const channels = OTA_CHANNELS.filter((channel) => links[channel]);
            return (
              <div
                key={property.id}
                role="group"
                aria-label={`${t.read.label}: ${property.name}`}
                {...stylex.props(styles.read)}
              >
                <span {...stylex.props(styles.small)}>
                  {t.read.from}
                  {properties.length > 1 ? ` (${property.name})` : ""}
                </span>
                {!canRead ? (
                  <Link to="/extension" {...stylex.props(styles.setUp)}>
                    {t.empty.noExtension}
                  </Link>
                ) : channels.length === 0 ? (
                  <span {...stylex.props(styles.small)}>{t.empty.noLinks}</span>
                ) : (
                  channels.map((channel) => (
                    // Not `noreferrer`: the extension recognises a tab opened from Innkeep by its referrer.
                    <a
                      key={channel}
                      href={links[channel]}
                      target="_blank"
                      rel="noopener"
                      title={t.read.hint}
                      {...stylex.props(buttonStyle({ size: "sm" }))}
                    >
                      {m.common.sources[channel]}
                      <ExternalLink aria-hidden size={14} />
                      <Hidden>{m.common.actions.newTab}</Hidden>
                    </a>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {all.length === 0 ? (
        <EmptyState title={t.empty.title}>{t.empty.body}</EmptyState>
      ) : (
        <>
          <div {...stylex.props(styles.filters)}>
            <Choice
              label={t.filters.label}
              options={SHOW.map((value) => ({
                label: t.filters[value],
                search: to({ show: value }),
                current: value === show,
              }))}
            />
            <Choice
              label={t.filters.platform}
              options={[
                { label: t.filters.both, search: to({ platform: null }), current: platform == null },
                ...OTA_CHANNELS.map((channel) => ({
                  label: m.common.sources[channel],
                  search: to({ platform: channel }),
                  current: channel === platform,
                })),
              ]}
            />
            <Choice
              label={t.filters.stars}
              options={[
                { label: t.filters.anyStars, search: to({ stars: null }), current: star == null },
                ...STARS.map((value) => ({
                  label: String(value),
                  star: true,
                  title: t.filters.starsLabel(value),
                  search: to({ stars: value }),
                  current: value === star,
                })),
              ]}
            />
            <p {...stylex.props(styles.count)}>{t.count(shown.length, all.length)}</p>
          </div>

          {shown.length === 0 ? (
            <p {...stylex.props(styles.nothing)}>{t.nothing}</p>
          ) : (
            <ul {...stylex.props(styles.list)}>
              {shown.map((review) => (
                <li key={review.id}>
                  <ReviewCard
                    review={review}
                    propertyName={properties.length > 1 ? (names.get(review.propertyId) ?? null) : null}
                    replyHref={pageLinks[review.propertyId]?.[review.source] ?? null}
                    number={number}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <p {...stylex.props(styles.note)}>{t.note}</p>
    </div>
  );
}

function Choice({
  label,
  options,
}: {
  label: string;
  options: { label: string; star?: boolean; title?: string; search: ReviewsSearch; current: boolean }[];
}) {
  return (
    <nav aria-label={label} {...stylex.props(styles.choice)}>
      <span {...stylex.props(styles.choiceLabel)}>{label}</span>
      {options.map((option) => (
        <Link
          key={option.label}
          to="/reviews"
          search={option.search}
          aria-current={option.current ? "true" : undefined}
          aria-label={option.title}
          title={option.title}
          {...stylex.props(styles.option, option.current && styles.chosen)}
        >
          {option.label}
          {option.star && <Star aria-hidden size={12} fill="currentColor" strokeWidth={0} />}
        </Link>
      ))}
    </nav>
  );
}
