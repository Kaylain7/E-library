// scripts/ui.js — DOM rendering, announcements, dialogs, theme

import { getRecords, getSettings, getFilteredSorted, getSearchPattern, getSortKey, getTagFilter } from './state.js';

// ── Helpers ───────────────────────────────────────────────
const $ = id => document.getElementById(id);

export function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export function highlight(text, re) {
  if (!re || !text) return escHtml(text ?? '');
  const esc = escHtml(text);
  const gre = new RegExp(re.source, (re.flags.replace('g','') + 'g'));
  return esc.replace(gre, m => `<mark>${m}</mark>`);
}

// ── Announce (ARIA live) ──────────────────────────────────
export function announce(msg, assertive = false) {
  const el = $(assertive ? 'status-assertive' : 'status-polite');
  if (!el) return;
  el.textContent = '';
  requestAnimationFrame(() => { el.textContent = msg; });
}

// ── Theme ─────────────────────────────────────────────────
export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme ?? 'light');
}

// ── Section navigation ────────────────────────────────────
export function navigateTo(sectionId) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));
  const target = $('section-' + sectionId);
  if (target) {
    target.classList.remove('hidden');
    const h = target.querySelector('h1');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus(); }
  }
  document.querySelectorAll('.nav-link').forEach(l => {
    const active = l.dataset.section === sectionId;
    l.classList.toggle('active', active);
    l.setAttribute('aria-current', active ? 'page' : 'false');
  });
  // Close hamburger
  $('hamburger-btn')?.setAttribute('aria-expanded','false');
  document.body.classList.remove('nav-open');
}

// ── Tag filter dropdown ───────────────────────────────────
export function renderTagFilter() {
  const sel = $('tag-filter');
  if (!sel) return;
  const cur  = getTagFilter();
  const tags = [...new Set(getRecords().map(r => r.tag))].sort();
  sel.innerHTML = '<option value="">All tags</option>' +
    tags.map(t => `<option value="${escHtml(t)}"${t === cur ? ' selected':''}>${escHtml(t)}</option>`).join('');
}

// ── Dashboard ─────────────────────────────────────────────
export function renderDashboard() {
  const records = getRecords();
  const settings = getSettings();
  const total = records.length;
  const totalPages = records.reduce((s,r) => s + (r.pages||0), 0);

  // Top tag
  const tagMap = {};
  records.forEach(r => { tagMap[r.tag] = (tagMap[r.tag]||0)+1; });
  const topTag = Object.entries(tagMap).sort((a,b)=>b[1]-a[1])[0]?.[0] ?? '—';

  // Last 7 days
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate()-7);
  const recent = records.filter(r => new Date(r.dateAdded) >= cutoff).length;

  if ($('stat-total'))   $('stat-total').textContent   = total;
  if ($('stat-pages'))   $('stat-pages').textContent   = totalPages.toLocaleString();
  if ($('stat-top-tag')) $('stat-top-tag').textContent = topTag;
  if ($('stat-recent'))  $('stat-recent').textContent  = recent;

  renderTrend(records);
  renderCapBar(records, settings.pageCap ?? 5000);
}

function renderTrend(records) {
  const chart  = $('trend-chart');
  const labels = $('trend-labels');
  if (!chart || !labels) return;
  const days = [];
  for (let i=6; i>=0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i);
    days.push(d.toISOString().slice(0,10));
  }
  const counts  = days.map(day => records.filter(r => r.dateAdded === day).length);
  const maxCount = Math.max(...counts, 1);
  const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  chart.innerHTML = counts.map((c,i) =>
    `<div class="trend-bar" style="height:${Math.max(4,(c/maxCount)*100)}%"
          data-count="${c}" title="${days[i]}: ${c}" tabindex="0"
          aria-label="${days[i]}: ${c} book(s)"></div>`
  ).join('');
  labels.innerHTML = days.map(d =>
    `<span class="trend-label">${DAY_NAMES[new Date(d+'T12:00:00').getDay()]}</span>`
  ).join('');
}

