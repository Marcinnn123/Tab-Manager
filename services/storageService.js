const api = browser;

export function get(key) {
  return api.storage.local.get(key).then(result => result[key]);
}

export function set(key, value) {
  return api.storage.local.set({ [key]: value });
}
