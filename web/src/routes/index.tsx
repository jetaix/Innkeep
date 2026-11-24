import { createFileRoute, redirect } from "@tanstack/react-router";

// The landing page arrives in a later phase; until then the dashboard is the entry.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/overview" });
  },
});
