import { readDesignDoc } from "@/features/marketing/design-doc";

/** The design file itself, as Markdown, for people and tools that want the source. */
export function GET() {
  return new Response(readDesignDoc().raw, {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
