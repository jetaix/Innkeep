import * as stylex from "@stylexjs/stylex";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { type FormEvent, type ReactNode, Suspense, useEffect, useRef } from "react";
import { ApiError } from "../../api/client";
import { connectCalendars, createProperty } from "../../api/mutations";
import { extensionQuery, sessionQuery, setupProgressQuery, setupQuery } from "../../api/queries";
import { Logo } from "../../brand/logo";
import { ChromeSteps, RunButtons, Steps } from "../../features/extension/guide-parts";
import { PLATFORMS } from "../../features/properties/shared";
import { loadMessages, useI18n } from "../../i18n";
import { color, font, radius, text } from "../../tokens.stylex";
import { SubmitButton } from "../../ui/actions";
import { buttonStyle } from "../../ui/button";
import { Field, Input } from "../../ui/form";
import { Badge, Hidden, Loading, Notice } from "../../ui/primitives";

const STEPS = ["how", "name", "calendars", "extension", "read", "done"] as const;
type StepName = (typeof STEPS)[number];
type Search = { step?: StepName; id?: number; problem?: 1; check?: "outdated" | "waiting" };

/**
 * The "Add a property" guide: one screen per step, from the name to the
 * first read of the host's pages. It takes the whole screen, without the
 * menu, and is the host's own: a visitor of the demo is sent back to it.
 */
export const Route = createFileRoute("/properties/new")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const id = Number(search.id);
    return {
      step: STEPS.find((name) => name === search.step),
      id: Number.isInteger(id) && id > 0 ? id : undefined,
      problem: search.problem ? 1 : undefined,
      check: search.check === "outdated" || search.check === "waiting" ? search.check : undefined,
    };
  },
  beforeLoad: async ({ context: { queryClient } }) => {
    const session = await queryClient.ensureQueryData(sessionQuery);
    if (!session.signedIn) throw redirect({ to: session.demo ? "/overview" : "/login" });
  },
  loaderDeps: ({ search }) => ({ step: search.step ?? "how", id: search.id }),
  loader: async ({ context: { queryClient }, deps }) => {
    void loadMessages("setup", "properties", "extension");
    if (deps.step === "how" || deps.step === "name") return;
    // The later steps are about one property: without it, start from its name.
    if (!deps.id) throw redirect({ to: "/properties/new", search: { step: "name" } });
    try {
      await Promise.all([
        queryClient.ensureQueryData(setupQuery(deps.id)),
        deps.step === "calendars" ? null : queryClient.ensureQueryData(extensionQuery),
      ]);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw redirect({ to: "/properties/new", search: { step: "name" } });
      }
      throw error;
    }
  },
  component: () => (
    <Suspense fallback={<Loading />}>
      <Guide />
    </Suspense>
  ),
});

const WIDE = "@media (min-width: 48rem)";

/*
 * The first run, in the reading register: the ground, ink and hairlines.
 * The colour mark and the display title are the only brand on the screen,
 * and each step has one ink pill.
 */
