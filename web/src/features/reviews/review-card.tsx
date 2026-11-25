import * as stylex from "@stylexjs/stylex";
import { Star } from "lucide-react";
import type { OtaChannel, Review } from "@/db/schema";
import { isLow } from "@/features/reviews/compute";
import { useI18n } from "../../i18n";
import { color, text } from "../../tokens.stylex";
import { Badge, Card, Hidden, SourceBadge } from "../../ui/primitives";

const styles = stylex.create({
  card: { padding: "1rem" },
  header: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: "0.75rem",
    rowGap: "0.25rem",
  },
  author: { margin: 0, fontSize: "inherit", fontWeight: 500 },
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
  title: { margin: "0.5rem 0 0", fontWeight: 500 },
  sides: {
    display: "flex",
    flexDirection: "column",
    gap: "0.375rem",
    margin: "0.5rem 0 0",
    fontSize: text.base,
    lineHeight: 1.625,
  },
  words: { margin: 0, whiteSpace: "pre-line" },
  body: {
    margin: "0.5rem 0 0",
    maxWidth: "75ch",
    fontSize: text.base,
    lineHeight: 1.625,
    whiteSpace: "pre-line",
  },
  reply: {
    marginTop: "0.75rem",
    paddingInlineStart: "0.75rem",
    borderInlineStartWidth: 2,
    borderInlineStartStyle: "solid",
    borderInlineStartColor: color.lineStrong,
  },
  replyLabel: { margin: 0, color: color.muted, fontSize: text.sm },
  replyText: {
    margin: "0.125rem 0 0",
    maxWidth: "75ch",
    fontSize: text.base,
    lineHeight: 1.625,
    whiteSpace: "pre-line",
  },
  noReply: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "0.5rem",
    margin: "0.75rem 0 0",
    fontSize: text.sm,
  },
  link: { color: { default: color.muted, ":hover": color.ink }, textUnderlineOffset: 2 },
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
          review.body && <p {...stylex.props(styles.body)}>{review.body}</p>
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
