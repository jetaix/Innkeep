import type { OtaChannel, Review } from "@/db/schema";

/** Review maths. Pure, so it is unit tested. */

export type ReviewStats = {
  count: number;
  /** Mean rating on the platform's own scale; null without any rated review. */
  average: number | null;
  scale: number;
  /** Reviews the host has not replied to. */
  unanswered: number;
  /** Reviews scoring under 80% of the scale: the ones worth reading first. */
  low: number;
};

const LOW_BELOW = 0.8;

export const isLow = (review: Pick<Review, "rating" | "scale">) =>
  review.rating != null && review.rating / review.scale < LOW_BELOW;

export function reviewStats(reviews: Review[], source: OtaChannel): ReviewStats {
  const own = reviews.filter((review) => review.source === source);
  const rated = own.flatMap((review) => (review.rating == null ? [] : [review.rating]));
  return {
    count: own.length,
    average: rated.length ? rated.reduce((sum, rating) => sum + rating, 0) / rated.length : null,
    scale: own[0]?.scale ?? (source === "airbnb" ? 5 : 10),
    unanswered: own.filter((review) => !review.reply).length,
    low: own.filter(isLow).length,
  };
}

/** Newest first; a month-only date ("2026-10") sorts as the end of its month. */
export function newestFirst(reviews: Review[]): Review[] {
  const sortKey = (review: Review) => (review.reviewedOn ? review.reviewedOn.padEnd(10, "~") : "");
  return [...reviews].sort((a, b) => sortKey(b).localeCompare(sortKey(a)) || b.id - a.id);
}
