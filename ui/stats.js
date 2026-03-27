export function renderStats(tabs) {
  const statsEl = document.getElementById("stats-content");
  statsEl.innerHTML = "";

  const domainMap = new Map();
  tabs.forEach(t => {
    let host;
    try {
      const url = new URL(t.url);
      if (!["http:", "https:"].includes(url.protocol)) return;
      host = url.hostname;
    } catch { return; }
    domainMap.set(host, (domainMap.get(host) || 0) + 1);
  });

  const totalTabs = [...domainMap.values()].reduce((a, b) => a + b, 0);

  const topDomains = [...domainMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Summary cards
  const cards = document.createElement("div");
  cards.className = "stats-cards";

  const makeCard = (label, value) => {
    const card = document.createElement("div");
    card.className = "stats-card";
    card.innerHTML = `<span class="stats-value">${value}</span><span class="stats-label">${label}</span>`;
    return card;
  };

  cards.appendChild(makeCard("Total tabs", totalTabs));
  cards.appendChild(makeCard("Unique domains", domainMap.size));
  statsEl.appendChild(cards);

  // Top domains
  if (topDomains.length > 0) {
    const title = document.createElement("p");
    title.className = "stats-section-title";
    title.textContent = "Top domains";
    statsEl.appendChild(title);

    const list = document.createElement("ul");
    list.className = "stats-domain-list";

    topDomains.forEach(([domain, count]) => {
      const li = document.createElement("li");

      const name = document.createElement("span");
      name.textContent = domain;

      const bar = document.createElement("div");
      bar.className = "stats-bar-wrap";

      const fill = document.createElement("div");
      fill.className = "stats-bar-fill";
      fill.style.width = `${Math.round((count / totalTabs) * 100)}%`;

      const num = document.createElement("span");
      num.className = "stats-bar-num";
      num.textContent = count;

      bar.appendChild(fill);
      li.appendChild(name);
      li.appendChild(bar);
      li.appendChild(num);
      list.appendChild(li);
    });

    statsEl.appendChild(list);
  }
}
