/**
 * In-memory mock for the `idb` package.
 * Simulates IndexedDB object stores, indexes, and transactions.
 */

class MockObjectStore {
    constructor(keyPath) {
        this.keyPath = keyPath;
        this.data = new Map();
        this.indexes = {};
    }

    _keyFor(value) {
        if (Array.isArray(this.keyPath)) {
            return JSON.stringify(this.keyPath.map((k) => value[k]));
        }
        return value[this.keyPath];
    }

    async get(key) {
        const k = Array.isArray(key) ? JSON.stringify(key) : key;
        return this.data.get(k) ?? undefined;
    }

    async put(value, explicitKey) {
        const k =
            explicitKey !== undefined
                ? Array.isArray(explicitKey)
                    ? JSON.stringify(explicitKey)
                    : explicitKey
                : this._keyFor(value);
        this.data.set(k, structuredClone(value));
    }

    async getAll() {
        return [...this.data.values()];
    }

    async getAllFromIndex(_indexName, keyOrRange) {
        const all = [...this.data.values()];
        if (keyOrRange === undefined) return all;
        // Simple equality filter on index key path
        const idx = this.indexes[_indexName];
        if (!idx) return all;
        return all.filter((item) => {
            if (Array.isArray(idx.keyPath)) {
                return idx.keyPath.every((kp, i) => item[kp] === keyOrRange[i]);
            }
            return item[idx.keyPath] === keyOrRange;
        });
    }

    createIndex(name, keyPath) {
        this.indexes[name] = { keyPath };
        return this;
    }
}

class MockTransaction {
    constructor(store) {
        this.store = store;
        this.done = Promise.resolve();
    }
}

class MockDB {
    constructor() {
        this.stores = {};
        this.objectStoreNames = {
            _names: new Set(),
            contains(name) {
                return this._names.has(name);
            },
        };
    }

    createObjectStore(name, options = {}) {
        const store = new MockObjectStore(options.keyPath || null);
        this.stores[name] = store;
        this.objectStoreNames._names.add(name);
        return store;
    }

    async get(storeName, key) {
        return this.stores[storeName]?.get(key);
    }

    async put(storeName, value, key) {
        return this.stores[storeName]?.put(value, key);
    }

    async getAll(storeName) {
        return this.stores[storeName]?.getAll() ?? [];
    }

    async getAllFromIndex(storeName, indexName, key) {
        return this.stores[storeName]?.getAllFromIndex(indexName, key) ?? [];
    }

    transaction(storeName, _mode) {
        return new MockTransaction(this.stores[storeName]);
    }
}

// Singleton per DB_NAME so multiple opens return the same instance
const instances = {};

export async function openDB(name, version, { upgrade } = {}) {
    if (!instances[name]) {
        const db = new MockDB();
        if (upgrade) {
            upgrade(db, 0);
        }
        instances[name] = db;
    }
    return instances[name];
}

// Reset helper for tests
export function __resetMockDB() {
    for (const key of Object.keys(instances)) {
        delete instances[key];
    }
}
