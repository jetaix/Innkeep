import type { Metadata } from "next";
import Link from "next/link";
import { site, takesAccessRequests } from "@/config/site";
import { pillClass, SiteFooter, SiteHeader } from "@/features/marketing/site-chrome";
import { getI18n } from "@/i18n/server";
import { cn } from "@/lib/cn";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await getI18n()).m.ai;
  return {
    title: t.title,
    description: t.description,
    alternates: { canonical: "/ai" },
    openGraph: { title: t.title, description: t.description, url: "/ai" },
  };
}

const H2 = "font-display text-3xl leading-[1.06] tracking-[-0.025em] text-balance sm:text-5xl";
const COMMAND = `claude mcp add --transport http innkeep https://your-innkeep/api/mcp \\
  --header "Authorization: Bearer YOUR_MCP_TOKEN"`;
const CONFIG = JSON.stringify(
  {
    mcpServers: {
      innkeep: {
        type: "http",
        url: "https://your-innkeep/api/mcp",
        headers: { Authorization: "Bearer YOUR_MCP_TOKEN" },
      },
    },
  },
  null,
  2,
);

/** The public AI page: the MCP server, how to connect an assistant, and where it stops. */
export default async function AiPage() {
  const t = (await getI18n()).m.ai;
  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative isolate">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[46rem] overflow-x-clip"
          >
            <span className="glass glass-arch plane top-28 -left-24 h-[26rem] w-56 -rotate-12 [--drift:-120px] [--g:var(--glass-blue)] max-sm:top-[30rem] max-sm:-left-32 max-sm:h-64 max-sm:w-40" />
            <span className="glass glass-arch plane -top-10 -right-24 h-[30rem] w-64 rotate-[16deg] [--drift:-160px] [--g:var(--overlap)] max-sm:h-56 max-sm:w-40" />
          </div>

          <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-5 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[1fr_1.05fr]">
            <div>
              <h1 className="max-w-[14ch] font-display text-5xl leading-none tracking-[-0.035em] text-balance sm:text-7xl">
                {t.heading}
              </h1>
              <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-pretty text-muted">{t.lead}</p>
              <p className="mt-5 text-[15px] text-overlap">{t.wink}</p>
            </div>

            <figure aria-label={t.talk.label} className="panel rounded-[1.75rem] p-5 sm:p-7">
              <ol className="space-y-5">
                {t.talk.turns.map((turn) => (
                  <li key={turn.ask} className="space-y-2.5">
                    <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-[15px] leading-snug text-inverse">
                      <span className="sr-only">{t.talk.you}: </span>
                      {turn.ask}
                    </p>
                    <div className="max-w-[92%]">
                      <p className="font-mono text-xs text-overlap">{turn.tool}</p>
                      <p className="mt-1 text-[15px] leading-relaxed">
                        <span className="sr-only">{t.talk.assistant}: </span>
                        {turn.answer}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <figcaption className="mt-6 border-t border-line pt-3 text-xs text-muted">
                {t.talk.example}
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-5 pt-32 sm:px-8 sm:pt-44 md:grid-cols-[1fr_1.3fr]">
          <div>
            <h2 className={H2}>{t.tools.title}</h2>
            <p className="mt-6 max-w-[44ch] text-lg leading-relaxed text-muted">{t.tools.intro}</p>
          </div>
          <dl className="divide-y divide-line border-y border-line">
            {t.tools.items.map((tool) => (
              <div key={tool.name} className="py-6">
                <dt className="flex flex-wrap items-center gap-3">
                  <code className="font-mono text-[15px]">{tool.name}</code>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      tool.kind === "write" ? "bg-critical-bg text-overlap" : "bg-sunken text-muted",
                    )}
                  >
                    {tool.kind === "write" ? t.tools.writes : t.tools.reads}
                  </span>
                </dt>
                <dd className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-muted">{tool.body}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="connect" className="mx-auto max-w-6xl scroll-mt-24 px-5 pt-32 sm:px-8 sm:pt-44">
          <div className="field rounded-[2.5rem] px-5 py-14 [--g:var(--glass-blue)] sm:px-14 sm:py-20">
            <span
              aria-hidden
              className="glass glass-arch -top-24 -right-10 -z-10 h-80 w-56 rotate-[24deg] [--g:var(--glass-blue)] max-sm:hidden"
            />
            <div className="max-w-2xl">
              <h2 className={H2}>{t.connect.title}</h2>
              <p className="mt-6 max-w-[54ch] text-lg leading-relaxed text-pretty text-[color-mix(in_oklab,var(--ink)_72%,var(--g))]">
                {t.connect.intro}
              </p>
            </div>
            <ol className="panel mt-12 rounded-[1.75rem] px-6 py-2 sm:px-10">
              {t.connect.steps.map((step, index) => (
                <li key={step.title} className="border-b border-line py-7 last:border-b-0">
                  <h3 className="font-display text-xl tracking-[-0.01em]">
                    <span className="mr-2 text-overlap tabular-nums">{index + 1}.</span>
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-muted">{step.body}</p>
                  {index === 1 && (
                    <>
                      <pre className="relative mt-4 overflow-x-auto rounded-xl bg-subtle p-4 font-mono text-[13px] leading-6">
                        <code>{COMMAND}</code>
                      </pre>
                      <p className="mt-5 max-w-[62ch] text-[15px] leading-relaxed text-muted">
                        {t.connect.other}
                      </p>
                      <pre className="relative mt-3 overflow-x-auto rounded-xl bg-subtle p-4 font-mono text-[13px] leading-6">
                        <code>{CONFIG}</code>
                      </pre>
                      <p className="mt-4 max-w-[62ch] text-[13px] leading-relaxed text-muted">
                        {t.connect.desktop}
                      </p>
                    </>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-5 pt-32 sm:px-8 sm:pt-44 md:grid-cols-[1fr_1.3fr]">
          <h2 className={H2}>{t.limits.title}</h2>
          <dl className="divide-y divide-line border-y border-line">
            {t.limits.items.map((item) => (
              <div key={item.term} className="py-6">
                <dt className="font-display text-xl tracking-[-0.01em]">{item.term}</dt>
                <dd className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-muted">{item.body}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mx-auto max-w-6xl px-5 pt-32 sm:px-8 sm:pt-44">
          <h2 className={cn(H2, "max-w-[18ch]")}>{t.also.title}</h2>
          <dl className="mt-10 grid grid-cols-1 gap-x-16 gap-y-8 md:grid-cols-2">
            <div>
              <dt className="font-display text-xl tracking-[-0.01em]">{t.also.advice.term}</dt>
              <dd className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-muted">
                {t.also.advice.body}
              </dd>
            </div>
            <div>
              <dt className="font-display text-xl tracking-[-0.01em]">{t.also.install.term}</dt>
              <dd className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-muted">
                {t.also.install.body}{" "}
                <Link
                  href="/#install"
                  className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
                >
                  {t.also.install.link}
                </Link>
              </dd>
            </div>
          </dl>
        </section>

        <section className="mx-auto mt-32 max-w-6xl px-5 sm:mt-44 sm:px-8">
          <div className="field rounded-[2.5rem] px-6 py-20 text-center [--g:var(--overlap)] sm:py-28">
            <span
              aria-hidden
              className="glass glass-pill -top-10 right-[10%] -z-10 h-24 w-64 rotate-12 [--g:var(--glass-blue)] max-sm:-right-20"
            />
            <h2 className={cn(H2, "mx-auto max-w-[16ch]")}>{t.cta.title}</h2>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              {takesAccessRequests && (
                <Link href="/#access" className={pillClass("primary", "lg")}>
                  {t.cta.access}
                </Link>
              )}
              <a href={site.repo} className={pillClass(takesAccessRequests ? "secondary" : "primary", "lg")}>
                {t.cta.self}
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
