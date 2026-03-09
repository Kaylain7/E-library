// scripts/validators.js — regex validation rules

/**
 * Rule 1 — Title/Author: no leading/trailing whitespace, no double spaces.
 * Advanced: back-reference to catch duplicate consecutive words, e.g. "the the"
 */
const RE_TITLE = /^\S(?:.*\S)?$/;
const RE_DUP_WORD = /\b(\w+)\s+\1\b/i;   // back-reference — advanced regex

/**
 * Rule 2 — Pages: non-negative integer or decimal (up to 2 places)
 */
const RE_PAGES = /^(0|[1-9]\d*)(\.\d{1,2})?$/;

/**
 * Rule 3 — Date: YYYY-MM-DD
 */
const RE_DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/**
 * Rule 4 — Tag: letters, spaces, hyphens; must start/end with a letter.
 * Uses lookahead to ensure min 2 chars and at least one letter-only segment.
 */
const RE_TAG = /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/;

/**
 * Rule 5 (Advanced — lookahead) — ISBN-10 or ISBN-13 with optional hyphens.
 * ISBN-13: starts with 978 or 979 (positive lookahead), then 9 more digits.
 * ISBN-10: 9 digits then digit or X.
 */
const RE_ISBN = /^(?=(?:\d[-]?){9}[\dX]$|(?:97[89])[-]?\d{10}$)[\d-]+[\dX]$/i;

/**
 * Validate title/author field.
 * Returns null if valid, else an error message string.
 */
export function validateTitle(value) {
  if (!value || value.trim() === '') return 'Title is required.';
  if (!RE_TITLE.test(value)) return 'Title must not have leading or trailing spaces.';
  if (RE_DUP_WORD.test(value)) return 'Title contains a duplicate consecutive word.';
  return null;
}

export function validateAuthor(value) {
  if (!value || value.trim() === '') return 'Author is required.';
  if (!RE_TITLE.test(value)) return 'Author must not have leading or trailing spaces.';
  if (RE_DUP_WORD.test(value)) return 'Author contains a duplicate consecutive word.';
  return null;
}

/**
 * Validate pages field.
 */
export function validatePages(value) {
  if (!value || value.trim() === '') return 'Page count is required.';
  if (!RE_PAGES.test(value.trim())) return 'Pages must be a non-negative number (e.g. 320 or 12.5).';
  return null;
}

/**
 * Validate date (YYYY-MM-DD).
 */
export function validateDate(value) {
  if (!value || value.trim() === '') return 'Date is required.';
  if (!RE_DATE.test(value.trim())) return 'Date must be in YYYY-MM-DD format (e.g. 2025-04-15).';
  return null;
}

/**
 * Validate tag.
 */
export function validateTag(value) {
  if (!value || value.trim() === '') return 'Tag is required.';
  if (!RE_TAG.test(value.trim())) return 'Tag must contain only letters, spaces, or hyphens (e.g. Sci-Fi).';
  return null;
}

/**
 * Validate ISBN (optional — only if non-empty).
 */
export function validateISBN(value) {
  if (!value || value.trim() === '') return null; // optional
  if (!RE_ISBN.test(value.trim())) return 'ISBN must be a valid ISBN-10 or ISBN-13 format.';
  return null;
}

/**
 * Validate the entire form and return a map of { fieldName: errorMessage | null }
 */
export function validateForm(data) {
  return {
    title:  validateTitle(data.title),
    author: validateAuthor(data.author),
    pages:  validatePages(data.pages),
    date:   validateDate(data.dateAdded),
    tag:    validateTag(data.tag),
    isbn:   validateISBN(data.isbn),
  };
}