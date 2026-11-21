import { openDB } from 'idb';

const DB_NAME = 'logic-looper';
const DB_VERSION = 2;
export const ACTIVITY_STORE = 'daily_activity';

let dbPromise = null;

/**
 * Single shared connection. Previously db.js and activityStore.js each declared
 * their own upgrade logic for the same database, which could drift apart.
 */
export function getDB() {
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion) {
                // v1: key-value state store (settings + legacy stats snapshots)
                if (!db.objectStoreNames.contains('state')) {
                    db.createObjectStore('state');
                }
                // v2: one record per (userId, date) — the solve history
                if (oldVersion < 2 && !db.objectStoreNames.contains(ACTIVITY_STORE)) {
                    const store = db.createObjectStore(ACTIVITY_STORE, { keyPath: ['userId', 'date'] });
                    store.createIndex('by_user', 'userId');
                    store.createIndex('by_synced', ['userId', 'synced']);
                }
            },
            blocking() {
                // Another tab wants a newer version — let it upgrade.
                dbPromise?.then(db => db.close());
                dbPromise = null;
            },
        }).catch(err => {
            dbPromise = null;
            throw err;
        });
    }
    return dbPromise;
}

/**
 * Ask the browser not to evict our data under storage pressure. Without this,
 * IndexedDB is "best effort" and can be cleared silently (notably on mobile).
 */
export async function requestPersistentStorage() {
    try {
        if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
            await navigator.storage.persist();
        }
    } catch {
        /* not supported — fine */
    }
}

export async function saveSettings(userId, settings) {
    if (!userId) return;
    const db = await getDB();
    await db.put('state', settings, `settings::${userId}`);
}

export async function loadSettings(userId) {
    if (!userId) return null;
    const db = await getDB();
    return db.get('state', `settings::${userId}`);
}

/**
 * Practice (archive) results stay on this device only; they never affect the
 * streak, history or leaderboard. Shape: { 'YYYY-MM-DD': { points, timeSeconds } }
 * keeping the best score per day.
 */
export async function loadPracticeResults(userId) {
    if (!userId) return {};
    const db = await getDB();
    return (await db.get('state', `practice::${userId}`)) || {};
}

export async function savePracticeResult(userId, date, result) {
    if (!userId) return;
    const db = await getDB();
    const tx = db.transaction('state', 'readwrite');
    const all = (await tx.store.get(`practice::${userId}`)) || {};
    if (!all[date] || result.points > all[date].points) {
        all[date] = result;
        await tx.store.put(all, `practice::${userId}`);
    }
    await tx.done;
}

/**
 * Read the pre-1.1 stats snapshot (`stats::{userId}`). It is only read, for
 * recovering history (its heatmapData) — never written again, because writing
 * a reset Redux state over it is exactly how progress used to get wiped.
 */
export async function loadLegacyStats(userId) {
    if (!userId) return null;
    const db = await getDB();
    return db.get('state', `stats::${userId}`);
}

export async function clearLegacyStats(userId) {
    if (!userId) return;
    const db = await getDB();
    await db.delete('state', `stats::${userId}`);
}
