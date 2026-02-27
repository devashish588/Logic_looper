import { openDB } from 'idb';
import LZString from 'lz-string';

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
  const compressed = LZString.compressToUTF16(JSON.stringify(value));
  await db.put('state', compressed, key);
}

export async function loadState(key) {
  const db = await getDB();
  const compressed = await db.get('state', key);
  if (!compressed) return null;
  try {
    const decompressed = LZString.decompressFromUTF16(compressed);
    return JSON.parse(decompressed);
  } catch (e) {
    return compressed;
  }
}

/**
 * Save stats & settings scoped to a specific user.
 * Keys are namespaced as `stats::{userId}` and `settings::{userId}`.
 */
export async function saveAllState(userId, statsState, settingsState) {
  if (!userId) return; // don't save if no user
  const db = await getDB();
  const tx = db.transaction('state', 'readwrite');
  const compressedStats = LZString.compressToUTF16(JSON.stringify(statsState));
  const compressedSettings = LZString.compressToUTF16(JSON.stringify(settingsState));
  await tx.store.put(compressedStats, `stats::${userId}`);
  await tx.store.put(compressedSettings, `settings::${userId}`);
  await tx.done;
}

/**
 * Load stats & settings for a specific user.
 */
export async function loadAllState(userId) {
  if (!userId) return { stats: null, settings: null };
  const db = await getDB();
  const compressedStats = await db.get('state', `stats::${userId}`);
  const compressedSettings = await db.get('state', `settings::${userId}`);

  let stats = null;
  if (compressedStats) {
    try {
      stats = JSON.parse(LZString.decompressFromUTF16(compressedStats));
    } catch (e) {
      stats = compressedStats;
    }
  }

  let settings = null;
  if (compressedSettings) {
    try {
      settings = JSON.parse(LZString.decompressFromUTF16(compressedSettings));
    } catch (e) {
      settings = compressedSettings;
    }
  }

  return { stats, settings };
}
