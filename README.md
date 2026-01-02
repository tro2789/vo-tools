# VO Tools

Handy tools designed for voice actors and audio engineers.

🌐 **Live Demo:** [voiceover-tools.com](https://voiceover-tools.com)

[![Docker Hub](https://img.shields.io/docker/pulls/tro2789/vo-tools)](https://hub.docker.com/r/tro2789/vo-tools)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

## Features

### 🎯 Script Analysis
- Real-time word and character count
- Adjustable reading speed calculation
- Pricing calculator with custom rates
- Script comparison and diff visualization
- **Pronunciation lookup** - Click a word to see ARPABET phonetic notation (North American English)

### 📜 Teleprompter
- Professional fullscreen teleprompter for studio recording
- Auto-scroll with adjustable speed control
- Elapsed and remaining time display
- Keyboard-first operation (Space, arrows, Esc, Home)
- Remote control via smartphone (scan QR code)

### 🎙️ Telephony Converter
- Convert audio files to telephony-compatible formats
- Batch file conversion with progress tracking
- Volume normalization
- Phone-optimized audio filtering (300-3400Hz)

### ✅ ACX Compliance Checker
- Automated ACX audiobook technical requirements validation
- MP3 format and bitrate verification (192+ kbps CBR)
- Sample rate checking (44.1 kHz)
- RMS loudness measurement (-23dB to -18dB)
- Peak amplitude analysis (≤ -3dB)
- Leading/trailing silence measurement
- Detailed compliance report with actionable guidance

## Quick Start

### Option 1: Docker Hub (Recommended)

The fastest way to get started - no cloning required:

```bash
docker run -d -p 3000:3000 -p 5000:5000 --name vo-tools tro2789/vo-tools:latest
```

Access at http://localhost:3000

### Option 2: Docker Compose

Clone the repo for more control over the deployment:

```bash
git clone https://github.com/tro2789/vo-tools.git
cd vo-tools
docker compose up -d
```

Access at http://localhost:3010

**Useful commands:**
```bash
docker compose down              # Stop
docker compose logs -f           # View logs
docker compose up -d --build     # Rebuild from source
```

### Option 3: Local Development (No Docker)

**Prerequisites:** Node.js 20+, Python 3.11+

```bash
git clone https://github.com/tro2789/vo-tools.git
cd vo-tools
npm install
npm run dev
```

Access at http://localhost:3000

> **Note:** The ACX Checker and Telephony Converter require the Python backend. See [Development Guide](docs/DEVELOPMENT.md) for full setup.

## Development

For active development with hot-reload:

```bash
# Start development container (ports 3011/5001)
docker compose -f docker-compose.dev.yml up -d --build

# View logs
docker logs -f vo-tools-dev
```

📖 **See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for:**
- Complete development workflow
- Git branching strategy (dev → main)
- Testing procedures
- Troubleshooting guide

## Project Structure

```
vo-tools/
├── app/                       # Next.js app router pages
│   ├── page.tsx               # Landing page
│   ├── acx-check/             # ACX compliance checker
│   ├── script-analysis/       # Script analysis tool
│   ├── teleprompter/          # Teleprompter tool
│   ├── telephony-converter/   # Audio converter tool
│   ├── remote/                # Mobile remote control
│   └── api/                   # API routes
├── components/                # React components
├── hooks/                     # Custom React hooks
├── lib/                       # Utilities and API clients
├── app.py                     # Flask API backend
├── acx_analyzer.py            # ACX audio analysis
├── Dockerfile                 # Production container
└── docs/                      # Documentation
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Backend | Python Flask, Gunicorn |
| Audio Processing | FFmpeg, pydub, scipy |
| Container | Docker, Supervisord |

## Environment Variables

Copy `.env.example` to `.env` and configure as needed:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Next.js port | `3000` |
| `FLASK_ENV` | Flask environment | `production` |

## License

[Apache-2.0](LICENSE)

## Support

- 💬 [Discord Community](https://discord.gg/gYg69PbHfR)
- ☕ [Buy Me A Coffee](https://buy.stripe.com/cNi9ATc9WgzM906g7Zbwk02)
- 🐛 [Report Issues](https://github.com/tro2789/vo-tools/issues)

---

Built with ❤️ for the voiceover community
