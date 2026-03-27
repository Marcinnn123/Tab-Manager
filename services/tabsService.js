export function getAllTabs() {
  return browser.tabs.query({});
}

export function closeTab(tabId) {
  return browser.tabs.remove(tabId);
}

export function openTab(url) {
  return browser.tabs.create({ url });
}

export function openTabs(urls) {
  return Promise.all(
    urls.map(url => browser.tabs.create({ url }))
  );
}
