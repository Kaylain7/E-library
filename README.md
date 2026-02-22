# 📚 Book & Notes Vault

A personal reading tracker built with vanilla HTML, CSS, and JavaScript. No frameworks — just semantic HTML, modular ES modules, and localStorage for persistence.

> **Theme:** Book & Notes Vault  
> **Live Demo:** [https://yourusername.github.io/book-vault](https://yourusername.github.io/book-vault)  
> **Demo Video:** [Unlisted YouTube link — replace me](#)

---

## Features

- **Add, edit, and delete books** with title, author, pages, tag, date, ISBN, and notes
- **Live regex-powered search** with safe compilation, case toggle, and `<mark>` highlighting
- **Sort** by date, title (A→Z / Z→A), or pages (↑ / ↓)
- **Filter** by tag via dropdown
- **Dashboard stats:** total books, total pages, top tag, average pages, 7-day activity chart, tag breakdown bars
- **Reading target / page cap** with progress bar and ARIA live announcements
- **Inline table editing** (desktop) and form editing (mobile)
- **Confirm dialog** before destructive actions with keyboard trap and Escape support
- **JSON import/export** with schema validation; **CSV export** with proper escaping
- **Light / Dark theme toggle** persisted to localStorage
- **Fully keyboard-navigable:** skip link, visible focus styles, ARIA live regions
- **Mobile-first** responsive layout across 3 breakpoints (360px / 768px / 1024px)
- **`seed.json`** with 12 diverse records — importable via the UI

---

## Regex Catalog

| # | Pattern | Purpose | Example match |
|---|---------|---------|---------------|
| 1 | `/^\S(?:.*\S)?$|^\S$/` | Title/author: no leading/trailing spaces | ✓ `"Dune"` / ✗ `" Dune"` |
| 2 | `/ /` (double space) | Forbid consecutive spaces | ✗ `"Dune  the Book"` |
| 3 | `/^(0|[1-9]\d*)(\.\d{1,2})?$/` | Pages: non-negative integer or 1–2 decimal places | ✓ `"312"`, `"12.5"` / ✗ `"abc"` |
| 4 | `/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/` | Date: strict YYYY-MM-DD | ✓ `"2025-09-25"` / ✗ `"25/09/2025"` |
| 5 | `/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/` | Tag: letters, spaces, hyphens | ✓ `"Sci-Fi"` / ✗ `"123"` |
| 6 | `/^(?:\d[\s-]?){9}[\dX]|(?:\d[\s-]?){13})$|^$/` | ISBN-10 or ISBN-13 (optional) | ✓ `"978-0-7564-0407-1"` |
| **7 ★** | `/\b(\w+)\s+\1\b/i` | **ADVANCED back-reference:** duplicate consecutive words in author/notes | ✗ `"the the"`, ✗ `"Herbert Herbert"` |
| **8 ★** | `/^(?![A-Z\s]+$).+$/` | **ADVANCED negative lookahead:** title must not be entirely uppercase | ✗ `"DUNE"` / ✓ `"Dune"` |

*Search accepts any arbitrary regex pattern entered by the user, compiled safely with try/catch.*

---

## Keyboard Map

| Key / Action | Effect |
|---|---|
| `Tab` / `Shift+Tab` | Move focus through interactive elements |
| `Enter` / `Space` | Activate focused button or link |
| `Escape` | Close confirm dialog |
| Skip link (first Tab on load) | Jump directly to `#main-content` |
| Catalog table: `Tab` into | Scroll region focusable via `tabindex="0"` |
| Dialog: `Tab` | Trapped within dialog buttons |
| Sort select: arrow keys | Cycle through sort options |

---

## Accessibility Notes

- **Semantic landmarks:** `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`, `<article>`
- **Heading hierarchy:** `h1` per section; `h2` for subsections — never skips levels
- **All form inputs** have `<label>` bound via `for`/`id`; required fields marked with `aria-required="true"`
- **Visible focus styles** on every interactive element (2px outline in `--border-focus` colour)
- **ARIA live regions:**
  - `aria-live="polite"` on record count, cap status, form status, action status
  - `aria-live="assertive"` on search errors and cap-exceeded messages
  - `role="alert"` on inline field error spans
- **`<mark>` highlighting** preserves text content; screen readers announce the text normally
- **Progress bar** uses `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- **Confirm dialog** uses `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trap, Escape close
- **Colour contrast** — all text/background pairs exceed WCAG AA 4.5:1 in both light and dark themes

---

## How to Run Tests

1. Clone / download the repo
2. Serve locally (e.g. `npx serve .` or VS Code Live Server — required for ES modules)
3. Open `http://localhost:PORT/tests.html`
4. All assertions run inline; results display with pass/fail counts

---

## Project Structure

```
book-vault/
├── index.html          # Main app shell (semantic HTML, ARIA landmarks)
├── tests.html          # Standalone test suite (no build step)
├── seed.json           # 12 seed records for import/testing
├── README.md
├── styles/
│   └── main.css        # Mobile-first CSS, CSS custom properties, animations
└── scripts/
    ├── main.js         # Entry point — event wiring, nav, form, import/export
    ├── state.js        # Single source of truth; derived filtering/sorting
    ├── storage.js      # localStorage read/write abstraction
    ├── ui.js           # All DOM rendering (table, cards, dashboard, dialog)
    ├── validators.js   # All regex rules + safe search compiler + import validator
    └── search.js       # highlight() with XSS-safe HTML escaping
```

---

## Setup

```bash
# Clone
git clone https://github.com/yourusername/book-vault.git
cd book-vault

# Serve (ES modules require a server)
npx serve .
# or: python3 -m http.server 8080

# Open
open http://localhost:3000
```

To load seed data: **Catalog → Import JSON** → select `seed.json`.

---

## Commit History Milestones

| Milestone | Description |
|---|---|
| M1 | Spec, wireframes, data model, a11y plan |
| M2 | Semantic HTML structure, mobile-first base CSS |
| M3 | Form + all 8 regex validation rules, `tests.html` |
| M4 | Catalog table/cards, sorting, safe regex search, highlight |
| M5 | Dashboard stats, progress bar, ARIA live cap messages |
| M6 | localStorage persistence, JSON + CSV import/export, settings |
| M7 | Polish, dark mode, accessibility audit, README, demo video |

---

*Built for coursework — COMP Web Development. All code written by the repository owner.*
