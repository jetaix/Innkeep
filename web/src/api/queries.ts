import { queryOptions } from "@tanstack/react-query";
import { ApiError, rpc, unwrap } from "./client";

/**
 * One definition per resource. A route's loader and the components that
 * show the data read the same one, so the request is made once and the cache
 * key cannot drift between the two.
 */
type Locale = "en" | "fr";
const text = (value: number | undefined) => (value === undefined ? undefined : String(value));

type Session = Awaited<ReturnType<Awaited<ReturnType<typeof rpc.session.$get>>["json"]>>;

/**
 * Who is asking. Where no demo is offered the server turns away anyone who
 * is not signed in: that is an answer, not a failure, and it sends them to
 * the sign-in page.
 */
export const sessionQuery = queryOptions({
  queryKey: ["session"],
  queryFn: async (): Promise<Session> => {
    try {
      return await unwrap(rpc.session.$get());
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return { signedIn: false, demo: false, role: null, member: null };
      }
      throw error;
    }
  },
});

/** Whether an account can be created here, and whether older data waits for its owner. */
export const accountQuery = queryOptions({
  queryKey: ["account"],
  queryFn: () => unwrap(rpc.account.$get()),
});

/** Who has access and the invitations still waiting: an admin's to read. */
export const membersQuery = queryOptions({
  queryKey: ["members"],
  queryFn: () => unwrap(rpc.members.$get()),
});

/** What an invitation link offers; fails when the link is no longer valid. */
export const invitationQuery = (token: string) =>
  queryOptions({
    queryKey: ["invitation", token],
    queryFn: () => unwrap(rpc.invitations[":token"].$get({ param: { token } })),
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

/** Host only: the property the "Add a property" guide is setting up, and what Innkeep knows of it so far. */
export const setupQuery = (id: number) =>
  queryOptions({
    queryKey: ["setup", id],
    queryFn: () => unwrap(rpc.setup[":id"].$get({ param: { id: String(id) } })),
  });

/** Host only: whether the extension has connected, and when it last read reservations. Never cached. */
export const setupProgressQuery = queryOptions({
  queryKey: ["setup", "progress"],
  queryFn: () => unwrap(rpc.setup.progress.$get()),
  staleTime: 0,
});
