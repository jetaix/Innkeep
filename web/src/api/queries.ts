import { queryOptions } from "@tanstack/react-query";
import { rpc, unwrap } from "./client";

/**
 * One definition per resource. A route's loader and the components that
 * show the data read the same one, so the request is made once and the cache
 * key cannot drift between the two.
 */
type Locale = "en" | "fr";
const text = (value: number | undefined) => (value === undefined ? undefined : String(value));

export const sessionQuery = queryOptions({
  queryKey: ["session"],
  queryFn: () => unwrap(rpc.session.$get()),
});

export const overviewQuery = queryOptions({
  queryKey: ["overview"],
  queryFn: () => unwrap(rpc.overview.$get()),
});

export const navQuery = (locale: Locale) =>
  queryOptions({
    queryKey: ["nav", locale],
    queryFn: () => unwrap(rpc.nav.$get({ query: { locale } })),
  });

export const propertiesQuery = queryOptions({
  queryKey: ["properties"],
  queryFn: () => unwrap(rpc.properties.$get()),
});

export const propertyQuery = (id: number) =>
  queryOptions({
    queryKey: ["properties", id],
    queryFn: () => unwrap(rpc.properties[":id"].$get({ param: { id: String(id) } })),
  });

export const propertyPreviewQuery = (id: number) =>
  queryOptions({
    queryKey: ["properties", id, "preview"],
    queryFn: () => unwrap(rpc.properties[":id"].preview.$get({ param: { id: String(id) } })),
  });

export const staysQuery = (range: { from?: string; to?: string } = {}) =>
  queryOptions({
    queryKey: ["stays", range.from ?? null, range.to ?? null],
    queryFn: () => unwrap(rpc.stays.$get({ query: range })),
  });

export const feedsQuery = queryOptions({
  queryKey: ["feeds"],
  queryFn: () => unwrap(rpc.feeds.$get()),
});

export const cleaningQuery = queryOptions({
  queryKey: ["cleaning"],
  queryFn: () => unwrap(rpc.cleaning.$get()),
});

export const revenueQuery = (range: { back?: number; ahead?: number } = {}) =>
  queryOptions({
    queryKey: ["revenue", range.back ?? null, range.ahead ?? null],
    queryFn: () => unwrap(rpc.revenue.$get({ query: { back: text(range.back), ahead: text(range.ahead) } })),
  });

export const revenueYearsQuery = queryOptions({
  queryKey: ["revenue", "years"],
  queryFn: () => unwrap(rpc.revenue.years.$get()),
});

export const chargesQuery = queryOptions({
  queryKey: ["charges"],
  queryFn: () => unwrap(rpc.charges.$get()),
});

export const pricingQuery = (asked: { property: number; plan?: string; days?: number }) =>
  queryOptions({
    queryKey: ["pricing", asked.property, asked.plan ?? null, asked.days ?? null],
    queryFn: () =>
      unwrap(
        rpc.pricing.$get({
          query: { property: String(asked.property), plan: asked.plan, days: text(asked.days) },
        }),
      ),
  });

export const reviewsQuery = queryOptions({
  queryKey: ["reviews"],
  queryFn: () => unwrap(rpc.reviews.$get()),
});

export const suggestionsQuery = (locale: Locale) =>
  queryOptions({
    queryKey: ["suggestions", locale],
    queryFn: () => unwrap(rpc.suggestions.$get({ query: { locale } })),
  });

export const adviceQuery = queryOptions({
  queryKey: ["advice"],
  queryFn: () => unwrap(rpc.advice.$get()),
});

export const freshnessQuery = queryOptions({
  queryKey: ["freshness"],
  queryFn: () => unwrap(rpc.freshness.$get()),
});

/** Host only: the server answers 403 to a visitor of the demo. */
export const extensionQuery = queryOptions({
  queryKey: ["extension"],
  queryFn: () => unwrap(rpc.extension.$get()),
});

export const settingsQuery = queryOptions({
  queryKey: ["settings"],
  queryFn: () => unwrap(rpc.settings.$get()),
});