const styles = stylex.create({
  screen: { display: "flex", flexDirection: "column", minHeight: "100dvh" },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.75rem",
    padding: { default: "0.75rem 1rem", [WIDE]: "1rem 1.5rem" },
  },
  where: {
    minWidth: 0,
    margin: "0 0 0 auto",
    overflow: "hidden",
    color: color.muted,
    fontSize: text.base,
    fontVariantNumeric: "tabular-nums",
    fontWeight: 500,
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  close: { width: "2rem", paddingInline: 0 },
  track: { height: 2, backgroundColor: color.line },
  bar: { height: "100%", backgroundColor: color.ink },
  reached: (width: string) => ({ width }),
  body: { display: "flex", flexDirection: "column", flexGrow: 1 },
  main: {
    flexGrow: 1,
    width: "100%",
    maxWidth: "38rem",
    marginInline: "auto",
    padding: { default: "2rem 1rem", [WIDE]: "3.5rem 1rem" },
  },
  title: {
    margin: 0,
    fontFamily: font.display,
    fontSize: { default: "1.75rem", [WIDE]: "2.25rem" },
    fontWeight: 400,
    letterSpacing: "-0.03em",
    lineHeight: 1.1,
    textWrap: "balance",
  },
  intro: {
    maxWidth: "60ch",
    margin: "0.75rem 0 0",
    color: color.muted,
    fontSize: text.md,
    lineHeight: 1.6,
    textWrap: "pretty",
  },
  content: { marginTop: "2rem" },
  footer: {
    position: "sticky",
    bottom: 0,
    padding: "0.75rem 1rem",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.line,
    backgroundColor: color.bg,
  },
  footerRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.5rem",
    maxWidth: "38rem",
    marginInline: "auto",
  },
  next: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "0.5rem",
    marginInlineStart: "auto",
  },
  expect: { margin: 0, fontSize: text.md, fontWeight: 600 },
  items: { margin: "0.5rem 0 0", padding: 0, listStyle: "none" },
  item: {
    display: "flex",
    gap: "0.875rem",
    paddingBlock: "1rem",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.line,
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
    fontSize: text.sm,
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums",
  },
  itemTitle: { margin: 0, fontSize: text.md, fontWeight: 500, lineHeight: "1.5rem" },
  itemBody: { margin: "0.125rem 0 0", color: color.muted, fontSize: text.base, lineHeight: 1.625 },
  fields: { display: "flex", flexDirection: "column", gap: "1.25rem" },
  field: { height: "2.75rem" },
  link: {
    fontFamily: { default: "inherit", [WIDE]: font.mono },
    fontSize: { default: text.field, [WIDE]: text.sm },
  },
  below: { marginTop: "0.5rem" },
  above: { marginBottom: "1rem" },
  plain: { margin: 0 },
  // What a waiting step says while it watches: a quiet line on the ground, announced once.
  waiting: {
    padding: "0.75rem 0.875rem",
    borderRadius: radius.field,
    backgroundColor: color.subtle,
    fontSize: text.base,
    lineHeight: 1.625,
  },
  strong: { fontWeight: 500 },
  quiet: { display: "block", marginTop: "0.125rem", color: color.muted },
  rule: {
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.lineStrong,
  },
  other: { margin: "1rem 0 0", color: color.muted, fontSize: text.base },
  inkLink: {
    color: color.ink,
    fontWeight: 500,
    textDecorationColor: color.lineStrong,
    textUnderlineOffset: 4,
  },
  desktop: {
    display: { default: "none", [WIDE]: "flex" },
    flexWrap: "wrap",
    gap: "0.5rem",
    margin: "1rem 0 0",
  },
  desktopBlock: { display: { default: "none", [WIDE]: "block" }, marginTop: "1.5rem" },
  phone: {
    display: { default: "block", [WIDE]: "none" },
    margin: "1rem 0 0",
    color: color.muted,
    fontSize: text.base,
  },
  result: {
    paddingTop: "1.25rem",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.lineStrong,
  },
  figure: { margin: 0, fontSize: text.lg, fontWeight: 600, letterSpacing: "-0.01em" },
  named: { margin: "0.25rem 0 0", color: color.muted, fontSize: text.base },
  unnamed: {
    maxWidth: "60ch",
    margin: "0.75rem 0 0",
    color: color.muted,
    fontSize: text.base,
    lineHeight: 1.625,
  },
});

