// state.js — single source of truth
import { loadRecords, saveRecords, loadSettings, saveSettings } from './storage.js';

const state = {
  records: [],
  settings: { pageCap: 1000, unit: 'pages', theme: 'light' },
  re: null,
  sort: 'date-desc',
  tag: '',
};

export const initState      = () => { state.records = loadRecords(); state.settings = loadSettings(); };
export const getRecords     = () => state.records;
export const getSettings    = () => state.settings;
export const getSearchPattern = () => state.re;
export const getTagFilter   = () => state.tag;
export const getUniqueTags  = () => [...new Set(state.records.map(r => r.tag).filter(Boolean))].sort();

export function setSearchPattern(re) { state.re = re; }
export function setSortKey(k)        { state.sort = k; }
export function setTagFilter(t)      { state.tag = t; }

export function updateSettings(patch) {
  state.settings = { ...state.settings, ...patch };
  saveSettings(state.settings);
}

export function addRecord(record) {
  state.records.push(record);
  saveRecords(state.records);
}

export function updateRecord(id, patch) {
  const i = state.records.findIndex(r => r.id === id);
  if (i === -1) return false;
  state.records[i] = { ...state.records[i], ...patch, updatedAt: new Date().toISOString() };
  saveRecords(state.records);
  return true;
}

export function deleteRecord(id) {
  const len = state.records.length;
  state.records = state.records.filter(r => r.id !== id);
  if (state.records.length !== len) { saveRecords(state.records); return true; }
  return false;
}

export function replaceAllRecords(records) {
  state.records = records;
  saveRecords(state.records);
}

export function getFilteredSorted() {
  const { re, tag, sort } = state;
  let out = state.records.filter(r => {
    if (tag && r.tag !== tag) return false;
    if (re) return re.test([r.title, r.author, r.tag, r.notes || ''].join(' '));
    return true;
  });
  return out.sort((a, b) => {
    if (sort === 'date-desc')  return new Date(b.dateAdded) - new Date(a.dateAdded);
    if (sort === 'date-asc')   return new Date(a.dateAdded) - new Date(b.dateAdded);
    if (sort === 'title-asc')  return a.title.localeCompare(b.title);
    if (sort === 'title-desc') return b.title.localeCompare(a.title);
    if (sort === 'pages-desc') return b.pages - a.pages;
    if (sort === 'pages-asc')  return a.pages - b.pages;
    return 0;
  });
}

let _seq = 0;
export const generateId = () => `book_${Date.now().toString(36)}_${(++_seq).toString().padStart(4,'0')}`;