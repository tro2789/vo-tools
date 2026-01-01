# VO Tools

Handy tools designed for voice actors and audio engineers.

Live demo available at https://voiceover-tools.com

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

### 🎙️ Telephony Converter
- Convert audio files to telephony-compatible formats
- Batch file conversion
- Volume normalization
- Phone-optimized audio filtering (300-3400Hz)

### ✅ ACX Compliance Checker
- Automated ACX audiobook technical requirements validation
- MP3 format and bitrate verification (192+ kbps CBR)
- Sample rate checking (44.1 kHz)
- RMS loudness measurement (-23dB to -18dB)
- Peak amplitude analysis (≤ -3dB)
- Noise floor detection (≤ -60dB)
- Leading/trailing silence measurement
- Detailed compliance report with actionable guidance

## Quick Start

### Production Deployment

```bash
cd vo-tools
docker-compose up -d --build
```

Access at http://localhost:3010

**Useful commands:**
```bash
docker-compose down              # Stop
docker-compose logs -f           # View logs
docker-compose up -d --build     # Rebuild
```

### Development Environment

For active development, use the separate dev environment on different ports:

```bash
# Start development container (ports 3011/5001)
docker-compose -f docker-compose.dev.yml up -d --build

# Access dev site
http://localhost:3011

# View dev logs
docker logs -f vo-tools-dev
```

**📖 See [`DEVELOPMENT.md`](DEVELOPMENT.md) for:**
- Complete development workflow
- Git branching strategy (dev → main)
- Testing procedures
- Troubleshooting guide

### Local Development (No Docker)

```bash
npm install
npm run dev  # Port 3000
```

## Project Structure

```
vo-tools/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Landing page
│   ├── script-analysis/   # Script analysis tool
│   ├── teleprompter/      # Teleprompter tool
│   └── telephony-converter/ # Telephony converter tool
├── components/            # React components
│   ├── teleprompter/      # Teleprompter components
│   └── ...                # Other components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and API clients
└── docs/                  # Documentation
```

## Documentation

- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Development workflow, Git strategy, testing

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Python Flask (API backend)
- Docker with Supervisord

## License
Apache-2.0


## Support

- [Discord Community](https://discord.gg/gYg69PbHfR)
- [Buy Me A Coffee](https://buy.stripe.com/cNi9ATc9WgzM906g7Zbwk02)
- [Issue Tracking](https://gitea.tohareprod.com/tro2789/vo-tools)

---

Built with ❤️ for the voiceover community.
