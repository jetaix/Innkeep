import { createFileRoute } from "@tanstack/react-router";
import { AiPage } from "../../features/marketing/ai-page";
import { readMessages } from "../../i18n";
import { pageHead } from "../../site";

export const Route = createFileRoute("/_site/ai")({
  head: () => {
    const t = readMessages("ai").ai;
    return pageHead({ title: t.title, description: t.description, path: "/ai" });
  },
  component: AiPage,
});
