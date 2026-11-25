import { X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { CHANNELS } from "@/channels";
import { Logo } from "@/components/brand/logo";
import { SubmitButton } from "@/components/ui/actions";
import { buttonClass } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Loading } from "@/components/ui/loading";
import { Badge, Card, Notice } from "@/components/ui/primitives";
import { OTA_CHANNELS } from "@/db";
import { ChromeSteps, innkeepOrigin } from "@/features/extension/guide-parts";
import { getExtensionStatus } from "@/features/extension/status";
import { confirmExtension, connectCalendars, nameProperty, setupProgress } from "@/features/setup/actions";
import { ContinueWhen } from "@/features/setup/continue-when";
import { getSetupProperty, getSetupSummary } from "@/features/setup/queries";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).m.setup.title };
}

const STEPS = ["how", "name", "calendars", "extension", "read", "done"] as const;
type StepName = (typeof STEPS)[number];
const at = (step: StepName, id?: number) => `/properties/new?step=${step}${id ? `&id=${id}` : ""}`;

export default function NewPropertyPage({ searchParams }: PageProps<"/properties/new">) {
  return (
    <Suspense fallback={<Loading />}>
      <Guide searchParams={searchParams} />
    </Suspense>
  );
}

/** One screen of the guide: what it is called, where it stands, its content and its two buttons. */
async function Screen({
  step,
  title,
  intro,
  action,
  back,
  next,
  children,
}: {
  step: StepName;
  title: string;
  intro: string;
  /** When the step saves something, the whole screen is its form. */
  action?: (form: FormData) => Promise<void>;
  back?: string;
  next: ReactNode;
  children: ReactNode;
}) {
  const { m } = await getI18n();
  const t = m.setup;
  const position = STEPS.indexOf(step) + 1;
  const Body = action ? "form" : "div";
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
        <Logo />
        <p className="truncate text-[13px] font-medium text-muted">{t.title}</p>
        <Link href="/properties" aria-label={m.common.actions.close} className={buttonClass({ size: "sm" })}>
          <X aria-hidden className="size-4" />
        </Link>
      </header>
      <div
        role="progressbar"
        aria-label={t.progress(position, STEPS.length)}
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-valuenow={position}
        className="h-1 bg-sunken"
      >
        <div className="h-full bg-ink" style={{ width: `${(position / STEPS.length) * 100}%` }} />
      </div>
      <Body action={action} className="flex flex-1 flex-col">
        <main id="main" className="mx-auto w-full max-w-xl flex-1 px-4 py-8 md:py-12">
          <p className="text-xs font-medium text-muted">{t.progress(position, STEPS.length)}</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-balance">{title}</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">{intro}</p>
          <div className="mt-6">{children}</div>
        </main>
        <footer className="sticky bottom-0 border-t border-line bg-bg px-4 py-3">
          <div className="mx-auto flex max-w-xl flex-wrap items-center justify-between gap-2">
            {back ? (
              <Link href={back} className={buttonClass()}>
                {t.back}
              </Link>
            ) : (
              <span />
            )}
            <div className="flex flex-wrap items-center justify-end gap-2">{next}</div>
          </div>
        </footer>
      </Body>
    </div>
  );
}

