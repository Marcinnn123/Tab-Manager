// contentScript.js
const BLOCKED_KEY = "blockedDomains";
const domain = location.hostname;

let overlay = null;

/* ==============================
   HELPERS
============================== */
function isBlocked(blockedDomains) {
  const now = Date.now();

  return blockedDomains.some(item => {
    if (!item || !item.domain) return false;

    const matchesDomain =
      domain === item.domain || domain.endsWith("." + item.domain);

    const stillActive =
      item.blockedUntil === null || item.blockedUntil > now;

    return matchesDomain && stillActive;
  });
}

function createOverlay() {
  if (overlay) return;

  overlay = document.createElement("div");
  overlay.id = "tab-manager-block-overlay";

  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    background: "rgba(0,0,0,0.85)",
    zIndex: "999999",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontFamily: "Inter, sans-serif",
    textAlign: "center"
  });

  overlay.innerHTML = `
    <div style="
      background:#111827;
      padding:24px;
      border-radius:16px;
      max-width:320px;
    ">
      <h2 style="margin-bottom:8px;font-size:18px;">Site blocked</h2>
      <p style="opacity:.8;margin-bottom:6px;">${domain}</p>
      <small style="opacity:.6;">
        This site is currently blocked
      </small>
    </div>
  `;

  document.documentElement.appendChild(overlay);
  document.body.style.overflow = "hidden";
}

function removeOverlay() {
  if (!overlay) return;

  overlay.remove();
  overlay = null;
  document.body.style.overflow = "";
}

/* ==============================
   INITIAL CHECK
============================== */
browser.storage.local.get(BLOCKED_KEY).then(data => {
  const blocked = data[BLOCKED_KEY] || [];
  if (isBlocked(blocked)) {
    createOverlay();
  }
});

/* ==============================
   LIVE UPDATES (NO REFRESH)
============================== */
browser.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes[BLOCKED_KEY]) return;

  const blocked = changes[BLOCKED_KEY].newValue || [];

  if (isBlocked(blocked)) {
    createOverlay();
  } else {
    removeOverlay();
  }
});

/* ==============================
   AUTO UNBLOCK TIMER
   (in case block expires without storage change)
============================== */
setInterval(async () => {
  const data = await browser.storage.local.get(BLOCKED_KEY);
  const blocked = data[BLOCKED_KEY] || [];

  if (isBlocked(blocked)) {
    createOverlay();
  } else {
    removeOverlay();
  }
}, 30 * 1000); // check every 30s
