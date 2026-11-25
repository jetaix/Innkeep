import * as stylex from "@stylexjs/stylex";
import { createFileRoute } from "@tanstack/react-router";
import { Brand, Display, Glass, GlassField, Panel } from "../brand/glass";
import { Logo } from "../brand/logo";
import { useI18n } from "../i18n";
import { LanguageSwitch, ThemeSwitch } from "../shell/preferences";
import { color, radius, text } from "../tokens.stylex";
import { CopyButton } from "../ui/actions";
import { Button } from "../ui/button";
import { Field, Input, Select, Textarea } from "../ui/form";
import { Modal } from "../ui/modal";
import { Badge, Card, Kbd, Notice, SectionTitle, SourceBadge } from "../ui/primitives";

/**
 * The workbench: every piece of the design system on one page, in the
 * dashboard's colours and in the public pages', so a change to a token or a
 * primitive can be looked at in one place, on a phone and in the dark.
 * It reads no data and is linked from nowhere.
 */
export const Route = createFileRoute("/kit")({ component: Kit });

const WIDE = "@media (min-width: 48rem)";

const styles = stylex.create({
  page: { display: "grid", gridTemplateColumns: { default: "1fr", [WIDE]: "1fr 1fr" } },
  half: { display: "flex", flexDirection: "column", gap: "1.25rem", minWidth: 0, padding: "1.5rem 1rem" },
  row: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" },
  switches: { display: "flex", flexDirection: "column", gap: "0.375rem", maxWidth: "14rem" },
  form: { display: "grid", gap: "0.75rem", padding: "1rem" },
  swatches: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(5.5rem, 1fr))", gap: "0.5rem" },
  swatch: {
    height: "3rem",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: color.line,
    borderRadius: radius.md,
  },
  name: { margin: "0.25rem 0 0", color: color.muted, fontSize: text.xs },
  stage: { height: "20rem", borderRadius: radius.xl },
  arch: { top: "2rem", left: "12%", width: "9rem", height: "15rem" },
  archTwo: { top: "4rem", left: "calc(12% + 5.5rem)", width: "9rem", height: "15rem" },
  pill: { right: "8%", bottom: "2rem", width: "8rem", height: "3rem" },
  tile: { top: "1.5rem", right: "10%", width: "4.5rem", height: "4.5rem" },
  panel: { position: "relative", margin: "1.5rem", padding: "1rem", borderRadius: radius.xl },
  headline: { margin: 0, fontSize: "2rem", lineHeight: 1.1, letterSpacing: "-0.03em" },
});

const swatch = stylex.create({
  bg: { backgroundColor: color.bg },
  subtle: { backgroundColor: color.subtle },
  sunken: { backgroundColor: color.sunken },
  line: { backgroundColor: color.line },
  lineStrong: { backgroundColor: color.lineStrong },
  faint: { backgroundColor: color.faint },
  muted: { backgroundColor: color.muted },
  ink: { backgroundColor: color.ink },
  airbnb: { backgroundColor: color.airbnb },
  booking: { backgroundColor: color.booking },
  direct: { backgroundColor: color.direct },
  block: { backgroundColor: color.block },
  good: { backgroundColor: color.good },
  warn: { backgroundColor: color.warn },
  critical: { backgroundColor: color.critical },
  overlap: { backgroundColor: color.overlap },
});

const SWATCHES = Object.keys(swatch) as (keyof typeof swatch)[];

function Kit() {
  return (
    <div {...stylex.props(styles.page)}>
      <title>Innkeep</title>
      <div {...stylex.props(styles.half)}>
        <Pieces tone="ink" />
      </div>
      <Brand xstyle={styles.half}>
        <Pieces tone="color" />
        <GlassField tint="blue" xstyle={styles.stage}>
          <Glass tint="coral" xstyle={styles.arch} />
          <Glass tint="blue" xstyle={styles.archTwo} />
          <Glass tint="green" shape="pill" xstyle={styles.pill} />
          <Glass tint="overlap" shape="tile" opacity={0.7} xstyle={styles.tile} />
        </GlassField>
        <GlassField tint="coral">
          <Panel xstyle={styles.panel}>
            <p {...stylex.props(styles.headline)}>
              <Display>Innkeep</Display>
            </p>
          </Panel>
        </GlassField>
      </Brand>
    </div>
  );
}

function Pieces({ tone }: { tone: "ink" | "color" }) {
  const { m } = useI18n();
  const c = m.common;
  return (
    <>
      <Logo tone={tone} />
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
          <Field label={c.command.label} htmlFor={`${tone}-text`} hint={c.command.empty}>
            <Input id={`${tone}-text`} placeholder={c.command.placeholder} />
          </Field>
          <Field label={c.preferences.theme} htmlFor={`${tone}-select`}>
            <Select id={`${tone}-select`}>
              <option>{c.preferences.system}</option>
              <option>{c.preferences.light}</option>
              <option>{c.preferences.dark}</option>
            </Select>
          </Field>
          <Field label={c.sample.title} htmlFor={`${tone}-area`}>
            <Textarea id={`${tone}-area`} rows={3} defaultValue={c.sample.body} />
          </Field>
          <Field label={c.loading} htmlFor={`${tone}-fixed`}>
            <Input id={`${tone}-fixed`} readOnly value={c.loading} />
          </Field>
        </form>
      </Card>
      <div {...stylex.props(styles.row)}>
        <Modal label={c.command.open} title={c.command.label} description={c.command.placeholder}>
          <Field label={c.command.label} htmlFor={`${tone}-modal`}>
            <Input id={`${tone}-modal`} />
          </Field>
        </Modal>
      </div>
    </>
  );
}
