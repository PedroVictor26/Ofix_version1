// Simple in-memory context manager with auto-expire placeholder
class ContextManager {
  constructor() {
    this.store = new Map();
  }

  async createContext(id, initial = {}) {
    const ctx = { id, ...initial, createdAt: new Date(), updatedAt: new Date() };
    this.store.set(id, ctx);
    return ctx;
  }

  async updateContext(id, patch = {}) {
    const existing = this.store.get(id) || (await this.createContext(id, {}));
    const updated = { ...existing, ...patch, updatedAt: new Date() };
    this.store.set(id, updated);
    return updated;
  }

  async getContext(id) {
    return this.store.get(id) || null;
  }
}

const contextManager = new ContextManager();
export default contextManager;
