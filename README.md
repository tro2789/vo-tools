# VO Tools

Handy tools designed for voice actors and audio engineers.

Live at [voiceover-tools.com](https://voiceover-tools.com)

![Docker Pulls](https://img.shields.io/docker/pulls/tro2789/vo-tools)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

## Features

### Script Analysis
- Real-time word and character count
- Adjustable reading speed calculation
- Pricing calculator with custom rates
- Script comparison and diff visualization
- Pronunciation lookup - click a word to see ARPABET phonetic notation (North American English)

### Teleprompter
- Professional fullscreen teleprompter for studio recording
- Auto-scroll with adjustable speed control
- Elapsed and remaining time display
- Keyboard-first operation (Space, arrows, Esc, Home)
- Remote control via smartphone (scan QR code)

### Telephony Converter
- Convert audio files to telephony-compatible formats (u-law, A-law, PCM, G.722)
- Batch file conversion with progress tracking
- Volume normalization (quiet, lower, medium, high, max)
- Phone-optimized audio filtering (300-3400Hz bandpass)

### ACX Compliance Checker
- Automated ACX audiobook technical requirements validation
- MP3 format and bitrate verification (192+ kbps CBR)
- Sample rate checking (44.1 kHz)
- Integrated loudness measurement (-23dB to -18dB LUFS)
- Peak amplitude analysis (no higher than -3dB)
- Leading/trailing silence measurement
- Detailed compliance report

## Quick Start

### Docker Hub (Recommended)

```bash
docker run -d -p 3000:3000 --name vo-tools tro2789/vo-tools:latest
```

Access at http://localhost:3000

### Docker Compose

```bash
curl -O https://raw.githubusercontent.com/tro2789/vo-tools/main/docker-compose.yml
docker compose up -d
```

Access at http://localhost:3010

```bash
docker compose down              # Stop
docker compose logs -f           # View logs
docker compose pull              # Update to latest image
```

### Local Development

**Prerequisites:** Node.js 22+, FFmpeg

```bash
git clone https://gitea.tohareprod.com/tro2789/vo-tools.git
cd vo-tools
npm install
npm run dev
```

Access at http://localhost:3000

> **Note:** Audio conversion and ACX checking require FFmpeg installed on your system (`apt install ffmpeg` / `brew install ffmpeg`).

## Production Deployment with Reverse Proxy

Everything runs on a single port (3000) including WebSocket, so reverse proxy configuration is straightforward.

### Nginx

```nginx
server {
    listen 443 ssl;
    server_name voiceover-tools.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Caddy

```caddy
voiceover-tools.com {
    reverse_proxy localhost:3000
}
```

### Important Notes

- **Single port (3000)** serves everything: frontend, API routes, and WebSocket
- Only expose your reverse proxy (port 80/443) to the internet
- Keep port 3000 internal (localhost only)
- WebSocket upgrade headers are required for the teleprompter remote feature

## Project Structure

```
vo-tools/
├── app/                       # Next.js App Router pages
│   ├── page.tsx               # Landing page
│   ├── acx-check/             # ACX compliance checker
│   ├── script-analysis/       # Script analysis tool
│   ├── teleprompter/          # Teleprompter tool
│   ├── telephony-converter/   # Audio converter tool
│   ├── remote/                # Mobile remote control
│   └── api/                   # API routes (convert, acx-check, health)
├── components/                # React components
├── hooks/                     # Custom React hooks
├── lib/                       # Utilities
│   ├── audio/                 # Audio processing (FFmpeg wrappers)
│   │   ├── ffmpeg.ts          # FFmpeg/FFprobe utilities (uses execFile, safe from injection)
│   │   ├── convert.ts         # Format conversion logic
│   │   └── acx-analyzer.ts    # ACX compliance analysis
│   └── types/                 # TypeScript type definitions
├── server.mjs                 # Custom server (Next.js + Socket.IO)
├── Dockerfile                 # Production container
└── docs/                      # Documentation
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Backend | Next.js API routes, FFmpeg via Node.js execFile |
| WebSocket | Socket.IO (integrated into custom server) |
| Container | Docker (node:22-alpine + ffmpeg) |

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) | `http://localhost:3000` |
| `MAX_CONTENT_LENGTH` | Max upload size in bytes | `52428800` (50MB) |
| `UPLOAD_FOLDER` | Temp directory for audio processing | `/tmp/uploads` |
| `FFMPEG_TIMEOUT` | FFmpeg conversion timeout in ms | `300000` (5 min) |
| `WS_RATE_LIMIT_PER_MINUTE` | WebSocket rate limit | `30` |
| `LOG_LEVEL` | Logging level | `INFO` |

## License

[Apache-2.0](LICENSE)

## Support

- [Discord Community](https://discord.gg/gYg69PbHfR)
- [Buy Me A Coffee](https://buy.stripe.com/cNi9ATc9WgzM906g7Zbwk02)
- [Report Issues](https://github.com/tro2789/vo-tools/issues)

---

Built with care for the voiceover community
