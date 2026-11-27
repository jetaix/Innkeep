import * as stylex from "@stylexjs/stylex";
import { useMutation } from "@tanstack/react-query";
import type { OtaChannel } from "@/db/schema";
import { markPublished, saveListing, syncListing } from "../../api/mutations";
import { useI18n } from "../../i18n";
import { color, font, radius, text } from "../../tokens.stylex";
import { CopyButton, SubmitButton } from "../../ui/actions";
import { Field, Input, Textarea } from "../../ui/form";
import { Badge, Card, Hidden, Notice, SectionTitle, SourceDot } from "../../ui/primitives";
import { washStyle } from "../../ui/slab";
import type { PropertyAnswer, PropertyListing } from "./shared";

const WIDE = "@media (min-width: 40rem)";
const DESK = "@media (min-width: 48rem)";

const styles = stylex.create({
  card: { padding: "1.25rem", overflow: "hidden" },
  // The platform's own colour, as a pale sheet across the top of its card and nowhere else.
  head: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.5rem",
    margin: "-1.25rem -1.25rem 0",
    padding: "0.875rem 1.25rem",
    borderRadius: `${radius.lg} ${radius.lg} 0 0`,
  },
  heading: { display: "flex", alignItems: "center", gap: "0.5rem" },
  headSide: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: "0.75rem",
    rowGap: "0.25rem",
  },
  onWash: { backgroundColor: color.panel },
  // The same words as on the list, where they follow the platform's name: here they stand alone.
  status: { display: "inline-block", "::first-letter": { textTransform: "uppercase" } },
  quiet: {
    color: { default: color.ink, ":hover": color.ink },
    textDecorationColor: { default: color.lineStrong, ":hover": color.ink },
    fontSize: text.sm,
    textDecoration: "underline",
    textUnderlineOffset: 2,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "0.75rem",
    marginTop: "1rem",
  },
  stretch: { alignSelf: "stretch" },
  fields: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  mono: { fontFamily: font.mono, fontSize: { default: text.field, [DESK]: text.sm } },
  copy: { display: "flex", alignItems: "center", gap: "0.5rem" },
  critical: { color: color.critical },
  local: {
    padding: "0.625rem 0.75rem",
    borderRadius: radius.slab,
    backgroundColor: color.warnBg,
    color: color.warn,
    fontSize: text.base,
    lineHeight: 1.625,
  },
  localTitle: { margin: 0, fontWeight: 500 },
  localLine: { margin: "0.25rem 0 0" },
  localInstead: { margin: "0.5rem 0 0.25rem" },
  localMissing: { margin: "0.5rem 0 0" },
  exportHint: { margin: "0 0 0.25rem", color: color.muted, fontSize: text.sm, fontWeight: 500 },
  shown: { borderTopWidth: 1, borderTopStyle: "solid", borderTopColor: color.line, paddingTop: "0.75rem" },
  shownTitle: { margin: "0 0 0.75rem", fontSize: text.sm, fontWeight: 600 },
  state: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "0.5rem",
    marginTop: "1rem",
    paddingTop: "1rem",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.line,
  },
  manual: { width: "100%", margin: 0, color: color.muted, fontSize: text.sm, lineHeight: 1.625 },
  failed: { marginTop: "0.75rem" },
  // What the extension read
  read: {
    marginTop: "1rem",
    paddingTop: "0.75rem",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.line,
  },
  readHead: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: "0.5rem",
  },
  readTitle: { margin: 0, fontSize: text.sm, fontWeight: 600 },
  readHint: { margin: "0.125rem 0 0", color: color.muted, fontSize: text.sm },
  readEmpty: { margin: "0.25rem 0 0", color: color.muted, fontSize: text.sm },
  facts: {
    display: "grid",
    gridTemplateColumns: { default: "1fr", [WIDE]: "minmax(0, 10rem) 1fr" },
    columnGap: "1rem",
    rowGap: "0.5rem",
    margin: "0.5rem 0 0",
    fontSize: text.sm,
  },
  pair: { display: "contents" },
  term: { color: color.muted },
  value: { margin: 0, whiteSpace: "pre-line" },
  readAt: { margin: "0.5rem 0 0", color: color.muted, fontSize: text.sm },
  pages: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    margin: "0.5rem 0 0",
    padding: 0,
    listStyle: "none",
  },
  page: { borderWidth: 1, borderStyle: "solid", borderColor: color.line, borderRadius: radius.slab },
  summary: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: "0.5rem",
    padding: "0.5rem 0.75rem",
    fontSize: text.base,
    cursor: "pointer",
  },
  pageTitle: { fontWeight: 500 },
  pageMeta: { color: color.muted, fontSize: text.sm },
  pageBody: {
    padding: "0.5rem 0.75rem",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.line,
  },
  photos: {
    display: "grid",
    gridTemplateColumns: { default: "repeat(4, minmax(0, 1fr))", [WIDE]: "repeat(6, minmax(0, 1fr))" },
    gap: "0.25rem",
    marginBottom: "0.5rem",
  },
  photo: {
    display: "block",
    width: "100%",
    aspectRatio: "1",
    borderRadius: radius.sm,
    objectFit: "cover",
    backgroundColor: color.sunken,
  },
  lines: {
    maxHeight: "18rem",
    margin: 0,
    overflowY: "auto",
    color: color.muted,
    fontSize: text.sm,
    lineHeight: 1.625,
    whiteSpace: "pre-line",
  },
});

