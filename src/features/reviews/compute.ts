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

/**
 * A rating as 1 to 5 stars whatever the platform's scale: Booking.com's 8.4
 * out of 10 is 4 stars. Null without a rating.
 */
export function stars(review: Pick<Review, "rating" | "scale">): 1 | 2 | 3 | 4 | 5 | null {
  if (review.rating == null || review.scale <= 0) return null;
  return Math.min(5, Math.max(1, Math.round((review.rating / review.scale) * 5))) as 1 | 2 | 3 | 4 | 5;
}

export const STARS = [5, 4, 3, 2, 1] as const;

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
