import { getAllTabs, openTabs } from "./tabsService.js";
import * as storage from "./storageService.js";

const STORAGE_KEY = "workspaces";

export async function getWorkspaces() {
  return (await storage.get(STORAGE_KEY)) || [];
}

export async function saveWorkspace(name) {
  const tabs = await getAllTabs();
  const workspaces = await getWorkspaces();

  workspaces.push({
    id: Date.now(),
    name,
    tabs: tabs.map(t => ({ url: t.url, title: t.title || t.url, favIconUrl: t.favIconUrl || "" })),
    createdAt: new Date().toISOString()
  });

  await storage.set(STORAGE_KEY, workspaces);
}

export async function deleteWorkspace(id) {
  const workspaces = await getWorkspaces();
  await storage.set(
    STORAGE_KEY,
    workspaces.filter(w => w.id !== id)
  );
}

export async function openWorkspace(id) {
  const workspaces = await getWorkspaces();
  const ws = workspaces.find(w => w.id === id);
  if (!ws) return;

  await openTabs(ws.tabs.map(t => (typeof t === "string" ? t : t.url)));
}

export async function getWorkspaceById(id) {
  const workspaces = await getWorkspaces();
  return workspaces.find(w => w.id === id);
}

export async function reorderWorkspaces(reordered) {
  await storage.set(STORAGE_KEY, reordered);
}

export async function updateWorkspace(id, updatedWorkspace) {
  const workspaces = await getWorkspaces();
  const index = workspaces.findIndex(w => w.id === id);
  if (index === -1) return;

  workspaces[index] = updatedWorkspace;
  await storage.set(STORAGE_KEY, workspaces);
}

