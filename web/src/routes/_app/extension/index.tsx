import { createFileRoute } from "@tanstack/react-router";

// The page arrives with the rest of the extension's screens.
export const Route = createFileRoute("/_app/extension/")({ component: () => null });
