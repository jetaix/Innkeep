import * as stylex from "@stylexjs/stylex";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Download as DownloadIcon, ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { extensionQuery } from "../../api/queries";
import { useI18n } from "../../i18n";
import { color, font, radius, shadow, text } from "../../tokens.stylex";
import { CopyButton } from "../../ui/actions";
import { buttonStyle } from "../../ui/button";
import { Hidden } from "../../ui/primitives";

/** The pieces of the extension's setup guide, shared by its own page and by the "Add a property" guide. */

const WIDE = "@media (min-width: 48rem)";

const styles = stylex.create({
  // A numbered list in the reading register: hairlines between steps, no panel.
  steps: { margin: 0, padding: 0, listStyle: "none", counterReset: "step" },
  step: {
    display: "flex",
    gap: "0.875rem",
    paddingBlock: "1.125rem",
    borderTopWidth: { default: 1, ":first-child": 0 },
    borderTopStyle: "solid",
    borderTopColor: color.line,
    counterIncrement: "step",
  },
  number: {
    display: "flex",
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    width: "1.5rem",
    height: "1.5rem",
    borderRadius: radius.full,
    backgroundColor: color.sunken,
    color: color.ink,
    fontSize: text.sm,
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums",
    "::before": { content: "counter(step)" },
  },
  stepText: { flexGrow: 1, flexBasis: 0, minWidth: 0 },
  stepTitle: { margin: 0, fontSize: text.md, fontWeight: 500, lineHeight: "1.5rem" },
  stepBody: {
    maxWidth: "65ch",
    marginTop: "0.25rem",
    color: color.muted,
    fontSize: text.base,
    lineHeight: 1.625,
  },
  strong: { color: color.ink, fontWeight: 500 },
  mono: { color: color.ink, fontFamily: font.mono, fontSize: text.sm },
  copyable: { display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" },
  // The one white surface of a step: a thing to copy as it is.
  code: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 0,
    padding: "0.4375rem 0.625rem",
    overflow: "hidden",
    borderRadius: radius.field,
    backgroundColor: color.panel,
    boxShadow: shadow.card,
    color: color.ink,
    fontFamily: font.mono,
    fontSize: text.sm,
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  small: { display: "block", marginTop: "0.75rem", fontSize: text.sm },
  block: { display: "block", marginTop: "0.5rem" },
  row: { display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: "0.75rem", rowGap: "0.375rem" },
  hint: { color: color.muted, fontSize: text.sm },
  // A run needs a desktop browser: a phone is told so instead.
  desktop: { display: { default: "none", [WIDE]: "flex" } },
  phone: { display: { default: "block", [WIDE]: "none" }, color: color.muted, fontSize: text.base },
});

/** The numbered list the steps stand in. */
export function Steps({ children }: { children: ReactNode }) {
  return <ol {...stylex.props(styles.steps)}>{children}</ol>;
}

export function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li {...stylex.props(styles.step)}>
      <span aria-hidden {...stylex.props(styles.number)} />
      <div {...stylex.props(styles.stepText)}>
        <h3 {...stylex.props(styles.stepTitle)}>{title}</h3>
        <div {...stylex.props(styles.stepBody)}>{children}</div>
      </div>
    </li>
  );
}

/** A smaller line under a step's text. */
export function Aside({ children, ink }: { children: ReactNode; ink?: boolean }) {
  return <span {...stylex.props(styles.small, ink && styles.strong)}>{children}</span>;
}

export function Strong({ children }: { children: ReactNode }) {
  return <strong {...stylex.props(styles.strong)}>{children}</strong>;
}

export function Mono({ children }: { children: ReactNode }) {
  return <code {...stylex.props(styles.mono)}>{children}</code>;
}

export function Copyable({ value, label, secret }: { value: string; label: string; secret?: boolean }) {
  return (
    <span {...stylex.props(styles.copyable)}>
      <code {...stylex.props(styles.code)}>{secret ? "•".repeat(24) : value}</code>
      <CopyButton value={value} label={label} />
    </span>
  );
}

/** The address the host's browser reaches this Innkeep at: what the extension must be given. */
export function useInnkeepOrigin(): string {
  const { origin } = useSuspenseQuery(extensionQuery).data;
  return origin ?? window.location.origin;
}

/** The address and the token to paste in the extension's settings. */
export function Credentials() {
  const s = useI18n("extension").m.extension.setup;
  const { token } = useSuspenseQuery(extensionQuery).data;
  const origin = useInnkeepOrigin();
  return (
    <>
      <Copyable value={origin} label={s.copyAddress} />
      {token ? (
        <Copyable value={token} label={s.copyToken} secret />
      ) : (
        <span {...stylex.props(styles.small)}>{s.connect.tokenMissing}</span>
      )}
    </>
  );
}

