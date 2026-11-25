import * as stylex from "@stylexjs/stylex";
import { createFileRoute } from "@tanstack/react-router";
import { Display, Glass, GlassField, Panel } from "../brand/glass";
import { Logo } from "../brand/logo";
import { useI18n } from "../i18n";
import { LanguageSwitch, ThemeSwitch } from "../shell/preferences";
import { color, radius, shadow, text } from "../tokens.stylex";
import { CopyButton } from "../ui/actions";
import { Button } from "../ui/button";
import { Field, Input, Select, Textarea } from "../ui/form";
import { Modal } from "../ui/modal";
import { Badge, Card, Kbd, Notice, SectionTitle, SourceBadge } from "../ui/primitives";
import { figureStyle, type SlabTone, slabStyle, washStyle } from "../ui/slab";

/**
 * The workbench: every piece of the design system on one page, so a change
 * to a token or a primitive can be looked at in one place, on a phone and in
 * the dark. The dashboard and the public pages are one world, so there is
 * one of each piece. It reads no data and is linked from nowhere.
 */
export const Route = createFileRoute("/kit")({ component: Kit });

const WIDE = "@media (min-width: 60rem)";

const styles = stylex.create({
  page: {
    display: "grid",
    gridTemplateColumns: { default: "minmax(0, 1fr)", [WIDE]: "minmax(0, 1fr) minmax(0, 1fr)" },
    alignItems: "start",
    gap: "2rem",
    maxWidth: "80rem",
    marginInline: "auto",
    padding: { default: "1.5rem 1rem 4rem", [WIDE]: "2.5rem 2rem 5rem" },
  },
  half: { display: "flex", flexDirection: "column", gap: "1.5rem", minWidth: 0 },
  row: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" },
  switches: { display: "flex", flexDirection: "column", gap: "0.375rem", maxWidth: "14rem" },
  form: { display: "grid", gap: "0.75rem", padding: "1.25rem" },
  swatches: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(5.5rem, 1fr))", gap: "0.5rem" },
  swatch: {
    height: "3rem",
    borderRadius: radius.slab,
    boxShadow: `inset 0 0 0 1px ${color.line}`,
  },
  name: { margin: "0.25rem 0 0", color: color.muted, fontSize: text.xs },
  // Bookings on a calendar row.
  slabs: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(8.5rem, 1fr))", gap: "0.5rem" },
  slab: {
    display: "flex",
    alignItems: "center",
    height: "2.25rem",
    paddingInline: "0.75rem",
    fontSize: text.sm,
    fontWeight: 500,
  },
  wash: { padding: "0.75rem", borderRadius: radius.slab, fontSize: text.sm, fontWeight: 500 },
  figures: { display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "1.5rem", padding: "1.25rem" },
  figureLarge: { fontSize: "3rem" },
  figureSmall: { fontSize: "1.5rem" },
  shadows: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "1rem" },
  surface: {
    display: "flex",
    alignItems: "flex-end",
    height: "5.5rem",
    padding: "0.75rem",
    borderRadius: radius.lg,
    backgroundColor: color.panel,
    color: color.muted,
    fontSize: text.xs,
  },
  card: { boxShadow: shadow.card },
  panelShadow: { boxShadow: shadow.panel },
  pop: { boxShadow: shadow.pop },
  stage: { height: "20rem", borderRadius: "1.75rem" },
  arch: { top: "2rem", left: "12%", width: "9rem", height: "15rem" },
  archTwo: { top: "4rem", left: "calc(12% + 5.5rem)", width: "9rem", height: "15rem" },
  pill: { right: "8%", bottom: "2rem", width: "8rem", height: "3rem" },
  tile: { top: "1.5rem", right: "10%", width: "4.5rem", height: "4.5rem" },
  field: { borderRadius: "1.75rem" },
  panel: { position: "relative", margin: "1.5rem", padding: "1.25rem", borderRadius: radius.lg },
  headline: { margin: 0, fontSize: "2rem", lineHeight: 1.1, letterSpacing: "-0.03em" },
});

const swatch = stylex.create({
  bg: { backgroundColor: color.bg },
  subtle: { backgroundColor: color.subtle },
  sunken: { backgroundColor: color.sunken },
  panel: { backgroundColor: color.panel },
  line: { backgroundColor: color.line },
  lineStrong: { backgroundColor: color.lineStrong },
  faint: { backgroundColor: color.faint },
  muted: { backgroundColor: color.muted },
  ink: { backgroundColor: color.ink },
  airbnb: { backgroundColor: color.airbnb },
  booking: { backgroundColor: color.booking },
  direct: { backgroundColor: color.direct },
  block: { backgroundColor: color.block },
  clash: { backgroundColor: color.clash },
  clashBg: { backgroundColor: color.clashBg },
  good: { backgroundColor: color.good },
  warn: { backgroundColor: color.warn },
  warnBg: { backgroundColor: color.warnBg },
  critical: { backgroundColor: color.critical },
  criticalBg: { backgroundColor: color.criticalBg },
});

const SWATCHES = Object.keys(swatch) as (keyof typeof swatch)[];
const TONES = ["airbnb", "booking", "direct", "block", "clash"] as const satisfies readonly SlabTone[];

