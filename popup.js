import * as tabsService from "./services/tabsService.js";
import * as workspaceService from "./services/workspaceService.js";

import { renderTabs } from "./ui/renderTabs.js";
import { renderWorkspaces } from "./ui/renderWorkspaces.js";
import { openModal, closeModal } from "./ui/modals.js";
import { renderStats } from "./ui/stats.js";

// ===============================
// DOM
// ===============================
const searchInput = document.getElementById("search");

const saveWorkspaceBtn = document.getElementById("save-workspace");
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
const closeStatsModalBtn = document.getElementById("close-stats-modal");

const exportTabsBtn = document.getElementById("export-tabs");

// ===============================
// STATE
// ===============================
let allTabs = [];
let editingWorkspace = null;

// ===============================
// HELPERS
// ===============================
function groupTabsByDomain(tabs) {
  return tabs.reduce((acc, tab) => {
    try {
      const domain = new URL(tab.url).hostname || "Other";
      acc[domain] ||= [];
      acc[domain].push(tab);
    } catch {
      acc.Other ||= [];
      acc.Other.push(tab);
    }
    return acc;
  }, {});
}

// ===============================
// TABS + SEARCH
// ===============================
async function loadTabs(filterText = "") {
  allTabs = await tabsService.getAllTabs();

  const filteredTabs = allTabs.filter(tab => {
    const text = filterText.toLowerCase();
    return (
      (tab.title && tab.title.toLowerCase().includes(text)) ||
      (tab.url && tab.url.toLowerCase().includes(text))
    );
  });

  const grouped = groupTabsByDomain(filteredTabs);

  renderTabs(grouped, async (tabId) => {
    await tabsService.closeTab(tabId);
    loadTabs(searchInput.value);
  });
}

searchInput.addEventListener("input", () => {
  loadTabs(searchInput.value);
});

// ===============================
// WORKSPACES LIST
// ===============================
async function loadWorkspaces() {
  const workspaces = await workspaceService.getWorkspaces();

  renderWorkspaces(workspaces, {
    onOpen: (id) => workspaceService.openWorkspace(id),
    onDelete: async (id) => {
      if (!confirm("Delete this workspace?")) return;
      await workspaceService.deleteWorkspace(id);
      loadWorkspaces();
    },
    onEdit: (id) => openWorkspaceEditor(id)
  });
}

// ===============================
// WORKSPACE EDITOR
// ===============================
async function openWorkspaceEditor(id) {
  editingWorkspace = await workspaceService.getWorkspaceById(id);
  if (!editingWorkspace) return;

  workspaceTitle.textContent = `Edit Workspace: ${editingWorkspace.name}`;
  newTabUrlInput.value = "";
  renderWorkspaceDetails();
  openModal("workspace-modal");
}

function renderWorkspaceDetails() {
  workspaceDetails.innerHTML = "";

  editingWorkspace.tabs.forEach((url, index) => {
    const li = document.createElement("li");
    li.textContent = url;

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "✕";
    removeBtn.className = "close-btn";
    removeBtn.onclick = async () => {
      editingWorkspace.tabs.splice(index, 1);
      await workspaceService.updateWorkspace(
        editingWorkspace.id,
        editingWorkspace
      );
      renderWorkspaceDetails();
    };

    li.appendChild(removeBtn);
    workspaceDetails.appendChild(li);
  });
}

addTabBtn.addEventListener("click", async () => {
  const url = newTabUrlInput.value.trim();
  if (!url || !editingWorkspace) return;

  editingWorkspace.tabs.push(url);
  await workspaceService.updateWorkspace(
    editingWorkspace.id,
    editingWorkspace
  );

  newTabUrlInput.value = "";
  renderWorkspaceDetails();
});

closeWorkspaceModal.addEventListener("click", () => {
  closeModal("workspace-modal");
  editingWorkspace = null;
});

// ===============================
// SAVE WORKSPACE
// ===============================
saveWorkspaceBtn.addEventListener("click", () => {
  workspaceNameInput.value = "";
  openModal("modal");
});

modalCancel.addEventListener("click", () => {
  closeModal("modal");
});

modalSave.addEventListener("click", async () => {
  const name = workspaceNameInput.value.trim();
  if (!name) {
    alert("Workspace name cannot be empty!");
    return;
  }

  await workspaceService.saveWorkspace(name);
  closeModal("modal");
  loadWorkspaces();
});

// ===============================
// STATS
// ===============================
tabStatsBtn.addEventListener("click", async () => {
  const tabs = await tabsService.getAllTabs();
  renderStats(tabs);
  openModal("stats-modal");
});

closeStatsModalBtn.addEventListener("click", () => {
  closeModal("stats-modal");
});

// ===============================
// EXPORT
// ===============================
exportTabsBtn.addEventListener("click", async () => {
  const tabs = await tabsService.getAllTabs();
  const workspaces = await workspaceService.getWorkspaces();

  const exportData = {
    currentTabs: tabs.map(t => ({ title: t.title, url: t.url })),
    workspaces
  };

  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "tabs_export.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// ===============================
// INIT
// ===============================
loadTabs();
loadWorkspaces();
