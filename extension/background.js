/**
 * The only place that talks to the network, and only to the Innkeep address
 * the host saved in the settings. It also runs the two actions of the
 * toolbar popup: "update reservations" and "read everything".
 */
async function callInnkeep(method, path, body) {
  const { baseUrl, token } = await chrome.storage.local.get(["baseUrl", "token"]);
  if (!baseUrl || !token)
    return { ok: false, error: "Open the extension settings and connect your Innkeep first." };

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        // Lets Innkeep tell the host when this copy is too old to send everything.
        "X-Innkeep-Extension": chrome.runtime.getManifest().version,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, error: data.error ?? `Innkeep answered ${response.status}.` };
    return { ok: true, ...data };
  } catch {
    return { ok: false, error: `Could not reach Innkeep at ${baseUrl}. Is it running?` };
  }
}

const ALLOWED_PATHS = [
  "/api/ingest/reservations",
  "/api/ingest/listing",
  "/api/ingest/prices",
  "/api/ingest/quote",
  "/api/ingest/preview",
  "/api/ingest/reviews",
  "/api/ingest/page",
  "/api/ingest/messages",
];

/**
 * A run: one tab taken through a list of the host's own pages, one at a
 * time. It starts only from the popup, shows a banner with a Stop button on
 * every page, never clicks or types, and ends on Innkeep's Data page. Each
 * page gets a few seconds for the page scripts to read and send what it
 * shows; a page that sends nothing (signed out, or nothing to read) is
 * simply passed.
 */
const STEP_LIMIT_MS = 14_000;
/** After a page's last send, wait this long for another before moving on. */
const SETTLE_MS = 3_000;
/** Pages found in a site's own menu may be added to a run, up to this many. */
const MAX_FOUND = 15;

let tour = null;

const tourStatus = (tabId) =>
  tour
    ? {
        active: true,
        thisTab: tabId === tour.tabId,
        index: tour.index,
        total: tour.steps.length,
        label: tour.steps[tour.index]?.label ?? "",
        read: tour.steps.filter((step) => step.sent).length,
      }
    : { active: false, last: lastRun };

/** What the last run did, for the popup: how many pages gave data. */
let lastRun = null;

/**
 * @param {string} query  What to ask Innkeep for: "scope=…" from the popup, or the one-time "key=…" of a button in Innkeep.
 * @param {number} [tabId]  The tab to use; a new one when left out.
 */
async function startTour(query, tabId) {
  if (tour) return { ok: false, error: "A run is already going." };
  const plan = await callInnkeep("GET", `/api/extension/tour?${query}`);
  if (!plan.ok) return plan;
  if (!plan.steps?.length)
    return { ok: false, error: "Innkeep has no page to read yet. Add a listing first." };

  const first = { url: plan.steps[0].url, active: true };
  const tab = tabId == null ? await chrome.tabs.create(first) : await chrome.tabs.update(tabId, first);
  tour = { tabId: tab.id, steps: plan.steps, index: 0, found: 0, doneUrl: plan.doneUrl, timer: null };
  armTimer(STEP_LIMIT_MS);
  return { ok: true, total: plan.steps.length };
}

function armTimer(delay) {
  clearTimeout(tour.timer);
  tour.timer = setTimeout(nextStep, delay);
}

function nextStep() {
  if (!tour) return;
  tour.index++;
  if (tour.index >= tour.steps.length) return finishTour(true);
  chrome.tabs.update(tour.tabId, { url: tour.steps[tour.index].url }).catch(() => finishTour(false));
  armTimer(STEP_LIMIT_MS);
}

function finishTour(completed) {
  if (!tour) return;
  clearTimeout(tour.timer);
  const { tabId, steps, doneUrl } = tour;
  lastRun = {
    completed,
    total: steps.length,
    read: steps.filter((step) => step.sent).length,
    // Pages that gave nothing, so the host knows where to look (usually a sign-in).
    silent: steps.filter((step) => !step.sent).map((step) => step.label),
    at: Date.now(),
  };
  tour = null;
  // End on Innkeep, where the host sees what is now up to date.
  if (completed && doneUrl) chrome.tabs.update(tabId, { url: doneUrl }).catch(() => {});
}

/**
 * A button in Innkeep opens `<Innkeep>/extension/run?key=…`. The extension may
 * see addresses on the host's Innkeep (the one permission asked for at setup),
 * so it notices that page and starts the run in that same tab. The key is
 * made by Innkeep, works once, and is checked by Innkeep, not here.
 */
chrome.tabs.onUpdated.addListener(async (tabId, change, tab) => {
  const address = change.url ?? (change.status === "complete" ? tab.url : null);
  if (!address || tour) return;
  const { baseUrl } = await chrome.storage.local.get("baseUrl");
  if (!baseUrl || !address.startsWith(`${baseUrl}/extension/run?`)) return;
  const key = new URL(address).searchParams.get("key");
  if (key && /^[A-Za-z0-9_-]{10,60}$/.test(key)) await startTour(`key=${key}`, tabId);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tour?.tabId === tabId) finishTour(false);
});

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  const tabId = sender.tab?.id;
  switch (message?.type) {
    case "innkeep:send":
      if (!ALLOWED_PATHS.includes(message.path)) return false;
      callInnkeep("POST", message.path, message.payload).then((result) => {
        // During a run, a page that sent something has done its job: move on once it goes quiet.
        if (tour && tabId === tour.tabId && result.ok) {
          tour.steps[tour.index].sent = true;
          armTimer(SETTLE_MS);
        }
        respond(result);
      });
      return true;

    case "innkeep:close-tab":
      // Only ever closes the tab that asked, and never the tab of a run.
      if (tabId != null && tabId !== tour?.tabId) chrome.tabs.remove(tabId);
      return false;

    case "innkeep:test":
      callInnkeep("GET", ALLOWED_PATHS[0]).then(respond);
      return true;

    case "innkeep:tour-start":
      // Only the extension's own popup may start a run, never a web page.
      if (sender.tab) return false;
      startTour(`scope=${message.scope === "reservations" ? "reservations" : "all"}`).then(respond);
      return true;

    case "innkeep:tour-status":
      respond(tourStatus(tabId));
      return false;

    case "innkeep:tour-stop":
      finishTour(false);
      respond({ ok: true });
      return false;

    case "innkeep:tour-found": {
      // A site's own menu, seen during a run: add its pages once, same site only.
      if (!tour || tabId !== tour.tabId || !Array.isArray(message.pages)) return false;
      const origin = new URL(sender.url ?? sender.tab.url).origin;
      for (const page of message.pages) {
        if (tour.found >= MAX_FOUND) break;
        if (typeof page?.url !== "string" || !page.url.startsWith(`${origin}/`)) continue;
        const path = new URL(page.url).pathname;
        if (tour.steps.some((step) => new URL(step.url).pathname === path)) continue;
        tour.steps.push({ url: page.url, label: String(page.label ?? path).slice(0, 80) });
        tour.found++;
      }
      return false;
    }

    default:
      return false;
  }
});
