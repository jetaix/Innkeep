import { Download as DownloadIcon } from "lucide-react";
import { headers } from "next/headers";
import path from "node:path";
import type { ReactNode } from "react";
import { CopyButton } from "@/components/ui/actions";
import { buttonClass } from "@/components/ui/button";
import { getI18n } from "@/i18n/server";
import manifest from "../../../extension/manifest.json";
import { isHosted, storeUrl } from "./install";

export { isHosted, storeUrl };

/** The pieces of the extension's setup guide, shared by its own page and by the "Add a property" guide. */

/** The address the host's browser reaches this Innkeep at: what the extension must be given. */
export async function innkeepOrigin() {
  const requestHeaders = await headers();
  return (
    process.env.APP_URL?.replace(/\/$/, "") ??
    `${requestHeaders.get("x-forwarded-proto") ?? "http"}://${requestHeaders.get("host")}`
  );
}

export function Copyable({ value, label, secret }: { value: string; label: string; secret?: boolean }) {
  return (
    <span className="mt-2 flex items-center gap-2">
      <code className="min-w-0 flex-1 truncate rounded-md bg-sunken px-2 py-1.5 font-mono text-xs">
        {secret ? "•".repeat(24) : value}
      </code>
      <CopyButton value={value} label={label} />
    </span>
  );
}

export function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li className="flex gap-3 px-5 py-4 [counter-increment:step]">
      <span
        aria-hidden
        className="flex size-5 shrink-0 items-center justify-center rounded-full bg-sunken text-[11px] font-semibold tabular-nums before:content-[counter(step)]"
      />
      <div className="min-w-0 flex-1">
        <h3 className="font-medium">{title}</h3>
        <div className="mt-1 text-[13px] leading-relaxed text-muted">{children}</div>
      </div>
    </li>
  );
}

/** The address and the token to paste in the extension's settings. */
export async function Credentials({ origin, token }: { origin: string; token: string | undefined }) {
  const s = (await getI18n()).m.extension.setup;
  return (
    <>
      <Copyable value={origin} label={s.copyAddress} />
      {token ? (
        <Copyable value={token} label={s.copyToken} secret />
      ) : (
        <span className="mt-2 block text-xs">{s.connect.tokenMissing}</span>
      )}
    </>
  );
}

/** The steps that put the extension in Chrome and connect it, as items of a numbered list. */
export async function ChromeSteps({ origin, token }: { origin: string; token: string | undefined }) {
  const { m } = await getI18n();
  const s = m.extension.setup;
  const newTab = m.common.actions.newTab;
  const hosted = isHosted();
  const folder = path.join(process.cwd(), "extension");
  const store = storeUrl();
  return (
    <>
      {!token && (
        <Step title={s.switchOn.title}>
          {s.switchOn.before} <code className="font-mono text-xs text-ink">EXTENSION_TOKEN=</code>{" "}
          {s.switchOn.middle} <code className="font-mono text-xs text-ink">.env.local</code>
          {s.switchOn.after}
        </Step>
      )}
      {store ? (
        <Step title={s.store.title}>
          {s.store.body}
          <span className="mt-2 block">
            <a
              href={store}
              target="_blank"
              rel="noopener"
              className={buttonClass({ size: "sm", variant: "primary" })}
            >
              {s.store.button}
              <span className="sr-only"> {newTab}</span>
            </a>
          </span>
        </Step>
      ) : (
        <>
          <Step title={s.openPage.title}>
            {s.openPage.before} <strong className="font-medium text-ink">{s.openPage.strong}</strong>{" "}
            {s.openPage.after}
            <Copyable value="chrome://extensions" label={s.copyAddress} />
          </Step>
          <Step title={s.load.title}>
            {s.load.before} <strong className="font-medium text-ink">{s.load.strong}</strong>{" "}
            {hosted ? s.load.afterHosted : s.load.after}
            {!hosted && <Copyable value={folder} label={s.copyPath} />}
            {!hosted && <span className="mt-3 block text-xs">{s.load.elsewhere}</span>}
            <Download />
          </Step>
        </>
      )}
      <Step title={s.pin.title}>{s.pin.body}</Step>
      <Step title={s.connect.title}>
        {s.connect.before} <strong className="font-medium text-ink">{s.connect.settings}</strong>{" "}
        {s.connect.middle} <strong className="font-medium text-ink">{s.connect.strong}</strong>
        {s.connect.after}
        <Credentials origin={origin} token={token} />
      </Step>
    </>
  );
}

/** The extension as a ZIP, written to `public/` by `scripts/zip-extension.mjs` before each build. */
export async function Download() {
  const s = (await getI18n()).m.extension.setup;
  return (
    <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
      <a
        href="/innkeep-extension.zip"
        download={`innkeep-extension-${manifest.version}.zip`}
        className={buttonClass({ size: "sm", variant: "primary" })}
      >
        <DownloadIcon aria-hidden />
        {s.download(manifest.version)}
      </a>
      <span className="text-xs text-muted">{s.downloadHint}</span>
    </span>
  );
}
