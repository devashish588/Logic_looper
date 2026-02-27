import '@testing-library/jest-dom';

// Polyfill structuredClone for jsdom environment
if (typeof globalThis.structuredClone === 'undefined') {
    globalThis.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}
