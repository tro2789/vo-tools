# VO Tools

Professional tools for voice actors and audio engineers.

## Tech Stack

- **Frontend**: Next.js 16 (App Router, standalone output, Turbopack dev), React 19, TypeScript
- **Styling**: Tailwind CSS v4 (CSS-based config in `globals.css`, `@theme`/`@custom-variant`/`@utility` syntax), PostCSS via `@tailwindcss/postcss`
- **Theming**: next-themes (light/dark, class-based via `@custom-variant dark`)
- **Backend**: Next.js API routes + FFmpeg via `child_process.execFile`, Socket.IO for WebSocket
- **Runtime**: Node 22 LTS
- **Audio**: FFmpeg/FFprobe (system dependency, installed in Docker image)
- **Server**: Custom `server.mjs` wrapping Next.js + Socket.IO on a single port

## Design System

Monochrome, flat, dense — no accent colour and no border radius. The design contract is
`design-reference/REDESIGN-SPEC.md`, drawn from `design-reference/VO Tools - Redesign.dc.html`.

- **Font**: Inter (via next/font/google), `font-variant-numeric: tabular-nums` on body.
- **Tokens**: CSS variables on `:root` / `.dark` in `app/globals.css`, exposed to Tailwind via
  `@theme inline`. Use the token classes, never hex: `bg-page`, `bg-panel`, `bg-subtle`,
  `border-line`, `border-line-strong`, `border-line-faint`, `text-ink`, `text-body`,
  `text-muted`, `text-disabled`, `bg-button`, `bg-bar`, `text-bar-text`, `text-bar-bright`,
  `border-bar-line`, `text-bar-muted`, `text-ok`, `bg-ok-bg`, `text-bad`, `bg-bad-bg`,
  `bg-stage`. Primary buttons are `bg-button text-panel` so they invert correctly in dark mode.
- **No cyan, no `rounded-*`, no shadows, no gradients.** The only radius is the 5px saved dot;
  the only gradients are the teleprompter fullscreen fades.
- Section labels 10px/600/0.14em uppercase muted. Status meta 11px uppercase muted. Body 12px,
  panel copy 13–15px, big metrics 40px/1 weight 600. Controls 26–32px, rail primary action 40px.
- Focus is a global `outline: 1px solid var(--ink)` with 2px offset; range/checkbox/radio use
  `accent-color: var(--button)`.
- **Shell components** live in `components/shell/` (barrel export in `index.ts`): `TopBar`,
  `DocumentBar`, `SavedIndicator`, `Workspace`, `StatusBar`, `RailSection`, `SectionLabel`,
  `Segmented`, `Button`, `IconButton`, `Chip`, `Kbd`, `DropZone`, `Pill`. Build pages from these
  rather than re-creating bars and rails ad hoc. `TopBar` is rendered once from `app/layout.tsx`
  (dark workspace bar on every route, hidden on `/remote`). Its Analysis tab points at `/`.
- **Shared script document**: `hooks/useScriptDocument.ts` holds the one script that Analysis and
  Teleprompter share — localStorage key `vo-tools-script-doc`, `{ title, text, updatedAt }`, via
  `useSyncExternalStore` plus the `storage` event. `readScriptDocument()` is the non-React
  accessor.
- **Hydration**: components whose initial state comes from `localStorage`/`sessionStorage` must not
  read storage while rendering. Gate them with `useHydrated()` (`hooks/useHydrated.ts`) and render a
  static shell frame until it returns `true` — this is what `components/ScriptWorkspace.tsx` does for
  `ScriptCalculator`, whose `useLocalStorage('vo-tools-state')` initialiser would otherwise make the
  first client render disagree with the server HTML.

## Project Structure

