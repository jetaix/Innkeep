import * as stylex from "@stylexjs/stylex";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { type ReactNode, useState } from "react";
import { extensionQuery, sessionQuery } from "../../../api/queries";
import {
  Aside,
  ChromeSteps,
  Copyable,
  Credentials,
  DetailsRefresh,
  Download,
  Mono,
  RunButtons,
  Step,
  Steps,
  Strong,
  useInnkeepOrigin,
} from "../../../features/extension/guide-parts";
import { loadMessages, useI18n } from "../../../i18n";
import { color, radius, text } from "../../../tokens.stylex";
import { Badge, Notice, PageHeader } from "../../../ui/primitives";

/** How to put the browser extension in a browser and connect it. The host's own: the demo has none to set up. */
export const Route = createFileRoute("/_app/extension/")({
  beforeLoad: async ({ context: { queryClient } }) => {
    const session = await queryClient.ensureQueryData(sessionQuery);
    if (!session.signedIn) throw redirect({ to: "/overview" });
  },
  loader: ({ context: { queryClient } }) => {
    void loadMessages("extension", "reservations");
    return queryClient.ensureQueryData(extensionQuery);
  },
  component: ExtensionPage,
});

/*
 * The reading register: ground, ink and hairlines, no panels. Each guide is
 * a part of the page under a strong hairline, its steps divided by fine ones.
 */
const styles = stylex.create({
  page: { display: "flex", flexDirection: "column", gap: "2.5rem", maxWidth: "48rem" },
  connected: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: "1rem",
    rowGap: "0.75rem",
  },
  line: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem", margin: 0 },
  detail: { color: color.muted, fontSize: text.base },
  notice: { padding: "0.75rem 0.875rem", lineHeight: 1.625 },
  block: { display: "block", marginTop: "0.5rem" },
  part: {
    paddingTop: "1.25rem",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.lineStrong,
  },
  title: { margin: 0, fontSize: text.lg, fontWeight: 600, letterSpacing: "-0.01em" },
  subtitle: { margin: "0.25rem 0 0", color: color.muted, fontSize: text.base, lineHeight: 1.6 },
  body: { marginTop: "0.5rem" },
  // A guide for another browser: its heading is the control that opens it.
  folded: {
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.lineStrong,
  },
  summary: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.75rem",
    paddingBlock: "1.25rem",
    borderRadius: radius.md,
    cursor: "pointer",
    listStyle: "none",
    "::-webkit-details-marker": { display: "none" },
  },
  chevron: { flexShrink: 0, color: color.muted },
  open: { rotate: "180deg" },
  buttons: { display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" },
  bullets: {
    display: "flex",
    flexDirection: "column",
    gap: "0.375rem",
    maxWidth: "70ch",
    margin: "0.75rem 0 0",
    paddingInlineStart: "1.25rem",
    color: color.muted,
    fontSize: text.base,
    lineHeight: 1.625,
    listStyleType: "disc",
  },
  terms: {
    maxWidth: "70ch",
    margin: "0.75rem 0 0",
    color: color.muted,
    fontSize: text.sm,
    lineHeight: 1.625,
  },
});

function ExtensionPage() {
  const t = useI18n("extension").m.extension;
  return (
    <>
      <PageHeader title={t.title} description={t.description} />
      <Guide />
    </>
  );
}

function Part({
  id,
  title,
  subtitle,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} {...stylex.props(styles.part)}>
      <h2 id={id} {...stylex.props(styles.title)}>
        {title}
      </h2>
      {subtitle && <p {...stylex.props(styles.subtitle)}>{subtitle}</p>}
      <div {...stylex.props(styles.body)}>{children}</div>
    </section>
  );
}

/** A guide for another browser, closed until the host asks for it. */
function FoldedGuide({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <details onToggle={(event) => setOpen(event.currentTarget.open)} {...stylex.props(styles.folded)}>
      <summary {...stylex.props(styles.summary)}>
        <div>
          <h2 {...stylex.props(styles.title)}>{title}</h2>
          <p {...stylex.props(styles.subtitle)}>{subtitle}</p>
        </div>
        <ChevronDown aria-hidden size={16} {...stylex.props(styles.chevron, open && styles.open)} />
      </summary>
      <Steps>{children}</Steps>
    </details>
  );
}

