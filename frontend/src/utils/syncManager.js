import { getDailyActivity, getUnsyncedEntries, markEntriesSynced, putActivityEntries } from '../storage/activityStore.js';
import { loadLegacyStats } from '../storage/db.js';
import { normalizeEntry, isBetterEntry, entriesFromHeatmap } from './statsCalculator.js';

// Relative by default: in production the API is served from the same origin (Vercel), and in dev
// Vite proxies /api to the backend (see vite.config.js).
export const API_URL = import.meta.env?.VITE_API_URL || '/api';

export class UnauthorizedError extends Error {
    constructor() {
        super('Session expired');
        this.name = 'UnauthorizedError';
    }
}

// A request that takes longer than this is treated as "can't reach the server": the app carries on
// with what is saved on the device instead of waiting forever on a stalled connection.
const READ_TIMEOUT_MS = 15000;
const WRITE_TIMEOUT_MS = 45000; // uploading a long history takes longer

async function api(path, token, options = {}, timeoutMs = READ_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(`${API_URL}${path}`, {
            ...options,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                ...(options.headers || {}),
            },
        });
        if (res.status === 401) throw new UnauthorizedError();
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return await res.json();
    } finally {
        clearTimeout(timer);
    }
}

function toServerEntry(e) {
    return {
        date: e.date,
        puzzleType: e.puzzleType,
        points: e.points,
        timeSeconds: e.timeSeconds,
        hintsUsed: e.hintsUsed,
        mistakes: e.mistakes,
        noMistakes: e.noMistakes,
        solvedAt: e.solvedAt,
        legacy: e.legacy,
    };
}

/**
 * Push every not-yet-synced local solve to the backend. Safe to call any time:
 * the server merges (never lowers or deletes), so retries are harmless.
 *
 * @returns {Promise<'synced' | 'offline' | 'unauthorized' | 'error'>}
 */
export async function syncDailyActivity(userId, token, achievements = []) {
    if (!userId || !token) return 'error';
    if (typeof navigator !== 'undefined' && !navigator.onLine) return 'offline';

    try {
        const unsynced = (await getUnsyncedEntries(userId)).map(normalizeEntry).filter(Boolean);
        if (unsynced.length === 0 && achievements.length === 0) return 'synced';

        await api('/stats/batch-sync', token, {
            method: 'POST',
            body: JSON.stringify({ entries: unsynced.map(toServerEntry), achievements }),
        }, WRITE_TIMEOUT_MS);
        await markEntriesSynced(userId, unsynced.map(e => e.date));
        return 'synced';
    } catch (err) {
        if (err instanceof UnauthorizedError) return 'unauthorized';
        console.warn('Sync failed (offline?):', err);
        return typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'error';
    }
}

/**
 * Build the complete history for a user by merging every place progress may live:
 *   1. the server (DailyScore rows)
 *   2. this device's `daily_activity` records (incl. ones that never synced
 *      because of the v1.0 sync bug)
 *   3. the v1.0 `stats::{userId}` snapshot's heatmapData, which held all history
 *      from before `daily_activity` existed
 * Days the server is missing are written locally as unsynced and pushed up.
 *
 * @returns {Promise<{ entries, achievements, status, recoveredCount }>}
 */
export async function hydrateUserProgress(userId, token) {
    let status = 'synced';
    let server = null;
    try {
        if (typeof navigator !== 'undefined' && !navigator.onLine) throw new Error('offline');
        server = await api('/stats/me', token);
    } catch (err) {
        status = err instanceof UnauthorizedError ? 'unauthorized' : 'offline';
    }

    const merged = new Map(); // date -> { ...entry, synced }
    const offer = (entry, synced) => {
        if (!entry) return;
        const prev = merged.get(entry.date);
        if (isBetterEntry(entry, prev)) merged.set(entry.date, { ...entry, synced });
    };

    const serverDates = new Set();
    for (const row of server?.history || []) {
        const e = normalizeEntry(row);
        if (e) { serverDates.add(e.date); offer(e, true); }
    }

    // Local records: only trust their `synced` flag if we couldn't reach the
    // server. If the server is reachable and lacks the day, it must be re-sent.
    const localRecords = await getDailyActivity(userId).catch(() => []);
    for (const rec of localRecords) {
        const e = normalizeEntry(rec);
        if (e) offer(e, server ? serverDates.has(e.date) && Boolean(rec.synced) : Boolean(rec.synced));
    }

    const legacy = await loadLegacyStats(userId).catch(() => null);
    for (const e of entriesFromHeatmap(legacy?.heatmapData)) offer(e, false);

    // Persist the merged view locally so the device has the full history offline.
    const localByDate = new Map(localRecords.map(r => [r.date, r]));
    const toWrite = [...merged.values()].filter(e => {
        const rec = localByDate.get(e.date);
        return !rec || normalizeEntry(rec)?.points !== e.points || Boolean(rec.synced) !== e.synced
            || Boolean(rec.legacy) !== e.legacy;
    });
    await putActivityEntries(userId, toWrite).catch(err => console.warn('Could not cache history locally:', err));

    const achievements = [...new Set([...(server?.achievements || []), ...(legacy?.achievements || [])])];
    const recoveredCount = server ? [...merged.values()].filter(e => !e.synced).length : 0;

    if (status === 'synced') {
        const serverHas = new Set(server.achievements || []);
        status = await syncDailyActivity(userId, token, achievements.filter(a => !serverHas.has(a)));
    }

    return {
        entries: [...merged.values()],
        achievements,
        status,
        recoveredCount: status === 'synced' ? recoveredCount : 0,
    };
}

/** Delete all of this user's progress on the server ("Reset all progress"). */
export async function deleteServerProgress(token) {
    return api('/stats/me', token, { method: 'DELETE' }, WRITE_TIMEOUT_MS);
}