```
app/                    # Next.js App Router pages
  page.tsx              # Home = Script Analysis workspace (word count, timing, pricing).
                        #   `/script-analysis` 308-redirects here via next.config.mjs.
  globals.css           # Tailwind v4 config + design tokens
  sitemap.ts            # Auto-generated sitemap.xml (all public pages)
  telephony-converter/  # Audio format conversion for IVR/VoIP
  teleprompter/         # Auto-scrolling teleprompter with phone remote
  acx-check/            # ACX audiobook compliance checker
  remote/               # Phone remote control for teleprompter
  api/                  # API routes
    convert/            # Audio format conversion (direct FFmpeg)
    acx-check/          # ACX compliance analysis (direct FFmpeg)
    health/             # Health check endpoint
components/             # React components
  shell/                # Design-system shell (TopBar, DocumentBar, Workspace,
                        #   StatusBar, RailSection, SectionLabel, Segmented,
                        #   Button, IconButton, Chip, Kbd, DropZone, Pill,
                        #   SavedIndicator) — barrel export in index.ts
  ScriptWorkspace.tsx   # Hydration gate around ScriptCalculator (static shell first)
  ThemeToggle.tsx       # Dark/light toggle (variant: 'bar' | 'light')
  ScriptCalculator.tsx  # Main script analysis component
  acx/                  # ACX checker components
  teleprompter/         # Teleprompter components
  editor/               # Script editor components
  analysis/             # MetricsBlock, SpeedControl, format.ts (m:ss clock)
  pricing/              # QuoteSection (rail quote form + PDF button)
  comparison/           # DeltaTable, DiffPanes (compare mode)
  pronunciation/        # ScriptTextDisplay, PronunciationTooltip, LookedUpList
  settings/             # ExpansionSettings (chips)
lib/                    # Utilities
  audio/                # Audio processing modules
    ffmpeg.ts           # FFmpeg/FFprobe wrappers (uses execFile, safe from injection)
    convert.ts          # Audio conversion logic (format maps, filters)
    acx-analyzer.ts     # ACX compliance analysis
  types/                # TypeScript type definitions
hooks/                  # React hooks
  useScriptDocument.ts  # Shared script document (localStorage, cross-tab)
  useHydrated.ts        # false until hydration finishes (useSyncExternalStore)
design-reference/       # Redesign spec + Claude Design HTML exports
server.mjs              # Custom server (Next.js + Socket.IO, single port)
```

## Commands

```bash
npm run dev             # Start dev server (Turbopack)
npm run build           # Production build
npm run lint            # ESLint
node server.mjs         # Production server (after build)
```

## Environment Variables

- `ALLOWED_ORIGINS` — Comma-separated CORS origins (default: `http://localhost:3000`)
- `UPLOAD_FOLDER` — Temp directory for audio processing (default: `/tmp/uploads`)
- `FFMPEG_TIMEOUT` — FFmpeg conversion timeout in ms (default: `300000`)
- `MAX_CONTENT_LENGTH` — Max upload size in bytes (default: `52428800` / 50MB)
- `WS_RATE_LIMIT_PER_MINUTE` — WebSocket rate limit (default: `30`)

## Deployment

- **Hosting**: Self-hosted via Docker Compose on home box (migrated off Railway — Socket.IO + long FFmpeg jobs don't fit free-tier serverless)
- **Domain**: `voiceover-tools.com` via direct static-IP ingress (CF proxied A → `149.154.41.49` → Caddy edge LXC `192.168.0.254` → NPM → `http://192.168.0.83:3010`). Migrated 2026-08-19 — the domain had been missed in the 2026-08-03 Phase 3 cutover and rode the standby tunnel until then. Origin CA cert in `~/Repos/docs/edge-proxy/certs/`, zone SSL `strict`. `www` 301s to the apex at the Cloudflare edge.
- **Git**: `https://gitea.tohareprod.com/tro2789/vo-tools` — push to `main`
- Dockerfile: multi-stage (node:22-alpine build, node:22-alpine + ffmpeg runtime)
- Compose: `docker-compose.yml` builds locally, maps `3010:3000`, `restart: unless-stopped`
- Deploy workflow: commit → push → `docker compose up -d --build` on the home box (no CI/CD)

## Testing (added 2026-08-23)

Vitest, node environment. `npm test` runs 8 files / 139 tests over `utils/*` (text analysis, pause detection, pricing, comparison, pronunciation) and `lib/audio/*` (ffmpeg parsing with `execFile` mocked, ACX analyzer). Config: `vitest.config.mts`. Known quirk pinned by tests: `calculateSpokenWordCount` collapses contractions and hyphenated numbers into one token. Not covered: `pdfGenerator.ts`, `lib/api/converter.ts`, API route handlers.
CI: `.gitea/workflows/ci.yml` runs `npm ci` and the checks above on every push (Node 24, added 2026-08-23). Lint is not in CI because of 9 pre-existing ESLint errors in untouched files.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
