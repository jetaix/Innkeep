import * as stylex from "@stylexjs/stylex";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import type { ExtensionStatus } from "@/features/extension/status";
import type { DataSource } from "@/features/freshness/sources";
import { syncListing } from "../../api/mutations";
import { freshnessQuery, propertiesQuery } from "../../api/queries";
import { useI18n } from "../../i18n";
import { color, text } from "../../tokens.stylex";
import { SubmitButton } from "../../ui/actions";
import { buttonStyle } from "../../ui/button";
import { Badge, Hidden, SourceDot } from "../../ui/primitives";
import { SyncCta } from "../extension/sync-cta";

const styles = stylex.create({
  section: { display: "flex", flexDirection: "column", gap: "2.5rem" },
  summary: { maxWidth: "44rem" },
  group: { minWidth: 0 },
  groupTitle: { margin: "0 0 0.5rem", fontSize: text.md, fontWeight: 600, letterSpacing: "-0.01em" },
  line: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "0.5rem",
    margin: 0,
    fontWeight: 500,
  },
  how: { margin: "0.375rem 0 0", color: color.muted, fontSize: text.base, lineHeight: 1.625 },
  popup: {
    marginTop: "1rem",
    paddingTop: "1rem",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.line,
    fontSize: text.base,
    lineHeight: 1.625,
  },
  popupTitle: { margin: 0, fontWeight: 500 },
  popupBody: { margin: "0.125rem 0 0", color: color.muted },
  bullets: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    margin: "0.375rem 0 0",
    paddingInlineStart: "1.25rem",
    color: color.muted,
    listStyleType: "disc",
  },
  name: { color: color.ink, fontWeight: 500 },
  buttons: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem", marginTop: "0.75rem" },
  small: { margin: "0.375rem 0 0", color: color.muted, fontSize: text.sm },
  scroll: {
    position: "relative",
    overflowX: "auto",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.lineStrong,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: color.line,
  },
  table: { width: "100%", minWidth: "40rem", borderCollapse: "collapse", textAlign: "start" },
  th: {
    padding: "0.5rem 0.75rem",
    color: color.muted,
    fontSize: text.sm,
    fontWeight: 500,
    textAlign: "start",
  },
  cell: {
    padding: "0.625rem 0.75rem",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.line,
    fontWeight: 400,
    textAlign: "start",
    verticalAlign: "top",
  },
  first: { paddingInlineStart: 0 },
  last: { paddingInlineEnd: 0, textAlign: "end" },
  nowrap: { whiteSpace: "nowrap" },
  when: { color: color.muted, fontVariantNumeric: "tabular-nums" },
  strong: { fontWeight: 500 },
  feeds: { display: "block", color: color.muted, fontSize: text.sm },
  automatic: { display: "block", marginTop: "0.125rem", color: color.muted, fontSize: text.sm },
  progress: { display: "block", marginTop: "0.125rem", color: color.muted, fontSize: text.sm },
  from: { display: "inline-flex", alignItems: "center", gap: "0.375rem" },
  error: {
    display: "block",
    maxWidth: "28ch",
    marginTop: "0.25rem",
    color: color.critical,
    fontSize: text.sm,
  },
  tried: {
    display: "block",
    maxWidth: "30ch",
    marginBottom: "0.375rem",
    color: color.muted,
    fontSize: text.sm,
    lineHeight: 1.625,
    textAlign: "start",
  },
  blocked: {
    display: "inline-block",
    maxWidth: "26ch",
    color: color.muted,
    fontSize: text.sm,
    lineHeight: 1.625,
    textAlign: "start",
  },
  link: { color: color.ink, textDecorationColor: color.lineStrong, textUnderlineOffset: 4 },
  below: { display: "block", marginTop: "0.375rem" },
  limits: { maxWidth: "44rem" },
  rows: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    margin: "0.5rem 0 0",
    paddingInlineStart: "1.25rem",
    color: color.muted,
    fontSize: text.base,
    lineHeight: 1.625,
    listStyleType: "disc",
  },
  why: { maxWidth: "80ch", margin: "0.75rem 0 0", color: color.muted, fontSize: text.sm, lineHeight: 1.625 },
});

type ExtensionState = ExtensionStatus["state"];

/**
 * Where each piece of data comes from, how fresh it is and the one thing to
 * press to refresh it. Shown as a section of the Settings page.
 */
