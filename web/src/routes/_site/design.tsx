import { createFileRoute } from "@tanstack/react-router";
import { DesignPage } from "../../features/marketing/design-page";
import { readMessages } from "../../i18n";
import { pageHead } from "../../site";

export const Route = createFileRoute("/_site/design")({
  head: () => {
    const t = readMessages("design").design;
    return pageHead({ title: t.title, description: t.lead, path: "/design" });
  },
  component: DesignPage,
});
