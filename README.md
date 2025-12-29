# VO Tools 🎙️

**Professional voiceover script calculator with intelligent analysis, comparison, and pricing tools**

VO Tools is a comprehensive web application designed for voiceover artists to analyze scripts, compare revisions, calculate reading times, and generate professional quotes for clients. Try it out right now at https://script.tohareprod.com.

---

## ✨ Features

### 📊 Script Analysis
- **Word Count**: Real-time calculation of total words
- **Reading Time Estimation**: Accurate duration based on adjustable WPM (75-160)
- **Pause Detection**: Automatic detection and timing of pauses (commas, periods, ellipses)
- **Intelligent Text Expansion**: 
  - Numbers to spoken words (e.g., "10,000" → "ten thousand")
  - Currency formatting (e.g., "$100" → "one hundred dollars")
  - Decimals (e.g., "3.5" → "three point five")
  - Percentages, ordinals, and measurements

### 🔄 Script Comparison
- **Side-by-Side View**: Compare original and revised scripts
- **Diff Highlighting**: Visual highlighting of changes
  - Green: Added text
  - Red: Removed text
  - Yellow: Modified text
- **Word Count Difference**: See exact changes in word count

### 💰 Pricing & Quotes
- **Multiple Pricing Models**:
  - Per Word pricing
  - Per Minute pricing
  - Per Project (flat rate)
- **Automatic Quote Calculation**: Based on word count and reading time
- **Minimum Session Fees**: Set minimum rates for small projects
- **Revision Pricing**: Configure separate rates for pickups/revisions
- **PDF Export**: Generate professional quote PDFs for clients
- **Client & Project Info**: Customize quotes with client and project names

### 💾 Auto-Save & Persistence
- **Automatic Saving**: Your work is automatically saved every 30 seconds
- **Session Recovery**: Resume where you left off after page refresh
- **Unsaved Changes Warning**: Get notified before leaving with unsaved work
- **Save Indicator**: See save status in real-time (saved/unsaved)
- **Local Storage**: All data persists in your browser

### 🎨 Modern Interface
- **Dark/Light Theme**: Comfortable viewing in any environment
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Clean Layout**: Distraction-free editor with sidebar analytics
- **Professional UI**: Built with modern design principles

---

## 🚀 Quick Start

### Docker Deployment (Recommended)

The easiest way to run VO Tools:

```bash
# Navigate to project directory
cd vo-tools

# Start with Docker Compose
docker-compose up -d

# Access the app at http://localhost:3010
```

To rebuild after changes:
```bash
docker-compose up -d --build
```

To stop:
```bash
docker-compose down
```

### Local Development

**Prerequisites:**
- Node.js 20.x or higher
- npm package manager

**Steps:**

1. **Install dependencies**
   ```bash
   cd vo-tools
   npm install
   ```

2. **Run development server**
   ```bash
   npm run dev
   ```

3. **Open browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## 🛠️ Tech Stack

- **[Next.js 16](https://nextjs.org/)** - React framework with App Router and Turbopack
- **[React 19](https://react.dev/)** - Latest React features
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS](https://tailwindcss.com/)** - Modern styling
- **[Lucide React](https://lucide.dev/)** - Icon library
- **[jsPDF](https://github.com/parallax/jsPDF)** - PDF generation
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Theme management
- **[number-to-words](https://www.npmjs.com/package/number-to-words)** - Number conversion

---

## 💡 How to Use

### Single Script Mode

1. Enter or paste your script into the editor
2. Adjust WPM slider to match your reading speed
3. Toggle expansion options as needed (numbers, currency, etc.)
4. View real-time word count and reading time in sidebar
5. Optional: Configure pricing and generate a PDF quote

### Comparison Mode

1. Click "Compare Scripts" toggle
2. Enter original script on the left
3. Enter revised script on the right
4. View highlighted differences and word count changes
5. Both scripts are analyzed independently

### Generating Quotes

1. Configure your pricing in the sidebar:
   - Choose pricing model (per word, per minute, or per project)
   - Set your rates
   - Optional: Set minimum session fee
   - Configure revision pricing
2. Enter client and project name
3. Click "Download Quote PDF"
4. Professional PDF is generated with all project details

---

## 📝 Pause Detection

VO Tools automatically detects and times pauses in your script:

- **Commas** (`,`) - 0.3 seconds
- **Periods** (`.`) - 0.5 seconds
- **Question marks** (`?`) - 0.5 seconds
- **Exclamation marks** (`!`) - 0.5 seconds
- **Semicolons** (`;`) - 0.4 seconds
- **Colons** (`:`) - 0.4 seconds
- **Ellipses** (`...`) - 0.7 seconds
- **Em dashes** (`—`) - 0.3 seconds

Pause time is added to total reading time for more accurate estimates.

---

## 🎯 Use Cases

- **Voiceover Artists**: Calculate script durations, generate client quotes, and compare script revisions
- **Producers**: Budget recording sessions and estimate costs
- **Copywriters**: Time commercial and ad scripts
- **Content Creators**: Plan video narration timing
- **Audiobook Narrators**: Estimate chapter and book duration

---

## 🔧 Available Scripts

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Docker commands
docker-compose up -d          # Start
docker-compose down           # Stop
docker-compose up -d --build  # Rebuild
```

---

## 📚 Documentation

For detailed information about the project, see the [`/docs`](./docs) folder:

- **[CHANGELOG.md](./docs/CHANGELOG.md)** - Version history and release notes
- **[CONTRIBUTING.md](./docs/CONTRIBUTING.md)** - Guidelines for contributors
- **[FOLDER_STRUCTURE.md](./docs/FOLDER_STRUCTURE.md)** - Project organization and architecture
- **[PLAN.md](./docs/PLAN.md)** - Technical improvement roadmap
- **[TEST_COMPARISON.md](./docs/TEST_COMPARISON.md)** - Feature testing notes

---

## 💖 Support

If you find VO Tools helpful, consider supporting development:

**[Buy me a coffee ☕](https://buy.stripe.com/cNi9ATc9WgzM906g7Zbwk02)**

---

## 📄 License

This project is available for personal and commercial use.

---

**Built with ❤️ for the voiceover community**