function Guide() {
  const { m, fmt } = useI18n("extension");
  const t = m.extension;
  const s = t.setup;
  const { status, required, hosted, paths } = useSuspenseQuery(extensionQuery).data;
  const origin = useInnkeepOrigin();
  // Innkeep runs from its folder on this computer: the guides that build from that folder apply.
  const local = !hosted && paths;

  return (
    <div {...stylex.props(styles.page)}>
      {status.state === "ready" && (
        <div {...stylex.props(styles.connected)}>
          <p {...stylex.props(styles.line)}>
            <Badge tone="good">{t.connected.badge}</Badge>
            <span {...stylex.props(styles.detail)}>
              {t.connected.detail(status.version, fmt.timeAgo(status.at))}
            </span>
          </p>
          <DetailsRefresh />
        </div>
      )}
      {status.state === "outdated" && (
        <Notice tone="warn" xstyle={styles.notice}>
          {t.outdated.before(status.version, required)} <Mono>chrome://extensions</Mono>
          {t.outdated.after}
          <span {...stylex.props(styles.block)}>{s.update}</span>
          <Download />
        </Notice>
      )}

      <Part id="setup-heading" title={s.title} subtitle={s.subtitle}>
        <Steps>
          <ChromeSteps />
          <Step title={s.read.title}>
            {s.read.body}
            <span {...stylex.props(styles.buttons)}>
              <RunButtons />
            </span>
            <Aside>{s.read.manual}</Aside>
            <span {...stylex.props(styles.block)}>
              <DetailsRefresh />
            </span>
          </Step>
        </Steps>
      </Part>

      {local && (
        <FoldedGuide title={t.safari.title} subtitle={t.safari.subtitle}>
          <Step title={t.safari.xcode.title}>{t.safari.xcode.body}</Step>
          <Step title={t.safari.build.title}>
            {t.safari.build.body}
            <Copyable value={`cd "${local.root}" && npm run build:safari`} label={t.safari.copyCommand} />
          </Step>
          <Step title={t.safari.allow.title}>{t.safari.allow.body}</Step>
          <Step title={t.safari.open.title}>
            {t.safari.open.body}
            <Copyable value={local.safariBuild} label={s.copyPath} />
          </Step>
          <Step title={t.safari.enable.title}>{t.safari.enable.body}</Step>
          <Step title={t.safari.sites.title}>{t.safari.sites.body}</Step>
          <Step title={s.connect.title}>
            {s.connect.before} <Strong>{s.connect.settings}</Strong> {s.connect.middle}{" "}
            <Strong>{s.connect.strong}</Strong>
            {t.safari.connectAfter}
            <Credentials />
          </Step>
          <Step title={s.read.title}>
            {s.read.body}
            <Aside>{t.safari.later}</Aside>
          </Step>
        </FoldedGuide>
      )}

      {local && (
        <FoldedGuide title={t.ios.title} subtitle={t.ios.subtitle}>
          <Step title={t.ios.need.title}>
            {t.ios.need.body}
            <Aside>{t.ios.limits}</Aside>
          </Step>
          <Step title={t.ios.project.title}>
            {t.ios.project.body}
            <Copyable value={local.safariProject} label={s.copyPath} />
          </Step>
          <Step title={t.ios.sign.title}>
            {t.ios.sign.body}
            <Aside>{t.ios.sign.taken}</Aside>
          </Step>
          <Step title={t.ios.phone.title}>{t.ios.phone.body}</Step>
          <Step title={t.ios.run.title}>{t.ios.run.body}</Step>
          <Step title={t.ios.enable.title}>{t.ios.enable.body}</Step>
          <Step title={t.ios.sites.title}>{t.ios.sites.body}</Step>
          <Step title={t.ios.connect.title}>
            {t.ios.connect.body}
            {/* A phone cannot reach an address that only this computer answers to. */}
            {/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|$)/.test(origin) ? (
              <Aside ink>{t.ios.connect.local}</Aside>
            ) : (
              <Credentials />
            )}
          </Step>
          <Step title={t.ios.read.title}>{t.ios.read.body}</Step>
        </FoldedGuide>
      )}

      <Part id="use-heading" title={t.use.title} subtitle={t.use.subtitle}>
        <Steps>
          {t.use.steps.map((step) => (
            <Step key={step.title} title={step.title}>
              {step.body}
            </Step>
          ))}
        </Steps>
      </Part>

      <Part id="after-heading" title={t.after.title}>
        <ul {...stylex.props(styles.bullets)}>
          {t.after.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Part>

      <Part id="reads-heading" title={t.reads.title}>
        <ul {...stylex.props(styles.bullets)}>
          {t.reads.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p {...stylex.props(styles.terms)}>{t.reads.terms}</p>
      </Part>
    </div>
  );
}