/** A link shown in full, with a button to copy it. */
export function CopyField({ value, label }: { value: string; label: string }) {
  return (
    <div {...stylex.props(styles.copy)}>
      <Input readOnly value={value} aria-label={label} xstyle={styles.mono} />
      <CopyButton value={value} />
    </div>
  );
}

/** One platform's side of a property: its calendar links, what it shows and what was read from it. */
export function ChannelCard({
  channel,
  property,
  listing,
  exportUrl,
  unreachable,
  otherListing,
  pushesContent,
  extensionOn,
}: {
  channel: OtaChannel;
  property: PropertyAnswer["property"];
  listing: PropertyListing | undefined;
  exportUrl: string;
  /** Innkeep runs on an address the platforms cannot open (this computer, a home network). */
  unreachable: boolean;
  /** The same property's listing on the other platform. */
  otherListing: PropertyListing | undefined;
  /** The platform takes listing details through an API. */
  pushesContent: boolean;
  extensionOn: boolean;
}) {
  const { m, fmt } = useI18n("properties");
  const t = m.properties.channel;
  const label = m.common.sources[channel];
  const state = listing ? listing.state : "never";
  const id = (name: string) => `${channel}-${name}`;
  const save = useMutation(saveListing);
  const sync = useMutation(syncListing);
  const publish = useMutation(markPublished);
  const error = save.error ?? sync.error ?? publish.error;

  return (
    <Card xstyle={styles.card}>
      <section aria-labelledby={id("heading")}>
        <div {...stylex.props(washStyle(channel), styles.head)}>
          <SectionTitle id={id("heading")} xstyle={styles.heading}>
            <SourceDot source={channel} />
            {label}
          </SectionTitle>
          <div {...stylex.props(styles.headSide)}>
            {listing?.listingUrl && (
              <a href={listing.listingUrl} target="_blank" rel="noreferrer" {...stylex.props(styles.quiet)}>
                {t.openListing}
                <Hidden> {m.common.actions.newTab}</Hidden>
              </a>
            )}
            {/* Whether the calendar link works, said as a state. */}
            {!listing?.icalUrl ? (
              <Badge xstyle={styles.onWash}>
                <span {...stylex.props(styles.status)}>{m.properties.list.status.notConnected}</span>
              </Badge>
            ) : listing.lastSyncError ? (
              <Badge tone="critical">
                <span {...stylex.props(styles.status)}>{m.properties.list.status.notSyncing}</span>
              </Badge>
            ) : (
              <Badge tone="good" xstyle={styles.onWash}>
                <span {...stylex.props(styles.status)}>{m.properties.list.status.connected}</span>
              </Badge>
            )}
          </div>
        </div>

        <form
          {...stylex.props(styles.form)}
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate({
              property: property.id,
              channel,
              fields: Object.fromEntries(new FormData(event.currentTarget)),
            });
          }}
        >
          <Field
            label={t.importLabel(label)}
            htmlFor={id("icalUrl")}
            hint={<SyncStatus listing={listing} />}
            xstyle={styles.stretch}
          >
            <Input
              id={id("icalUrl")}
              name="icalUrl"
              defaultValue={listing?.icalUrl ?? ""}
              placeholder="https://…ics"
              spellCheck={false}
              xstyle={styles.mono}
            />
          </Field>
          {unreachable ? (
            // The platform would answer "invalid link": say why, and give the link that does work.
            <div {...stylex.props(styles.local, styles.stretch)}>
              <p {...stylex.props(styles.localTitle)}>{t.local.title(label)}</p>
              <p {...stylex.props(styles.localLine)}>{t.local.why(label)}</p>
              {otherListing?.icalUrl ? (
                <>
                  <p {...stylex.props(styles.localInstead)}>
                    {t.local.instead(m.common.sources[otherListing.channel], t.calendarHelp[channel])}
                  </p>
                  <CopyField
                    value={otherListing.icalUrl}
                    label={t.local.copyLabel(m.common.sources[otherListing.channel])}
                  />
                </>
              ) : (
                <p {...stylex.props(styles.localMissing)}>
                  {t.local.missing(m.common.sources[channel === "airbnb" ? "booking" : "airbnb"])}
                </p>
              )}
            </div>
          ) : (
            <div {...stylex.props(styles.stretch)}>
              <p {...stylex.props(styles.exportHint)}>{t.exportHint(t.calendarHelp[channel])}</p>
              <CopyField value={exportUrl} label={t.exportLabel(label)} />
            </div>
          )}

          <div {...stylex.props(styles.shown, styles.stretch)}>
            <p {...stylex.props(styles.shownTitle)}>{t.shownOn(label)}</p>
            <div {...stylex.props(styles.fields)}>
              <Field label={t.listingUrl} htmlFor={id("listingUrl")}>
                <Input
                  id={id("listingUrl")}
                  name="listingUrl"
                  type="url"
                  defaultValue={listing?.listingUrl ?? ""}
                  placeholder="https://…"
                />
              </Field>
              <Field label={t.titleOverride} htmlFor={id("titleOverride")}>
                <Input
                  id={id("titleOverride")}
                  name="titleOverride"
                  defaultValue={listing?.titleOverride ?? ""}
                  placeholder={property.title || t.titleOverridePlaceholder}
                />
              </Field>
              <Field label={t.descriptionOverride} htmlFor={id("descriptionOverride")}>
                <Textarea
                  id={id("descriptionOverride")}
                  name="descriptionOverride"
                  rows={3}
                  defaultValue={listing?.descriptionOverride ?? ""}
                  placeholder={t.descriptionOverridePlaceholder}
                />
              </Field>
            </div>
          </div>
          <SubmitButton
            variant="primary"
            pending={save.isPending}
            pendingLabel={m.properties.property.saving}
          >
            {t.save(label)}
          </SubmitButton>
        </form>

        {error && (
          <Notice tone="critical" role="alert" xstyle={styles.failed}>
            {error.message}
          </Notice>
        )}

        {listing && (
          <div {...stylex.props(styles.state)}>
            {listing.icalUrl && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  sync.mutate(listing.id);
                }}
              >
                <SubmitButton size="sm" pending={sync.isPending} pendingLabel={t.syncing}>
                  {t.syncNow}
                </SubmitButton>
              </form>
            )}
            <Badge tone={state === "outdated" ? "warn" : state === "current" ? "good" : "neutral"}>
              {state === "current" && t.published(fmt.timeAgo(listing.publishedAt ?? 0))}
              {state === "outdated" && t.outdated}
              {state === "never" && t.neverPublished}
            </Badge>
            {state !== "current" && (
              <>
                <CopyButton value={listing.content.title} label={t.copyTitle} />
                <CopyButton value={listing.content.description} label={t.copyDescription} />
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    publish.mutate(listing.id);
                  }}
                >
                  <SubmitButton
                    size="sm"
                    pending={publish.isPending}
                    pendingLabel={m.properties.property.saving}
                  >
                    {pushesContent ? t.publishTo(label) : t.markPublished}
                  </SubmitButton>
                </form>
                {!pushesContent && <p {...stylex.props(styles.manual)}>{t.manualNote(label)}</p>}
              </>
            )}
          </div>
        )}
        {listing && <ChannelFacts channel={channel} listing={listing} extensionOn={extensionOn} />}
        {listing && <AdminPages channel={channel} listing={listing} />}
      </section>
    </Card>
  );
}

