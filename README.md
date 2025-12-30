# VO Tools

Handy tools designed for voice actors and audio engineers.

## Features

### 🎯 Script Analysis
- Real-time word and character count
- Adjustable reading speed calculation
- Pricing calculator with custom rates
- Script comparison and diff visualization

### 🎙️ Telephony Converter
- Convert audio files to telephony-compatible formats
- Batch file conversion
- Volume normalization
- Phone-optimized audio filtering (300-3400Hz)

## Quick Start

### Using Docker (Recommended)

1. Navigate to the project directory:
```bash
cd vo-tools
```

2. Start the application:
```bash
docker-compose up -d --build
```

3. Open http://localhost:3010

**Useful commands:**
```bash
docker-compose down              # Stop
docker-compose logs -f           # View logs
docker-compose up -d --build     # Rebuild
```

### Local Development

For development without Docker:

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Project Structure

```
vo-tools/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Landing page
│   ├── script-analysis/   # Script analysis tool
│   └── telephony-converter/ # Telephony converter tool
├── components/            # React components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and API clients
└── docs/                  # Documentation
```

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Docker

## Support

- [Discord Community](https://discord.gg/gYg69PbHfR)
- [Buy Me A Coffee](https://buy.stripe.com/cNi9ATc9WgzM906g7Zbwk02)
- [Source Code](https://gitea.tohareprod.com/tro2789/vo-tools)

---

Built with ❤️ for the voiceover community.