/** One screen of the guide: what it is called, where it stands, its content and its two buttons. */
function Screen({
  step,
  title,
  intro,
  onSubmit,
  back,
  next,
  children,
}: {
  step: StepName;
  title: string;
  intro: string;
  /** When the step saves something, the whole screen is its form. */
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  back?: Search;
  next: ReactNode;
  children: ReactNode;
}) {
  const { m } = useI18n("setup");
  const t = m.setup;
  const position = STEPS.indexOf(step) + 1;
  // A new step starts at its top, as a new page would.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs when the step changes, not on every draw
  useEffect(() => window.scrollTo(0, 0), [step]);

  const inner = (
    <>
      <main id="main" {...stylex.props(styles.main)}>
        <h1 {...stylex.props(styles.title)}>{title}</h1>
        <p {...stylex.props(styles.intro)}>{intro}</p>
        <div {...stylex.props(styles.content)}>{children}</div>
      </main>
      <footer {...stylex.props(styles.footer)}>
        <div {...stylex.props(styles.footerRow)}>
          {back && (
            <Link to="/properties/new" search={back} {...stylex.props(buttonStyle())}>
              {t.back}
            </Link>
          )}
          <div {...stylex.props(styles.next)}>{next}</div>
        </div>
      </footer>
    </>
  );

  return (
    <div {...stylex.props(styles.screen)}>
      <title>{`${t.title} · Innkeep`}</title>
      <meta name="robots" content="noindex, nofollow" />
      <header {...stylex.props(styles.header)}>
        <Logo tone="color" />
        <p {...stylex.props(styles.where)}>{t.progress(position, STEPS.length)}</p>
        <Link
          to="/properties"
          aria-label={m.common.actions.close}
          {...stylex.props(buttonStyle({ size: "sm" }), styles.close)}
        >
          <X aria-hidden size={16} />
        </Link>
      </header>
      <div
        role="progressbar"
        aria-label={t.progress(position, STEPS.length)}
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-valuenow={position}
        {...stylex.props(styles.track)}
      >
        <div {...stylex.props(styles.bar, styles.reached(`${(position / STEPS.length) * 100}%`))} />
      </div>
      {onSubmit ? (
        <form onSubmit={onSubmit} {...stylex.props(styles.body)}>
          {inner}
        </form>
      ) : (
        <div {...stylex.props(styles.body)}>{inner}</div>
      )}
    </div>
  );
}

function Guide() {
  const { step = "how", id } = Route.useSearch();
  if (step === "how") return <How />;
  if (step === "name" || !id) return <Name />;
  if (step === "calendars") return <Calendars id={id} />;
  if (step === "extension") return <Extension id={id} />;
  if (step === "read") return <Read id={id} />;
  return <Done id={id} />;
}

const primary = buttonStyle({ variant: "primary" });

