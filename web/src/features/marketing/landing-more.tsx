import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import { Glass, GlassField, Panel } from "../../brand/glass";
import { pillStyle } from "../../brand/pill";
import { useI18n } from "../../i18n";
import { site, takesAccessRequests } from "../../site";
import { color, font } from "../../tokens.stylex";
import { AccessForm } from "./access-form";
import { CopyRequest } from "./copy-request";
import { kit } from "./landing-kit";

// StyleX reads a media query only from the file that uses it.
const LG = "@media (min-width: 64rem)";
const MD = "@media (min-width: 48rem)";
const SM = "@media (min-width: 40rem)";

const styles = stylex.create({
  // Trust
  trust: {
    paddingBlock: { default: "3.5rem", [SM]: "5rem" },
    paddingInline: { default: "1.25rem", [SM]: "3.5rem" },
    borderRadius: "2.5rem",
  },
  trustGlass: {
    display: { default: "none", [SM]: "block" },
    top: "-6rem",
    right: "-2.5rem",
    width: "14rem",
    height: "20rem",
    rotate: "24deg",
  },
  trustText: { maxWidth: "42rem" },
  trustLead: { maxWidth: "52ch" },
  facts: {
    display: "grid",
    gridTemplateColumns: { default: "minmax(0, 1fr)", [MD]: "repeat(2, minmax(0, 1fr))" },
    columnGap: "3rem",
    margin: "3rem 0 0",
    paddingBlock: "0.5rem",
    paddingInline: { default: "1.5rem", [SM]: "2.5rem" },
    borderRadius: "1.75rem",
  },
  fact: {
    paddingBlock: "1.5rem",
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: color.line,
  },
  lastFact: { borderBottomWidth: 0 },
  // In two columns the last row is two facts.
  lastRowFact: { borderBottomWidth: { default: 1, [MD]: 0 } },
  factBody: { maxWidth: "52ch" },
  privacy: { marginTop: "2rem" },

  // Limits
  limits: {
    display: "grid",
    gridTemplateColumns: { default: "minmax(0, 1fr)", [MD]: "minmax(0, 1fr) minmax(0, 1.3fr)" },
    gap: "3rem",
  },
  limitsLead: { maxWidth: "44ch", textWrap: "wrap" },
  compare: { marginTop: "1.5rem" },
  list: {
    margin: 0,
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.line,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: color.line,
  },
  limit: { paddingBlock: "1.5rem" },
  divided: { borderTopWidth: 1, borderTopStyle: "solid", borderTopColor: color.line },
  limitBody: { maxWidth: "62ch" },

  // Two ways
  waysTitle: { maxWidth: "14ch", marginInline: "auto", textAlign: "center" },
  ways: {
    display: "grid",
    gridTemplateColumns: { default: "minmax(0, 1fr)", [MD]: "repeat(2, minmax(0, 1fr))" },
    gap: "1.25rem",
    marginTop: "3.5rem",
  },
  way: {
    display: "flex",
    flexDirection: "column",
    padding: { default: "1.75rem", [SM]: "2.5rem" },
    borderRadius: "1.75rem",
  },
  wayGlass: { top: "-6rem", right: "-2.5rem", width: "12rem", height: "18rem", rotate: "24deg" },
  state: { margin: 0, fontSize: "0.8125rem", fontWeight: 500 },
  hosted: { color: color.overlap },
  free: { color: color.good },
  wayTitle: {
    margin: "0.5rem 0 0",
    fontFamily: font.display,
    fontSize: "2.25rem",
    fontWeight: 400,
    lineHeight: 1.1111,
    letterSpacing: "-0.025em",
  },
  wayBody: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "0%",
    maxWidth: "44ch",
    margin: "1rem 0 0",
    fontSize: "1rem",
    lineHeight: 1.625,
  },
  muted: { color: color.muted },
  wayForm: { width: "100%", marginTop: "2rem", marginInline: 0 },
  wayActions: { marginTop: "2rem" },

  // Install
  install: { paddingTop: { default: "7rem", [SM]: "9rem" } },
  installLead: { maxWidth: "52ch", marginInline: "auto" },
  installGrid: {
    display: "grid",
    gridTemplateColumns: { default: "minmax(0, 1fr)", [LG]: "minmax(0, 1.35fr) minmax(0, 1fr)" },
    gap: "1.25rem",
    marginTop: "4rem",
  },
  ask: { display: "flex", flexDirection: "column", overflow: "hidden", borderRadius: "1.75rem" },
  askHead: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "1rem",
    padding: { default: "1.5rem", [SM]: "2rem" },
  },
  askTitle: {
    margin: 0,
    fontFamily: font.display,
    fontSize: "1.5rem",
    fontWeight: 400,
    lineHeight: 1.3333,
    letterSpacing: "-0.02em",
    textWrap: "balance",
  },
  askBody: {
    maxWidth: "60ch",
    margin: "0.75rem 0 0",
    color: color.muted,
    fontSize: "0.9375rem",
    lineHeight: 1.625,
  },
  prompt: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "0%",
    maxHeight: "16rem",
    margin: 0,
    paddingBlock: "1.5rem",
    paddingInline: { default: "1.5rem", [SM]: "2rem" },
    overflowY: "auto",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.line,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: color.line,
    backgroundColor: color.subtle,
    color: color.muted,
    fontFamily: font.sans,
    fontSize: "0.8125rem",
    lineHeight: 1.625,
    whiteSpace: "pre-wrap",
  },
  askFoot: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.75rem",
    paddingBlock: "1rem",
    paddingInline: { default: "1.5rem", [SM]: "2rem" },
    color: color.muted,
    fontSize: "0.8125rem",
  },
  caution: { maxWidth: "52ch", margin: 0 },
  guide: { color: color.ink, textDecorationLine: "underline", textUnderlineOffset: 4 },
  terminal: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "2rem",
    minHeight: "24rem",
    padding: { default: "1.5rem", [SM]: "2rem" },
    borderRadius: "1.75rem",
  },
  terminalGlass: { right: "-2.5rem", bottom: "-7rem", width: "14rem", height: "26rem", rotate: "12deg" },
  commands: {
    margin: 0,
    padding: "1.25rem",
    borderRadius: "1rem",
    fontFamily: font.mono,
    fontSize: "0.8125rem",
    lineHeight: "1.75rem",
    overflowWrap: "anywhere",
    whiteSpace: "pre-wrap",
  },
  code: { fontFamily: "inherit", fontSize: "inherit" },
  faint: { color: color.faint },
  ready: { color: color.muted, fontFamily: font.sans },
  source: { alignSelf: "flex-start" },

  // The last word
  close: {
    position: "relative",
    isolation: "isolate",
    maxWidth: "72rem",
    marginTop: { default: "9rem", [SM]: "12rem" },
    marginInline: "auto",
    paddingInline: { default: "1.25rem", [SM]: "2rem" },
  },
  closeField: {
    paddingTop: { default: "5rem", [SM]: "9rem" },
    paddingBottom: { default: "18rem", [SM]: "9rem" },
    paddingInline: "1.5rem",
    borderRadius: "2.5rem",
    textAlign: "center",
  },
  closeCoral: {
    bottom: "-7rem",
    left: { default: "8%", [SM]: "-1.5rem" },
    width: { default: "11rem", [SM]: "14rem" },
    height: { default: "20rem", [SM]: "24rem" },
    rotate: "-6deg",
  },
  closeBlue: {
    bottom: "-9rem",
    left: { default: "38%", [SM]: "6rem" },
    width: { default: "11rem", [SM]: "14rem" },
    height: { default: "24rem", [SM]: "26rem" },
    rotate: "3deg",
  },
  closeGreen: {
    top: "-2.5rem",
    right: { default: "-5rem", [SM]: "10%" },
    width: "16rem",
    height: "6rem",
    rotate: "12deg",
  },
  closeTitle: { maxWidth: "16ch", marginInline: "auto" },
  closeLead: { maxWidth: "46ch", marginInline: "auto" },
  closeActions: { justifyContent: "center", marginTop: "2.25rem" },
});

