import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import { Glass } from "../../brand/glass";
import { LogoMark } from "../../brand/logo";
import { pillStyle } from "../../brand/pill";
import { useI18n } from "../../i18n";
import { hasPublicDemo, takesAccessRequests } from "../../site";
import { color, font } from "../../tokens.stylex";
import { AccessForm } from "./access-form";
import { DemoFilm } from "./demo-film";
import { kit } from "./landing-kit";
import { SourceLogo, type SourceLogoName } from "./source-logos";

// StyleX reads a media query only from the file that uses it.
const SM = "@media (min-width: 40rem)";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

const settle = stylex.keyframes({ from: { opacity: 0, translate: "0 28px", filter: "blur(10px)" } });

const styles = stylex.create({
  hero: { position: "relative", isolation: "isolate" },
  planes: {
    position: "absolute",
    insetInline: 0,
    top: 0,
    zIndex: -1,
    height: "62rem",
    overflowX: "clip",
    pointerEvents: "none",
  },
  green: {
    top: { default: "26rem", [SM]: "6rem" },
    left: { default: "-9rem", [SM]: "-7rem" },
    width: { default: "12rem", [SM]: "16rem" },
    height: { default: "20rem", [SM]: "34rem" },
    rotate: "-12deg",
  },
  blue: {
    top: "-4rem",
    right: "-5rem",
    width: { default: "11rem", [SM]: "18rem" },
    height: { default: "16rem", [SM]: "26rem" },
    rotate: "18deg",
  },
  coral: {
    top: { default: "30rem", [SM]: "14rem" },
    right: "-9rem",
    width: { default: "13rem", [SM]: "20rem" },
    height: { default: "20rem", [SM]: "36rem" },
    rotate: "8deg",
  },
  top: {
    maxWidth: "72rem",
    marginInline: "auto",
    paddingTop: { default: "3rem", [SM]: "2.5rem" },
    paddingInline: { default: "1.25rem", [SM]: "2rem" },
    textAlign: "center",
  },
  // Each part of the first screen settles into place, one after the other.
  settles: {
    animationName: settle,
    animationDuration: "0.9s",
    animationTimingFunction: EASE,
    animationFillMode: "both",
  },
  second: { animationDelay: "80ms" },
  third: { animationDelay: "160ms" },
  fourth: { animationDelay: "240ms" },
  last: { animationDuration: "1.1s", animationDelay: "360ms" },
  mark: {
    display: "block",
    width: { default: "3.5rem", [SM]: "4rem" },
    height: { default: "3.5rem", [SM]: "4rem" },
    marginInline: "auto",
    filter: `drop-shadow(0 18px 24px color-mix(in oklab, ${color.overlap} 35%, transparent))`,
  },
  title: {
    maxWidth: "16ch",
    margin: "1.5rem auto 0",
    fontFamily: font.display,
    fontSize: { default: "3rem", [SM]: "5.25rem" },
    fontWeight: 400,
    lineHeight: 1,
    letterSpacing: "-0.035em",
    textWrap: "balance",
  },
  body: {
    maxWidth: "66ch",
    margin: "1.5rem auto 0",
    color: color.muted,
    fontSize: { default: "1.125rem", [SM]: "1.25rem" },
    lineHeight: 1.625,
    textWrap: "pretty",
  },
  access: { marginTop: "1.75rem", scrollMarginTop: "7rem" },
  under: { margin: "0.5rem 0 0", color: color.muted, fontSize: "0.8125rem" },
  actions: { justifyContent: "center", marginTop: "2rem" },
  film: {
    maxWidth: "72rem",
    marginTop: "2.25rem",
    marginInline: "auto",
    paddingInline: { default: "0.75rem", [SM]: "2rem" },
  },
  works: { marginTop: "2.5rem", paddingInline: "0.5rem" },
  label: { margin: 0, color: color.muted, fontSize: "0.8125rem", fontWeight: 500, textAlign: "center" },
  again: { marginTop: "2rem" },
  list: {
    display: "grid",
    gridTemplateColumns: { default: "minmax(0, 1fr)", [SM]: "repeat(2, minmax(0, 1fr))" },
    gap: "0.75rem",
    maxWidth: "40rem",
    margin: "1rem auto 0",
    padding: 0,
    listStyle: "none",
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: "0.875rem",
    padding: "0.875rem 1rem",
    borderRadius: "1rem",
  },
  logo: { flexShrink: 0, width: "1.75rem", height: "1.75rem" },
  itemText: { minWidth: 0, textAlign: "left" },
  name: { display: "block", fontSize: "0.9375rem", fontWeight: 500 },
  detail: { display: "block", color: color.muted, fontSize: "0.8125rem", lineHeight: 1.375 },
  more: { margin: "1rem 0 0", fontSize: "0.8125rem", textAlign: "center" },
  strong: { fontWeight: 500 },
  extension: {
    maxWidth: "66ch",
    margin: "1.25rem auto 0",
    color: color.muted,
    fontSize: "0.9375rem",
    lineHeight: 1.625,
    textAlign: "center",
    textWrap: "pretty",
  },
  note: {
    margin: "0.5rem 0 0",
    color: color.faint,
    fontSize: "0.75rem",
    lineHeight: 1.3333,
    textAlign: "center",
  },
});

