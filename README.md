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
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
cd vo-tools
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Configure environment variables:
```bash
cp .env.example .env.local
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

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
└── docs/                           # Documentation

```

## Environment Variables

### Telephony Converter

If you're running the telephony converter backend separately, configure the API URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Leave empty to use same-origin API (when backend serves both static files and API).

## Development

### Building for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Features Roadmap

- ✅ Script Analysis with timing calculator
- ✅ Telephony audio converter
- ✅ Dark/light mode support
- ✅ Responsive design
- 🚀 Additional tools coming soon!

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Custom components with Lucide icons
- **Theme:** next-themes for dark/light mode

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

- Join our [Discord community](https://discord.gg/gYg69PbHfR)
- [Support development](https://buy.stripe.com/cNi9ATc9WgzM906g7Zbwk02)

## License

Built with ❤️ for the voiceover community.
