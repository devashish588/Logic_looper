/**
 * Seeded PRNG (mulberry32) — deterministic random from a date string.
 * Same date always produces the same sequence of numbers.
 */
export function hashSeed(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const ch = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + ch;
        hash |= 0;
    }
    return Math.abs(hash);
}

export function createRng(seed) {
    let s = typeof seed === 'string' ? hashSeed(seed) : seed;
    return function () {
        s |= 0; s = s + 0x6D2B79F5 | 0;
        let t = Math.imul(s ^ s >>> 15, 1 | s);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

/** Shuffle array in-place using Fisher-Yates */
export function shuffle(arr, rng) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/** Pick n random items from array */
export function pickN(arr, n, rng) {
    const copy = [...arr];
    shuffle(copy, rng);
    return copy.slice(0, n);
}

/** Random integer in [min, max] inclusive */
export function randInt(min, max, rng) {
    return Math.floor(rng() * (max - min + 1)) + min;
}
