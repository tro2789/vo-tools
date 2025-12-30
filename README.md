# VO Tools

A comprehensive suite of professional tools designed for voice actors and audio engineers.

## Features

### 🎯 Script Analysis
- Real-time word and character count
- Adjustable reading speed calculation
- Pricing calculator with custom rates
- Script comparison and diff visualization
- Export capabilities

### 🎙️ Telephony Converter
- Convert audio files to telephony-compatible formats (WAV, G.722)
- Batch file conversion support
- Volume normalization controls
- Phone-optimized audio filtering (300-3400Hz bandpass)
- Support for multiple input formats (WAV, MP3, OGG, FLAC, M4A, AIFF, WMA, AAC)

## Getting Started

### Prerequisites
- Docker and Docker Compose

### Installation (Recommended: Docker)

1. Navigate to the project directory:
```bash
cd vo-tools
```

2. Build and start the container:
```bash
docker-compose up -d --build
```

3. Open [http://localhost:3010](http://localhost:3010) in your browser.

That's it! The application is now running in a Docker container.

### Managing the Container

**Stop the container:**
```bash
docker-compose down
```

**View logs:**
```bash
docker-compose logs -f
```

**Rebuild after changes:**
```bash
docker-compose up -d --build
```

## Alternative: Local Development

If you prefer to run without Docker:

### Prerequisites
- Node.js 20+
- npm or yarn

### Setup

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
vo-tools/
├── app/
│   ├── page.tsx                    # Landing page with tool selection
│   ├── script-analysis/            # Script analysis tool
│   │   └── page.tsx
│   ├── telephony-converter/        # Telephony converter tool
│   │   └── page.tsx
│   ├── layout.tsx                  # Root layout with navigation
│   └── globals.css
├── components/
│   ├── Navigation.tsx              # Global navigation component
│   ├── Footer.tsx                  # Global footer component
│   ├── ScriptCalculator.tsx        # Script analysis main component
│   ├── ThemeProvider.tsx           # Dark/light theme provider
│   ├── ThemeToggle.tsx             # Theme toggle button
│   ├── analysis/                   # Script analysis components
│   ├── comparison/                 # Script comparison components
│   ├── editor/                     # Script editor components
│   └── pricing/                    # Pricing calculator components
├── lib/
│   ├── api/
│   │   └── converter.ts            # Telephony converter API client
│   ├── hooks/
│   │   ├── useAudioConverter.ts    # Audio converter hook
│   │   ├── useScriptAnalysis.ts    # Script analysis hook
│   │   └── ...
│   └── types/
│       └── converter.ts            # Telephony converter types
├── hooks/                          # Additional custom hooks
├── docs/                           # Documentation
├── docker-compose.yml              # Docker Compose configuration
└── Dockerfile                      # Docker build configuration
```

## Configuration

### Environment Variables

The application uses environment variables for configuration. Create a `.env.local` file if you need to customize settings:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

> **Note:** When using Docker, the default configuration works out of the box. Environment variables are only needed for advanced customization.

## Deployment

### Production Deployment with Docker

The included Docker configuration is production-ready:

1. Build the production image:
```bash
docker-compose up -d --build
```

2. The application will be available on port 3010

### Port Configuration

To change the port, edit `docker-compose.yml`:

```yaml
ports:
  - "YOUR_PORT:3000"
```

## Features Roadmap

- ✅ Script Analysis with timing calculator
- ✅ Telephony audio converter
- ✅ Dark/light mode support
- ✅ Responsive design
- ✅ Docker deployment
- 🚀 Additional tools coming soon!

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Custom components with Lucide icons
- **Theme:** next-themes for dark/light mode
- **Deployment:** Docker with Alpine Linux base image

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

- Join our [Discord community](https://discord.gg/gYg69PbHfR)
- [Support development](https://buy.stripe.com/cNi9ATc9WgzM906g7Zbwk02)
- [View source code](https://gitea.tohareprod.com/tro2789/vo-tools)

## License

Built with ❤️ for the voiceover community.