function Kit() {
  const { m } = useI18n();
  // A tone that is not a source is named as the code names it.
  const toneName = (tone: SlabTone) => (tone === "block" || tone === "clash" ? tone : m.common.sources[tone]);
  return (
    <div {...stylex.props(styles.page)}>
      <title>Innkeep</title>
      <div {...stylex.props(styles.half)}>
        <Pieces />
      </div>
      <div {...stylex.props(styles.half)}>
        <div {...stylex.props(styles.slabs)}>
          {TONES.map((tone) => (
            <div key={tone} {...stylex.props(slabStyle(tone), styles.slab)}>
              {toneName(tone)}
            </div>
          ))}
        </div>
        <div {...stylex.props(styles.slabs)}>
          {TONES.map((tone) => (
            <div key={tone} {...stylex.props(washStyle(tone), styles.wash)}>
              {toneName(tone)}
            </div>
          ))}
        </div>
        <Card xstyle={styles.figures}>
          <span {...stylex.props(figureStyle, styles.figureLarge)}>1 871 €</span>
          <span {...stylex.props(figureStyle, styles.figureSmall)}>53 %</span>
        </Card>
        <div {...stylex.props(styles.shadows)}>
          <div {...stylex.props(styles.surface, styles.card)}>card</div>
          <div {...stylex.props(styles.surface, styles.panelShadow)}>panel</div>
          <div {...stylex.props(styles.surface, styles.pop)}>pop</div>
        </div>
        <GlassField tint="blue" xstyle={styles.stage}>
          <Glass tint="coral" xstyle={styles.arch} />
          <Glass tint="blue" xstyle={styles.archTwo} />
          <Glass tint="green" shape="pill" xstyle={styles.pill} />
          <Glass tint="overlap" shape="tile" opacity={0.7} xstyle={styles.tile} />
        </GlassField>
        <GlassField tint="coral" xstyle={styles.field}>
          <Panel xstyle={styles.panel}>
            <p {...stylex.props(styles.headline)}>
              <Display>Innkeep</Display>
            </p>
          </Panel>
        </GlassField>
      </div>
    </div>
  );
}

function Pieces() {
  const { m } = useI18n();
  const c = m.common;
  return (
    <>
      <div {...stylex.props(styles.row)}>
        <Logo tone="color" />
        <Logo />
      </div>
      <div {...stylex.props(styles.switches)}>
        <ThemeSwitch withLabels />
        <LanguageSwitch withLabels />
      </div>
      <div {...stylex.props(styles.swatches)}>
        {SWATCHES.map((name) => (
          <div key={name}>
            <div {...stylex.props(styles.swatch, swatch[name])} />
            <p {...stylex.props(styles.name)}>{name}</p>
          </div>
        ))}
      </div>
      <div {...stylex.props(styles.row)}>
        <Button variant="primary">{c.actions.copy}</Button>
        <Button>{c.actions.later}</Button>
        <Button variant="ghost">{c.actions.close}</Button>
        <Button variant="danger">{c.sample.remove}</Button>
        <Button disabled>{c.actions.copied}</Button>
        <Button size="sm">{c.actions.copy}</Button>
        <Button size="lg" variant="primary">
          {c.actions.copy}
        </Button>
        <CopyButton value="Innkeep" />
      </div>
      <div {...stylex.props(styles.row)}>
        <Badge>{c.preferences.system}</Badge>
        <Badge tone="good">{c.actions.copied}</Badge>
        <Badge tone="warn">{c.actions.later}</Badge>
        <Badge tone="critical">{c.nav.needAttention}</Badge>
        <Badge tone="clash">clash</Badge>
        <SourceBadge source="airbnb" />
        <SourceBadge source="booking" />
        <SourceBadge source="direct" />
        <Kbd>⌘K</Kbd>
        <Kbd>G</Kbd>
      </div>
      <Notice tone="warn">
        <strong>{c.sample.title}</strong> {c.sample.body}
      </Notice>
      <Notice tone="critical">{m.demo.refused}</Notice>
      <Card>
        <form {...stylex.props(styles.form)} onSubmit={(event) => event.preventDefault()}>
          <SectionTitle>{c.preferences.language}</SectionTitle>
          <Field label={c.command.label} htmlFor={`kit-text`} hint={c.command.empty}>
            <Input id={`kit-text`} placeholder={c.command.placeholder} />
          </Field>
          <Field label={c.preferences.theme} htmlFor={`kit-select`}>
            <Select id={`kit-select`}>
              <option>{c.preferences.system}</option>
              <option>{c.preferences.light}</option>
              <option>{c.preferences.dark}</option>
            </Select>
          </Field>
          <Field label={c.sample.title} htmlFor={`kit-area`}>
            <Textarea id={`kit-area`} rows={3} defaultValue={c.sample.body} />
          </Field>
          <Field label={c.loading} htmlFor={`kit-fixed`}>
            <Input id={`kit-fixed`} readOnly value={c.loading} />
          </Field>
        </form>
      </Card>
      <div {...stylex.props(styles.row)}>
        <Modal label={c.command.open} title={c.command.label} description={c.command.placeholder}>
          <Field label={c.command.label} htmlFor={`kit-modal`}>
            <Input id={`kit-modal`} />
          </Field>
        </Modal>
      </div>
    </>
  );
}
