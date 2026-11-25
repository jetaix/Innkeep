import * as stylex from "@stylexjs/stylex";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { useSyncExternalStore } from "react";
import type { DataSource } from "@/features/freshness/sources";
import { freshnessQuery, propertiesQuery } from "../../api/queries";
import { useI18n } from "../../i18n";
import { color, radius, text } from "../../tokens.stylex";
import { Button, buttonStyle } from "../../ui/button";
import { Hidden, SourceDot } from "../../ui/primitives";

const KEY = "innkeep:update-prompt-dismissed";
const listeners = new Set<() => void>();

function dismissed() {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

/** Hides the prompt until the browser tab is closed, once the host says "Later". */
function dismiss() {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    // Private windows may refuse storage; the prompt then simply stays.
  }
  for (const listener of listeners) listener();
}

const WIDE = "@media (min-width: 48rem)";
const PRINT = "@media print";

const styles = stylex.create({
  // The extension runs in a desktop browser, so a phone is not asked to start it.
  prompt: {
    position: "relative",
    display: { default: "none", [WIDE]: "block", [PRINT]: "none" },
    marginTop: "1.25rem",
    marginInline: "1.5rem 2rem",
    padding: "1rem 1.25rem",
    borderRadius: radius.xl,
    backgroundColor: color.sunken,
    fontSize: text.base,
  },
  inner: { maxWidth: "48rem" },
  later: { position: "absolute", top: "0.75rem", right: "0.75rem" },
  title: { margin: 0, paddingInlineEnd: "5rem", fontSize: text.md, fontWeight: 600 },
  body: { margin: "0.125rem 0 0", color: color.muted, lineHeight: 1.625 },
  outdated: { margin: "0.5rem 0 0", color: color.warn },
  inherit: { color: "inherit", textUnderlineOffset: 2 },
  buttons: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem", marginTop: "0.75rem" },
  hint: { fontWeight: 400, opacity: 0.7 },
  mutedHint: { color: color.muted, fontWeight: 400 },
  small: { color: color.muted, fontSize: text.sm },
  what: { margin: "1rem 0 0", color: color.muted, fontSize: text.sm },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "0.375rem",
    margin: "0.375rem 0 0",
    padding: 0,
    listStyle: "none",
  },
  source: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: "0.75rem",
    rowGap: "0.25rem",
  },
  name: { display: "flex", alignItems: "center", gap: "0.375rem", minWidth: "14rem", fontWeight: 500 },
  when: { flexGrow: 1, flexBasis: 0, color: color.muted, fontSize: text.sm },
  all: { margin: "0.75rem 0 0", fontSize: text.sm },
  link: { color: color.ink, textDecorationColor: color.lineStrong, textUnderlineOffset: 2 },
});

/**
 * Asks the host, on opening Innkeep, to bring their data up to date when
 * something they can refresh is more than a day old (or was never read).
 *
 * It names exactly what is old, so the prompt never disagrees with what the
 * host can see, and offers two ways: let the extension go through the pages
 * in one tab, or open the page of one line. It leaves once nothing listed is
 * older than a day.
 *
 * The links are deliberately not `noreferrer`: the extension recognises a tab
 * opened from Innkeep by its referrer, and closes only those.
 */