function How() {
  const t = useI18n("setup").m.setup;
  return (
    <Screen
      step="how"
      title={t.how.title}
      intro={t.how.intro}
      next={
        <Link to="/properties/new" search={{ step: "name" }} {...stylex.props(primary)}>
          {t.continue}
        </Link>
      }
    >
      <h2 {...stylex.props(styles.expect)}>{t.how.expect}</h2>
      <ol {...stylex.props(styles.items)}>
        {t.how.items.map((item, index) => (
          <li key={item.title} {...stylex.props(styles.item)}>
            <span aria-hidden {...stylex.props(styles.number)}>
              {index + 1}
            </span>
            <div>
              <h3 {...stylex.props(styles.itemTitle)}>{item.title}</h3>
              <p {...stylex.props(styles.itemBody)}>{item.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </Screen>
  );
}

/** Step 2: the name creates the property, and the guide goes on with it. */
function Name() {
  const { m } = useI18n("setup", "properties");
  const t = m.setup;
  const navigate = useNavigate();
  const create = useMutation(createProperty);
  return (
    <Screen
      step="name"
      title={t.name.title}
      intro={t.name.intro}
      onSubmit={(event) => {
        event.preventDefault();
        const name = String(new FormData(event.currentTarget).get("name") ?? "");
        create.mutate(name, {
          onSuccess: (created) =>
            navigate({ to: "/properties/new", search: { step: "calendars", id: created.id } }),
        });
      }}
      back={{ step: "how" }}
      next={
        <SubmitButton variant="primary" pending={create.isPending} pendingLabel={t.name.pending}>
          {t.continue}
        </SubmitButton>
      }
    >
      <Field label={m.properties.create.label} htmlFor="name">
        <Input
          id="name"
          name="name"
          required
          placeholder={m.properties.create.placeholder}
          autoComplete="off"
          aria-describedby={create.error ? "name-error" : undefined}
          xstyle={styles.field}
        />
      </Field>
      {create.error && (
        <Notice tone="critical" role="alert" id="name-error" xstyle={styles.below}>
          {create.error.message}
        </Notice>
      )}
    </Screen>
  );
}

/** Step 3: saves the links that were filled in, and stays on the step when one cannot be read. */
function Calendars({ id }: { id: number }) {
  const { m } = useI18n("setup", "properties");
  const t = m.setup;
  const { problem } = Route.useSearch();
  const navigate = useNavigate();
  const found = useSuspenseQuery(setupQuery(id)).data;
  const save = useMutation(connectCalendars);
  return (
    <Screen
      step="calendars"
      title={t.calendars.title(found.property.name)}
      intro={t.calendars.intro}
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const links = {
          airbnb: String(form.get("airbnb") ?? ""),
          booking: String(form.get("booking") ?? ""),
        };
        save.mutate(
          { property: id, links },
          {
            onSuccess: ({ unreadable }) =>
              navigate({
                to: "/properties/new",
                search: unreadable ? { step: "calendars", id, problem: 1 } : { step: "extension", id },
              }),
          },
        );
      }}
      next={
        <>
          <Link to="/properties/new" search={{ step: "extension", id }} {...stylex.props(buttonStyle())}>
            {problem ? t.calendars.anyway : t.skip}
          </Link>
          <SubmitButton variant="primary" pending={save.isPending} pendingLabel={t.calendars.pending}>
            {t.calendars.submit}
          </SubmitButton>
        </>
      }
    >
      <div {...stylex.props(styles.fields)}>
        {PLATFORMS.map((channel) => {
          const listing = found.listings.find((row) => row.channel === channel);
          return (
            <div key={channel}>
              <Field
                label={t.calendars.label(m.common.sources[channel])}
                htmlFor={channel}
                hint={t.calendars.find(m.properties.channel.calendarHelp[channel])}
              >
                <Input
                  id={channel}
                  name={channel}
                  type="url"
                  defaultValue={listing?.icalUrl ?? ""}
                  placeholder="https://…"
                  spellCheck={false}
                  autoComplete="off"
                  xstyle={[styles.field, styles.link]}
                />
              </Field>
              {problem && listing?.icalUrl && listing.lastSyncError && (
                <Notice tone="critical" xstyle={styles.below}>
                  {t.calendars.problem(listing.lastSyncError)}
                </Notice>
              )}
            </div>
          );
        })}
        {save.error && (
          <Notice tone="critical" role="alert">
            {save.error.message}
          </Notice>
        )}
      </div>
    </Screen>
  );
}

/**
 * Lets a step of the guide go on by itself: asks Innkeep every few seconds
 * whether the extension has connected, or has read a reservations page since
 * this step was opened, and opens the next step when it has. What it shows is announced once.
 */
function ContinueWhen({
  want,
  to,
  children,
}: {
  want: "extension" | "read";
  to: Search;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const client = useQueryClient();
  // Asked only while the page is in view.
  const { data, dataUpdatedAt } = useQuery({ ...setupProgressQuery, refetchInterval: 3000 });
  // The last read as Innkeep's own clock had it when this step opened.
  const readBefore = useRef<number | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `dataUpdatedAt` marks each answer, even an unchanged one
  useEffect(() => {
    if (!data) return;
    const first = readBefore.current === null;
    readBefore.current ??= data.readAt;
    if (want === "extension" ? data.extension : !first && data.readAt > readBefore.current) {
      // What the next step shows was read before the extension called.
      void Promise.all(
        [["extension"], ["freshness"], ["setup"]].map((queryKey) => client.invalidateQueries({ queryKey })),
      ).then(() => navigate({ to: "/properties/new", search: to, replace: true }));
    }
  }, [data, dataUpdatedAt]);

  return (
    <div role="status" {...stylex.props(styles.waiting)}>
      {children}
    </div>
  );
}

/** Step 4: "I've added the extension" only goes on once the extension has really called. */
function Extension({ id }: { id: number }) {
  const { m } = useI18n("setup", "extension");
  const t = m.setup;
  const { check } = Route.useSearch();
  const navigate = useNavigate();
  const client = useQueryClient();
  const { status } = useSuspenseQuery(extensionQuery).data;
  const ready = status.state === "ready";
  const confirm = useMutation({
    mutationFn: () => client.fetchQuery({ ...extensionQuery, staleTime: 0 }),
    onSuccess: ({ status: now }) =>
      navigate({
        to: "/properties/new",
        search:
          now.state === "ready"
            ? { step: "read", id }
            : { step: "extension", id, check: now.state === "outdated" ? "outdated" : "waiting" },
      }),
  });
  return (
    <Screen
      step="extension"
      title={t.extension.title}
      intro={t.extension.intro}
      onSubmit={
        ready
          ? undefined
          : (event) => {
              event.preventDefault();
              confirm.mutate();
            }
      }
      back={{ step: "calendars", id }}
      next={
        ready ? (
          <Link to="/properties/new" search={{ step: "read", id }} {...stylex.props(primary)}>
            {t.continue}
          </Link>
        ) : (
          <>
            <Link to="/properties/new" search={{ step: "read", id }} {...stylex.props(buttonStyle())}>
              {t.skip}
            </Link>
            <SubmitButton variant="primary" pending={confirm.isPending} pendingLabel={t.extension.pending}>
              {t.extension.done}
            </SubmitButton>
          </>
        )
      }
    >
      {ready && (
        <p {...stylex.props(styles.plain, styles.above)}>
          <Badge tone="good">{t.read.connected}</Badge>
        </p>
      )}
      {!ready && check && (
        <Notice tone="warn" role="status" xstyle={styles.above}>
          {check === "outdated" ? t.extension.outdated : t.extension.waiting}
        </Notice>
      )}
      {!ready && (
        <div {...stylex.props(styles.above)}>
          <ContinueWhen want="extension" to={{ step: "read", id }}>
            {t.extension.watching}
          </ContinueWhen>
        </div>
      )}
      <div {...stylex.props(styles.rule)}>
        <Steps>
          <ChromeSteps />
        </Steps>
      </div>
      <p {...stylex.props(styles.other)}>
        {t.extension.other}{" "}
        <a href="/extension" target="_blank" rel="noopener" {...stylex.props(styles.inkLink)}>
          {t.extension.otherLink}
          <Hidden> {m.common.actions.newTab}</Hidden>
        </a>
      </p>
    </Screen>
  );
}

/** Step 5: one run of the extension, started here and watched until the reservations are in. */
function Read({ id }: { id: number }) {
  const { m } = useI18n("setup", "extension");
  const t = m.setup;
  const { status } = useSuspenseQuery(extensionQuery).data;
  const ready = status.state === "ready";
  return (
    <Screen
      step="read"
      title={t.read.title}
      intro={ready ? t.read.intro : t.read.noExtension}
      back={{ step: "extension", id }}
      next={
        // Once the buttons that start a run are on the screen, they are the step's one ink pill.
        <Link
          to="/properties/new"
          search={{ step: "done", id }}
          {...stylex.props(ready ? buttonStyle() : primary)}
        >
          {t.read.next}
        </Link>
      }
    >
      {ready && (
        <>
          <p {...stylex.props(styles.plain)}>
            <Badge tone="good">{t.read.connected}</Badge>
          </p>
          <p {...stylex.props(styles.desktop)}>
            <RunButtons size="md" />
          </p>
          <p {...stylex.props(styles.phone)}>{m.extension.cta.computer}</p>
          <div {...stylex.props(styles.desktopBlock)}>
            <ContinueWhen want="read" to={{ step: "done", id }}>
              <strong {...stylex.props(styles.strong)}>{t.read.keepOpen}</strong>
              <span {...stylex.props(styles.quiet)}>{t.read.keepOpenBody}</span>
            </ContinueWhen>
          </div>
        </>
      )}
    </Screen>
  );
}

/** The last step: what Innkeep knows about the property so far. */
function Done({ id }: { id: number }) {
  const t = useI18n("setup").m.setup;
  // Read again on arriving: the run of the step before has just added to it.
  const { property, summary } = useSuspenseQuery({ ...setupQuery(id), staleTime: 0 }).data;
  return (
    <Screen
      step="done"
      title={t.done.title(property.name)}
      intro={t.done.intro}
      back={{ step: "read", id }}
      next={
        <Link to="/properties/$id" params={{ id }} {...stylex.props(primary)}>
          {t.read.finish}
        </Link>
      }
    >
      <div {...stylex.props(styles.result)}>
        <p {...stylex.props(styles.figure)}>{t.done.stays(summary.stays)}</p>
        {summary.named > 0 && <p {...stylex.props(styles.named)}>{t.done.named(summary.named)}</p>}
        {summary.named < summary.stays || summary.stays === 0 ? (
          <p {...stylex.props(styles.unnamed)}>{t.done.unnamed}</p>
        ) : null}
      </div>
    </Screen>
  );
}