/** The steps that put the extension in Chrome and connect it, as items of a numbered list. */
export function ChromeSteps() {
  const { m } = useI18n("extension");
  const s = m.extension.setup;
  const { token, hosted, store, paths } = useSuspenseQuery(extensionQuery).data;
  return (
    <>
      {!token && (
        <Step title={s.switchOn.title}>
          {s.switchOn.before} <Mono>EXTENSION_TOKEN=</Mono> {s.switchOn.middle} <Mono>.env.local</Mono>
          {s.switchOn.after}
        </Step>
      )}
      {store ? (
        <Step title={s.store.title}>
          {s.store.body}
          <span {...stylex.props(styles.block)}>
            <a
              href={store}
              target="_blank"
              rel="noopener"
              {...stylex.props(buttonStyle({ size: "sm", variant: "primary" }))}
            >
              {s.store.button}
              <Hidden> {m.common.actions.newTab}</Hidden>
            </a>
          </span>
        </Step>
      ) : (
        <>
          <Step title={s.openPage.title}>
            {s.openPage.before} <Strong>{s.openPage.strong}</Strong> {s.openPage.after}
            <Copyable value="chrome://extensions" label={s.copyAddress} />
          </Step>
          <Step title={s.load.title}>
            {s.load.before} <Strong>{s.load.strong}</Strong> {hosted ? s.load.afterHosted : s.load.after}
            {!hosted && paths && <Copyable value={paths.extension} label={s.copyPath} />}
            {!hosted && <Aside>{s.load.elsewhere}</Aside>}
            <Download />
          </Step>
        </>
      )}
      <Step title={s.pin.title}>{s.pin.body}</Step>
      <Step title={s.connect.title}>
        {s.connect.before} <Strong>{s.connect.settings}</Strong> {s.connect.middle}{" "}
        <Strong>{s.connect.strong}</Strong>
        {s.connect.after}
        <Credentials />
      </Step>
    </>
  );
}

/** The extension as a ZIP, served beside the app. */
export function Download() {
  const s = useI18n("extension").m.extension.setup;
  const { version } = useSuspenseQuery(extensionQuery).data;
  return (
    <span {...stylex.props(styles.row, styles.block)}>
      <a
        href="/innkeep-extension.zip"
        download={`innkeep-extension-${version}.zip`}
        {...stylex.props(buttonStyle({ size: "sm", variant: "primary" }))}
      >
        <DownloadIcon aria-hidden size={14} />
        {s.download(version)}
      </a>
      <span {...stylex.props(styles.hint)}>{s.downloadHint}</span>
    </span>
  );
}

/**
 * The two buttons that start a run of the extension. Plain links to Innkeep's
 * own start page, which hands over to the extension: the browser must make a
 * real navigation, and not `noreferrer`, since the extension recognises a tab
 * opened from Innkeep by its referrer.
 */
export function RunButtons({ size = "sm", quiet }: { size?: "sm" | "md"; quiet?: boolean }) {
  const { m } = useI18n("extension");
  const t = m.extension.prompt.refresh;
  return (
    <>
      <a
        href="/extension/start?scope=all"
        target="_blank"
        rel="noopener"
        {...stylex.props(buttonStyle({ size, variant: quiet ? "secondary" : "primary" }))}
      >
        {t.everything}
        <Hidden> {m.common.actions.newTab}</Hidden>
      </a>
      <a
        href="/extension/start?scope=reservations"
        target="_blank"
        rel="noopener"
        {...stylex.props(buttonStyle({ size }))}
      >
        {t.reservations}
        <Hidden> {m.common.actions.newTab}</Hidden>
      </a>
    </>
  );
}

/** The run buttons on a computer; on a phone, the line that says a computer is needed. */
export function RunOnComputer({ size }: { size?: "sm" | "md" }) {
  const t = useI18n("extension").m.extension;
  return (
    <>
      <span {...stylex.props(styles.row, styles.desktop)}>
        <RunButtons size={size} />
      </span>
      <span {...stylex.props(styles.phone)}>{t.cta.computer}</span>
    </>
  );
}

/**
 * One-click refresh of guest names, payouts and past stays. Each button opens the host's
 * own reservations page on the platform in a new tab; the Innkeep
 * extension reads it, sends the details here and closes the tab again.
 *
 * Deliberately a plain link, not `noreferrer`: the extension recognises a tab
 * opened from Innkeep by its referrer, and only closes those.
 */
export function DetailsRefresh() {
  const { m } = useI18n("reservations");
  const t = m.reservations.refresh;
  const { links } = useSuspenseQuery(extensionQuery).data;
  if (links.length === 0) return null;
  return (
    <span role="group" aria-label={t.label} {...stylex.props(styles.row)}>
      <span {...stylex.props(styles.hint)}>{t.from}</span>
      {links.map((link) => (
        <a
          key={link.id}
          href={link.href}
          target="_blank"
          rel="noopener"
          title={t.hint}
          {...stylex.props(buttonStyle({ size: "sm" }))}
        >
          {m.common.sources[link.channel]}
          <ExternalLink aria-hidden size={14} />
          <Hidden> {m.common.actions.newTab}</Hidden>
        </a>
      ))}
    </span>
  );
}
