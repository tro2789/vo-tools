# VO Tools redesign — build spec (2026-09-06)

Source of truth: `design-reference/VO Tools - Redesign.dc.html` (Claude Design export). `VO Tools - Current.dc.html` is a recreation of the site as it is today, for comparison only. Open the redesign file in a text editor; each screen is a `<div data-screen-label="…">` block with inline styles. Copy sizes, colors, spacing and copy text from it exactly.

## What we implement

The design offers three Turn 1 directions (1a, 1b, 1c). **We implement 1b, the unified workspace**, plus every Turn 2 and Turn 3 screen, which all use the 1b shell. Ignore 1a and 1c.

| Screen id | Label in file | Route | Owner task |
|---|---|---|---|
| 1b | Workspace · Analysis (single mode, edit tab) | `/` (was `/script-analysis`, now a 308 redirect) | analysis |
| 3a | Analysis · Compare mode | `/` (was `/script-analysis`, now a 308 redirect) | analysis |
| 3b | Analysis · Pronunciation view | `/` (was `/script-analysis`, now a 308 redirect) | analysis |
| 3c | Analysis · First run (empty) | `/` (was `/script-analysis`, now a 308 redirect) | analysis |
| 2c | Teleprompter setup tab | `/teleprompter` | teleprompter |
| 2f | Teleprompter fullscreen | `/teleprompter` (fullscreen state) | teleprompter |
| 2g | Phone remote | `/remote` | remote |
| 2d | Convert tab (queue filled) | `/telephony-converter` | convert |
| 3d | Convert empty queue | `/telephony-converter` | convert |
| 2e | ACX tab (results) | `/acx-check` | acx |
| 3e | ACX empty | `/acx-check` | acx |

Routes: the Analysis workspace lives at `/` (landing page dropped 2026-09-06). Tab order in the top bar: Analysis, Teleprompter, Convert, ACX.

## Tokens (light theme, from the file)

| Token | Hex | Use |
|---|---|---|
| page | `#F2F3F5` | page background, active tab bg, selected row bg, chip-on bg |
| panel | `#FFFFFF` | main panel, rail, document bar |
| subtle | `#FAFBFC` | table headers, drop zones, info boxes, sub-footers |
| line | `#E4E6E9` | default 1px borders, grid gap lines |
| line-strong | `#C9CCD1` | control borders (segmented, inputs, secondary buttons), dashed drop zones |
| line-faint | `#F2F3F5` | row dividers inside lists |
| ink | `#131313` | headings, primary values, active text, dark bars |
| body | `#333438` | body text, values |
| muted | `#6E7076` | labels, secondary text, icons |
| disabled | `#8A8D93` | disabled text, empty-state numbers |
| button | `#262626` | primary button bg, selected segment bg, active tab underline |
| bar-bg | `#131313` | top bar and status bar |
| bar-text | `#B9BCC2` | top bar inactive tabs, status bar text |
| bar-bright | `#E4E6E9` | top bar Discord text |
| bar-line | `#3A3A3A` | top bar control borders |
| bar-muted | `#9A9CA2` | dark-panel labels |
| ok | `#167A4B` | saved dot, PASS, added diff text |
| ok-bg | `#E8F2EC` | added diff bg |
| bad | `#B3261E` | FAIL, negative delta, removed diff text |
| bad-bg | `#FBEAE8` | removed diff bg |
| stage | `#0A0A0A` | teleprompter fullscreen and phone remote bg (both themes) |

Dark theme (the design shows light only; keep next-themes dark mode working with this mapping): page `#0A0A0A`, panel `#131313`, subtle `#171717`, line `#262626`, line-strong `#3A3A3A`, line-faint `#1F1F1F`, ink `#F2F3F5`, body `#D4D6DA`, muted `#8A8D93`, disabled `#5F6167`, button `#E4E6E9` with ink text, bar-bg `#000000`, bar-text `#8A8D93`, bar-bright `#D4D6DA`, bar-line `#2A2A2A`, ok/bad keep, ok-bg `#12301F`, bad-bg `#3A1512`.

Tokens live in `app/globals.css` as CSS variables on `:root` and `.dark`, exposed to Tailwind through `@theme inline` so classes like `bg-panel`, `text-muted`, `border-line`, `bg-bar` work. The shell task creates them; page tasks use them and never hard-code hex values (except `stage` screens, which may use the token).

## Type and shape rules

- Font: Inter (already loaded via next/font). Add `font-variant-numeric: tabular-nums` on body.
- **No border radius anywhere** (except the 5px saved dot). Remove all `rounded-*` classes you touch.
- No shadows except the pronunciation popover (`0 8px 24px rgba(19,19,19,0.14)`).
- No cyan. No gradients (except the fullscreen teleprompter fades). Remove `cyan-*` classes you touch.
- Section labels: 10px, weight 600, letter-spacing 0.14em, uppercase, muted.
- Status/meta text: 11px, uppercase, muted (e.g. "412 CHARS", "3 FILES · 12.4 MB").
- Body text 12px; panel body copy 13px–15px; big metrics 40px/1 weight 600.
- Controls are short: 26px tall in the document bar, 28px–32px in rails, 40px for the rail's primary action, 24px chips.
- Dense spacing: 14–16px panel padding, 10–12px between label and content.
- Icons: lucide-react, 13–14px in controls, 16px in landing rows, 18–22px in drop zones.