/**
 * The listing as the platform's own editor describes it, read by the browser
 * extension. Reference only: headings and values stay in the host's language.
 */
function ChannelFacts({
  channel,
  listing,
  extensionOn,
}: {
  channel: OtaChannel;
  listing: PropertyListing;
  extensionOn: boolean;
}) {
  const { m, fmt } = useI18n("properties");
  const t = m.properties.facts;
  const label = m.common.sources[channel];
  const cards = Object.values(listing.details);
  // Only Airbnb's editor is read today, and only once the extension is switched on.
  const editor =
    channel === "airbnb" && listing.externalId && extensionOn
      ? `${URL.canParse(listing.listingUrl) ? new URL(listing.listingUrl).origin : "https://www.airbnb.com"}/hosting/listings/editor/${listing.externalId}/details`
      : null;
  if (cards.length === 0 && !editor) return null;

  return (
    <div {...stylex.props(styles.read)}>
      <div {...stylex.props(styles.readHead)}>
        <p {...stylex.props(styles.readTitle)}>{t.heading(label)}</p>
        {editor && (
          // Not `noreferrer`: the extension recognises a tab opened from Innkeep by its referrer.
          <a href={editor} target="_blank" rel="noopener" {...stylex.props(styles.quiet)}>
            {cards.length ? t.readAgain : t.readWithExtension}
            <Hidden> {t.opensEditor(label)}</Hidden>
          </a>
        )}
      </div>
      {cards.length === 0 ? (
        <p {...stylex.props(styles.readEmpty)}>{t.empty}</p>
      ) : (
        <>
          <dl {...stylex.props(styles.facts)}>
            {cards.map(([heading, ...values]) => (
              <div key={heading} {...stylex.props(styles.pair)}>
                <dt {...stylex.props(styles.term)}>{heading}</dt>
                <dd {...stylex.props(styles.value)}>{values.join("\n")}</dd>
              </div>
            ))}
          </dl>
          {listing.channelDetailsAt && (
            <p {...stylex.props(styles.readAt)}>{t.readAt(fmt.timeAgo(listing.channelDetailsAt))}</p>
          )}
        </>
      )}
    </div>
  );
}

