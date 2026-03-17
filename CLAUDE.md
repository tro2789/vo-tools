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

Mirrors the light theme of realvotalent.com:
- **Font**: Inter (via next/font/google)
- **Accent**: Cyan (`#0085d8` primary, `--color-cyan-*` palette in globals.css)
- **Neutrals**: Gray scale (Tailwind `gray-*`)
- **Light bg**: `#f5f7fa`, white cards, gray-200 borders
- **Dark bg**: `#000d15` (ink-950), `#072030` (space-900 cards), `gray-700/50` borders

When editing components, use `gray-*` for neutrals and `cyan-*` for accents. Do not use `stone-*` or `gold-*`.

## Project Structure

```
app/                    # Next.js App Router pages
  page.tsx              # Homepage
  script-analysis/      # Script word count, timing, pricing
  telephony-converter/  # Audio format conversion for IVR/VoIP
  teleprompter/         # Auto-scrolling teleprompter with phone remote
  acx-check/            # ACX audiobook compliance checker
  remote/               # Phone remote control for teleprompter
  api/                  # API routes
    convert/            # Audio format conversion (direct FFmpeg)
    acx-check/          # ACX compliance analysis (direct FFmpeg)
    health/             # Health check endpoint
components/             # React components
  Navigation.tsx        # Sticky nav (hidden on homepage)
  Footer.tsx            # Site footer
  ThemeToggle.tsx       # Dark/light mode toggle
  ScriptCalculator.tsx  # Main script analysis component
  acx/                  # ACX checker components
  teleprompter/         # Teleprompter components
  editor/               # Script editor components
  analysis/             # Analysis sidebar, speed control
  pricing/              # Pricing calculator
  comparison/           # Script diff/comparison
  pronunciation/        # Pronunciation guide
  settings/             # Expansion settings
lib/                    # Utilities
  audio/                # Audio processing modules
    ffmpeg.ts           # FFmpeg/FFprobe wrappers (uses execFile, safe from injection)
    convert.ts          # Audio conversion logic (format maps, filters)
    acx-analyzer.ts     # ACX compliance analysis
  socket/               # WebSocket modules
    rooms.ts            # Teleprompter remote room management
  types/                # TypeScript type definitions
hooks/                  # React hooks
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

- **Git**: `https://gitea.tohareprod.com/tro2789/vo-tools` — push to both `main` and `dev`
- **Docker**: `tro2789/vo-tools:latest` on Docker Hub
- **Build**: `docker build -t tro2789/vo-tools:latest .`
- **Push**: `docker push tro2789/vo-tools:latest`
- Dockerfile: multi-stage (node:22-alpine build, node:22-alpine + ffmpeg runtime)
- Single process, single port (3000)