## Shell contract (built by the shell task, used by every page task)

All in `components/shell/`:

- `TopBar` — 44px, `bar-bg`. Left: "VO TOOLS" wordmark (12px, 700, tracking 0.16em, white) then the four tabs (44px tall, 12px text, padding 0 12px; active = `page` bg + `ink` text weight 500; inactive = `bar-text`). Right: theme toggle (26px square, `bar-line` border), Discord link (26px, `bar-line` border, `bar-bright` text, message-circle icon), Support link (26px, white bg, ink text, filled heart). On `/` it renders the landing variant instead: 48px, `panel` bg, `line` bottom border, wordmark 13px ink, no tabs, right controls with light borders (28px tall, Support = `button` bg white text). Hidden on `/remote`. Rendered once from `app/layout.tsx`. Below `md` the tabs scroll horizontally and the Discord/Support labels hide (icons stay).
- `DocumentBar` — `panel` bg, `line` bottom border, padding 10px 16px, flex space-between. Props: `icon` (lucide component), `title` (ReactNode: an editable input or static text), `meta` (ReactNode, e.g. saved indicator or "3 FILES · 12.4 MB"), `actions` (ReactNode, right side). Wraps on small screens.
- `SavedIndicator` — 5px `ok` dot + 11px uppercase muted text ("SAVED", "SAVING…", "NOTHING TO SAVE YET").
- `Workspace` — the body grid: `grid-cols-[1fr_340px]` with `gap-px bg-line`; children `main` and `rail` render in `panel` bg cells. Below `lg` the rail stacks under main. Prop `mainClassName` for min-height.
- `StatusBar` — 28px, `bar-bg`, 11px uppercase `bar-text`, first left item white. Props: `left: ReactNode[]`, `right: ReactNode[]`. Items are separated by 20px gap. Below `md` only the first two left items and the last right item show.
- `RailSection` — padding 14px 16px (`p-4` variant for 16px), `line` bottom border unless `last`. Optional `label` (renders `SectionLabel`) and `labelRight` slot.
- `SectionLabel` — the 10px uppercase label.
- `Segmented` — bordered group (`line-strong`), `size` 26|28; options `{value,label,disabled?}`; selected = `button` bg white text weight 500; others `panel` bg muted text.
- `Button` — variants `primary` (`button` bg, white text, weight 500), `secondary` (`panel` bg, `line-strong` border, `body` text), `ghost` (transparent, muted, for the 26px document-bar actions where the design shows a light-bordered muted button, use `secondary` with muted text via `tone="muted"`). Sizes 26|28|32|40. Optional leading icon. Full width via className.
- `IconButton` — 24px square, transparent, muted (trash rows, close, copy).
- `Chip` — 24px checkbox chip for text-expansion options: on = `page` bg + `line-strong` border, off = `panel` bg + `line` border. 12px native checkbox + 11px label.
- `Kbd` — `line-strong` border, 2px 6px padding, 10px text.
- `DropZone` — dashed `line-strong` border, `subtle` bg, centered column; props `icon`, `title`, `hint`, `formats` (uppercase 10px, tracking 0.08em), `height`, plus input props for file selection and drag/drop handlers.
- `DataTable` helpers are not required; build tables with CSS grid rows per the design (`grid-template-columns` copied from the file, 30px `subtle` header row with 10px uppercase labels).
- `Pill` — PASS/FAIL outline badge (11px, 600, 1px border in `ok`/`bad`, padding 2px 6px).

Also from the shell task: `hooks/useScriptDocument.ts` — one persistent script document shared by Analysis and Teleprompter. Stored in localStorage key `vo-tools-script-doc` as `{ title: string; text: string; updatedAt: number }`. Returns `{ title, text, setTitle, setText, reset, updatedAt }`. Uses `useSyncExternalStore` or an equivalent so two components on the same page stay in sync, and the `storage` event so tabs stay in sync. Default title `""` (UI shows "Untitled script" placeholder).

## Behaviour rules for every task

- Keep every existing feature working. This is a restyle plus the small interaction changes the design shows. Do not remove capabilities the current pages have.
- Keep the routes, the API routes, the hooks in `hooks/` and `lib/`, and the utils untouched unless the spec says otherwise. `npm test` must stay green (139 tests).
- Use the shell components. Do not re-create bars or rails ad hoc.
- Mobile: every page must still work at 390px wide. Rail stacks under main; tables get `overflow-x-auto`; drop zones stay tappable.
- Copy text comes from the design file. Where the design shows a note that a feature is "PROPOSED" (3c: paste-from-clipboard, open-a-.txt, load-a-sample), implement those three buttons for real; they are small.
- Dark mode must look intentional using the dark token mapping. Check both themes.
- Remove the old `Navigation.tsx` usage; the shell's `TopBar` replaces it (shell task deletes the file).
- The teleprompter fullscreen (2f) and phone remote (2g) always use the `stage` palette regardless of theme.
- Accessibility: buttons have labels, inputs have labels or aria-labels, focus rings visible (use `outline: 1px solid` ink/`button`, offset 2px).
- Do not add dependencies.
- Checks before you finish: `npx tsc --noEmit`, `npm test`, `npm run build`. Lint has 9 pre-existing errors in untouched files; do not add new ones in files you touch (`npx eslint <files>`).
