export function renderTabs(groupedTabs, onCloseTab) {
  const list = document.getElementById("tab-list");
  list.innerHTML = "";

  Object.entries(groupedTabs).forEach(([domain, tabs]) => {
    const section = document.createElement("li");
    section.className = "domain-section";

    const header = document.createElement("h3");
    header.textContent = `${domain} (${tabs.length})`;
    section.appendChild(header);

    const ul = document.createElement("ul");

    tabs.forEach(tab => {
      const li = document.createElement("li");
      li.className = "tab-item";

      const title = document.createElement("span");
      title.textContent = tab.title || tab.url;

      const closeBtn = document.createElement("button");
      closeBtn.textContent = "✕";
      closeBtn.className = "close-btn";
      closeBtn.addEventListener("click", () => {
        onCloseTab(tab.id);
      });

      li.appendChild(title);
      li.appendChild(closeBtn);
      ul.appendChild(li);
    });

    section.appendChild(ul);
    list.appendChild(section);
  });
}
