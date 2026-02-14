import { openDB } from 'idb';

const DB_NAME = 'logic-looper';
const DB_VERSION = 2;

async function getDB() {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion) {
            if (!db.objectStoreNames.contains('state')) {
                db.createObjectStore('state');
            }
            // v2: add daily_activity store for heatmap data
            if (oldVersion < 2) {
                if (!db.objectStoreNames.contains('daily_activity')) {
                    const store = db.createObjectStore('daily_activity', {
                        keyPath: ['userId', 'date'],
                    });
                    store.createIndex('by_user', 'userId');
                    store.createIndex('by_synced', ['userId', 'synced']);
                }
            }
        },
    });
}

export async function saveState(key, value) {
    const db = await getDB();
    await db.put('state', value, key);
}

export async function loadState(key) {
    const db = await getDB();
    return db.get('state', key);
}

/**
 * Save stats & settings scoped to a specific user.
 * Keys are namespaced as `stats::{userId}` and `settings::{userId}`.
 */
export async function saveAllState(userId, statsState, settingsState) {
    if (!userId) return; // don't save if no user
    const db = await getDB();
    const tx = db.transaction('state', 'readwrite');
    await tx.store.put(statsState, `stats::${userId}`);
    await tx.store.put(settingsState, `settings::${userId}`);
    await tx.done;
}

/**
 * Load stats & settings for a specific user.
 */
export async function loadAllState(userId) {
    if (!userId) return { stats: null, settings: null };
    const db = await getDB();
    const stats = await db.get('state', `stats::${userId}`);
    const settings = await db.get('state', `settings::${userId}`);
    return { stats, settings };
}
