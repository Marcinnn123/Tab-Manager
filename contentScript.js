// contentScript.js
const BLOCKED_KEY = "blockedDomains";
const domain = location.hostname;

let overlay = null;
let countdownInterval = null;

/* ==============================
   HELPERS
============================== */
function getBlockEntry(blockedDomains) {
  const now = Date.now();

  return blockedDomains.find(item => {
    if (!item || !item.domain) return false;

    const matchesDomain =
      domain === item.domain || domain.endsWith("." + item.domain);

    const stillActive =
      item.blockedUntil === null || item.blockedUntil > now;

    return matchesDomain && stillActive;
  }) || null;
}

function formatRemaining(ms) {
  if (ms <= 0) return "0 min";

  const totalSeconds = Math.ceil(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds} s`;

  const minutes = Math.ceil(ms / 60000);
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

/* ==============================
   OVERLAY
============================== */
function createOverlay(blockedUntil) {
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
      <p id="tmb-domain" style="opacity:.8;margin-bottom:6px;"></p>
      <small style="opacity:.6;">
        ${blockedUntil === null
          ? "Blocked forever"
          : `Unblocks in <span id="tmb-countdown">${formatRemaining(blockedUntil - Date.now())}</span>`
        }
      </small>
    </div>
  `;

  overlay.querySelector("#tmb-domain").textContent = domain;

  document.documentElement.appendChild(overlay);
  document.body.style.overflow = "hidden";

  if (blockedUntil !== null) {
    startCountdown(blockedUntil);
  }
}

function removeOverlay() {
  if (!overlay) return;

  clearInterval(countdownInterval);
  countdownInterval = null;
  overlay.remove();
  overlay = null;
  document.body.style.overflow = "";
}

function startCountdown(blockedUntil) {
  clearInterval(countdownInterval);

  countdownInterval = setInterval(() => {
    const remaining = blockedUntil - Date.now();

    if (remaining <= 0) {
      removeOverlay();
      return;
    }

    const el = document.getElementById("tmb-countdown");
    if (el) el.textContent = formatRemaining(remaining);
  }, 1000);
}

/* ==============================
   INITIAL CHECK
============================== */
browser.storage.local.get(BLOCKED_KEY).then(data => {
  const blocked = data[BLOCKED_KEY] || [];
  const entry = getBlockEntry(blocked);
  if (entry) createOverlay(entry.blockedUntil);
});

/* ==============================
   LIVE UPDATES (NO REFRESH)
============================== */
browser.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes[BLOCKED_KEY]) return;

  const blocked = changes[BLOCKED_KEY].newValue || [];
  const entry = getBlockEntry(blocked);

  if (entry) {
    removeOverlay();
    createOverlay(entry.blockedUntil);
  } else {
    removeOverlay();
  }
});
