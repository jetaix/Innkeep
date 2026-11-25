import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "../../shell/placeholder";

// The page itself arrives in the next phase; the address and the menu entry already work.
export const Route = createFileRoute("/_app/calendar")({
  // `?new=true` opens the form that adds a booking or blocks dates.
  validateSearch: (search: Record<string, unknown>): { new?: true } =>
    search.new === true || search.new === "true" || search.new === 1 ? { new: true } : {},
  component: () => <Placeholder id="calendar" />,
});