export function UpdatePrompt() {
  const { m, fmt } = useI18n("extension", "data");
  const t = m.extension.prompt;
  const hidden = useSyncExternalStore(subscribe, dismissed, () => false);
  const { data } = useQuery(freshnessQuery);
  const { data: places } = useQuery(propertiesQuery);
  if (hidden || !data || !places) return null;
  // Without the extension the links would do nothing; the setup button covers that case.
  if (data.extension === "off" || data.extension === "missing") return null;
  const old = data.sources.filter((source) => data.old.includes(source.id));
  if (old.length === 0) return null;
  // "Reservations only" helps only when reservations are among what is old.
  const reservationsOld = old.some((source) => source.kind === "reservations");
  const { properties } = places;

  return (
    <section aria-labelledby="update-heading" {...stylex.props(styles.prompt)}>
      <div {...stylex.props(styles.inner)}>
        <h2 id="update-heading" {...stylex.props(styles.title)}>
          {t.refresh.title}
        </h2>
        <p {...stylex.props(styles.body)}>{t.refresh.body(old.length)}</p>
        {data.extension === "outdated" && (
          <p {...stylex.props(styles.outdated)}>
            {t.outdated.before}{" "}
            <Link to="/extension" {...stylex.props(styles.inherit)}>
              {t.outdated.link}
            </Link>
            {t.outdated.after}
          </p>
        )}
        <div {...stylex.props(styles.buttons)}>
          {/* Plain links to Innkeep's own start page, which hands over to the extension. */}
          <a
            href="/extension/start?scope=all"
            target="_blank"
            rel="noopener"
            {...stylex.props(buttonStyle({ variant: "primary" }))}
          >
            {t.refresh.everything}
            <span {...stylex.props(styles.hint)}>{t.refresh.everythingHint}</span>
            <Hidden> {m.common.actions.newTab}</Hidden>
          </a>
          {reservationsOld && (
            <a
              href="/extension/start?scope=reservations"
              target="_blank"
              rel="noopener"
              {...stylex.props(buttonStyle())}
            >
              {t.refresh.reservations}
              <span {...stylex.props(styles.mutedHint)}>{t.refresh.reservationsHint}</span>
              <Hidden> {m.common.actions.newTab}</Hidden>
            </a>
          )}
          <span {...stylex.props(styles.small)}>{t.refresh.signIn}</span>
        </div>

        <p {...stylex.props(styles.what)}>{t.refresh.what}</p>
        <ul {...stylex.props(styles.list)}>
          {old.map((source) => {
            const platform = source.channel ? m.common.sources[source.channel] : m.data.claude;
            const property =
              properties.length > 1 && source.propertyId
                ? properties.find((entry) => entry.id === source.propertyId)?.name
                : null;
            return (
              <li key={source.id} {...stylex.props(styles.source)}>
                <span {...stylex.props(styles.name)}>
                  {source.channel && <SourceDot source={source.channel} />}
                  {m.data.kinds[source.kind].name}, {platform}
                  {property ? ` (${property})` : ""}
                </span>
                <span {...stylex.props(styles.when)}>
                  {source.at ? t.refresh.lastRead(fmt.timeAgo(source.at)) : t.refresh.neverRead}
                </span>
                <OneSource source={source} platform={platform} />
              </li>
            );
          })}
        </ul>
        <p {...stylex.props(styles.all)}>
          <Link to="/settings" search={{ tab: "data" }} {...stylex.props(styles.link)}>
            {m.data.seeAll}
          </Link>
        </p>
      </div>
      <Button size="sm" variant="ghost" xstyle={styles.later} onClick={dismiss}>
        {m.common.actions.later}
      </Button>
    </section>
  );
}

/** The way to refresh one line by hand, when it has one. */
function OneSource({ source, platform }: { source: DataSource; platform: string }) {
  const { m } = useI18n("extension", "data");
  const { action } = source;
  if (action.type === "open") {
    return (
      <a
        href={action.href}
        target="_blank"
        rel="noopener"
        title={m.data.actions.hint}
        {...stylex.props(buttonStyle({ size: "sm" }))}
      >
        {m.data.actions.open(platform)}
        <ExternalLink aria-hidden size={14} />
        <Hidden> {m.common.actions.newTab}</Hidden>
      </a>
    );
  }
  if (action.type === "go") {
    return action.href === "/pricing" ? (
      <Link to="/pricing" {...stylex.props(buttonStyle({ size: "sm" }))}>
        {m.data.actions.pricing}
      </Link>
    ) : (
      <Link to="/suggestions" hash="claude" {...stylex.props(buttonStyle({ size: "sm" }))}>
        {m.data.actions.assistant}
      </Link>
    );
  }
  // Read only by a full run: the button above is the way.
  return <span {...stylex.props(styles.small)}>{m.extension.prompt.refresh.byRun}</span>;
}
