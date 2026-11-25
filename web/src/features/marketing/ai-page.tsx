import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import { Glass, GlassField } from "../../brand/glass";
import { pillStyle } from "../../brand/pill";
import { useI18n } from "../../i18n";
import { site, takesAccessRequests } from "../../site";
import { color, font, shadow } from "../../tokens.stylex";
import { Hidden } from "../../ui/primitives";

const SMALL = "@media (min-width: 40rem)";
const MEDIUM = "@media (min-width: 48rem)";
const LARGE = "@media (min-width: 64rem)";

const COMMAND = `claude mcp add --transport http innkeep https://your-innkeep/api/mcp \\
  --header "Authorization: Bearer YOUR_MCP_TOKEN"`;
const CONFIG = JSON.stringify(
  {
    mcpServers: {
      innkeep: {
        type: "http",
        url: "https://your-innkeep/api/mcp",
        headers: { Authorization: "Bearer YOUR_MCP_TOKEN" },
      },
    },
  },
  null,
  2,
);

const styles = stylex.create({
  hero: { position: "relative", isolation: "isolate" },
  backdrop: {
    position: "absolute",
    insetInline: 0,
    top: 0,
    zIndex: -10,
    height: "46rem",
    overflowX: "clip",
    pointerEvents: "none",
  },
  slabBlue: {
    top: { default: "30rem", [SMALL]: "7rem" },
    left: { default: "-8rem", [SMALL]: "-6rem" },
    width: { default: "10rem", [SMALL]: "14rem" },
    height: { default: "16rem", [SMALL]: "26rem" },
    rotate: "-12deg",
  },
  slabOverlap: {
    top: "-2.5rem",
    right: "-6rem",
    width: { default: "10rem", [SMALL]: "16rem" },
    height: { default: "14rem", [SMALL]: "30rem" },
    rotate: "16deg",
  },
  heroGrid: {
    display: "grid",
    gridTemplateColumns: { default: "minmax(0, 1fr)", [LARGE]: "minmax(0, 1fr) minmax(0, 1.05fr)" },
    alignItems: "center",
    gap: "3rem",
    maxWidth: "72rem",
    marginInline: "auto",
    paddingTop: { default: "3.5rem", [SMALL]: "5rem" },
    paddingInline: { default: "1.25rem", [SMALL]: "2rem" },
  },
  h1: {
    maxWidth: "14ch",
    margin: 0,
    fontFamily: font.display,
    fontSize: { default: "3rem", [SMALL]: "4.5rem" },
    fontWeight: 400,
    lineHeight: 1,
    letterSpacing: "-0.035em",
    textWrap: "balance",
  },
  lead: {
    maxWidth: "52ch",
    margin: "1.5rem 0 0",
    color: color.muted,
    fontSize: "1.125rem",
    lineHeight: 1.625,
    textWrap: "pretty",
  },
  wink: { margin: "1.25rem 0 0", color: color.overlap, fontSize: "15px" },
  panel: { backgroundColor: color.panel, boxShadow: shadow.panel },
  talk: {
    margin: 0,
    padding: { default: "1.25rem", [SMALL]: "1.75rem" },
    borderRadius: "1.75rem",
  },
  turns: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
  ask: {
    width: "fit-content",
    maxWidth: "85%",
    margin: 0,
    marginInlineStart: "auto",
    padding: "0.625rem 1rem",
    borderRadius: "1rem",
    borderEndEndRadius: "0.375rem",
    backgroundColor: color.ink,
    color: color.inverse,
    fontSize: "15px",
    lineHeight: 1.375,
  },
  reply: { maxWidth: "92%", marginTop: "0.625rem" },
  tool: {
    margin: 0,
    color: color.overlap,
    fontFamily: font.mono,
    fontSize: "0.75rem",
    lineHeight: 1.333,
  },
  answer: { margin: "0.25rem 0 0", fontSize: "15px", lineHeight: 1.625 },
  caption: {
    marginTop: "1.5rem",
    paddingTop: "0.75rem",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.line,
    color: color.muted,
    fontSize: "0.75rem",
    lineHeight: 1.333,
  },
  section: {
    maxWidth: "72rem",
    marginInline: "auto",
    paddingTop: { default: "8rem", [SMALL]: "11rem" },
    paddingInline: { default: "1.25rem", [SMALL]: "2rem" },
  },
  split: {
    display: "grid",
    gridTemplateColumns: { default: "minmax(0, 1fr)", [MEDIUM]: "minmax(0, 1fr) minmax(0, 1.3fr)" },
    gap: "3rem",
  },
  anchor: { scrollMarginTop: "6rem" },
  h2: {
    margin: 0,
    fontFamily: font.display,
    fontSize: { default: "1.875rem", [SMALL]: "3rem" },
    fontWeight: 400,
    lineHeight: 1.06,
    letterSpacing: "-0.025em",
    textWrap: "balance",
  },
  intro: {
    maxWidth: "44ch",
    margin: "1.5rem 0 0",
    color: color.muted,
    fontSize: "1.125rem",
    lineHeight: 1.625,
  },
  rows: {
    margin: 0,
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.line,
  },
  row: {
    paddingBlock: "1.5rem",
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: color.line,
  },
  toolTerm: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem" },
  toolName: { fontFamily: font.mono, fontSize: "15px" },
  kind: {
    padding: "0.125rem 0.625rem",
    borderRadius: "999px",
    fontSize: "0.75rem",
    fontWeight: 500,
    lineHeight: 1.333,
  },
  reads: { backgroundColor: color.sunken, color: color.muted },
  writes: { backgroundColor: color.criticalBg, color: color.overlap },
  body: {
    maxWidth: "62ch",
    margin: "0.5rem 0 0",
    color: color.muted,
    fontSize: "15px",
    lineHeight: 1.625,
  },
  term: {
    margin: 0,
    fontFamily: font.display,
    fontSize: "1.25rem",
    fontWeight: 400,
    lineHeight: 1.4,
    letterSpacing: "-0.01em",
  },
  field: {
    padding: { default: "3.5rem 1.25rem", [SMALL]: "5rem 3.5rem" },
    borderRadius: "2.5rem",
  },
  fieldSlab: {
    display: { default: "none", [SMALL]: "block" },
    top: "-6rem",
    right: "-2.5rem",
    zIndex: -10,
    width: "14rem",
    height: "20rem",
    rotate: "24deg",
  },
  connectHead: { maxWidth: "42rem" },
  // The field's own colour (`--g`) tints the text that sits directly on it.
  connectIntro: {
    maxWidth: "54ch",
    margin: "1.5rem 0 0",
    color: `color-mix(in oklab, ${color.ink} 72%, var(--g))`,
    fontSize: "1.125rem",
    lineHeight: 1.625,
    textWrap: "pretty",
  },
  steps: {
    margin: "3rem 0 0",
    padding: { default: "0.5rem 1.5rem", [SMALL]: "0.5rem 2.5rem" },
    borderRadius: "1.75rem",
    listStyle: "none",
  },
  step: { paddingBlock: "1.75rem" },
  stepRule: { borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: color.line },
  number: { marginInlineEnd: "0.5rem", color: color.overlap, fontVariantNumeric: "tabular-nums" },
  pre: {
    position: "relative",
    margin: "1rem 0 0",
    padding: "1rem",
    overflowX: "auto",
    borderRadius: "0.75rem",
    backgroundColor: color.subtle,
    fontFamily: font.mono,
    fontSize: "13px",
    lineHeight: "1.5rem",
  },
  preAfter: { marginTop: "0.75rem" },
  code: { fontFamily: "inherit" },
  other: { marginTop: "1.25rem" },
  desktop: { marginTop: "1rem", fontSize: "13px" },
  alsoTitle: { maxWidth: "18ch" },
  also: {
    display: "grid",
    gridTemplateColumns: { default: "minmax(0, 1fr)", [MEDIUM]: "repeat(2, minmax(0, 1fr))" },
    columnGap: "4rem",
    rowGap: "2rem",
    margin: "2.5rem 0 0",
  },
  alsoBody: { maxWidth: "52ch" },
  link: {
    color: color.ink,
    fontWeight: 500,
    textDecorationLine: "underline",
    textDecorationColor: { default: color.lineStrong, ":hover": color.ink },
    textUnderlineOffset: "4px",
  },
  closing: {
    maxWidth: "72rem",
    marginTop: { default: "8rem", [SMALL]: "11rem" },
    marginInline: "auto",
    paddingInline: { default: "1.25rem", [SMALL]: "2rem" },
  },
  cta: {
    padding: { default: "5rem 1.5rem", [SMALL]: "7rem 1.5rem" },
    borderRadius: "2.5rem",
    textAlign: "center",
  },
  ctaSlab: {
    top: "-2.5rem",
    right: { default: "-5rem", [SMALL]: "10%" },
    zIndex: -10,
    width: "16rem",
    height: "6rem",
    rotate: "12deg",
  },
  ctaTitle: { maxWidth: "16ch", marginInline: "auto" },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "0.75rem",
    marginTop: "2.25rem",
  },
});

