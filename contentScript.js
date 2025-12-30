// contentScript.js
const BLOCKED_KEY = "blockedDomains";
const domain = location.hostname;

let overlay = null;

function isDomainBlocked(blockedDomains) {
  return blockedDomains.some(blocked =>
    domain === blocked || domain.endsWith("." + blocked)
  );
}

function showOverlay() {
  if (overlay) return;

  overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.background = "rgba(0,0,0,0.85)";
  overlay.style.zIndex = "999999";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.color = "#fff";
  overlay.style.fontSize = "24px";
  overlay.style.fontFamily = "sans-serif";
  overlay.style.textAlign = "center";

  overlay.innerHTML = `
    <div>
      <p>This site is blocked</p>
      <small>${domain}</small>
    </div>
  `;

  document.documentElement.appendChild(overlay);
  document.body.style.overflow = "hidden";
}

function hideOverlay() {
  if (!overlay) return;

  overlay.remove();
  overlay = null;
  document.body.style.overflow = "";
}

browser.storage.local.get(BLOCKED_KEY).then(data => {
  const blockedDomains = data[BLOCKED_KEY] || [];
  if (isDomainBlocked(blockedDomains)) {
    showOverlay();
  }
});

browser.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes[BLOCKED_KEY]) return;

  const newBlockedDomains = changes[BLOCKED_KEY].newValue || [];

  if (isDomainBlocked(newBlockedDomains)) {
    showOverlay();
  } else {
    hideOverlay();
  }
});
