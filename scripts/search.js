// scripts/search.js
// Search utilities — re-exported from validators.js for compatibility.
export { compileRegex, validateRegexPattern } from './validators.js';

/**
 * Highlight regex matches in plain text by wrapping in <mark>.
 * @param {string} text
 * @param {RegExp|null} re
 * @returns {string} HTML string
 */
export function highlight(text, re) {
  if (!re || !text) return escHtml(text ?? '');
  const esc = escHtml(text);
  const gre = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  return esc.replace(gre, m => `<mark>${m}</mark>`);
}

/**
 * Filter books array by regex across title, author, tag, notes.
 * @param {Array} books
 * @param {RegExp|null} re
 * @returns {Array}
 */
export function filterBooks(books, re) {
  if (!re) return books;
  return books.filter(b =>
    re.test(b.title)       ||
    re.test(b.author)      ||
    re.test(b.tag)         ||
    re.test(b.notes || '')
  );
}

function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}