export function DataSection() {
  const { m } = useI18n("data", "extension");
  const t = m.data;
  const { sources, toRefresh, extension } = useSuspenseQuery(freshnessQuery).data;
  const { properties } = useSuspenseQuery(propertiesQuery).data;
  const groups = [
    { key: "account", title: t.account, rows: sources.filter((source) => source.propertyId == null) },
    ...properties.map((property) => ({
      key: String(property.id),
      title: property.name,
      rows: sources.filter((source) => source.propertyId === property.id),
    })),
  ].filter((group) => group.rows.length > 0);

  return (
    <div {...stylex.props(styles.section)}>
      <div {...stylex.props(styles.summary)}>
        <p {...stylex.props(styles.line)}>
          <Badge tone={toRefresh ? "warn" : "good"}>
            {toRefresh ? t.summary.toRefresh(toRefresh) : t.summary.allFresh}
          </Badge>
        </p>
        <p {...stylex.props(styles.how)}>{t.summary.how}</p>
        <div {...stylex.props(styles.popup)}>
          <p {...stylex.props(styles.popupTitle)}>{t.summary.popup.title}</p>
          <p {...stylex.props(styles.popupBody)}>{t.summary.popup.body}</p>
          <ul {...stylex.props(styles.bullets)}>
            {[t.summary.popup.reservations, t.summary.popup.everything].map((action) => (
              <li key={action.name}>
                <strong {...stylex.props(styles.name)}>{action.name}</strong>: {action.text}
              </li>
            ))}
          </ul>
          <div {...stylex.props(styles.buttons)}>
            {/* Not `noreferrer`: the extension recognises a tab opened from Innkeep by its referrer. */}
            <a
              href="/extension/start?scope=all"
              target="_blank"
              rel="noopener"
              {...stylex.props(buttonStyle({ variant: "primary" }))}
            >
              {m.extension.prompt.refresh.everything}
              <Hidden>{m.common.actions.newTab}</Hidden>
            </a>
            <a
              href="/extension/start?scope=reservations"
              target="_blank"
              rel="noopener"
              {...stylex.props(buttonStyle())}
            >
              {m.extension.prompt.refresh.reservations}
              <Hidden>{m.common.actions.newTab}</Hidden>
            </a>
          </div>
          <p {...stylex.props(styles.small)}>{t.summary.popup.signIn}</p>
        </div>
      </div>

      {groups.map((group) => (
        <div key={group.key} {...stylex.props(styles.group)}>
          <h3 {...stylex.props(styles.groupTitle)}>{group.title}</h3>
          <div {...stylex.props(styles.scroll)}>
            <table {...stylex.props(styles.table)}>
              <thead>
                <tr>
                  <th scope="col" {...stylex.props(styles.th, styles.first)}>
                    {t.columns.source}
                  </th>
                  <th scope="col" {...stylex.props(styles.th)}>
                    {t.columns.from}
                  </th>
                  <th scope="col" {...stylex.props(styles.th)}>
                    {t.columns.read}
                  </th>
                  <th scope="col" {...stylex.props(styles.th)}>
                    {t.columns.state}
                  </th>
                  <th scope="col" {...stylex.props(styles.th, styles.last)}>
                    {t.columns.action}
                  </th>
                </tr>
              </thead>
              <tbody>
                {group.rows.map((source) => (
                  <SourceRow key={source.id} source={source} extension={extension} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div {...stylex.props(styles.limits)}>
        <h3 {...stylex.props(styles.groupTitle)}>{t.limits.title}</h3>
        <ul {...stylex.props(styles.rows)}>
          {t.limits.rows.map((row) => (
            <li key={row}>{row}</li>
          ))}
        </ul>
        <p {...stylex.props(styles.why)}>{t.limits.why}</p>
      </div>
    </div>
  );
}

const STATE_TONE = { fresh: "good", stale: "warn", never: "neutral" } as const;

function SourceRow({ source, extension }: { source: DataSource; extension: ExtensionState }) {
  const { m, fmt } = useI18n("data");
  const t = m.data;
  const kind = t.kinds[source.kind];
  const platform = source.channel ? m.common.sources[source.channel] : t.claude;

  return (
    <tr>
      <th scope="row" {...stylex.props(styles.cell, styles.first)}>
        <span {...stylex.props(styles.strong)}>{kind.name}</span>
        <span {...stylex.props(styles.feeds)}>{kind.feeds}</span>
        {source.automatic && <span {...stylex.props(styles.automatic)}>{t.automatic}</span>}
        {source.progress && (
          <span {...stylex.props(styles.progress)}>
            {source.kind === "adminPages"
              ? t.actions.pages(source.progress.done)
              : t.progress(source.progress.done, source.progress.total)}
          </span>
        )}
      </th>
      <td {...stylex.props(styles.cell, styles.nowrap)}>
        <span {...stylex.props(styles.from)}>
          {source.channel && <SourceDot source={source.channel} />}
          {platform}
        </span>
      </td>
      <td {...stylex.props(styles.cell, styles.nowrap, styles.when)}>
        {source.at ? <span title={fmt.dateTime(source.at)}>{fmt.timeAgo(source.at)}</span> : t.never}
      </td>
      <td {...stylex.props(styles.cell)}>
        <Badge tone={source.error ? "critical" : STATE_TONE[source.state]}>
          {source.error ? t.state.failed : t.state[source.state]}
        </Badge>
        {source.error && <span {...stylex.props(styles.error)}>{source.error}</span>}
      </td>
      <td {...stylex.props(styles.cell, styles.last)}>
        <SourceAction source={source} platform={platform} extension={extension} />
      </td>
    </tr>
  );
}

function SourceAction({
  source,
  platform,
  extension,
}: {
  source: DataSource;
  platform: string;
  extension: ExtensionState;
}) {
  const { m } = useI18n("data");
  const t = m.data;
  const sync = useMutation(syncListing);
  const { action } = source;
  // The one thing to press is primary only while the data needs it.
  const variant = source.state === "fresh" ? "secondary" : "primary";

  switch (action.type) {
    case "open":
      return (
        // Not `noreferrer`: the extension recognises a tab opened from Innkeep by its referrer.
        <a
          href={action.href}
          target="_blank"
          rel="noopener"
          title={t.actions.hint}
          {...stylex.props(buttonStyle({ size: "sm", variant }))}
        >
          {t.actions.open(platform)}
          <ExternalLink aria-hidden size={14} />
          <Hidden>{m.common.actions.newTab}</Hidden>
        </a>
      );
    case "sync":
      return (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            sync.mutate(action.listingId);
          }}
        >
          <SubmitButton
            size="sm"
            variant={source.error ? "primary" : "secondary"}
            pending={sync.isPending}
            pendingLabel={t.actions.syncing}
          >
            {t.actions.sync}
          </SubmitButton>
          {sync.error && (
            <span role="alert" {...stylex.props(styles.error)}>
              {sync.error.message}
            </span>
          )}
        </form>
      );
    case "go":
      return action.href === "/pricing" ? (
        <Link to="/pricing" {...stylex.props(buttonStyle({ size: "sm", variant }))}>
          {t.actions.pricing}
        </Link>
      ) : (
        <Link to="/suggestions" hash="claude" {...stylex.props(buttonStyle({ size: "sm", variant }))}>
          {t.actions.assistant}
        </Link>
      );
    case "popup":
      return (
        <>
          {source.tried && <span {...stylex.props(styles.tried)}>{t.actions.tried}</span>}
          <SyncCta state={extension} scope="all" variant={source.tried ? "secondary" : variant} />
        </>
      );
    case "blocked": {
      const blocked = t.blocked[action.reason];
      return (
        <span {...stylex.props(styles.blocked)}>
          {blocked.text}{" "}
          {action.reason === "extension" && (
            <Link to="/extension" {...stylex.props(styles.link)}>
              {blocked.link}
            </Link>
          )}
          {action.reason === "claude" && (
            <Link to="/suggestions" hash="claude" {...stylex.props(styles.link)}>
              {blocked.link}
            </Link>
          )}
          {(action.reason === "listingUrl" || action.reason === "calendarLink") && source.propertyId && (
            <Link to="/properties/$id" params={{ id: source.propertyId }} {...stylex.props(styles.link)}>
              {blocked.link}
            </Link>
          )}
          {action.reason === "listingId" && (
            <span {...stylex.props(styles.below)}>
              <SyncCta state={extension} scope="reservations" />
            </span>
          )}
        </span>
      );
    }
  }
}