function SyncStatus({ listing }: { listing: PropertyListing | undefined }) {
  const { m, fmt } = useI18n("properties");
  const t = m.properties.sync;
  if (!listing?.icalUrl) return t.paste;
  if (listing.lastSyncError) {
    return (
      <span role="alert" {...stylex.props(styles.critical)}>
        {t.failed(listing.lastSyncError)}
        {listing.lastSyncedAt ? t.lastSuccess(fmt.timeAgo(listing.lastSyncedAt)) : ""}
      </span>
    );
  }
  return listing.lastSyncedAt ? t.lastSynced(fmt.timeAgo(listing.lastSyncedAt)) : t.never;
}

/**
 * Admin pages of the platform kept as shown by the extension: every amenity,
 * every photo, the policies. Reference only, in the host's own language.
 */
function AdminPages({ channel, listing }: { channel: OtaChannel; listing: PropertyListing }) {
  const { m, fmt } = useI18n("properties");
  const t = m.properties.adminPages;
  if (listing.pages.length === 0) return null;

  return (
    <div {...stylex.props(styles.read)}>
      <p {...stylex.props(styles.readTitle)}>{t.title(m.common.sources[channel])}</p>
      <p {...stylex.props(styles.readHint)}>{t.hint}</p>
      <ul {...stylex.props(styles.pages)}>
        {listing.pages.map((page) => (
          <li key={page.key}>
            <details {...stylex.props(styles.page)}>
              <summary {...stylex.props(styles.summary)}>
                <span {...stylex.props(styles.pageTitle)}>{page.title || page.key}</span>
                <span {...stylex.props(styles.pageMeta)}>
                  {[
                    page.images.length ? t.photos(page.images.length) : null,
                    t.read(fmt.timeAgo(page.seenAt)),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </summary>
              <div {...stylex.props(styles.pageBody)}>
                {page.images.length > 0 && (
                  <div {...stylex.props(styles.photos)}>
                    {page.images.slice(0, 24).map((image) => (
                      // Photos load from the platform's own image servers.
                      <img
                        key={image}
                        src={image}
                        alt=""
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        {...stylex.props(styles.photo)}
                      />
                    ))}
                  </div>
                )}
                <p {...stylex.props(styles.lines)}>{page.lines.join("\n")}</p>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