async function Guide({ searchParams }: Pick<PageProps<"/properties/new">, "searchParams">) {
  await connection();
  const params = await searchParams;
  const { m } = await getI18n();
  const t = m.setup;
  const step = STEPS.find((name) => name === params.step) ?? "how";
  const primary = buttonClass({ variant: "primary" });

  if (step === "how") {
    return (
      <Screen
        step={step}
        title={t.how.title}
        intro={t.how.intro}
        next={
          <Link href={at("name")} className={primary}>
            {t.continue}
          </Link>
        }
      >
        <h2 className="text-xs font-medium tracking-wide text-muted uppercase">{t.how.expect}</h2>
        <ol className="mt-3 space-y-5">
          {t.how.items.map((item, index) => (
            <li key={item.title} className="flex gap-3">
              <span
                aria-hidden
                className="flex size-6 shrink-0 items-center justify-center rounded-md bg-sunken text-xs font-semibold tabular-nums"
              >
                {index + 1}
              </span>
              <div>
                <h3 className="font-medium">{item.title}</h3>
                <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Screen>
    );
  }

  if (step === "name") {
    return (
      <Screen
        step={step}
        title={t.name.title}
        intro={t.name.intro}
        action={nameProperty}
        back={at("how")}
        next={
          <SubmitButton variant="primary" pendingLabel={t.name.pending}>
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
          />
        </Field>
      </Screen>
    );
  }

  // The later steps are about one property: without it, start from its name.
  const id = Number(params.id);
  const found = Number.isInteger(id) && id > 0 ? await getSetupProperty(id) : null;
  if (!found) redirect(at("name"));

  if (step === "calendars") {
    return (
      <Screen
        step={step}
        title={t.calendars.title(found.property.name)}
        intro={t.calendars.intro}
        action={connectCalendars.bind(null, id)}
        next={
          <>
            <Link href={at("extension", id)} className={buttonClass()}>
              {params.problem ? t.calendars.anyway : t.skip}
            </Link>
            <SubmitButton variant="primary" pendingLabel={t.calendars.pending}>
              {t.calendars.submit}
            </SubmitButton>
          </>
        }
      >
        <div className="space-y-5">
          {OTA_CHANNELS.map((channel) => {
            const listing = found.listings.find((row) => row.channel === channel);
            const label = CHANNELS[channel].label;
            return (
              <div key={channel}>
                <Field
                  label={t.calendars.label(label)}
                  htmlFor={channel}
                  hint={t.calendars.find(m.properties.channel.calendarHelp[channel])}
                >
                  <Input
                    id={channel}
                    name={channel}
                    type="url"
                    defaultValue={listing?.icalUrl ?? ""}
                    placeholder="https://…"
                    className="font-mono md:text-xs"
                    spellCheck={false}
                    autoComplete="off"
                  />
                </Field>
                {params.problem && listing?.icalUrl && listing.lastSyncError && (
                  <Notice tone="critical" className="mt-2">
                    {t.calendars.problem(listing.lastSyncError)}
                  </Notice>
                )}
              </div>
            );
          })}
        </div>
      </Screen>
    );
  }

  const status = await getExtensionStatus();

  if (step === "extension") {
    const ready = status.state === "ready";
    return (
      <Screen
        step={step}
        title={t.extension.title}
        intro={t.extension.intro}
        action={ready ? undefined : confirmExtension.bind(null, id)}
        back={at("calendars", id)}
        next={
          ready ? (
            <Link href={at("read", id)} className={primary}>
              {t.continue}
            </Link>
          ) : (
            <>
              <Link href={at("read", id)} className={buttonClass()}>
                {t.skip}
              </Link>
              <SubmitButton variant="primary" pendingLabel={t.extension.pending}>
                {t.extension.done}
              </SubmitButton>
            </>
          )
        }
      >
        {ready && (
          <p className="mb-4">
            <Badge tone="good">{t.read.connected}</Badge>
          </p>
        )}
        {!ready && params.check && (
          <Notice tone="warn" className="mb-4" role="status">
            {params.check === "outdated" ? t.extension.outdated : t.extension.waiting}
          </Notice>
        )}
        {!ready && (
          <div className="mb-4">
            <ContinueWhen progress={setupProgress} want="extension" href={at("read", id)}>
              {t.extension.watching}
            </ContinueWhen>
          </div>
        )}
        <Card>
          <ol className="divide-y divide-line [counter-reset:step]">
            <ChromeSteps origin={await innkeepOrigin()} token={process.env.EXTENSION_TOKEN} />
          </ol>
        </Card>
        <p className="mt-4 text-[13px] text-muted">
          {t.extension.other}{" "}
          <a
            href="/extension"
            target="_blank"
            rel="noopener"
            className="font-medium text-ink underline underline-offset-2"
          >
            {t.extension.otherLink}
            <span className="sr-only"> {m.common.actions.newTab}</span>
          </a>
        </p>
      </Screen>
    );
  }

  if (step === "read") {
    const ready = status.state === "ready";
    return (
      <Screen
        step={step}
        title={t.read.title}
        intro={ready ? t.read.intro : t.read.noExtension}
        back={at("extension", id)}
        next={
          <Link href={at("done", id)} className={ready ? buttonClass() : primary}>
            {t.read.next}
          </Link>
        }
      >
        {ready && (
          <>
            <p>
              <Badge tone="good">{t.read.connected}</Badge>
            </p>
            <p className="mt-4 hidden flex-wrap gap-2 md:flex">
              <a href="/extension/start?scope=all" target="_blank" rel="noopener" className={primary}>
                {m.extension.prompt.refresh.everything}
                <span className="sr-only"> {m.common.actions.newTab}</span>
              </a>
              <a
                href="/extension/start?scope=reservations"
                target="_blank"
                rel="noopener"
                className={buttonClass()}
              >
                {m.extension.prompt.refresh.reservations}
                <span className="sr-only"> {m.common.actions.newTab}</span>
              </a>
            </p>
            <p className="mt-4 text-[13px] text-muted md:hidden">{m.extension.cta.computer}</p>
            <div className="mt-6 hidden md:block">
              <ContinueWhen progress={setupProgress} want="read" href={at("done", id)}>
                <strong className="font-medium">{t.read.keepOpen}</strong>
                <span className="mt-0.5 block text-muted">{t.read.keepOpenBody}</span>
              </ContinueWhen>
            </div>
          </>
        )}
      </Screen>
    );
  }

  const summary = await getSetupSummary(id);
  return (
    <Screen
      step={step}
      title={t.done.title(found.property.name)}
      intro={t.done.intro}
      back={at("read", id)}
      next={
        <Link href={`/properties/${id}`} className={primary}>
          {t.read.finish}
        </Link>
      }
    >
      <Card className="p-5">
        <p className="text-base font-semibold tracking-tight">{t.done.stays(summary.stays)}</p>
        {summary.named > 0 && <p className="mt-1 text-[13px] text-muted">{t.done.named(summary.named)}</p>}
        {summary.named < summary.stays || summary.stays === 0 ? (
          <p className="mt-3 text-[13px] leading-relaxed text-muted">{t.done.unnamed}</p>
        ) : null}
      </Card>
    </Screen>
  );
}
