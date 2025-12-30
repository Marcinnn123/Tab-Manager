export function renderStats(tabs) {
  const statsEl = document.getElementById("stats-content");

  const totalTabs = tabs.length;
  const domains = new Set(tabs.map(t => {
    try {
      return new URL(t.url).hostname;
    } catch {
      return "unknown";
    }
  }));

  const text = [
    `Total tabs: ${totalTabs}`,
    `Unique domains: ${domains.size}`
  ].join("\n");

  statsEl.textContent = text;
}
