import fs from "node:fs";
import path from "node:path";

/**
 * Reads `DESIGN.md`, the record of how the public pages look, so the website
 * can show it. The file has a block of tokens at the top (colours, type,
 * radii) and prose below. Both parsers handle exactly what that file uses;
 * they are not general YAML or Markdown readers.
 */
export type Block =
  | { kind: "heading"; level: 2 | 3; text: string; id: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] };

export type TypeStyle = {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  letterSpacing?: string;
};

export type DesignDoc = {
  raw: string;
  description: string;
  colors: [name: string, value: string][];
  typography: [name: string, style: TypeStyle][];
  blocks: Block[];
};

const unquote = (value: string) => value.replace(/^"(.*)"$/, "$1");

/** The token block: `key: value` lines, nested by two spaces. */
function tokens(source: string) {
  const root: Record<string, unknown> = {};
  const path_: Record<string, unknown>[] = [root];
  for (const line of source.split("\n")) {
    if (!line.trim()) continue;
    const depth = (line.length - line.trimStart().length) / 2;
    const [, key, value] = /^\s*([^:]+):\s*(.*)$/.exec(line) ?? [];
    if (!key) continue;
    const parent = path_[depth] ?? root;
    if (value) parent[key] = unquote(value);
    else {
      const child: Record<string, unknown> = {};
      parent[key] = child;
      path_[depth + 1] = child;
    }
  }
  return root;
}

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** The prose: headings, paragraphs and bulleted lists, each possibly over several lines. */
function blocks(source: string): Block[] {
  const out: Block[] = [];
  let open: Block | null = null;
  for (const line of source.split("\n")) {
    const heading = /^(#{2,3}) (.+)$/.exec(line);
    const item = /^- (.+)$/.exec(line);
    if (!line.trim()) open = null;
    else if (/^# /.test(line)) open = null;
    else if (heading) {
      out.push({
        kind: "heading",
        level: heading[1].length as 2 | 3,
        text: heading[2],
        id: slug(heading[2]),
      });
      open = null;
    } else if (item) {
      if (open?.kind !== "list") {
        open = { kind: "list", items: [] };
        out.push(open);
      }
      open.items.push(item[1]);
    } else if (open?.kind === "list") {
      open.items[open.items.length - 1] += ` ${line.trim()}`;
    } else if (open?.kind === "paragraph") {
      open.text += ` ${line.trim()}`;
    } else {
      open = { kind: "paragraph", text: line.trim() };
      out.push(open);
    }
  }
  return out;
}

export function readDesignDoc(): DesignDoc {
  const raw = fs.readFileSync(path.join(process.cwd(), "DESIGN.md"), "utf8");
  const [, front = "", body = ""] = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw) ?? [];
  const data = tokens(front);
  return {
    raw,
    description: typeof data.description === "string" ? data.description : "",
    colors: Object.entries((data.colors ?? {}) as Record<string, string>),
    typography: Object.entries((data.typography ?? {}) as Record<string, TypeStyle>),
    blocks: blocks(body),
  };
}
