import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: false } },
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
