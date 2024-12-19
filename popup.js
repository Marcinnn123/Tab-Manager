const tabList = document.getElementById("tab-list");
const workspaceList = document.getElementById("workspace-list");
const saveWorkspaceBtn = document.getElementById("save-workspace");
const modal = document.getElementById("modal");
const modalSave = document.getElementById("modal-save");
const modalCancel = document.getElementById("modal-cancel");
const workspaceNameInput = document.getElementById("workspace-name");

let tabs = [];

// Kontrola dostupnosti API
if (!browser) {
  console.error("Browser API is not available!");
}

// Načítání otevřených karet
function loadTabs() {
  browser.tabs.query({}).then((result) => {
    tabs = result;
    console.log("Loaded tabs:", tabs);
    renderGroupedTabs(tabs);
  }).catch((err) => console.error("Error loading tabs:", err));
}

// Seskupení karet podle domény
function groupTabsByDomain(tabs) {
  const grouped = {};
  tabs.forEach((tab) => {
    try {
      const url = new URL(tab.url);
      const domain = url.hostname || "Other";
      if (!grouped[domain]) grouped[domain] = [];
      grouped[domain].push(tab);
    } catch (err) {
      console.warn("Invalid URL for tab:", tab, err);
    }
  });
  return grouped;
}

// Zobrazení seskupených karet
function renderGroupedTabs(tabs) {
  const groupedTabs = groupTabsByDomain(tabs);
  tabList.innerHTML = "";

  for (const domain in groupedTabs) {
    const section = document.createElement("div");
    section.className = "domain-section";

    const title = document.createElement("h3");
    title.textContent = `${domain} (${groupedTabs[domain].length})`;

    const closeAllBtn = document.createElement("button");
    closeAllBtn.textContent = "Close All";
    closeAllBtn.onclick = () => {
      groupedTabs[domain].forEach((tab) => browser.tabs.remove(tab.id));
      loadTabs();
    };

    section.appendChild(title);
    section.appendChild(closeAllBtn);

    groupedTabs[domain].forEach((tab) => {
      const li = document.createElement("li");
      li.className = "tab-item";
      li.textContent = tab.title;

      const closeBtn = document.createElement("button");
      closeBtn.textContent = "✖";
      closeBtn.className = "close-btn";
      closeBtn.onclick = () => {
        browser.tabs.remove(tab.id).then(loadTabs);
        loadTabs();
      };

      li.appendChild(closeBtn);
      section.appendChild(li);
    });

    tabList.appendChild(section);
  }
}

// Otevření modálního okna
saveWorkspaceBtn.addEventListener("click", () => {
  workspaceNameInput.value = "";
  modal.style.display = "flex";
});

// Zavření modálního okna
modalCancel.addEventListener("click", () => {
  modal.style.display = "none";
});

// Uložení pracovního sezení
modalSave.addEventListener("click", () => {
  const workspaceName = workspaceNameInput.value.trim();
  if (!workspaceName) {
    alert("Workspace name cannot be empty!");
    return;
  }

  browser.tabs.query({}).then((tabs) => {
    const workspace = {
      name: workspaceName,
      tabs: tabs.map((tab) => ({ title: tab.title, url: tab.url })),
    };

    browser.storage.local.get({ workspaces: [] }).then((data) => {
      const updatedWorkspaces = [...data.workspaces, workspace];
      browser.storage.local.set({ workspaces: updatedWorkspaces }).then(() => {
        renderWorkspaces();
        modal.style.display = "none";
        console.log("Workspace saved:", workspace);
      }).catch((err) => console.error("Error saving workspace:", err));
    });
  }).catch((err) => console.error("Error retrieving tabs:", err));
});

// Zobrazení uložených pracovních sezení
function renderWorkspaces() {
  workspaceList.innerHTML = "";
  browser.storage.local.get({ workspaces: [] }).then((data) => {
    console.log("Loaded workspaces:", data.workspaces);

    data.workspaces.forEach((ws, index) => {
      const li = document.createElement("li");
      li.className = "tab-item";
      li.textContent = ws.name;

      const restoreBtn = document.createElement("button");
      restoreBtn.textContent = "Restore";
      restoreBtn.onclick = () => {
        ws.tabs.forEach((tab) => browser.tabs.create({ url: tab.url }));
      };

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.className = "close-btn";
      deleteBtn.onclick = () => {
        data.workspaces.splice(index, 1);
        browser.storage.local.set({ workspaces: data.workspaces }).then(
          renderWorkspaces
        );
      };

      li.appendChild(restoreBtn);
      li.appendChild(deleteBtn);
      workspaceList.appendChild(li);
    });
  }).catch((err) => console.error("Error loading workspaces:", err));
}

// Inicializace
loadTabs();
renderWorkspaces();