/** Where the data lives, on a field of the colour of a direct booking. */
export function LandingTrust() {
  const { m } = useI18n("marketing");
  const t = m.marketing.trust;
  return (
    <section id="trust" {...stylex.props(kit.section)}>
      <GlassField tint="green" xstyle={styles.trust}>
        <Glass tint="green" xstyle={[kit.behind, styles.trustGlass]} />
        <div {...stylex.props(styles.trustText)}>
          <h2 {...stylex.props(kit.h2)}>{t.title}</h2>
          <p {...stylex.props(kit.lead, kit.tinted, styles.trustLead)}>{t.intro}</p>
        </div>
        <dl {...stylex.props(kit.panel, styles.facts)}>
          {t.items.map((item, index) => (
            <div
              key={item.term}
              {...stylex.props(
                styles.fact,
                index === t.items.length - 1 && styles.lastFact,
                index === t.items.length - 2 && styles.lastRowFact,
              )}
            >
              <dt {...stylex.props(kit.term)}>{item.term}</dt>
              <dd {...stylex.props(kit.definition, styles.factBody)}>{item.body}</dd>
            </div>
          ))}
        </dl>
        <a
          href={`${site.repo}/blob/main/docs/EXTENSION-PRIVACY.md`}
          {...stylex.props(kit.link, kit.more, styles.privacy)}
        >
          {t.privacy}
        </a>
      </GlassField>
    </section>
  );
}