function renderCapBar(records, cap) {
  const total   = records.reduce((s,r) => s+(r.pages||0), 0);
  const pct     = Math.min((total/cap)*100, 100);
  const fill    = $('cap-bar-fill');
  const msg     = $('cap-status');
  const bar     = $('cap-progress');
  if (!fill || !msg) return;
  fill.style.width = pct+'%';
  fill.classList.toggle('over', total > cap);
  bar?.setAttribute('aria-valuenow', Math.round(pct));
  const remaining = cap - total;
  if (total > cap) {
    msg.textContent = `🔴 Exceeded by ${(total-cap).toLocaleString()} pages!`;
    announce(`Reading goal exceeded by ${total-cap} pages!`, true);
  } else {
    msg.textContent = `${remaining.toLocaleString()} pages remaining to reach ${cap.toLocaleString()}.`;
  }
}

// ── Table (desktop) ───────────────────────────────────────
export function renderTable() {
  const tbody = $('catalog-tbody');
  const empty = $('empty-state');
  const info  = $('results-info');
  if (!tbody) return;

  const records = getFilteredSorted();
  const re      = getSearchPattern();

  tbody.innerHTML = '';

  if (records.length === 0) {
    empty?.classList.remove('hidden');
    if (info) info.textContent = 'No books match your search.';
    return;
  }
  empty?.classList.add('hidden');
  if (info) info.textContent = `Showing ${records.length} book${records.length!==1?'s':''}`;

  const frag = document.createDocumentFragment();
  records.forEach(r => {
    const tr = document.createElement('tr');
    tr.dataset.id = r.id;
    tr.innerHTML = `
      <td>${highlight(r.title, re)}${r.isbn?`<br><small class="isbn-label">ISBN: ${escHtml(r.isbn)}</small>`:''}
          ${r.notes?`<div class="notes-preview" title="${escHtml(r.notes)}">${highlight(r.notes.slice(0,70)+(r.notes.length>70?'…':''),re)}</div>`:''}</td>
      <td>${highlight(r.author, re)}</td>
      <td>${escHtml(String(r.pages))}</td>
      <td><span class="tag-pill">${highlight(r.tag, re)}</span></td>
      <td><time datetime="${escHtml(r.dateAdded)}">${escHtml(r.dateAdded)}</time></td>
      <td>
        <div class="action-btns">
          <button class="btn-sm edit btn-edit"   data-id="${escHtml(r.id)}" aria-label="Edit ${escHtml(r.title)}">Edit</button>
          <button class="btn-sm delete btn-delete" data-id="${escHtml(r.id)}" aria-label="Delete ${escHtml(r.title)}">Del</button>
        </div>
      </td>`;
    frag.appendChild(tr);
  });
  tbody.appendChild(frag);
}

/** Replace a table row with inline edit inputs */
export function renderEditRow(rec) {
  const row = document.querySelector(`#catalog-tbody tr[data-id="${rec.id}"]`);
  if (!row) return;
  row.innerHTML = `
    <td><input class="edit-input field-input" data-field="title"     value="${escHtml(rec.title)}"     aria-label="Edit title"/></td>
    <td><input class="edit-input field-input" data-field="author"    value="${escHtml(rec.author)}"    aria-label="Edit author"/></td>
    <td><input class="edit-input field-input" data-field="pages"     value="${escHtml(String(rec.pages))}" type="number" min="0" aria-label="Edit pages" style="width:70px"/></td>
    <td><input class="edit-input field-input" data-field="tag"       value="${escHtml(rec.tag)}"       aria-label="Edit tag"/></td>
    <td><input class="edit-input field-input" data-field="dateAdded" value="${escHtml(rec.dateAdded)}" aria-label="Edit date" placeholder="YYYY-MM-DD"/></td>
    <td>
      <div class="action-btns">
        <button class="btn-sm edit   btn-save-edit"      data-id="${escHtml(rec.id)}" aria-label="Save changes">Save</button>
        <button class="btn-sm delete btn-cancel-edit-row" data-id="${escHtml(rec.id)}" aria-label="Cancel edit">✕</button>
      </div>
    </td>`;
  row.querySelector('.edit-input')?.focus();
}

