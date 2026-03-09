// scripts/state.js — centralised app state (matches main.js API)

import { load, save, loadSettings as loadSett, saveSettings as saveSett } from './storage.js';

// ── Defaults ──────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  theme:   'light',
  unit:    'pages',
  pageCap: 5000,
};

let _records       = [];
let _settings      = { ...DEFAULT_SETTINGS };
let _searchPattern = null;
let _sortKey       = 'dateAdded-desc';
let _tagFilter     = '';

// ── Boot ──────────────────────────────────────────────────
export function initState() {
  _records  = load();
  _settings = { ...DEFAULT_SETTINGS, ...loadSett() };
}

// ── Records ───────────────────────────────────────────────
export function getRecords() { return [..._records]; }

export function addRecord(record) {
  _records.push(record);
  save(_records);
}

export function updateRecord(id, patch) {
  const idx = _records.findIndex(r => r.id === id);
  if (idx === -1) return false;
  _records[idx] = { ..._records[idx], ...patch, updatedAt: new Date().toISOString() };
  save(_records);
  return true;
}

export function deleteRecord(id) {
  _records = _records.filter(r => r.id !== id);
  save(_records);
}

export function replaceAllRecords(records) {
  _records = Array.isArray(records) ? records : [];
  save(_records);
}

// ── Search / Sort / Filter ────────────────────────────────
export function setSearchPattern(re) { _searchPattern = re; }
export function getSearchPattern()   { return _searchPattern; }

export function setSortKey(key)   { _sortKey = key; }
export function getSortKey()      { return _sortKey; }

export function setTagFilter(tag) { _tagFilter = tag; }
export function getTagFilter()    { return _tagFilter; }

export function getFilteredSorted() {
  let list = [..._records];
  if (_tagFilter) list = list.filter(r => r.tag === _tagFilter);
  if (_searchPattern) {
    list = list.filter(r =>
      _searchPattern.test(r.title)  ||
      _searchPattern.test(r.author) ||
      _searchPattern.test(r.tag)    ||
      _searchPattern.test(r.notes || '')
    );
  }
  const [field, dir] = _sortKey.split('-');
  list.sort((a, b) => {
    let va = a[field] ?? '', vb = b[field] ?? '';
    if (field === 'pages') { va = parseFloat(va) || 0; vb = parseFloat(vb) || 0; }
    else { va = String(va).toLowerCase(); vb = String(vb).toLowerCase(); }
    if (va < vb) return dir === 'asc' ? -1 : 1;
    if (va > vb) return dir === 'asc' ? 1 : -1;
    return 0;
  });
  return list;
}

// ── Settings ──────────────────────────────────────────────
export function getSettings() { return { ..._settings }; }

export function updateSettings(partial) {
  _settings = { ..._settings, ...partial };
  saveSett(_settings);
}

// ── Helpers ───────────────────────────────────────────────
export function generateId() {
  return 'book_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}