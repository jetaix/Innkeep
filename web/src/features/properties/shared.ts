import type { InferResponseType } from "hono/client";
import type { OtaChannel } from "@/db/schema";
import type { rpc } from "../../api/client";

/** The platforms a property is listed on, in the order they are shown. */
export const PLATFORMS = ["airbnb", "booking"] as const satisfies readonly OtaChannel[];

/** What the API answers for one property and for its preview. */
export type PropertyAnswer = InferResponseType<(typeof rpc.properties)[":id"]["$get"]>;
export type PropertyListing = PropertyAnswer["listings"][number];
export type PreviewAnswer = InferResponseType<(typeof rpc.properties)[":id"]["preview"]["$get"]>;

/** Airbnb's image server resizes on request; asking for a sensible width keeps the page light. */
export function sizedPhoto(url: string, width: number): string {
  const parsed = new URL(url);
  if (parsed.hostname.endsWith("muscache.com") && !parsed.search)
    parsed.searchParams.set("im_w", String(width));
  return parsed.toString();
}