/** The quiet passage: no glass, only what the product cannot do. */
export function LandingLimits() {
  const { m } = useI18n("marketing", "alternatives");
  const t = m.marketing.limits;
  return (
    <section id="limits" {...stylex.props(kit.section, styles.limits)}>
      <div>
        <h2 {...stylex.props(kit.h2)}>{t.title}</h2>
        <p {...stylex.props(kit.lead, styles.limitsLead)}>{t.intro}</p>
        <Link to="/alternatives" {...stylex.props(kit.link, kit.more, styles.compare)}>
          {m.alternatives.nav.alternatives}
        </Link>
      </div>
      <dl {...stylex.props(styles.list)}>
        {t.items.map((item, index) => (
          <div key={item.term} {...stylex.props(styles.limit, index > 0 && styles.divided)}>
            <dt {...stylex.props(kit.term)}>{item.term}</dt>
            <dd {...stylex.props(kit.definition, styles.limitBody)}>{item.body}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Hosted for you, or on your own computer. */
export function LandingWays() {
  const { m } = useI18n("marketing");
  const t = m.marketing.ways;
  return (
    <section id="ways" {...stylex.props(kit.section)}>
      <h2 {...stylex.props(kit.h2, styles.waysTitle)}>{t.title}</h2>
      <div {...stylex.props(styles.ways)}>
        <GlassField tint="overlap" xstyle={styles.way}>
          <Glass tint="overlap" plane="view" drift={-36} xstyle={[kit.behind, styles.wayGlass]} />
          <p {...stylex.props(styles.state, styles.hosted)}>{t.hosted.state}</p>
          <h3 {...stylex.props(styles.wayTitle)}>{t.hosted.title}</h3>
          <p {...stylex.props(styles.wayBody, kit.tinted)}>{t.hosted.body}</p>
          {takesAccessRequests && <AccessForm xstyle={styles.wayForm} />}
        </GlassField>
        <Panel xstyle={styles.way}>
          <p {...stylex.props(styles.state, styles.free)}>{t.self.state}</p>
          <h3 {...stylex.props(styles.wayTitle)}>{t.self.title}</h3>
          <p {...stylex.props(styles.wayBody, styles.muted)}>{t.self.body}</p>
          <div {...stylex.props(kit.actions, styles.wayActions)}>
            <a href={site.repo} {...stylex.props(pillStyle("primary", "lg"))}>
              {t.self.github}
            </a>
            <Link to="/" hash="install" {...stylex.props(pillStyle("secondary", "lg"))}>
              {t.self.guide}
            </Link>
          </div>
        </Panel>
      </div>
    </section>
  );
}

/** Installing it: by asking an AI assistant, or with three commands. */
export function LandingInstall() {
  const { m, locale } = useI18n("marketing");
  const t = m.marketing.open;
  const guide = `${site.repo}/blob/main/docs/${locale === "fr" ? "INSTALLATION.fr.md" : "INSTALL.md"}`;
  return (
    <section id="install" {...stylex.props(kit.section, styles.install)}>
      <div {...stylex.props(kit.intro)}>
        <h2 {...stylex.props(kit.h2)}>{t.title}</h2>
        <p {...stylex.props(kit.lead, styles.installLead)}>{t.body(site.license)}</p>
      </div>

      <div {...stylex.props(styles.installGrid)}>
        <Panel xstyle={styles.ask} aria-labelledby="ai-install">
          <div {...stylex.props(styles.askHead)}>
            <div>
              <h3 id="ai-install" {...stylex.props(styles.askTitle)}>
                {t.ai.title}
              </h3>
              <p {...stylex.props(styles.askBody)}>{t.ai.body}</p>
            </div>
            <CopyRequest value={t.ai.prompt} label={t.ai.copy} />
          </div>
          <pre tabIndex={0} aria-label={t.ai.label} {...stylex.props(styles.prompt)}>
            {t.ai.prompt}
          </pre>
          <div {...stylex.props(styles.askFoot)}>
            <p {...stylex.props(styles.caution)}>{t.ai.caution}</p>
            <a href={guide} {...stylex.props(styles.guide)}>
              {t.ai.guide}
            </a>
          </div>
        </Panel>

        <GlassField tint="blue" xstyle={styles.terminal}>
          <Glass tint="blue" xstyle={[kit.behind, styles.terminalGlass]} />
          <pre aria-label={t.install} {...stylex.props(kit.panel, styles.commands)}>
            <code {...stylex.props(styles.code)}>
              <span {...stylex.props(styles.faint)}>$ </span>git clone {site.repo}
              {"\n"}
              <span {...stylex.props(styles.faint)}>$ </span>cd Innkeep
              {"\n"}
              <span {...stylex.props(styles.faint)}>$ </span>npm run app
              {"\n\n"}
              <span {...stylex.props(styles.ready)}>{t.ready}</span>
            </code>
          </pre>
          <a href={site.repo} {...stylex.props(pillStyle("secondary", "lg"), styles.source)}>
            {t.source}
          </a>
        </GlassField>
      </div>
    </section>
  );
}

/** The last word, where the three colours of glass meet. */
export function LandingClose() {
  const { m } = useI18n("marketing");
  const t = m.marketing;
  return (
    <section {...stylex.props(styles.close)}>
      <GlassField tint="overlap" xstyle={styles.closeField}>
        <Glass tint="coral" xstyle={[kit.behind, styles.closeCoral]} />
        <Glass tint="blue" xstyle={[kit.behind, styles.closeBlue]} />
        <Glass tint="green" shape="pill" xstyle={[kit.behind, styles.closeGreen]} />
        <h2 {...stylex.props(kit.h2, styles.closeTitle)}>{t.close.title}</h2>
        <p {...stylex.props(kit.lead, kit.tinted, styles.closeLead)}>{t.close.body}</p>
        <div {...stylex.props(kit.actions, styles.closeActions)}>
          {takesAccessRequests ? (
            <Link to="/" hash="access" {...stylex.props(pillStyle("primary", "lg"))}>
              {t.nav.access}
            </Link>
          ) : (
            <Link to="/overview" {...stylex.props(pillStyle("primary", "lg"))}>
              {t.hero.dashboard}
            </Link>
          )}
          <a href={site.repo} {...stylex.props(pillStyle("secondary", "lg"))}>
            {t.close.self}
          </a>
        </div>
      </GlassField>
    </section>
  );
}
