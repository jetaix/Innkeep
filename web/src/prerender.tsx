import { QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { renderToString } from "react-dom/server";
import { ALTERNATIVES, CHECKED_ON } from "@/features/marketing/alternatives";
import { GUIDE_SLUGS, GUIDES_UPDATED_ON } from "@/features/marketing/guides";
import { makeRouter, queryClient } from "./router";
import { brand, site } from "./site";

/**
 * The public pages, rendered to HTML at build (see `scripts/prerender.ts`),
 * so a search engine, a link preview and a visitor on a slow connection all
 * get the page itself and not an empty shell. Each is written in English;
 * the app takes over in the browser and switches language if it must.
 */
export const PAGES: { path: string; lastModified?: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/alternatives", lastModified: CHECKED_ON, priority: 0.8 },
  { path: "/design", priority: 0.5 },
  { path: "/ai", priority: 0.8 },
  { path: "/guides", lastModified: GUIDES_UPDATED_ON, priority: 0.8 },
  ...GUIDE_SLUGS.map((slug) => ({ path: `/guides/${slug}`, lastModified: GUIDES_UPDATED_ON, priority: 0.8 })),
  ...ALTERNATIVES.map((alternative) => ({
    path: `/alternatives/${alternative.slug}`,
    lastModified: CHECKED_ON,
    priority: 0.6,
  })),
];

export { brand, site };

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

type Tag = Record<string, string | undefined>;

/** The head tags the routes on screen ask for; a deeper route's tag replaces its parent's. */
function headOf(router: ReturnType<typeof makeRouter>): string {
  let title = "";
  const meta = new Map<string, Tag>();
  const links: Tag[] = [];
  const scripts: Tag[] = [];
  for (const match of router.state.matches) {
    for (const tag of (match.meta ?? []) as (Tag | undefined)[]) {
      if (!tag) continue;
      if (tag.title) title = tag.title;
      else meta.set(tag.name ?? tag.property ?? JSON.stringify(tag), tag);
    }
    links.push(...((match.links ?? []) as Tag[]));
    scripts.push(...((match.headScripts ?? []) as Tag[]));
  }
  const attributes = (tag: Tag) =>
    Object.entries(tag)
      .filter(([name, value]) => name !== "children" && value !== undefined)
      .map(([name, value]) => ` ${name}="${escapeHtml(String(value))}"`)
      .join("");
  return [
    `<title data-static>${escapeHtml(title)}</title>`,
    ...[...meta.values()].map((tag) => `<meta data-static${attributes(tag)}>`),
    ...links.map((tag) => `<link data-static${attributes(tag)}>`),
    // Inside a script, only a closing tag could end it early.
    ...scripts.map(
      (tag) =>
        `<script data-static${attributes(tag)}>${(tag.children ?? "").replace(/</g, "\\u003c")}</script>`,
    ),
  ].join("\n    ");
}

/** One page as HTML: what goes in the head, and what goes in the app's root. */
export async function render(path: string): Promise<{ head: string; body: string }> {
  const router = makeRouter(createMemoryHistory({ initialEntries: [path] }));
  await router.load();
  const failed = router.state.matches.find((match) => match.status !== "success");
  if (failed) throw new Error(`${path} did not load: ${failed.routeId} is ${failed.status}`);
  const body = renderToString(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { head: headOf(router), body };
}
