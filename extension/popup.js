const reservations = document.getElementById("reservations");
const everything = document.getElementById("everything");
const stop = document.getElementById("stop");
const status = document.getElementById("status");
const progress = document.getElementById("progress");
const booking = document.getElementById("booking");
const bookingAway = document.getElementById("bookingAway");

/** The hour a run ended, as this browser writes hours. */
function hour(at) {
  const when = document.createElement("time");
  when.id = "when";
  when.dateTime = new Date(at).toISOString();
  when.textContent = new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return when;
}

function show(state) {
  const running = Boolean(state?.active);
  reservations.disabled = everything.disabled = running;
  stop.hidden = !running;
  progress.hidden = !running;
  // Booking.com's slab is hatched after a run it turned away, until the next one starts.
  const away = !running && Boolean(state?.last?.turnedAway?.includes("admin.booking.com"));
  booking.classList.toggle("away", away);
  bookingAway.hidden = !away;
  if (running) {
    progress.setAttribute("aria-valuemax", state.total);
    progress.setAttribute("aria-valuenow", state.index + 1);
    progress.firstElementChild.style.width = `${((state.index + 1) / state.total) * 100}%`;
    status.textContent = `Reading page ${state.index + 1} of ${state.total}: ${state.label}`;
  } else if (state?.last) {
    const { read, total, silent, completed, turnedAway = [], at } = state.last;
    status.textContent =
      `${completed ? "Last run" : "Last run (stopped)"}: ${read} of ${total} pages gave data.` +
      (silent.length
        ? ` Nothing from: ${silent.slice(0, 4).join(", ")}${silent.length > 4 ? "…" : ""}.`
        : "") +
      (turnedAway.includes("admin.booking.com")
        ? " Booking.com asked you to sign in, so its other pages were skipped. Sign in there, then run again."
        : "");
    if (at) status.append(" ", hour(at));
  }
}

async function refresh() {
  show(await chrome.runtime.sendMessage({ type: "innkeep:tour-status" }));
}

async function start(scope) {
  status.textContent = "Starting…";
  const result = await chrome.runtime.sendMessage({ type: "innkeep:tour-start", scope });
  if (!result?.ok) {
    status.textContent = result?.error ?? "Could not start.";
    // A refused or missing token is fixed in the settings: take the host there.
    if (result?.reconnect) chrome.runtime.openOptionsPage();
  } else refresh();
}

reservations.addEventListener("click", () => start("reservations"));
everything.addEventListener("click", () => start("all"));
stop.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "innkeep:tour-stop" });
  refresh();
});
document.getElementById("settings").addEventListener("click", () => chrome.runtime.openOptionsPage());

refresh();
setInterval(refresh, 1500);
