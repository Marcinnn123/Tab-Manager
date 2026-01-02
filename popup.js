import * as tabsService from "./services/tabsService.js";
import * as workspaceService from "./services/workspaceService.js";
import { renderTabs } from "./ui/renderTabs.js";
import { renderWorkspaces } from "./ui/renderWorkspaces.js";
import { openModal, closeModal } from "./ui/modals.js";
import { renderStats } from "./ui/stats.js";

/* ==============================
   CONSTANTS & STATE
============================== */
const BLOCKED_KEY = "blockedDomains";

let allTabs = [];
let editingWorkspace = null;

let domainToBlock = null;
let selectedMinutes = null;

/* ==============================
   DOM
============================== */
const searchInput = document.getElementById("search");

const saveWorkspaceBtn = document.getElementById("save-workspace");
const modalSave = document.getElementById("modal-save");
const modalCancel = document.getElementById("modal-cancel");
const workspaceNameInput = document.getElementById("workspace-name");
const workspaceError = document.getElementById("workspace-error");

const workspaceModal = document.getElementById("workspace-modal");
const workspaceDetails = document.getElementById("workspace-details");
const workspaceTitle = document.getElementById("workspace-title");
const newTabUrlInput = document.getElementById("new-tab-url");
const addTabBtn = document.getElementById("add-tab-btn");
const closeWorkspaceModal = document.getElementById("close-workspace-modal");

const tabStatsBtn = document.getElementById("tab-stats");
const closeStatsModalBtn = document.getElementById("close-stats-modal");
const exportTabsBtn = document.getElementById("export-tabs");

const blockedInput = document.getElementById("blocked-input");
const addBlockedBtn = document.getElementById("add-blocked");
const blockedList = document.getElementById("blocked-list");

const blockModalTitle = document.getElementById("block-modal-title");
const blockConfirmBtn = document.getElementById("block-confirm");
const blockCancelBtn = document.getElementById("block-cancel");
const customMinutesInput = document.getElementById("custom-minutes");

/* ==============================
   STORAGE HELPERS
============================== */
async function getBlockedDomains() {
  return (await browser.storage.local.get(BLOCKED_KEY))[BLOCKED_KEY] || [];
}

async function saveBlockedDomains(domains) {
  await browser.storage.local.set({ [BLOCKED_KEY]: domains });
}

/* ==============================
   HELPERS
============================== */
function groupTabsByDomain(tabs) {
  return tabs.reduce((acc, tab) => {
    try {
      const domain = new URL(tab.url).hostname;
      acc[domain] ||= [];
      acc[domain].push(tab);
    } catch {
      acc.Other ||= [];
      acc.Other.push(tab);
    }
    return acc;
  }, {});
}

function formatRemaining(ms) {
  if (ms <= 0) return "expired";

  const minutes = Math.ceil(ms / 60000);
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

/* ==============================
   TABS
============================== */
async function loadTabs(filterText = "") {
  allTabs = await tabsService.getAllTabs();

  const filtered = allTabs.filter(tab => {
    const t = filterText.toLowerCase();
    return (
      tab.title?.toLowerCase().includes(t) ||
      tab.url?.toLowerCase().includes(t)
    );
  });

  renderTabs(groupTabsByDomain(filtered), {
    onCloseTab: async (id) => {
      await tabsService.closeTab(id);
      loadTabs(searchInput.value);
    },
    onAddBlocked: (domain) => {
      domainToBlock = domain;
      selectedMinutes = null;
      customMinutesInput.value = "";
      document
        .querySelectorAll(".block-options button")
        .forEach(b => b.classList.remove("active"));

      blockModalTitle.textContent = `Block ${domain}`;
      openModal("block-modal");
    }
  });
}

searchInput.addEventListener("input", () => {
  loadTabs(searchInput.value);
});

/* ==============================
   BLOCK MODAL LOGIC
============================== */
document.querySelectorAll(".block-options button").forEach(btn => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".block-options button")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");

    if (btn.dataset.forever) {
      selectedMinutes = null;
    } else {
      selectedMinutes = Number(btn.dataset.minutes);
    }
  });
});

blockConfirmBtn.addEventListener("click", async () => {
  if (!domainToBlock) return;

  let blockedUntil = null;
  const custom = Number(customMinutesInput.value);

  if (custom > 0) {
    blockedUntil = Date.now() + custom * 60 * 1000;
  } else if (selectedMinutes) {
    blockedUntil = Date.now() + selectedMinutes * 60 * 1000;
  }

  const blocked = await getBlockedDomains();
  if (!blocked.some(b => b.domain === domainToBlock)) {
    blocked.push({ domain: domainToBlock, blockedUntil });
    await saveBlockedDomains(blocked);
  }

  closeModal("block-modal");
  renderBlockedDomains();
});

blockCancelBtn.addEventListener("click", () => {
  closeModal("block-modal");
});

