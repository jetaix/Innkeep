import { describe, expect, it } from "vitest";
import { readDesignDoc } from "./design-doc";

describe("the design document", () => {
  const doc = readDesignDoc();

  it("reads the colour and type tokens", () => {
    const colors = Object.fromEntries(doc.colors);
    expect(colors.ground).toMatch(/^#[0-9a-f]{6}$/);
    expect(colors.overlap).toMatch(/^#[0-9a-f]{6}$/);
    expect(doc.typography.find(([name]) => name === "display")?.[1].fontFamily).toContain("Funnel Display");
  });

  it("reads the prose as headings, paragraphs and lists", () => {
    const headings = doc.blocks.filter((block) => block.kind === "heading").map((block) => block.text);
    expect(headings).toContain("Colors");
    expect(headings).toContain("Typography");
    expect(doc.blocks.some((block) => block.kind === "list" && block.items.length > 1)).toBe(true);
    // No list item or paragraph was cut at a line break.
    expect(doc.blocks.every((block) => block.kind === "heading" || !/\n/.test(JSON.stringify(block)))).toBe(
      true,
    );
  });
});
