const api = browser;

export function getAllTabs() {
  return api.tabs.query({});
}

export function closeTab(tabId) {
  return api.tabs.remove(tabId);
}

export function openTab(url) {
  return api.tabs.create({ url });
}

export function openTabs(urls) {
  return Promise.all(
    urls.map(url => api.tabs.create({ url }))
  );
}
