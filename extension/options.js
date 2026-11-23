const form = document.getElementById("form");
const baseUrl = document.getElementById("baseUrl");
const token = document.getElementById("token");
const autoSend = document.getElementById("autoSend");
const result = document.getElementById("result");

chrome.storage.local.get(["baseUrl", "token", "autoSend"]).then((saved) => {
  autoSend.checked = saved.autoSend ?? true;
  baseUrl.value = saved.baseUrl ?? "";
  token.value = saved.token ?? "";
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

  // Ask for access to this one address only.
  const granted = await chrome.permissions.request({ origins: [`${origin}/*`] });
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
