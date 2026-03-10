// scripts/validators.js — all regex validation rules + search compiler

// Rule 1 — Title/Author: no leading/trailing spaces
const RE_TITLE = /^\S(?:.*\S)?$/;
// Advanced Rule 1b — back-reference: catch duplicate consecutive words
const RE_DUP_WORD = /\b(\w+)\s+\1\b/i;

// Rule 2 — Pages: non-negative integer or decimal ≤ 2 places
const RE_PAGES = /^(0|[1-9]\d*)(\.\d{1,2})?$/;

// Rule 3 — Date: YYYY-MM-DD
const RE_DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

// Rule 4 — Tag: letters, spaces, hyphens; letter-bounded segments
const RE_TAG = /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/;

// Rule 5 (Advanced — lookahead) — ISBN-10 or ISBN-13
// Strip hyphens first, then lookahead: assert 10-char ISBN-10 OR 13-digit ISBN-13
const RE_ISBN_CLEAN = /^(?=(\d{9}[\dX]|97[89]\d{10})$)[\dX]+$/i;

export function validateTitle(v) {
  if (!v || !v.trim()) return 'Title is required.';
  if (!RE_TITLE.test(v)) return 'No leading or trailing spaces.';
  if (RE_DUP_WORD.test(v)) return 'Title contains a repeated consecutive word.';
  return null;
}

export function validateAuthor(v) {
  if (!v || !v.trim()) return 'Author is required.';
  if (!RE_TITLE.test(v)) return 'No leading or trailing spaces.';
  if (RE_DUP_WORD.test(v)) return 'Author contains a repeated consecutive word.';
  return null;
}

export function validatePages(v) {
  if (!v || !v.trim()) return 'Page count is required.';
  if (!RE_PAGES.test(v.trim())) return 'Must be a non-negative number, e.g. 320 or 12.5.';
  return null;
}

export function validateDate(v) {
  if (!v || !v.trim()) return 'Date is required.';
  if (!RE_DATE.test(v.trim())) return 'Use YYYY-MM-DD format, e.g. 2025-04-15.';
  return null;
}

export function validateTag(v) {
  if (!v || !v.trim()) return 'Tag is required.';
  if (!RE_TAG.test(v.trim())) return 'Letters, spaces, or hyphens only (e.g. Sci-Fi).';
  return null;
}

export function validateISBN(v) {
  if (!v || !v.trim()) return null; // optional
  const clean = v.trim().replace(/-/g, '');
  if (!RE_ISBN_CLEAN.test(clean)) return 'Must be a valid ISBN-10 or ISBN-13.';
  return null;
}

/** Warn (not block) when notes contain duplicate consecutive words. */
export function warnDuplicateWords(v) {
  if (!v || !v.trim()) return null;
  if (RE_DUP_WORD.test(v)) return 'Note contains a repeated word (e.g. "the the").';
  return null; // warning only — null = no blocking error
}

/**
 * Validate all form fields at once.
 * Returns { title, author, pages, dateAdded, tag, isbn, notes, allValid }.
 */
export function validateAll(f) {
  const title     = validateTitle(f.title);
  const author    = validateAuthor(f.author);
  const pages     = validatePages(f.pages);
  const dateAdded = validateDate(f.dateAdded);
  const tag       = validateTag(f.tag);
  const isbn      = validateISBN(f.isbn);
  const notes     = null; // notes field not blocking
  const allValid  = [title, author, pages, dateAdded, tag, isbn].every(e => e === null);
  return { title, author, pages, dateAdded, tag, isbn, notes, allValid };
}

// ── Search regex compiler ──────────────────────────────────

/**
 * Validate that a user-typed pattern is a legal regex.
 * Supports /pattern/flags notation.
 * Returns { valid: boolean, message: string }
 */
export function validateRegexPattern(input) {
  if (!input || !input.trim()) return { valid: true, message: '' };
  const slashMatch = input.match(/^\/(.+)\/([gimsuy]*)$/);
  if (slashMatch) {
    try { new RegExp(slashMatch[1], slashMatch[2]); return { valid: true, message: '' }; }
    catch (e) { return { valid: false, message: `Invalid regex: ${e.message}` }; }
  }
  return { valid: true, message: '' }; // plain text always valid
}

/**
 * Compile a user pattern into a RegExp.
 * @param {string} input
 * @param {boolean} caseSensitive
 * @returns {RegExp|null}
 */
export function compileRegex(input, caseSensitive = false) {
  if (!input || !input.trim()) return null;
  const flags = caseSensitive ? 'g' : 'gi';
  const slashMatch = input.match(/^\/(.+)\/([gimsuy]*)$/);
  if (slashMatch) {
    try { return new RegExp(slashMatch[1], slashMatch[2] || (caseSensitive ? '' : 'i')); }
    catch { return null; }
  }
  try {
    const escaped = input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(escaped, caseSensitive ? '' : 'i');
  } catch { return null; }
}

// ── Import validation ─────────────────────────────────────
export function validateImport(data) {
  if (!Array.isArray(data)) return { valid: false, errors: ['Root must be a JSON array.'] };
  const errors = [];
  data.forEach((rec, i) => {
    if (!rec || typeof rec !== 'object') { errors.push(`Index ${i}: not an object.`); return; }
    ['id','title','author','pages','tag','dateAdded','createdAt','updatedAt'].forEach(k => {
      if (!(k in rec)) errors.push(`Index ${i}: missing field "${k}".`);
    });
    if (typeof rec.pages !== 'number') errors.push(`Index ${i}: "pages" must be a number.`);
  });
  return { valid: errors.length === 0, errors };
}