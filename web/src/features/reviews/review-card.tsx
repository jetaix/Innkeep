import * as stylex from "@stylexjs/stylex";
import { Star } from "lucide-react";
import type { OtaChannel, Review } from "@/db/schema";
import { isLow } from "@/features/reviews/compute";
import { useI18n } from "../../i18n";
import { color, radius, text } from "../../tokens.stylex";
import { Badge, Card, Hidden, SourceBadge } from "../../ui/primitives";

const styles = stylex.create({
  card: { padding: { default: "1rem", "@media (min-width: 40rem)": "1.25rem 1.5rem" } },
  header: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: "0.75rem",
    rowGap: "0.25rem",
  },
  author: { margin: 0, fontSize: text.md, fontWeight: 600 },
  rating: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.25rem",
    fontSize: text.base,
    fontWeight: 500,
    fontVariantNumeric: "tabular-nums",
  },
  low: { color: color.warn },
  small: { color: color.muted, fontSize: text.sm },
  title: { margin: "0.75rem 0 0", fontSize: "0.9375rem", fontWeight: 500 },
  // The guest's own words, at a size for reading.
  sides: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    maxWidth: "68ch",
    margin: "0.625rem 0 0",
    fontSize: "0.9375rem",
    lineHeight: 1.65,
  },
  words: { margin: 0, whiteSpace: "pre-line" },
  body: {
    margin: "0.625rem 0 0",
    maxWidth: "68ch",
    fontSize: "0.9375rem",
    lineHeight: 1.65,
    whiteSpace: "pre-line",
    textWrap: "pretty",
  },
  // The host's answer sits a step back from the guest's words.
  reply: {
    maxWidth: "68ch",
    marginTop: "0.875rem",
    padding: "0.75rem 0.875rem",
    borderRadius: radius.field,
    backgroundColor: color.subtle,
  },
  replyLabel: { margin: 0, color: color.muted, fontSize: text.sm, fontWeight: 500 },
  replyText: {
    margin: "0.25rem 0 0",
    fontSize: text.base,
    lineHeight: 1.625,
    whiteSpace: "pre-line",
  },
  noReply: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "0.5rem",
    margin: "0.875rem 0 0",
    fontSize: text.sm,
  },
  link: {
    color: { default: color.muted, ":hover": color.ink },
    textDecorationColor: color.lineStrong,
    textUnderlineOffset: 3,
  },
});

export function ReviewCard({
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
  const { m, fmt } = useI18n("reviews");
  const t = m.reviews.card;
  const platform: OtaChannel = review.source;
  // "2026-10" has no day: show the month alone.
  const when = review.reviewedOn
    ? review.reviewedOn.length === 7
      ? fmt.date(`${review.reviewedOn}-01`, { month: "long", year: "numeric" })
      : fmt.date(review.reviewedOn, { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <Card xstyle={styles.card}>
      <article>
        <header {...stylex.props(styles.header)}>
          <h3 {...stylex.props(styles.author)}>{review.author}</h3>
          <span {...stylex.props(styles.rating, isLow(review) && styles.low)}>
            <Star aria-hidden size={14} fill="currentColor" />
            {review.rating == null ? t.noRating : t.rating(number(review.rating), review.scale)}
          </span>
          <SourceBadge source={platform} />
          <span {...stylex.props(styles.small)}>
            {[when, review.stay, propertyName].filter(Boolean).join(" · ")}
          </span>
        </header>

        {review.title && <p {...stylex.props(styles.title)}>{review.title}</p>}
        {review.negative ? (
          <dl {...stylex.props(styles.sides)}>
            {review.body && (
              <div>
                <dt {...stylex.props(styles.small)}>{t.liked}</dt>
                <dd {...stylex.props(styles.words)}>{review.body}</dd>
              </div>
            )}
            <div>
              <dt {...stylex.props(styles.small)}>{t.disliked}</dt>
              <dd {...stylex.props(styles.words)}>{review.negative}</dd>
            </div>
          </dl>
        ) : (
          review.body && <blockquote {...stylex.props(styles.body)}>{review.body}</blockquote>
        )}

        {review.reply ? (
          <div {...stylex.props(styles.reply)}>
            <p {...stylex.props(styles.replyLabel)}>{t.reply}</p>
            <p {...stylex.props(styles.replyText)}>{review.reply}</p>
          </div>
        ) : (
          <p {...stylex.props(styles.noReply)}>
            <Badge tone="warn">{t.noReply}</Badge>
            {replyHref && (
              <a href={replyHref} target="_blank" rel="noreferrer" {...stylex.props(styles.link)}>
                {t.replyOn(m.common.sources[platform])}
                <Hidden> {m.common.actions.newTab}</Hidden>
              </a>
            )}
          </p>
        )}
      </article>
    </Card>
  );
}
