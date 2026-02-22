// main.js — entry point, wires all events
import { initState, getRecords, getSettings, addRecord, updateRecord, deleteRecord,
         replaceAllRecords, setSearchPattern, setSortKey, setTagFilter, generateId, updateSettings } from './state.js';
import { navigateTo, renderTable, renderCards, renderDashboard, renderTagFilter,
         showFieldError, resetForm, populateFormForEdit, renderEditRow,
         announce, openConfirmDialog, setupDialog, applyTheme, populateSettings, refreshAll } from './ui.js';
import { validateTitle, validateAuthor, validatePages, validateDate, validateTag,
         validateISBN, warnDuplicateWords, validateAll, compileRegex, validateRegexPattern, validateImport } from './validators.js';

const $ = id => document.getElementById(id);
const today = () => new Date().toISOString().slice(0, 10);

// ── Boot ──────────────────────────────────────────────────
initState();
const s = getSettings();
applyTheme(s.theme);
populateSettings(s);
setupDialog();
refreshAll();
navigateTo('dashboard');
bindNav();
bindForm();
bindCatalog();
bindSettings();
$('theme-toggle')?.addEventListener('click', () => {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  updateSettings({ theme: next });
});
bindImportExport();

// ── Nav ───────────────────────────────────────────────────
function bindNav() {
  document.querySelectorAll('.nav-link').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(a.dataset.section);
      if (a.dataset.section === 'dashboard') renderDashboard();
    });
  });
}

// ── Form ──────────────────────────────────────────────────
function bindForm() {
  const fields = [
    ['f-title',  'f-title-err',  () => validateTitle($('f-title').value)],
    ['f-author', 'f-author-err', () => validateAuthor($('f-author').value)],
    ['f-pages',  'f-pages-err',  () => validatePages($('f-pages').value)],
    ['f-date',   'f-date-err',   () => validateDate($('f-date').value)],
    ['f-tag',    'f-tag-err',    () => validateTag($('f-tag').value)],
    ['f-isbn',   'f-isbn-err',   () => validateISBN($('f-isbn').value)],
    ['f-notes',  'f-notes-err',  () => warnDuplicateWords($('f-notes').value)],
  ];
  fields.forEach(([fId, eId, validate]) => {
    $( fId)?.addEventListener('input', () => showFieldError(fId, eId, validate()));
    $(fId)?.addEventListener('blur',  () => showFieldError(fId, eId, validate()));
  });

  $('f-date')?.addEventListener('focus', () => { if (!$('f-date').value) $('f-date').value = today(); });

  $('book-form')?.addEventListener('submit', e => { e.preventDefault(); handleSubmit(); });

  $('btn-cancel-edit')?.addEventListener('click', () => { resetForm(); navigateTo('catalog'); });

  $('book-form')?.addEventListener('reset', () => setTimeout(() => {
    document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
    document.querySelectorAll('.field-input').forEach(el => el.classList.remove('invalid', 'valid'));
    $('form-status').textContent = '';
  }, 0));
}

function handleSubmit() {
  const f = {
    title:     $('f-title').value,  author:    $('f-author').value,
    pages:     $('f-pages').value,  dateAdded: $('f-date').value,
    tag:       $('f-tag').value,    isbn:      $('f-isbn').value,
    notes:     $('f-notes').value,
  };
  const r = validateAll(f);
  showFieldError('f-title',  'f-title-err',  r.title);
  showFieldError('f-author', 'f-author-err', r.author);
  showFieldError('f-pages',  'f-pages-err',  r.pages);
  showFieldError('f-date',   'f-date-err',   r.dateAdded);
  showFieldError('f-tag',    'f-tag-err',    r.tag);
  showFieldError('f-isbn',   'f-isbn-err',   r.isbn);
  showFieldError('f-notes',  'f-notes-err',  r.notes);
  if (!r.allValid) { document.querySelector('.field-input.invalid')?.focus(); return; }

  const now = new Date().toISOString();
  const editId = $('edit-id').value;
  const data = { title: f.title.trim(), author: f.author.trim(), pages: Number(f.pages),
                 dateAdded: f.dateAdded.trim(), tag: f.tag.trim(), isbn: f.isbn.trim(), notes: f.notes.trim() };

  if (editId) {
    updateRecord(editId, data);
    flashStatus('✓ Book updated.');
    announce('Book updated.');
  } else {
    addRecord({ id: generateId(), ...data, createdAt: now, updatedAt: now });
    flashStatus('✓ Added to the Vault!');
    announce('Book added to the Vault.');
  }
  resetForm();
  refreshAll();
}

