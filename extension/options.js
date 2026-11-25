const form = document.getElementById("form");
const baseUrl = document.getElementById("baseUrl");
const token = document.getElementById("token");
const autoSend = document.getElementById("autoSend");
const result = document.getElementById("result");
const notify = document.getElementById("notify");
const notifyResult = document.getElementById("notifyResult");

chrome.storage.local.get(["baseUrl", "token", "autoSend", "notify"]).then((saved) => {
  autoSend.checked = saved.autoSend ?? true;
  notify.checked = saved.notify === true;
  baseUrl.value = saved.baseUrl ?? "";
  token.value = saved.token ?? "";
});

/**
 * Notifications are asked for here, on the click, because the browser only
 * shows its permission question in answer to one. Saved at once, without
 * "Save and test".
 */
notify.addEventListener("change", async () => {
  notifyResult.textContent = "";
  if (!notify.checked) {
    await chrome.storage.local.set({ notify: false });
    await chrome.runtime.sendMessage({ type: "innkeep:notify-setup" });
    return;
  }
  const granted = await chrome.permissions
    .request({ permissions: ["notifications", "alarms"] })
    .catch(() => false);
  if (!granted) {
    notify.checked = false;
    notifyResult.textContent = "This browser did not allow notifications for the extension.";
    return;
  }
  await chrome.storage.local.set({ notify: true });
  const response = await chrome.runtime.sendMessage({ type: "innkeep:notify-setup", test: true });
  notifyResult.textContent = response?.ok
    ? "Notifications are on. While the browser is open, the extension asks your Innkeep every five minutes."
    : (response?.error ?? "Could not reach Innkeep. Connect the extension first, then tick this box again.");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  let origin;
  try {
    origin = new URL(baseUrl.value).origin;
  } catch {
    result.textContent = "That address is not a valid URL.";
    return;
  }

  // Ask for access to this one address only. The port is left out: Safari
  // refuses a pattern that has one, and Chrome ignores it.
  const { protocol, hostname } = new URL(origin);
  const granted = await chrome.permissions
    .request({ origins: [`${protocol}//${hostname}/*`] })
    .catch(() => false);
  if (!granted) {
    result.textContent = "Permission to reach that address was declined.";
    return;
  }

  await chrome.storage.local.set({
    baseUrl: origin,
    token: token.value.trim(),
    autoSend: autoSend.checked,
  });
  result.textContent = "Testing…";
  const response = await chrome.runtime.sendMessage({ type: "innkeep:test" });
  if (!response?.ok) {
    result.textContent = response?.error ?? "Test failed.";
    return;
  }

  // Innkeep answers with the host's own reservations pages; opening one sends its rows.
  const links = Array.isArray(response.links) ? response.links : [];
  result.textContent = links.length
    ? "Connected. Now open your reservations: "
    : "Connected. Next, connect a calendar in ";
  const targets = links.length
    ? links.map((link) => ({ label: link.label, href: link.href }))
    : [{ label: "Innkeep", href: `${origin}/extension` }];
  targets.forEach((target, index) => {
    // Only pages on the platforms themselves, or the Innkeep just saved.
    if (
      !/^https:\/\/([a-z0-9-]+\.)*(airbnb\.[a-z.]+|booking\.com)\//.test(target.href) &&
      !target.href.startsWith(origin)
    )
      return;
    if (index > 0) result.append(", ");
    const anchor = document.createElement("a");
    anchor.href = target.href;
    anchor.target = "_blank";
    anchor.rel = "noopener";
    anchor.textContent = target.label;
    result.append(anchor);
  });
  result.append(".");
});
