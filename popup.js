const tabList = document.getElementById("tab-list");
const workspaceList = document.getElementById("workspace-list");
const saveWorkspaceBtn = document.getElementById("save-workspace");
const modal = document.getElementById("modal");
const modalSave = document.getElementById("modal-save");
const modalCancel = document.getElementById("modal-cancel");
const workspaceNameInput = document.getElementById("workspace-name");
const workspaceModal = document.getElementById("workspace-modal");
const workspaceDetails = document.getElementById("workspace-details");
const workspaceTitle = document.getElementById("workspace-title");
const newTabUrlInput = document.getElementById("new-tab-url");
const addTabBtn = document.getElementById("add-tab-btn");
const closeWorkspaceModal = document.getElementById("close-workspace-modal");
const tabStatsBtn = document.getElementById("tab-stats");
const statsModal = document.getElementById("stats-modal");
const statsContent = document.getElementById("stats-content");
const closeStatsModalBtn = document.getElementById("close-stats-modal");
const exportTabsBtn = document.getElementById("export-tabs");

let tabs = [];
let currentWorkspaceIndex = null;

// Načítání otevřených karet
function loadTabs() {
  browser.tabs.query({}).then((result) => {
    tabs = result;
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
      };

      li.appendChild(closeBtn);
      section.appendChild(li);
    });

    tabList.appendChild(section);
  }
}

// Uložení nového pracovního sezení
saveWorkspaceBtn.addEventListener("click", () => {
  workspaceNameInput.value = "";
  modal.style.display = "flex";
});

// Zavření modálního okna pro vytvoření pracovního sezení
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
      });
    });
  });
});

// Zobrazení uložených pracovních sezení
function renderWorkspaces() {
  workspaceList.innerHTML = "";
  browser.storage.local.get({ workspaces: [] }).then((data) => {
    data.workspaces.forEach((workspace, index) => {
      const li = document.createElement("li");
      li.className = "tab-item";
      li.textContent = workspace.name;

      // Tlačítko Restore
      const restoreBtn = document.createElement("button");
      restoreBtn.textContent = "Restore";
      restoreBtn.className = "restore-btn";
      restoreBtn.onclick = () => {
        workspace.tabs.forEach((tab) => browser.tabs.create({ url: tab.url }));
      };

      // Tlačítko Edit
      const editBtn = document.createElement("button");
      editBtn.textContent = "Edit";
      editBtn.onclick = () => openWorkspaceModal(workspace, index);

      // Tlačítko Delete
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
      li.appendChild(editBtn);
      li.appendChild(deleteBtn);
      workspaceList.appendChild(li);
    });
  });
}

// Zobrazení modálního okna pro úpravu pracovního sezení
function openWorkspaceModal(workspace, index) {
  currentWorkspaceIndex = index;
  workspaceTitle.textContent = `Edit Workspace: ${workspace.name}`;
  workspaceDetails.innerHTML = "";

  workspace.tabs.forEach((tab, tabIndex) => {
    const li = document.createElement("li");
    li.textContent = tab.title;

    const deleteTabBtn = document.createElement("button");
    deleteTabBtn.textContent = "Remove";
    deleteTabBtn.className = "close-btn";
    deleteTabBtn.onclick = () => {
      workspace.tabs.splice(tabIndex, 1);
      renderWorkspaceDetails(workspace);
    };

    li.appendChild(deleteTabBtn);
    workspaceDetails.appendChild(li);
  });

  workspaceModal.style.display = "flex";
}

// Zavření modálního okna
closeWorkspaceModal.addEventListener("click", () => {
  workspaceModal.style.display = "none";
});