// ── Cards (mobile) ────────────────────────────────────────
export function renderCards() {
  const container = $('cards-container');
  if (!container) return;
  const records = getFilteredSorted();
  const re      = getSearchPattern();

  if (records.length === 0) { container.innerHTML = ''; return; }

  container.innerHTML = records.map(r => `
    <article class="book-card" data-id="${escHtml(r.id)}">
      <div class="card-header">
        <strong>${highlight(r.title, re)}</strong>
        <span class="tag-pill">${highlight(r.tag, re)}</span>
      </div>
      <p class="card-author">${highlight(r.author, re)}</p>
      <p class="card-meta">${escHtml(String(r.pages))} pages · ${escHtml(r.dateAdded)}</p>
      ${r.notes ? `<p class="card-notes">${highlight(r.notes.slice(0,100)+(r.notes.length>100?'…':''),re)}</p>`:''}
      <div class="action-btns">
        <button class="btn-sm edit btn-edit"    data-id="${escHtml(r.id)}" aria-label="Edit ${escHtml(r.title)}">Edit</button>
        <button class="btn-sm delete btn-delete" data-id="${escHtml(r.id)}" aria-label="Delete ${escHtml(r.title)}">Delete</button>
      </div>
    </article>`).join('');
}

// ── Form helpers ──────────────────────────────────────────
export function showFieldError(fieldId, errorId, message) {
  const input = $(fieldId);
  const err   = $(errorId);
  if (input) {
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    input.classList.toggle('invalid', !!message);
    input.classList.toggle('valid',   !message && input.value.trim() !== '');
  }
  if (err) err.textContent = message ?? '';
}

export function resetForm() {
  $('book-form')?.reset();
  if ($('edit-id')) $('edit-id').value = '';
  if ($('form-heading')) $('form-heading').textContent = 'Add a Book';
  if ($('btn-submit'))   $('btn-submit').textContent   = 'Add to Vault';
  $('btn-cancel-edit')?.classList.add('hidden');
  document.querySelectorAll('.field-error').forEach(e => e.textContent='');
  document.querySelectorAll('.field-input').forEach(e => e.classList.remove('invalid','valid'));
}

export function populateFormForEdit(rec) {
  resetForm();
  if ($('edit-id'))   $('edit-id').value   = rec.id;
  if ($('f-title'))   $('f-title').value   = rec.title;
  if ($('f-author'))  $('f-author').value  = rec.author;
  if ($('f-pages'))   $('f-pages').value   = rec.pages;
  if ($('f-date'))    $('f-date').value    = rec.dateAdded;
  if ($('f-tag'))     $('f-tag').value     = rec.tag;
  if ($('f-isbn'))    $('f-isbn').value    = rec.isbn ?? '';
  if ($('f-notes'))   $('f-notes').value   = rec.notes ?? '';
  if ($('form-heading')) $('form-heading').textContent = 'Edit Book';
  if ($('btn-submit'))   $('btn-submit').textContent   = 'Save Changes';
  $('btn-cancel-edit')?.classList.remove('hidden');
}

export function populateSettings(s) {
  if ($('s-page-cap')) $('s-page-cap').value = s.pageCap ?? 5000;
  if ($('s-unit'))     $('s-unit').value     = s.unit    ?? 'pages';
}

// ── Confirm Dialog ────────────────────────────────────────
let _resolveDialog = null;

export function setupDialog() {
  $('dialog-confirm')?.addEventListener('click', () => { _resolveDialog?.(true);  closeDialog(); });
  $('dialog-cancel')?.addEventListener('click',  () => { _resolveDialog?.(false); closeDialog(); });
  $('confirm-dialog')?.addEventListener('keydown', e => {
    if (e.key === 'Escape') { _resolveDialog?.(false); closeDialog(); }
    if (e.key === 'Tab') {
      const btns = [$('dialog-confirm'), $('dialog-cancel')].filter(Boolean);
      if (!btns.length) return;
      e.preventDefault();
      const idx = btns.indexOf(document.activeElement);
      btns[(idx + (e.shiftKey ? -1 : 1) + btns.length) % btns.length]?.focus();
    }
  });
}

export function openConfirmDialog(message) {
  return new Promise(resolve => {
    _resolveDialog = resolve;
    const el = $('confirm-dialog');
    if ($('dialog-desc')) $('dialog-desc').textContent = message;
    el?.classList.remove('hidden');
    $('dialog-confirm')?.focus();
  });
}

function closeDialog() {
  $('confirm-dialog')?.classList.add('hidden');
  _resolveDialog = null;
}

// ── refreshAll — convenience wrapper ─────────────────────
export function refreshAll() {
  renderTable();
  renderCards();
  renderTagFilter();
  renderDashboard();
}