// ui.js — all DOM rendering
import { getFilteredSorted, getRecords, getSettings, getSearchPattern, getUniqueTags } from './scripts/state.js';
import { highlight, escapeHtml } from './scripts/search.js';

const $ = id => document.getElementById(id);
const setText = (id, v) => { const el = $(id); if (el) el.textContent = String(v); };

function formatPages(pages, unit, cap) {
  const n = Number(pages);
  if (unit === 'chapters') return Math.round(n / 20);
  if (unit === 'percent')  return cap ? `${Math.round((n / cap) * 100)}%` : n;
  return n;
}

// ── Navigation ────────────────────────────────────────────
export function navigateTo(id) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  $(`section-${id}`)?.classList.add('active');
  document.querySelectorAll('.nav-link').forEach(a => {
    const active = a.dataset.section === id;
    a.classList.toggle('active', active);
    a.setAttribute('aria-current', active ? 'page' : 'false');
  });
}

// ── Table ─────────────────────────────────────────────────
export function renderTable() {
  const tbody = $('catalog-tbody');
  if (!tbody) return;
  const records = getFilteredSorted();
  const re = getSearchPattern();
  const { unit, pageCap } = getSettings();

  tbody.innerHTML = '';
  $('empty-state').hidden = records.length > 0;
  $('record-count').textContent = records.length
    ? `Showing ${records.length} of ${getRecords().length} book${getRecords().length !== 1 ? 's' : ''}`
    : '';

  records.forEach(r => {
    const tr = document.createElement('tr');
    tr.dataset.id = r.id;
    tr.innerHTML = `
      <td>
        <div class="td-title">${highlight(r.title, re)}</div>
        <div class="td-author">${highlight(r.author, re)}</div>
        ${r.isbn ? `<div class="isbn-meta">ISBN: ${escapeHtml(r.isbn)}</div>` : ''}
      </td>
      <td class="td-pages">${escapeHtml(String(formatPages(r.pages, unit, pageCap)))}</td>
      <td class="td-tag"><span class="tag-pill">${highlight(r.tag, re)}</span></td>
      <td class="td-date">${escapeHtml(r.dateAdded)}</td>
      <td class="td-actions">
        <div class="td-actions-inner">
          <button class="btn btn-sm btn-secondary btn-edit" data-id="${r.id}" aria-label="Edit ${escapeHtml(r.title)}">Edit</button>
          <button class="btn btn-sm btn-danger btn-delete" data-id="${r.id}" aria-label="Delete ${escapeHtml(r.title)}">Del</button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });
}

// ── Mobile Cards ──────────────────────────────────────────
export function renderCards() {
  let box = document.querySelector('.book-cards');
  if (!box) {
    box = document.createElement('div');
    box.className = 'book-cards';
    document.querySelector('.table-wrap')?.insertAdjacentElement('afterend', box);
  }
  const records = getFilteredSorted();
  const re = getSearchPattern();
  const { unit, pageCap } = getSettings();
  box.innerHTML = '';
  records.forEach(r => {
    const d = document.createElement('div');
    d.className = 'book-card';
    d.dataset.id = r.id;
    d.innerHTML = `
      <div class="book-card-title">${highlight(r.title, re)}</div>
      <div class="book-card-author">${highlight(r.author, re)}</div>
      <div class="book-card-meta">
        <span>📄 ${escapeHtml(String(formatPages(r.pages, unit, pageCap)))}</span>
        <span>🏷 ${highlight(r.tag, re)}</span>
        <span>📅 ${escapeHtml(r.dateAdded)}</span>
        ${r.isbn ? `<span>${escapeHtml(r.isbn)}</span>` : ''}
      </div>
      <div class="book-card-actions">
        <button class="btn btn-sm btn-secondary btn-edit" data-id="${r.id}" aria-label="Edit ${escapeHtml(r.title)}">Edit</button>
        <button class="btn btn-sm btn-danger btn-delete" data-id="${r.id}" aria-label="Delete ${escapeHtml(r.title)}">Delete</button>
      </div>`;
    box.appendChild(d);
  });
}

// ── Inline Edit Row ───────────────────────────────────────
export function renderEditRow(rec) {
  const tr = document.querySelector(`tr[data-id="${rec.id}"]`);
  if (!tr) return;
  tr.classList.add('edit-row');
  tr.innerHTML = `
    <td colspan="4">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:.5rem">
        <input class="edit-input" data-field="title"  value="${escapeHtml(rec.title)}"  aria-label="Title" />
        <input class="edit-input" data-field="author" value="${escapeHtml(rec.author)}" aria-label="Author" />
        <input class="edit-input" data-field="pages"  value="${rec.pages}" type="number" aria-label="Pages" />
        <input class="edit-input" data-field="tag"    value="${escapeHtml(rec.tag)}"    aria-label="Tag" />
      </div>
    </td>
    <td class="td-actions">
      <div class="td-actions-inner">
        <button class="btn btn-sm btn-primary btn-save-edit" data-id="${rec.id}">Save</button>
        <button class="btn btn-sm btn-ghost btn-cancel-edit-row" data-id="${rec.id}">Cancel</button>
      </div>
    </td>`;
  tr.querySelector('.edit-input')?.focus();
}

// ── Form helpers ──────────────────────────────────────────
export function populateFormForEdit(rec) {
  $('edit-id').value    = rec.id;
  $('f-title').value    = rec.title;
  $('f-author').value   = rec.author;
  $('f-pages').value    = rec.pages;
  $('f-tag').value      = rec.tag;
  $('f-date').value     = rec.dateAdded;
  $('f-isbn').value     = rec.isbn || '';
  $('f-notes').value    = rec.notes || '';
  $('h-add').textContent = 'Edit Book';
  $('btn-submit').textContent = 'Save Changes';
  $('btn-cancel-edit').hidden = false;
}

export function resetForm() {
  $('book-form')?.reset();
  $('edit-id').value = '';
  $('h-add').textContent = 'Add a Book';
  $('btn-submit').textContent = 'Add to Vault';
  $('btn-cancel-edit').hidden = true;
  document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  document.querySelectorAll('.field-input').forEach(el => el.classList.remove('invalid', 'valid'));
  $('form-status').textContent = '';
}

// ── Field error display ───────────────────────────────────
export function showFieldError(fieldId, errId, result) {
  const input = $(fieldId), errEl = $(errId);
  if (!input || !errEl) return;
  const bad = result.valid === false;
  input.classList.toggle('invalid', bad);
  input.classList.toggle('valid', !bad && !!input.value.trim());
  errEl.textContent = bad ? result.message : (result.warn ? result.message : '');
}

// ── Dashboard ─────────────────────────────────────────────
export function renderDashboard() {
  const records = getRecords();
  const { pageCap, unit } = getSettings();
  const totalPages = records.reduce((s, r) => s + Number(r.pages || 0), 0);
  const tagCounts = records.reduce((m, r) => { if (r.tag) m[r.tag] = (m[r.tag] || 0) + 1; return m; }, {});
  const topTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  setText('stat-total', records.length);
  setText('stat-pages', formatPages(totalPages, unit, pageCap));
  setText('stat-top-tag', topTag);
  setText('stat-avg', formatPages(records.length ? Math.round(totalPages / records.length) : 0, unit, pageCap));
  setText('cap-current', formatPages(totalPages, unit, pageCap));
  setText('cap-target-display', formatPages(pageCap, unit, pageCap));

  const pct = Math.min((totalPages / pageCap) * 100, 100);
  const fill = $('progress-fill');
  if (fill) { fill.style.width = `${pct}%`; fill.classList.toggle('over', totalPages > pageCap); }
  document.querySelector('.progress-bar-wrap')?.setAttribute('aria-valuenow', Math.round(pct));

  const statusEl = $('cap-status-msg');
  if (statusEl) {
    const rem = pageCap - totalPages;
    const over = totalPages >= pageCap;
    statusEl.textContent = over
      ? `🎉 Target exceeded by ${formatPages(Math.abs(rem), unit, pageCap)}!`
      : `${formatPages(rem, unit, pageCap)} pages remaining.`;
    statusEl.className = `cap-status${over ? ' exceeded' : ''}`;
  }

  renderWeekChart(records);
  renderTagBars(tagCounts, records.length);
}

function renderWeekChart(records) {
  const chart = $('week-chart');
  if (!chart) return;
  chart.innerHTML = '';
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const counts = Object.fromEntries(days.map(d => [d, 0]));
  records.forEach(r => { if (counts[r.dateAdded] !== undefined) counts[r.dateAdded]++; });
  const max = Math.max(...Object.values(counts), 1);
  days.forEach(day => {
    const n = counts[day];
    const label = new Date(day + 'T12:00').toLocaleDateString('en', { weekday: 'short' });
    const col = document.createElement('div');
    col.className = 'bar-day';
    col.innerHTML = `
      <div class="bar-fill" style="height:${(n / max) * 100}%" data-count="${n}" role="img" aria-label="${label}: ${n}" tabindex="0"></div>
      <span class="bar-label">${escapeHtml(label)}</span>`;
    chart.appendChild(col);
  });
}

function renderTagBars(tagCounts, total) {
  const el = $('tag-bars');
  if (!el) return;
  const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (!sorted.length) { el.textContent = 'No tags yet.'; return; }
  const max = sorted[0][1];
  el.innerHTML = sorted.map(([tag, count]) => `
    <div class="tag-bar-row">
      <span class="tag-bar-name" title="${escapeHtml(tag)}">${escapeHtml(tag)}</span>
      <div class="tag-bar-track" role="progressbar" aria-valuenow="${count}" aria-valuemin="0" aria-valuemax="${total}">
        <div class="tag-bar-fill" style="width:${(count / max) * 100}%"></div>
      </div>
      <span class="tag-bar-count">${count}</span>
    </div>`).join('');
}

// ── Tag filter + datalist ─────────────────────────────────
export function renderTagFilter() {
  const sel = $('tag-filter');
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = '<option value="">All Tags</option>';
  getUniqueTags().forEach(tag => {
    const opt = document.createElement('option');
    opt.value = tag; opt.textContent = tag;
    if (tag === current) opt.selected = true;
    sel.appendChild(opt);
  });
  const dl = $('tag-suggestions');
  if (dl) { dl.innerHTML = ''; getUniqueTags().forEach(tag => { const o = document.createElement('option'); o.value = tag; dl.appendChild(o); }); }
}

// ── ARIA announce ─────────────────────────────────────────
export function announce(msg, id = 'action-status') {
  const el = $(id);
  if (!el) return;
  el.textContent = '';
  requestAnimationFrame(() => { el.textContent = msg; });
}

// ── Confirm dialog ────────────────────────────────────────
let _resolve = null;
export function openConfirmDialog(msg) {
  return new Promise(res => {
    _resolve = res;
    $('confirm-msg').textContent = msg;
    $('confirm-dialog').hidden = false;
    $('confirm-ok')?.focus();
  });
}
export function setupDialog() {
  const dialog = $('confirm-dialog');
  if (!dialog) return;
  dialog.hidden = true;
  const close = v => { dialog.hidden = true; const r = _resolve; _resolve = null; r?.(v); };
  $('confirm-ok')?.addEventListener('click', () => close(true));
  $('confirm-cancel')?.addEventListener('click', () => close(false));
  dialog.addEventListener('click', e => { if (e.target === dialog) close(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !dialog.hidden) close(false); });
  dialog.addEventListener('keydown', e => {
    if (e.key !== 'Tab' || dialog.hidden) return;
    const btns = [...dialog.querySelectorAll('button')];
    if (e.shiftKey && document.activeElement === btns[0]) { e.preventDefault(); btns.at(-1).focus(); }
    else if (!e.shiftKey && document.activeElement === btns.at(-1)) { e.preventDefault(); btns[0].focus(); }
  });
}

// ── Theme ─────────────────────────────────────────────────
export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = $('theme-toggle');
  if (btn) {
    btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    btn.querySelector('.theme-icon').textContent = theme === 'dark' ? '☀︎' : '☾';
    btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }
}

// ── Settings populate ─────────────────────────────────────
export function populateSettings({ pageCap, unit }) {
  const cap = $('s-page-cap'), u = $('s-unit');
  if (cap) cap.value = pageCap;
  if (u)   u.value   = unit;
}

// ── Full refresh ──────────────────────────────────────────
export function refreshAll() {
  renderTable();
  renderCards();
  renderDashboard();
  renderTagFilter();
}