// Přidání nové záložky
addTabBtn.addEventListener("click", () => {
  const url = newTabUrlInput.value.trim();
  if (!url) {
    alert("Please enter a valid URL");
    return;
  }

  const newTab = { title: url, url: url };
  browser.storage.local.get({ workspaces: [] }).then((result) => {
    const workspaces = result.workspaces;

    if (currentWorkspaceIndex !== null && workspaces[currentWorkspaceIndex]) {
      workspaces[currentWorkspaceIndex].tabs.push(newTab);

      browser.storage.local.set({ workspaces }).then(() => {
        renderWorkspaceDetails(workspaces[currentWorkspaceIndex]);
      });
    }
  });
});

// Zobrazení detailů
function renderWorkspaceDetails(workspace) {
  workspaceDetails.innerHTML = "";

  workspace.tabs.forEach((tab, tabIndex) => {
    const li = document.createElement("li");
    li.textContent = tab.title;

    const deleteTabBtn = document.createElement("button");
    deleteTabBtn.textContent = "Remove";
    deleteTabBtn.className = "close-btn";
    deleteTabBtn.onclick = () => {
      workspace.tabs.splice(tabIndex, 1);
      renderWorkspaceDetails(workspace);
    };

    li.appendChild(deleteTabBtn);
    workspaceDetails.appendChild(li);
  });
}

tabStatsBtn.addEventListener("click", () => {
  let statsMessage = "";

  // Načíst aktuální záložky
  browser.tabs.query({}).then((tabs) => {
    statsMessage += `Total Open Tabs: ${tabs.length}\n`;

    // Seskupit záložky podle domény
    const domainCount = tabs.reduce((acc, tab) => {
      const domain = new URL(tab.url).hostname;
      acc[domain] = (acc[domain] || 0) + 1;
      return acc;
    }, {});

    statsMessage += "\nOpen Tabs by Domain:\n";
    for (const [domain, count] of Object.entries(domainCount)) {
      statsMessage += `- ${domain}: ${count} tabs\n`;
    }

    // Načíst uložené pracovní sezení
    browser.storage.local.get({ workspaces: [] }).then((data) => {
      const workspaces = data.workspaces;

      statsMessage += `\nTotal Workspaces: ${workspaces.length}\n`;

      // Počet záložek v každém pracovním sezení
      workspaces.forEach((ws, index) => {
        statsMessage += `Workspace "${ws.name}": ${ws.tabs.length} tabs\n`;
      });

      // Nejčastější domény ve všech pracovních sezeních
      const workspaceDomainCount = {};
      workspaces.forEach((ws) => {
        ws.tabs.forEach((tab) => {
          const domain = new URL(tab.url).hostname;
          workspaceDomainCount[domain] = (workspaceDomainCount[domain] || 0) + 1;
        });
      });

      statsMessage += "\nMost Frequent Domains in Workspaces:\n";
      const sortedDomains = Object.entries(workspaceDomainCount).sort(
        (a, b) => b[1] - a[1]
      );
      sortedDomains.forEach(([domain, count]) => {
        statsMessage += `- ${domain}: ${count} tabs\n`;
      });

      // Zobrazit výsledky v modálním okně
      statsContent.textContent = statsMessage;
      statsModal.style.display = "flex";
    });
  });
});

// Zavřít modální okno statistik
closeStatsModalBtn.addEventListener("click", () => {
  statsModal.style.display = "none";
});

exportTabsBtn.addEventListener("click", () => {
  const exportData = {};

  // Načtení aktuálních záložek
  browser.tabs.query({}).then((tabs) => {
    exportData.currentTabs = tabs.map((tab) => ({
      title: tab.title,
      url: tab.url,
    }));

    // Načtení uložených pracovních sezení
    browser.storage.local.get({ workspaces: [] }).then((data) => {
      exportData.workspaces = data.workspaces;

      // Vytvoření souboru JSON
      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      // Vytvoření odkazu ke stažení
      const a = document.createElement("a");
      a.href = url;
      a.download = "tabs_export.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log("Tabs and workspaces exported successfully.");
    });
  });
});

// Inicializace
loadTabs();
renderWorkspaces();