const logoTones = stylex.create({
  coral: { color: color.glassCoral },
  blue: { color: color.glassBlue },
  ink: { color: color.ink },
});

/** The first screen: what Innkeep is, the one action, the film, and what it works with. */
export function LandingHero() {
  const { m } = useI18n("marketing");
  const t = m.marketing;

  return (
    <section {...stylex.props(styles.hero)}>
      {/* Glass on three depth planes. The nearest moves most as the page scrolls. */}
      <div aria-hidden {...stylex.props(styles.planes)}>
        <Glass tint="green" plane="page" drift={-160} xstyle={styles.green} />
        <Glass tint="blue" plane="page" drift={-120} xstyle={styles.blue} />
        <Glass tint="coral" plane="page" drift={-200} xstyle={styles.coral} />
      </div>

      <div {...stylex.props(styles.top)}>
        <LogoMark tone="color" xstyle={[styles.mark, styles.settles]} />
        <h1 {...stylex.props(styles.title, styles.settles, styles.second)}>{t.hero.title}</h1>
        <p {...stylex.props(styles.body, styles.settles, styles.third)}>{t.hero.body}</p>
        {takesAccessRequests ? (
          <div id="access" {...stylex.props(styles.access, styles.settles, styles.fourth)}>
            <AccessForm />
            <p {...stylex.props(styles.under)}>
              <Link to="/" hash="ways" {...stylex.props(kit.link)}>
                {t.hero.selfHosted}
              </Link>
              {hasPublicDemo && (
                <>
                  {" · "}
                  <Link to="/overview" {...stylex.props(kit.link)}>
                    {m.demo.landing}
                  </Link>
                </>
              )}
            </p>
          </div>
        ) : (
          <div {...stylex.props(kit.actions, styles.actions, styles.settles, styles.fourth)}>
            <Link to="/overview" {...stylex.props(pillStyle("primary", "lg"))}>
              {t.hero.dashboard}
            </Link>
            <Link to="/" hash="demo" {...stylex.props(pillStyle("secondary", "lg"))}>
              {t.hero.watch}
            </Link>
          </div>
        )}
      </div>

      <div {...stylex.props(styles.film, styles.settles, styles.last)}>
        <DemoFilm />
        <div {...stylex.props(styles.works)}>
          <h2 {...stylex.props(styles.label)}>{t.works.label}</h2>
          <ul {...stylex.props(styles.list)}>
            <WorksWith name="airbnb" label={m.common.sources.airbnb} detail={t.works.airbnb} tone="coral" />
            <WorksWith name="booking" label={m.common.sources.booking} detail={t.works.booking} tone="blue" />
            <WorksWith name="chrome" label="Google Chrome" detail={t.works.chrome} tone="ink" />
            <WorksWith name="safari" label="Safari" detail={t.works.safari} tone="ink" />
          </ul>
          <h2 {...stylex.props(styles.label, styles.again)}>{t.works.ai}</h2>
          <ul {...stylex.props(styles.list)}>
            <WorksWith name="claude" label="Claude" detail={t.works.claude} tone="ink" />
            <WorksWith name="chatgpt" label="ChatGPT" detail={t.works.chatgpt} tone="ink" />
          </ul>
          <p {...stylex.props(styles.more)}>
            <Link to="/ai" {...stylex.props(kit.link, styles.strong)}>
              {t.features.keyboard.more}
            </Link>
          </p>
          <p {...stylex.props(styles.extension)}>{t.hero.extension}</p>
          <p {...stylex.props(styles.note)}>{t.works.note}</p>
        </div>
      </div>
    </section>
  );
}

function WorksWith({
  name,
  label,
  detail,
  tone,
}: {
  name: SourceLogoName;
  label: string;
  detail: string;
  tone: keyof typeof logoTones;
}) {
  return (
    <li {...stylex.props(kit.panel, styles.item)}>
      <SourceLogo name={name} xstyle={[styles.logo, logoTones[tone]]} />
      <span {...stylex.props(styles.itemText)}>
        <span {...stylex.props(styles.name)}>{label}</span>
        <span {...stylex.props(styles.detail)}>{detail}</span>
      </span>
    </li>
  );
}
