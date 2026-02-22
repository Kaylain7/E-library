// search.js — highlight regex matches, XSS-safe
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

export { esc as escapeHtml };

export function highlight(text, re) {
  if (!re) return esc(text);
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const parts = [];
  let last = 0, m;
  while ((m = g.exec(text)) !== null) {
    if (m.index === g.lastIndex) { g.lastIndex++; continue; }
    if (m.index > last) parts.push(esc(text.slice(last, m.index)));
    parts.push(`<mark>${esc(m[0])}</mark>`);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(esc(text.slice(last)));
  return parts.join('');
}