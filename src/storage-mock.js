// Mock storage for local development
const storage = new Map();

window.storage = {
  async get(key) {
    const value = storage.get(key);
    return value ? { key, value, shared: false } : null;
  },
  
  async set(key, value) {
    storage.set(key, value);
    return { key, value, shared: false };
  },
  
  async delete(key) {
    storage.delete(key);
    return { key, deleted: true, shared: false };
  },
  
  async list(prefix = '') {
    const keys = Array.from(storage.keys()).filter(k => k.startsWith(prefix));
    return { keys, prefix, shared: false };
  }
};