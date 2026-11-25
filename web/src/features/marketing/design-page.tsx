import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import raw from "../../../../DESIGN.md?raw";
import { useI18n } from "../../i18n";
import { site } from "../../site";
import { color, font, shadow } from "../../tokens.stylex";
import { parseDesignDoc } from "./design-doc";

const SMALL = "@media (min-width: 40rem)";

const doc = parseDesignDoc(raw);
const light = doc.colors.filter(([name]) => !name.endsWith("-dark"));
const dark = doc.colors.filter(([name]) => name.endsWith("-dark"));

const styles = stylex.create({
  main: {
    maxWidth: "56rem",
    marginInline: "auto",
    paddingInline: { default: "1.25rem", [SMALL]: "2rem" },
  },
  header: { paddingTop: { default: "3.5rem", [SMALL]: "5rem" }, paddingBottom: "3rem" },
  h1: {
    maxWidth: "16ch",
    margin: 0,
    fontFamily: font.display,
    fontSize: { default: "3rem", [SMALL]: "4.5rem" },
    fontWeight: 400,
    lineHeight: 1,
    letterSpacing: "-0.035em",
    textWrap: "balance",
  },
  lead: {
    maxWidth: "60ch",
    margin: "1.75rem 0 0",
    color: color.muted,
    fontSize: "1.125rem",
    lineHeight: 1.625,
    textWrap: "pretty",
  },
  links: {
    display: "flex",
    flexWrap: "wrap",
    columnGap: "1.5rem",
    rowGap: "0.5rem",
    margin: "1.25rem 0 0",
    fontSize: "15px",
  },
  link: {
    color: "inherit",
    fontWeight: 500,
    textDecorationLine: "underline",
    textDecorationColor: { default: color.lineStrong, ":hover": color.ink },
    textUnderlineOffset: "4px",
  },
  h2: {
    margin: 0,
    fontFamily: font.display,
    fontSize: { default: "1.5rem", [SMALL]: "1.875rem" },
    fontWeight: 400,
    lineHeight: { default: 1.333, [SMALL]: 1.2 },
    letterSpacing: "-0.02em",
  },
  group: { marginTop: "1.5rem" },
  groupTitle: { margin: 0, color: color.muted, fontSize: "13px", fontWeight: 500 },
  swatches: {
    display: "grid",
    gridTemplateColumns: { default: "repeat(2, minmax(0, 1fr))", [SMALL]: "repeat(4, minmax(0, 1fr))" },
    gap: "0.75rem",
    margin: "0.75rem 0 0",
    padding: 0,
    listStyle: "none",
  },
  swatch: {
    overflow: "hidden",
    borderRadius: "1rem",
    backgroundColor: color.panel,
    boxShadow: shadow.panel,
  },
  chip: { display: "block", height: "4rem" },
  chipColor: (value: string) => ({ backgroundColor: value }),
  swatchText: { display: "block", padding: "0.625rem 0.75rem" },
  swatchName: {
    display: "block",
    overflow: "hidden",
    fontSize: "13px",
    fontWeight: 500,
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  swatchValue: {
    display: "block",
    color: color.muted,
    fontFamily: font.mono,
    fontSize: "0.75rem",
    lineHeight: 1.333,
  },
  section: { paddingTop: "4rem" },
  samples: {
    margin: "1.5rem 0 0",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.line,
  },
  sampleRow: {
    display: "grid",
    gridTemplateColumns: { default: "minmax(0, 1fr)", [SMALL]: "9rem minmax(0, 1fr)" },
    alignItems: { default: null, [SMALL]: "baseline" },
    gap: "0.5rem",
    paddingBlock: "1.25rem",
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: color.line,
  },
  sampleTerm: { fontSize: "13px" },
  medium: { fontWeight: 500 },
  sampleSize: { color: color.muted, fontFamily: font.mono, fontSize: "0.75rem" },
  sample: {
    minWidth: 0,
    margin: 0,
    overflow: "hidden",
    lineHeight: 1.25,
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  displayFace: { fontFamily: font.display },
  monoFace: { fontFamily: font.mono },
  sampleType: (size: string, weight: string | null, spacing: string | null) => ({
    fontSize: size,
    fontWeight: weight,
    letterSpacing: spacing,
  }),
  note: { margin: 0, color: color.muted, fontSize: "13px" },
  docH2: {
    margin: 0,
    paddingTop: "3.5rem",
    fontFamily: font.display,
    fontSize: { default: "1.5rem", [SMALL]: "1.875rem" },
    fontWeight: 400,
    lineHeight: 1.25,
    letterSpacing: "-0.02em",
    scrollMarginTop: "6rem",
  },
  docH3: {
    margin: 0,
    paddingTop: "2rem",
    fontFamily: font.display,
    fontSize: "1.25rem",
    fontWeight: 400,
    lineHeight: 1.4,
    letterSpacing: "-0.01em",
    scrollMarginTop: "6rem",
  },
  prose: {
    maxWidth: "70ch",
    margin: "1rem 0 0",
    color: color.muted,
    fontSize: "1rem",
    lineHeight: 1.625,
  },
  list: { paddingInlineStart: "1.25rem", listStyleType: "disc" },
  item: { "::marker": { color: color.lineStrong } },
  itemAfter: { marginTop: "0.625rem" },
  code: {
    padding: "0.125rem 0.375rem",
    borderRadius: "0.375rem",
    backgroundColor: color.sunken,
    fontFamily: font.mono,
    fontSize: "0.85em",
  },
  strong: { color: color.ink, fontWeight: 500 },
});

/** Inline marks of the document: `code` and **strong**. */
function inline(text: string): ReactNode[] {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/).map((part, index) => {
    const key = `${index}-${part.slice(0, 12)}`;
    if (part.startsWith("`")) {
      return (
        <code key={key} {...stylex.props(styles.code)}>
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**")) {
      return (
        <strong key={key} {...stylex.props(styles.strong)}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

/** The public copy of `DESIGN.md`: its tokens shown as swatches and samples, then its text. */
export function DesignPage() {
  const t = useI18n("design").m.design;

  return (
    <main {...stylex.props(styles.main)}>
      <header {...stylex.props(styles.header)}>
        <h1 {...stylex.props(styles.h1)}>{t.heading}</h1>
        <p {...stylex.props(styles.lead)}>{t.lead}</p>
        <p {...stylex.props(styles.links)}>
          <a href="/design.md" {...stylex.props(styles.link)}>
            {t.raw}
          </a>
          <a href={`${site.repo}/blob/main/DESIGN.md`} {...stylex.props(styles.link)}>
            {t.source}
          </a>
        </p>
      </header>

      <section aria-labelledby="swatches">
        <h2 id="swatches" {...stylex.props(styles.h2)}>
          {t.colors}
        </h2>
        {(
          [
            [t.light, light],
            [t.dark, dark],
          ] as const
        ).map(([label, group]) => (
          <div key={label} {...stylex.props(styles.group)}>
            <h3 {...stylex.props(styles.groupTitle)}>{label}</h3>
            <ul {...stylex.props(styles.swatches)}>
              {group.map(([name, value]) => (
                <li key={name} {...stylex.props(styles.swatch)}>
                  <span aria-hidden {...stylex.props(styles.chip, styles.chipColor(value))} />
                  <span {...stylex.props(styles.swatchText)}>
                    <span {...stylex.props(styles.swatchName)}>{name}</span>
                    <span {...stylex.props(styles.swatchValue)}>{value}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section aria-labelledby="type-samples" {...stylex.props(styles.section)}>
        <h2 id="type-samples" {...stylex.props(styles.h2)}>
          {t.type}
        </h2>
        <dl {...stylex.props(styles.samples)}>
          {doc.typography.map(([name, style]) => (
            <div key={name} {...stylex.props(styles.sampleRow)}>
              <dt {...stylex.props(styles.sampleTerm)}>
                <span {...stylex.props(styles.medium)}>{name}</span>{" "}
                <span {...stylex.props(styles.sampleSize)}>{style.fontSize}</span>
              </dt>
              <dd
                {...stylex.props(
                  styles.sample,
                  style.fontFamily?.startsWith("Funnel") && styles.displayFace,
                  style.fontFamily?.includes("Mono") && styles.monoFace,
                  styles.sampleType(
                    `min(${style.fontSize ?? "1rem"}, 9vw)`,
                    style.fontWeight ?? null,
                    style.letterSpacing ?? null,
                  ),
                )}
              >
                {t.sample}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <article lang="en" {...stylex.props(styles.section)}>
        <p {...stylex.props(styles.note)}>{t.english}</p>
        {doc.blocks.map((block, index) => {
          const key = `${block.kind}-${index}`;
          if (block.kind === "heading") {
            return block.level === 2 ? (
              <h2 key={key} id={block.id} {...stylex.props(styles.docH2)}>
                {block.text}
              </h2>
            ) : (
              <h3 key={key} id={block.id} {...stylex.props(styles.docH3)}>
                {block.text}
              </h3>
            );
          }
          if (block.kind === "list") {
            return (
              <ul key={key} {...stylex.props(styles.prose, styles.list)}>
                {block.items.map((item, at) => (
                  <li key={item} {...stylex.props(styles.item, at > 0 && styles.itemAfter)}>
                    {inline(item)}
                  </li>
                ))}
              </ul>
            );
          }
          return (
            <p key={key} {...stylex.props(styles.prose)}>
              {inline(block.text)}
            </p>
          );
        })}
      </article>
    </main>
  );
}
