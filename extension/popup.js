const reservations = document.getElementById("reservations");
const everything = document.getElementById("everything");
const stop = document.getElementById("stop");
const status = document.getElementById("status");

function show(state) {
  const running = Boolean(state?.active);
  reservations.disabled = everything.disabled = running;
  stop.hidden = !running;
  if (running) {
    status.textContent = `Reading page ${state.index + 1} of ${state.total}: ${state.label}`;
  } else if (state?.last) {
    const { read, total, silent, completed, turnedAway = [] } = state.last;
    status.textContent =
      `${completed ? "Last run" : "Last run (stopped)"}: ${read} of ${total} pages gave data.` +
      (silent.length
        ? ` Nothing from: ${silent.slice(0, 4).join(", ")}${silent.length > 4 ? "…" : ""}.`
        : "") +
      (turnedAway.includes("admin.booking.com")
        ? " Booking.com asked you to sign in, so its other pages were skipped. Sign in there, then run again."
        : "");
  }
}

async function refresh() {
  show(await chrome.runtime.sendMessage({ type: "innkeep:tour-status" }));
}

async function start(scope) {
  status.textContent = "Starting…";
  const result = await chrome.runtime.sendMessage({ type: "innkeep:tour-start", scope });
  if (!result?.ok) status.textContent = result?.error ?? "Could not start.";
  else refresh();
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