/** The public AI page: the MCP server, how to connect an assistant, and where it stops. */
export function AiPage() {
  const t = useI18n("ai").m.ai;
  return (
    <main>
      <section {...stylex.props(styles.hero)}>
        <div aria-hidden {...stylex.props(styles.backdrop)}>
          <Glass tint="blue" plane="page" drift={-120} xstyle={styles.slabBlue} />
          <Glass tint="overlap" plane="page" drift={-160} xstyle={styles.slabOverlap} />
        </div>

        <div {...stylex.props(styles.heroGrid)}>
          <div>
            <h1 {...stylex.props(styles.h1)}>{t.heading}</h1>
            <p {...stylex.props(styles.lead)}>{t.lead}</p>
            <p {...stylex.props(styles.wink)}>{t.wink}</p>
          </div>

          <figure aria-label={t.talk.label} {...stylex.props(styles.panel, styles.talk)}>
            <ol {...stylex.props(styles.turns)}>
              {t.talk.turns.map((turn) => (
                <li key={turn.ask}>
                  <p {...stylex.props(styles.ask)}>
                    <Hidden>{t.talk.you}: </Hidden>
                    {turn.ask}
                  </p>
                  <div {...stylex.props(styles.reply)}>
                    <p {...stylex.props(styles.tool)}>{turn.tool}</p>
                    <p {...stylex.props(styles.answer)}>
                      <Hidden>{t.talk.assistant}: </Hidden>
                      {turn.answer}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <figcaption {...stylex.props(styles.caption)}>{t.talk.example}</figcaption>
          </figure>
        </div>
      </section>

      <section {...stylex.props(styles.section, styles.split)}>
        <div>
          <h2 {...stylex.props(styles.h2)}>{t.tools.title}</h2>
          <p {...stylex.props(styles.intro)}>{t.tools.intro}</p>
        </div>
        <dl {...stylex.props(styles.rows)}>
          {t.tools.items.map((tool) => (
            <div key={tool.name} {...stylex.props(styles.row)}>
              <dt {...stylex.props(styles.toolTerm)}>
                <code {...stylex.props(styles.toolName)}>{tool.name}</code>
                <span {...stylex.props(styles.kind, tool.kind === "write" ? styles.writes : styles.reads)}>
                  {tool.kind === "write" ? t.tools.writes : t.tools.reads}
                </span>
              </dt>
              <dd {...stylex.props(styles.body)}>{tool.body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="connect" {...stylex.props(styles.section, styles.anchor)}>
        <GlassField tint="blue" xstyle={styles.field}>
          <Glass tint="blue" xstyle={styles.fieldSlab} />
          <div {...stylex.props(styles.connectHead)}>
            <h2 {...stylex.props(styles.h2)}>{t.connect.title}</h2>
            <p {...stylex.props(styles.connectIntro)}>{t.connect.intro}</p>
          </div>
          <ol {...stylex.props(styles.panel, styles.steps)}>
            {t.connect.steps.map((step, index) => (
              <li
                key={step.title}
                {...stylex.props(styles.step, index < t.connect.steps.length - 1 && styles.stepRule)}
              >
                <h3 {...stylex.props(styles.term)}>
                  <span {...stylex.props(styles.number)}>{index + 1}.</span>
                  {step.title}
                </h3>
                <p {...stylex.props(styles.body)}>{step.body}</p>
                {index === 1 && (
                  <>
                    <pre {...stylex.props(styles.pre)}>
                      <code {...stylex.props(styles.code)}>{COMMAND}</code>
                    </pre>
                    <p {...stylex.props(styles.body, styles.other)}>{t.connect.other}</p>
                    <pre {...stylex.props(styles.pre, styles.preAfter)}>
                      <code {...stylex.props(styles.code)}>{CONFIG}</code>
                    </pre>
                    <p {...stylex.props(styles.body, styles.desktop)}>{t.connect.desktop}</p>
                  </>
                )}
              </li>
            ))}
          </ol>
        </GlassField>
      </section>

      <section {...stylex.props(styles.section, styles.split)}>
        <h2 {...stylex.props(styles.h2)}>{t.limits.title}</h2>
        <dl {...stylex.props(styles.rows)}>
          {t.limits.items.map((item) => (
            <div key={item.term} {...stylex.props(styles.row)}>
              <dt {...stylex.props(styles.term)}>{item.term}</dt>
              <dd {...stylex.props(styles.body)}>{item.body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section {...stylex.props(styles.section)}>
        <h2 {...stylex.props(styles.h2, styles.alsoTitle)}>{t.also.title}</h2>
        <dl {...stylex.props(styles.also)}>
          <div>
            <dt {...stylex.props(styles.term)}>{t.also.advice.term}</dt>
            <dd {...stylex.props(styles.body, styles.alsoBody)}>{t.also.advice.body}</dd>
          </div>
          <div>
            <dt {...stylex.props(styles.term)}>{t.also.install.term}</dt>
            <dd {...stylex.props(styles.body, styles.alsoBody)}>
              {t.also.install.body}{" "}
              <Link to="/" hash="install" {...stylex.props(styles.link)}>
                {t.also.install.link}
              </Link>
            </dd>
          </div>
        </dl>
      </section>

      <section {...stylex.props(styles.closing)}>
        <GlassField tint="overlap" xstyle={styles.cta}>
          <Glass tint="blue" shape="pill" xstyle={styles.ctaSlab} />
          <h2 {...stylex.props(styles.h2, styles.ctaTitle)}>{t.cta.title}</h2>
          <div {...stylex.props(styles.actions)}>
            {takesAccessRequests && (
              <Link to="/" hash="access" {...stylex.props(pillStyle("primary", "lg"))}>
                {t.cta.access}
              </Link>
            )}
            <a
              href={site.repo}
              {...stylex.props(pillStyle(takesAccessRequests ? "secondary" : "primary", "lg"))}
            >
              {t.cta.self}
            </a>
          </div>
        </GlassField>
      </section>
    </main>
  );
}