/* ==============================
   BLOCKED TAB
============================== */
async function renderBlockedDomains() {
  blockedList.innerHTML = "";

  const now = Date.now();
  let blocked = await getBlockedDomains();

  blocked = blocked.filter(
    b => b.blockedUntil === null || b.blockedUntil > now
  );

  await saveBlockedDomains(blocked);

  blocked.forEach((item, index) => {
    const li = document.createElement("li");

    const left = document.createElement("span");
    left.textContent = item.domain;

    const right = document.createElement("div");

    const time = document.createElement("small");
    time.textContent =
      item.blockedUntil === null
        ? "forever"
        : formatRemaining(item.blockedUntil - now);

    const remove = document.createElement("button");
    remove.className = "close-btn";
    remove.textContent = "✕";
    remove.onclick = async () => {
      blocked.splice(index, 1);
      await saveBlockedDomains(blocked);
      renderBlockedDomains();
    };

    right.appendChild(time);
    right.appendChild(remove);

    li.appendChild(left);
    li.appendChild(right);
    blockedList.appendChild(li);
  });
}

addBlockedBtn.addEventListener("click", async () => {
  let domain = blockedInput.value.trim();
  if (!domain) return;

  try {
    if (!domain.startsWith("http")) domain = "https://" + domain;
    domain = new URL(domain).hostname;
  } catch {
    return;
  }

  const blocked = await getBlockedDomains();
  if (blocked.some(b => b.domain === domain)) return;

  blocked.push({ domain, blockedUntil: null });
  await saveBlockedDomains(blocked);

  blockedInput.value = "";
  renderBlockedDomains();
});

/* ==============================
   WORKSPACES
============================== */
saveWorkspaceBtn.addEventListener("click", () => {
  workspaceNameInput.value = "";
  if (workspaceError) workspaceError.textContent = "";
  openModal("modal");
});

async function loadWorkspaces() {
  const ws = await workspaceService.getWorkspaces();
  renderWorkspaces(ws, {
    onOpen: async (id) => {
      await workspaceService.openWorkspace(id);
    },
    onEdit: async (id) => {
      await openWorkspaceEditor(id);
    },
    onDelete: async (id) => {
      await workspaceService.deleteWorkspace(id);
      loadWorkspaces();
    }
  });
}

async function openWorkspaceEditor(id) {
  const ws = await workspaceService.getWorkspaceById(id);
  if (!ws) return;

  editingWorkspace = { ...ws, id };
  workspaceTitle.textContent = `Edit Workspace: ${ws.name}`;
  workspaceDetails.innerHTML = "";

  (ws.tabs || []).forEach((tab, i) => {
    const li = document.createElement("li");

    const span = document.createElement("span");
    span.textContent = tab.url || tab;

    const btn = document.createElement("button");
    btn.textContent = "✕";
    btn.addEventListener("click", async () => {
      const updated = { ...ws, tabs: [...ws.tabs] };
      updated.tabs.splice(i, 1);
      await workspaceService.updateWorkspace(id, updated);
      openWorkspaceEditor(id);
    });

    li.appendChild(span);
    li.appendChild(btn);
    workspaceDetails.appendChild(li);
  });

  openModal("workspace-modal");
}

addTabBtn.addEventListener("click", async () => {
  if (!editingWorkspace) return;

  let url = newTabUrlInput.value.trim();
  if (!url) return;

  try {
    if (!url.startsWith("http")) url = "https://" + url;
    url = new URL(url).toString();
  } catch {
    return;
  }

  const ws = await workspaceService.getWorkspaceById(editingWorkspace.id);
  if (!ws) return;

  const updated = { ...ws, tabs: [...(ws.tabs || [])] };
  updated.tabs.push({ url });

  await workspaceService.updateWorkspace(editingWorkspace.id, updated);
  newTabUrlInput.value = "";
  openWorkspaceEditor(editingWorkspace.id);
});

closeWorkspaceModal.addEventListener("click", () => {
  editingWorkspace = null;
  closeModal("workspace-modal");
});

modalSave.addEventListener("click", async () => {
  const name = workspaceNameInput.value.trim();

  if (!name) {
    if (workspaceError) workspaceError.textContent = "Workspace name cannot be empty";
    return;
  }

  if (workspaceError) workspaceError.textContent = "";

  await workspaceService.saveWorkspace(name);
  closeModal("modal");
  loadWorkspaces();
});

modalCancel.addEventListener("click", () => closeModal("modal"));

workspaceNameInput.addEventListener("input", () => {
  if (workspaceError) workspaceError.textContent = "";
});


/* ==============================
   TOP TAB NAVIGATION
============================== */
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.tab;

    tabButtons.forEach(b => b.classList.remove("active"));
    tabContents.forEach(c => c.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(target).classList.add("active");
  });
});


/* ==============================
   STATS & EXPORT
============================== */
tabStatsBtn.addEventListener("click", async () => {
  renderStats(await tabsService.getAllTabs());
  openModal("stats-modal");
});

closeStatsModalBtn.addEventListener("click", () =>
  closeModal("stats-modal")
);

exportTabsBtn.addEventListener("click", async () => {
  const data = {
    currentTabs: await tabsService.getAllTabs(),
    workspaces: await workspaceService.getWorkspaces()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tabs_export.json";
  a.click();
  URL.revokeObjectURL(url);
});

/* ==============================
   INIT
============================== */
loadTabs();
loadWorkspaces();
renderBlockedDomains();
