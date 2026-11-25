/**
 * The only place that talks to the network, and only to the Innkeep address
 * the host saved in the settings. It also runs the two actions of the
 * toolbar popup: "update reservations" and "read everything".
 */
async function callInnkeep(method, path, body) {
  const { baseUrl, token } = await chrome.storage.local.get(["baseUrl", "token"]);
  if (!baseUrl || !token)
    return {
      ok: false,
      reconnect: true,
      error: "This extension is not connected to your Innkeep yet.",
    };

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
    if (response.status === 401) {
      // Innkeep's own refusal is JSON; anything else is a sign-in wall in front of it.
      return data.error
        ? {
            ok: false,
            reconnect: true,
            error:
              "Innkeep refused this extension's token: it no longer matches the one in Innkeep. Reconnect with the current token.",
          }
        : {
            ok: false,
            error: `Something in front of Innkeep at ${baseUrl} asks for a sign-in, so the extension cannot reach it. Turn that protection off for this address.`,
          };
    }
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
  const steps = plan.steps ?? [];
  if (!steps.length) return { ok: false, error: "Innkeep has no page to read yet. Add a listing first." };

  const first = { url: steps[0].url, active: true };
  const tab = tabId == null ? await chrome.tabs.create(first) : await chrome.tabs.update(tabId, first);
  tour = {
    tabId: tab.id,
    steps,
    index: 0,
    found: 0,
    turnedAway: new Set(),
    doneUrl: plan.doneUrl,
    timer: null,
  };
  armTimer(STEP_LIMIT_MS);
  return { ok: true, total: plan.steps.length };
}

function armTimer(delay) {
  clearTimeout(tour.timer);
  tour.timer = setTimeout(nextStep, delay);
}

/**
 * Sites that answer a page the host may not see with their sign-in page. A
 * step there that never showed the page it asked for was sent to sign in;
 * asking for the next ones would only do it again, page after page, and can
 * end the host's session. The rest of that site is left for another run.
 */
const SIGN_IN_WALLED = ["admin.booking.com"];
const hostOf = (url) => new URL(url).hostname;

function leaveSiteIfTurnedAway() {
  const step = tour.steps[tour.index];
  const host = step ? hostOf(step.url) : null;
  if (!step || step.arrived || !SIGN_IN_WALLED.includes(host)) return;
  tour.turnedAway.add(host);
  tour.steps = tour.steps.filter((other, index) => index <= tour.index || hostOf(other.url) !== host);
}

function nextStep() {
  if (!tour) return;
  leaveSiteIfTurnedAway();
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
    // Sites that asked the host to sign in: their remaining pages were not tried.
    turnedAway: [...tour.turnedAway],
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

    case "innkeep:open-settings":
      chrome.runtime.openOptionsPage();
      return false;

    case "innkeep:test":
      callInnkeep("GET", ALLOWED_PATHS[0]).then(respond);
      return true;

    case "innkeep:tour-start":
      // Only the extension's own popup may start a run, never a web page.
      if (sender.tab) return false;
      startTour(`scope=${message.scope === "reservations" ? "reservations" : "all"}`).then(respond);
      return true;

    case "innkeep:tour-status": {
      // A page script asking is a page that loaded: the step reached the site it was meant for.
      const step = tour && tabId === tour.tabId ? tour.steps[tour.index] : null;
      // Safari may leave `sender.url` out; the tab's address says the same thing.
      const from = sender.url ?? sender.tab?.url;
      if (step && from && hostOf(from) === hostOf(step.url)) step.arrived = true;
      respond(tourStatus(tabId));
      return false;
    }

    case "innkeep:tour-stop":
      finishTour(false);
      respond({ ok: true });
      return false;

    case "innkeep:tour-found": {
      // A site's own menu, seen during a run: add its pages once, same site only.
      if (!tour || tabId !== tour.tabId || !Array.isArray(message.pages)) return false;
      const origin = new URL(sender.url ?? sender.tab.url).origin;
      for (const page of message.pages) {
        if (typeof page?.url !== "string" || !page.url.startsWith(`${origin}/`)) continue;
        if (tour.turnedAway.has(hostOf(page.url))) continue;
        if (tour.found >= MAX_FOUND) break;
        const path = new URL(page.url).pathname;
        if (tour.steps.some((step) => new URL(step.url).pathname === path)) continue;
        tour.steps.push({ url: page.url, label: String(page.label ?? path).slice(0, 80) });
        tour.found++;
      }
      return false;
    }

    case "innkeep:notify-setup":
      // Only the extension's own settings page may switch notifications.
      if (sender.tab && !sender.url?.startsWith(chrome.runtime.getURL(""))) return false;
      setUpNotifications(message.test === true).then(respond);
      return true;

    default:
      return false;
  }
});

/**
 * Notifications, when the host ticked the box in the settings. The extension
 * asks its Innkeep, and nothing else, what happened to the reservations since
 * the last time, every few minutes while the browser is open. Innkeep words
 * the notifications; a click on one opens the Reservations page.
 */
const NOTIFY_ALARM = "innkeep:events";
const NOTIFY_EVERY_MINUTES = 5;
const language = () => chrome.i18n.getUILanguage().slice(0, 2);

let listening = false;
/** `alarms` and `notifications` only exist once the host allowed them, which can be after start-up. */
function listenForNotifications() {
  if (listening || !chrome.alarms || !chrome.notifications) return;
  listening = true;
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === NOTIFY_ALARM) void checkEvents();
  });
  chrome.notifications.onClicked.addListener(async (id) => {
    if (!id.startsWith("innkeep:")) return;
    chrome.notifications.clear(id);
    const { baseUrl } = await chrome.storage.local.get("baseUrl");
    if (baseUrl) chrome.tabs.create({ url: `${baseUrl}/reservations` });
  });
}

function show(id, title, message) {
  chrome.notifications.create(`innkeep:${id}`, {
    type: "basic",
    iconUrl: chrome.runtime.getURL("icons/icon-128.png"),
    title,
    message,
  });
}

/** Starts or stops the regular check, to match the setting. */
async function setUpNotifications(test = false) {
  const { notify } = await chrome.storage.local.get("notify");
  if (!chrome.alarms || !chrome.notifications) return { ok: false };
  if (!notify) {
    await chrome.alarms.clear(NOTIFY_ALARM);
    return { ok: true };
  }
  listenForNotifications();
  // Start from now: nobody wants a notification for each stay already in Innkeep.
  const start = await callInnkeep("GET", `/api/extension/events?lang=${language()}`);
  if (start.ok) {
    await chrome.storage.local.set({ eventCursor: start.last });
    if (test && start.test) show("test", start.test.title, start.test.body);
  }
  await chrome.alarms.create(NOTIFY_ALARM, { periodInMinutes: NOTIFY_EVERY_MINUTES });
  return start.ok ? { ok: true } : { ok: false, error: start.error };
}

async function checkEvents() {
  const { notify, eventCursor } = await chrome.storage.local.get(["notify", "eventCursor"]);
  if (!notify || !chrome.notifications) return;
  if (typeof eventCursor !== "number") return void setUpNotifications();
  const news = await callInnkeep("GET", `/api/extension/events?after=${eventCursor}&lang=${language()}`);
  if (!news.ok || !Array.isArray(news.notifications)) return;
  for (const item of news.notifications) show(item.id, String(item.title), String(item.body));
  if (typeof news.last === "number") await chrome.storage.local.set({ eventCursor: news.last });
}

// The browser wakes this script for an alarm, so the listeners must be in place as soon as it loads.
listenForNotifications();
