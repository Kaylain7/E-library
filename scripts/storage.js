// scripts/storage.js — localStorage persistence layer

const BOOKS_KEY    = 'vault:books';
const SETTINGS_KEY = 'vault:settings';

export function load() {
  try { return JSON.parse(localStorage.getItem(BOOKS_KEY) || '[]'); }
  catch { return []; }
}

export function save(data) {
  try { localStorage.setItem(BOOKS_KEY, JSON.stringify(data)); return true; }
  catch { return false; }
}

export function loadSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); }
  catch { return {}; }
}

export function saveSettings(s) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); return true; }
  catch { return false; }
}