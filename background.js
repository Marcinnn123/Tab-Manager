browser.runtime.onInstalled.addListener(() => {
  console.log("Tab Manager Pro installed successfully!");
  updateBadge();
});

async function updateBadge() {
  const tabs = await browser.tabs.query({});
  browser.browserAction.setBadgeText({ text: String(tabs.length) });
  browser.browserAction.setBadgeBackgroundColor({ color: "#3b82f6" });
}

browser.tabs.onCreated.addListener(updateBadge);
browser.tabs.onRemoved.addListener(updateBadge);

/* ==============================
   BLOCK EXPIRY NOTIFICATIONS
============================== */
const blockTimers = new Map();

function scheduleBlockNotifications(blockedDomains) {
  blockTimers.forEach(id => clearTimeout(id));
  blockTimers.clear();

  const now = Date.now();
  blockedDomains.forEach(item => {
    if (!item.blockedUntil) return;
    const remaining = item.blockedUntil - now;
    if (remaining <= 0) return;

    const timerId = setTimeout(() => {
      browser.notifications.create({
        type: "basic",
        iconUrl: "icon48.png",
        title: "Block expired",
        message: `${item.domain} is now unblocked.`
      });
      blockTimers.delete(item.domain);
    }, remaining);

    blockTimers.set(item.domain, timerId);
  });
}

browser.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.blockedDomains) {
    scheduleBlockNotifications(changes.blockedDomains.newValue || []);
  }
});

browser.storage.local.get("blockedDomains").then(data => {
  scheduleBlockNotifications(data.blockedDomains || []);
});
  