// ── Catalog ───────────────────────────────────────────────
function bindCatalog() {
  const searchInput = $('search-input');
  const searchCase  = $('search-case');
  const searchErr   = $('search-error');

  function applySearch() {
    const raw = searchInput?.value || '';
    if (!raw.trim()) { setSearchPattern(null); searchErr.textContent = ''; renderTable(); renderCards(); return; }
    const v = validateRegexPattern(raw);
    searchErr.textContent = v.valid ? '' : v.message;
    setSearchPattern(v.valid ? compileRegex(raw, searchCase?.checked) : null);
    renderTable(); renderCards();
  }

  searchInput?.addEventListener('input', applySearch);
  searchCase?.addEventListener('change', applySearch);
  $('sort-select')?.addEventListener('change', () => { setSortKey($('sort-select').value); renderTable(); renderCards(); });
  $('tag-filter')?.addEventListener('change', () => { setTagFilter($('tag-filter').value); renderTable(); renderCards(); });
  $('btn-clear-search')?.addEventListener('click', () => { if (searchInput) searchInput.value = ''; setSearchPattern(null); renderTable(); renderCards(); });

  // Table actions (event delegation)
  $('catalog-tbody')?.addEventListener('click', async e => {
    const id = e.target.closest('[data-id]')?.dataset.id;
    if (!id) return;
    const rec = getRecords().find(r => r.id === id);

    if (e.target.closest('.btn-edit')) {
      renderEditRow(rec);
    } else if (e.target.closest('.btn-delete')) {
      if (rec && await openConfirmDialog(`Delete "${rec.title}"?`)) {
        deleteRecord(id); announce(`"${rec.title}" deleted.`); refreshAll();
      }
    } else if (e.target.closest('.btn-save-edit')) {
      const row = e.target.closest('tr');
      const patch = {};
      row?.querySelectorAll('.edit-input').forEach(inp => { patch[inp.dataset.field] = inp.value; });
      if (patch.pages) patch.pages = Number(patch.pages);
      updateRecord(id, patch);
      announce('Book updated.'); refreshAll();
    } else if (e.target.closest('.btn-cancel-edit-row')) {
      renderTable();
    }
  });

  // Card actions (mobile) — delegated from catalog section
  $('section-catalog')?.addEventListener('click', async e => {
    if (e.target.closest('.table-wrap')) return;
    const id = e.target.closest('[data-id]')?.dataset.id;
    if (!id) return;
    const rec = getRecords().find(r => r.id === id);
    if (e.target.closest('.btn-edit') && rec) {
      populateFormForEdit(rec); navigateTo('add');
    } else if (e.target.closest('.btn-delete') && rec) {
      if (await openConfirmDialog(`Delete "${rec.title}"?`)) {
        deleteRecord(id); announce(`"${rec.title}" deleted.`); refreshAll();
      }
    }
  });
}

// ── Settings ──────────────────────────────────────────────
function bindSettings() {
  $('btn-save-cap')?.addEventListener('click', () => {
    const v = Number($('s-page-cap')?.value);
    if (v < 1) { announce('Enter a valid page target.'); return; }
    updateSettings({ pageCap: v }); renderDashboard(); announce(`Target set to ${v} pages.`);
  });
  $('btn-save-unit')?.addEventListener('click', () => {
    const u = $('s-unit')?.value;
    updateSettings({ unit: u }); refreshAll(); announce(`Unit changed to ${u}.`);
  });
  $('btn-clear-all')?.addEventListener('click', async () => {
    if (await openConfirmDialog('Delete ALL books? This cannot be undone.')) {
      replaceAllRecords([]); announce('All data cleared.'); refreshAll();
    }
  });
}

// ── Import / Export ───────────────────────────────────────
function bindImportExport() {
  $('btn-export')?.addEventListener('click', () => {
    download(JSON.stringify(getRecords(), null, 2), 'book-vault.json', 'application/json');
    announce(`Exported ${getRecords().length} records.`);
  });

  $('btn-export-csv')?.addEventListener('click', () => {
    const keys = ['id','title','author','pages','tag','dateAdded','isbn','notes','createdAt','updatedAt'];
    const rows = getRecords().map(r => keys.map(k => csvEsc(r[k] ?? '')).join(','));
    download([keys.join(','), ...rows].join('\r\n'), 'book-vault.csv', 'text/csv');
    announce(`Exported ${getRecords().length} records as CSV.`);
  });

  $('import-file')?.addEventListener('change', async e => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const v = validateImport(parsed);
      if (!v.valid) { alert('Import failed:\n' + v.errors.join('\n')); return; }
      if (await openConfirmDialog(`Import ${parsed.length} records? This replaces your current vault.`)) {
        replaceAllRecords(parsed); announce(`Imported ${parsed.length} records.`); refreshAll();
      }
    } catch { alert('Import failed: invalid JSON.'); }
    finally   { e.target.value = ''; }
  });
}

// ── Helpers ───────────────────────────────────────────────
function download(content, filename, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  Object.assign(document.createElement('a'), { href: url, download: filename }).click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function csvEsc(v) {
  const s = String(v);
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g,'""')}"` : s;
}

function flashStatus(msg) {
  const el = $('form-status');
  if (!el) return;
  el.textContent = msg;
  setTimeout(() => { el.textContent = ''; }, 4000);
}