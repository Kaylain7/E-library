// storage.js — localStorage persistence
const K = { r: 'bnv:records', s: 'bnv:settings' };
const defaults = { pageCap: 1000, unit: 'pages', theme: 'light' };
const parse = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };

export const loadRecords  = () => { const d = parse(K.r, []); return Array.isArray(d) ? d : []; };
export const saveRecords  = r  => localStorage.setItem(K.r, JSON.stringify(r));
export const loadSettings = () => ({ ...defaults, ...parse(K.s, {}) });
export const saveSettings = s  => localStorage.setItem(K.s, JSON.stringify(s));
export const clearAll     = () => { localStorage.removeItem(K.r); localStorage.removeItem(K.s); };