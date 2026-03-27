export function get(key) {
  return browser.storage.local.get(key).then(result => result[key]);
}

export function set(key, value) {
  return browser.storage.local.set({ [key]: value });
}
