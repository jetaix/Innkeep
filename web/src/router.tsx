import { MutationCache, QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { ApiError } from "./api/client";
import { routeTree } from "./routeTree.gen";
import { refused } from "./shell/refused";

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: false } },
  mutationCache: new MutationCache({
    // The server refuses a change from a visitor of the demo: say so, once, for every form.
    onError: (error) => {
      if (error instanceof ApiError && error.status === 403) refused();
    },
  }),
});

export const router = createRouter({
  routeTree,
  context: { queryClient },
  // Warm a destination when the pointer, the keyboard or a finger shows intent.
  defaultPreload: "intent",
  defaultPreloadDelay: 50,
  // The query cache decides what is fresh, not the router.
  defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
