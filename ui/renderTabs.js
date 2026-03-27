export function renderTabs(groupedTabs, blockedSet, { onCloseTab, onAddBlocked }) {
  const list = document.getElementById("tab-list");
  list.innerHTML = "";

  if (Object.keys(groupedTabs).length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No tabs open.";
    list.appendChild(empty);
    return;
  }

  Object.entries(groupedTabs).forEach(([domain, tabs]) => {
    const card = document.createElement("li");
    card.className = "domain-card";

    const header = document.createElement("div");
    header.className = "domain-header";

    const title = document.createElement("span");
    title.className = "domain-title";
    title.textContent = `${domain} (${tabs.length})`;

    const blockBtn = document.createElement("button");
    blockBtn.className = "block-btn";
    blockBtn.textContent = blockedSet.has(domain) ? "Extend block" : "Block domain";
    blockBtn.addEventListener("click", () => onAddBlocked(domain));

    header.appendChild(title);
    header.appendChild(blockBtn);

    const ul = document.createElement("ul");
    ul.className = "tabs-list";

    tabs.forEach(tab => {
      const row = document.createElement("li");
      row.className = "tab-row";

      const favicon = document.createElement("img");
      favicon.className = "tab-favicon";
      favicon.width = 14;
      favicon.height = 14;
      favicon.src = tab.favIconUrl || "";
      favicon.onerror = () => { favicon.style.display = "none"; };

      const tabTitle = document.createElement("span");
      tabTitle.textContent = tab.title || tab.url;

      const closeBtn = document.createElement("button");
      closeBtn.className = "close-btn";
      closeBtn.textContent = "✕";
      closeBtn.addEventListener("click", () => onCloseTab(tab.id));

      row.appendChild(favicon);
      row.appendChild(tabTitle);
      row.appendChild(closeBtn);
      ul.appendChild(row);
    });

    card.appendChild(header);
    card.appendChild(ul);
    list.appendChild(card);
  });
}
