import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "../../shell/placeholder";

// The page itself arrives in the next phase; the address and the menu entry already work.
export const Route = createFileRoute("/_app/reviews")({ component: () => <Placeholder id="reviews" /> });
