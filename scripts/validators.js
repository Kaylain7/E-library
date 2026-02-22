// validators.js — all regex validation for Book & Notes Vault

// Patterns
const RE_CLEAN    = /^\S(?:.*\S)?$|^\S$/;   // no leading/trailing spaces
const RE_DBLSPACE = /  /;                    // consecutive spaces
const RE_PAGES    = /^(0|[1-9]\d*)(\.\d{1,2})?$/;
const RE_DATE     = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const RE_TAG      = /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/;
const RE_ISBN     = /^(?:(?:\d[\s-]?){9}[\dX]|(?:\d[\s-]?){13})$|^$/;
const RE_DUPWORD  = /\b(\w+)\s+\1\b/i;                // ADVANCED: back-reference
const RE_ALLCAPS  = /^(?![A-Z\s]+$).+$/;              // ADVANCED: negative lookahead

const ok  = ()  => ({ valid: true,  message: '' });
const err = msg => ({ valid: false, message: msg });

export function validateTitle(v) {
  if (!v?.trim())              return err('Title is required.');
  if (!RE_CLEAN.test(v))       return err('No leading or trailing spaces.');
  if (RE_DBLSPACE.test(v))     return err('No consecutive spaces.');
  if (!RE_ALLCAPS.test(v))     return err('Title must not be entirely uppercase.');
  return ok();
}

export function validateAuthor(v) {
  if (!v?.trim())              return err('Author is required.');
  if (!RE_CLEAN.test(v))       return err('No leading or trailing spaces.');
  if (RE_DBLSPACE.test(v))     return err('No consecutive spaces.');
  if (RE_DUPWORD.test(v))      return err('Author name contains a duplicated word.');
  return ok();
}

export function validatePages(v) {
  if (!v?.trim())              return err('Pages is required.');
  if (!RE_PAGES.test(v.trim())) return err('Must be a positive number (e.g. 312).');
  const n = parseFloat(v);
  if (n < 1)                   return err('Must be at least 1.');
  if (n > 99999)               return err('Exceeds maximum (99999).');
  return ok();
}

export function validateDate(v) {
  if (!v?.trim())              return err('Date is required.');
  if (!RE_DATE.test(v.trim())) return err('Use YYYY-MM-DD format (e.g. 2024-03-15).');
  if (isNaN(new Date(v).getTime())) return err('Not a valid calendar date.');
  return ok();
}

export function validateTag(v) {
  if (!v?.trim())              return err('Tag is required.');
  if (!RE_TAG.test(v.trim()))  return err('Letters, spaces, or hyphens only (e.g. "Sci-Fi").');
  return ok();
}

export function validateISBN(v) {
  if (!v?.trim()) return ok();
  if (!RE_ISBN.test(v.trim())) return err('Unrecognised ISBN format.');
  return ok();
}

export function warnDuplicateWords(v) {
  const m = v && v.match(RE_DUPWORD);
  return m ? { warn: true, message: `Duplicate word: "${m[0]}"` } : { warn: false, message: '' };
}

export function validateAll(f) {
  const r = {
    title: validateTitle(f.title), author: validateAuthor(f.author),
    pages: validatePages(f.pages), dateAdded: validateDate(f.dateAdded),
    tag: validateTag(f.tag), isbn: validateISBN(f.isbn),
    notes: warnDuplicateWords(f.notes),
  };
  r.allValid = r.title.valid && r.author.valid && r.pages.valid
             && r.dateAdded.valid && r.tag.valid && r.isbn.valid;
  return r;
}

export function compileRegex(input, caseSensitive = false) {
  if (!input?.trim()) return null;
  try { return new RegExp(input.trim(), caseSensitive ? '' : 'i'); } catch { return null; }
}

export function validateRegexPattern(input) {
  if (!input?.trim()) return { valid: true, message: '' };
  try { new RegExp(input.trim()); return { valid: true, message: '' }; }
  catch (e) { return { valid: false, message: `Invalid regex: ${e.message}` }; }
}

const REQUIRED = ['id', 'title', 'author', 'pages', 'tag', 'dateAdded', 'createdAt', 'updatedAt'];
export function validateImport(data) {
  if (!Array.isArray(data))  return { valid: false, errors: ['Must be a JSON array.'] };
  if (!data.length)          return { valid: false, errors: ['Array is empty.'] };
  const errors = [];
  data.forEach((item, i) => {
    if (typeof item !== 'object' || !item) { errors.push(`Item ${i}: not an object.`); return; }
    REQUIRED.forEach(k => { if (!(k in item)) errors.push(`Item ${i}: missing "${k}".`); });
    if (item.pages != null && isNaN(Number(item.pages))) errors.push(`Item ${i}: "pages" not numeric.`);
  });
  return { valid: !errors.length, errors };
}