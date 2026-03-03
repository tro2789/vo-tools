# VO Tools

Professional tools for voice actors and audio engineers.

## Tech Stack

- **Frontend**: Next.js 16 (App Router, standalone output, Turbopack dev), React 19, TypeScript
- **Styling**: Tailwind CSS v4 (CSS-based config in `globals.css`, `@theme`/`@custom-variant`/`@utility` syntax), PostCSS via `@tailwindcss/postcss`
- **Theming**: next-themes (light/dark, class-based via `@custom-variant dark`)
- **Backend**: Python Flask (audio processing — `app.py`, `acx_analyzer.py`), served by Gunicorn + Eventlet
- **Runtime**: Node 22 LTS, Python 3.13

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
  api/                  # API routes (convert, acx-check)
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
hooks/                  # React hooks
app.py                  # Flask backend (audio conversion, ACX analysis)
acx_analyzer.py         # ACX audio analysis logic
```

## Commands

```bash
npm run dev             # Start dev server (Turbopack)
npm run build           # Production build
npm run lint            # ESLint
```

## Deployment

- **Git**: `https://gitea.tohareprod.com/tro2789/vo-tools` — push to both `main` and `dev`
- **Docker**: `tro2789/vo-tools:latest` on Docker Hub
- **Build**: `docker build -t tro2789/vo-tools:latest .`
- **Push**: `docker push tro2789/vo-tools:latest`
- Dockerfile: multi-stage (node:22-alpine build → python:3.13-slim runtime)
