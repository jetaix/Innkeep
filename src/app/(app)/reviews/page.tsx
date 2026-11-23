import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ExternalLink, Star } from "lucide-react";
import { connection } from "next/server";
import { CHANNELS } from "@/channels";
import { buttonClass } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { Badge, Card, EmptyState, PageHeader, SourceBadge, SourceDot } from "@/components/ui/primitives";
import { getDb, OTA_CHANNELS, reviews as reviewsTable, type OtaChannel, type Review } from "@/db";
import { getExtensionStatus } from "@/features/extension/status";
import { reviewPageLinks } from "@/features/reservations/platform-links";
import { getProperties } from "@/features/reservations/queries";
import { isLow, newestFirst, reviewStats } from "@/features/reviews/compute";
import { INTL_LOCALE } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { cn } from "@/lib/cn";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).m.reviews.title };
}

export default async function ReviewsPage({ searchParams }: PageProps<"/reviews">) {
  const t = (await getI18n()).m.reviews;
  return (
    <>
      <PageHeader title={t.title} description={t.description} />
      <Suspense fallback={<Loading />}>
        <Reviews searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const SHOW = ["all", "unanswered", "low"] as const;

async function Reviews({ searchParams }: Pick<PageProps<"/reviews">, "searchParams">) {
  await connection();
  const { locale, m, fmt } = await getI18n();
  const t = m.reviews;
  const params = await searchParams;
  const properties = await getProperties();
  if (properties.length === 0) return <EmptyState title={t.empty.title}>{t.empty.noProperty}</EmptyState>;

  const all = await getDb().select().from(reviewsTable).all();
  const show = SHOW.find((value) => value === one(params.show)) ?? "all";
  const platform = OTA_CHANNELS.find((channel) => channel === one(params.platform)) ?? null;
  const shown = newestFirst(all).filter(
    (review) =>
      (!platform || review.source === platform) &&
      (show === "all" || (show === "unanswered" ? !review.reply : isLow(review))),
  );
  const href = (next: { show?: string; platform?: string | null }) => {
    const query = new URLSearchParams();
    const nextShow = next.show ?? show;
    const nextPlatform = next.platform === undefined ? platform : next.platform;
    if (nextShow !== "all") query.set("show", nextShow);
    if (nextPlatform) query.set("platform", nextPlatform);
    return query.size ? `/reviews?${query}` : "/reviews";
  };
  const number = (value: number) =>
    value.toLocaleString(INTL_LOCALE[locale], { maximumFractionDigits: 2, minimumFractionDigits: 1 });
  const extension = await getExtensionStatus();
  const canRead = extension.state === "ready" || extension.state === "outdated";
  const names = new Map(properties.map((property) => [property.id, property.name]));
  const pageLinks = new Map(
    await Promise.all(
      properties.map(async (property) => [property.id, await reviewPageLinks(property.id)] as const),
    ),
  );

  return (
    <div className="max-w-4xl space-y-6">
      <Card className="space-y-3 p-4">
        <div className="space-y-2">
          {properties.map((property) => {
            const links = pageLinks.get(property.id)!;
            const channels = OTA_CHANNELS.filter((channel) => links[channel]);
            return (
              <div
                key={property.id}
                className="flex flex-wrap items-center gap-2"
                role="group"
                aria-label={`${t.read.label}: ${property.name}`}
              >
                <span className="text-xs text-muted">
                  {t.read.from}
                  {properties.length > 1 ? ` (${property.name})` : ""}
                </span>
                {!canRead ? (
                  <Link href="/extension" className="text-xs underline underline-offset-2">
                    {t.empty.noExtension}
                  </Link>
                ) : channels.length === 0 ? (
                  <span className="text-xs text-muted">{t.empty.noLinks}</span>
                ) : (
                  channels.map((channel) => (
                    // Not `noreferrer`: the extension recognises a tab opened from Innkeep by its referrer.
                    <a
                      key={channel}
                      href={links[channel]}
                      target="_blank"
                      rel="noopener"
                      title={t.read.hint}
                      className={buttonClass({ size: "sm" })}
                    >
                      {CHANNELS[channel].label}
                      <ExternalLink aria-hidden />
                      <span className="sr-only">{m.common.actions.newTab}</span>
                    </a>
                  ))
                )}
              </div>
            );
          })}
        </div>
        <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2">
          {OTA_CHANNELS.map((channel) => {
            const stats = reviewStats(all, channel);
            const lastSeen = Math.max(
              0,
              ...all.filter((review) => review.source === channel).map((review) => review.seenAt),
            );
            return (
              <div key={channel} className="bg-bg px-4 py-3">
                <dt className="flex items-center gap-1.5 text-xs text-muted">
                  <SourceDot source={channel} />
                  {CHANNELS[channel].label}
                </dt>
                <dd className="mt-1 text-xl font-semibold tracking-tight tabular-nums">
                  {stats.average == null ? "–" : t.stats.average(number(stats.average), stats.scale)}
                </dd>
                <dd className="mt-0.5 text-xs text-muted">
                  {stats.count === 0
                    ? t.stats.none
                    : [
                        t.stats.reviews(stats.count),
                        stats.unanswered ? t.stats.unanswered(stats.unanswered) : null,
                        stats.low ? t.stats.low(stats.low) : null,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                </dd>
                <dd className="mt-0.5 text-xs text-faint">
                  {lastSeen
                    ? t.read.readAt(CHANNELS[channel].label, fmt.timeAgo(lastSeen))
                    : t.read.never(CHANNELS[channel].label)}
                </dd>
              </div>
            );
          })}
        </dl>
      </Card>

      {all.length === 0 ? (
        <EmptyState title={t.empty.title}>{t.empty.body}</EmptyState>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Choice
              label={t.filters.label}
              options={SHOW.map((value) => ({
                label: t.filters[value],
                href: href({ show: value }),
                current: value === show,
              }))}
            />
            <Choice
              label={t.filters.platform}
              options={[
                { label: t.filters.both, href: href({ platform: null }), current: platform == null },
                ...OTA_CHANNELS.map((channel) => ({
                  label: CHANNELS[channel].label,
                  href: href({ platform: channel }),
                  current: channel === platform,
                })),
              ]}
            />
            <p className="ml-auto text-xs text-muted tabular-nums">{t.count(shown.length, all.length)}</p>
          </div>

          {shown.length === 0 ? (
            <p className="text-[13px] text-muted">{t.nothing}</p>
          ) : (
            <ul className="space-y-3">
              {shown.map((review) => (
                <li key={review.id}>
                  <ReviewCard
                    review={review}
                    propertyName={properties.length > 1 ? (names.get(review.propertyId) ?? null) : null}
                    replyHref={pageLinks.get(review.propertyId)?.[review.source] ?? null}
                    number={number}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <p className="max-w-[80ch] text-xs leading-relaxed text-muted">{t.note}</p>
    </div>
  );
}

function Choice({
  label,
  options,
}: {
  label: string;
  options: { label: string; href: string; current: boolean }[];
}) {
  return (
    <nav aria-label={label} className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-xs text-muted">{label}</span>
      {options.map((option) => (
        <Link
          key={option.href + option.label}
          href={option.href}
          aria-current={option.current ? "true" : undefined}
          className={cn(
            "flex h-7 items-center rounded-md border px-2.5 text-xs font-medium transition-colors",
            option.current
              ? "border-line-strong bg-sunken text-ink"
              : "border-line text-muted hover:text-ink",
          )}
        >
          {option.label}
        </Link>
      ))}
    </nav>
  );
}

async function ReviewCard({
  review,
  propertyName,
  replyHref,
  number,
}: {
  review: Review;
  propertyName: string | null;
  replyHref: string | null;
  number: (value: number) => string;
}) {
  const { m, fmt } = await getI18n();
  const t = m.reviews.card;
  const platform: OtaChannel = review.source;
  // "2026-10" has no day: show the month alone.
  const when = review.reviewedOn
    ? review.reviewedOn.length === 7
      ? fmt.date(`${review.reviewedOn}-01`, { month: "long", year: "numeric" })
      : fmt.date(review.reviewedOn, { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <Card className="p-4">
      <article>
        <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="font-medium">{review.author}</h3>
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[13px] font-medium tabular-nums",
              isLow(review) && "text-warn",
            )}
          >
            <Star aria-hidden className="size-3.5 fill-current" />
            {review.rating == null ? t.noRating : t.rating(number(review.rating), review.scale)}
          </span>
          <SourceBadge source={platform} />
          <span className="text-xs text-muted">
            {[when, review.stay, propertyName].filter(Boolean).join(" · ")}
          </span>
        </header>

        {review.title && <p className="mt-2 font-medium">{review.title}</p>}
        {review.negative ? (
          <dl className="mt-2 space-y-1.5 text-[13px] leading-relaxed">
            {review.body && (
              <div>
                <dt className="text-xs text-muted">{t.liked}</dt>
                <dd className="whitespace-pre-line">{review.body}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-muted">{t.disliked}</dt>
              <dd className="whitespace-pre-line">{review.negative}</dd>
            </div>
          </dl>
        ) : (
          review.body && (
            <p className="mt-2 max-w-[75ch] text-[13px] leading-relaxed whitespace-pre-line">{review.body}</p>
          )
        )}

        {review.reply ? (
          <div className="mt-3 border-l-2 border-line-strong pl-3">
            <p className="text-xs text-muted">{t.reply}</p>
            <p className="mt-0.5 max-w-[75ch] text-[13px] leading-relaxed whitespace-pre-line">
              {review.reply}
            </p>
          </div>
        ) : (
          <p className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <Badge tone="warn">{t.noReply}</Badge>
            {replyHref && (
              <a
                href={replyHref}
                target="_blank"
                rel="noreferrer"
                className="text-muted underline underline-offset-2 hover:text-ink"
              >
                {t.replyOn(CHANNELS[platform].label)}
                <span className="sr-only"> {m.common.actions.newTab}</span>
              </a>
            )}
          </p>
        )}
      </article>
    </Card>
  );
}
