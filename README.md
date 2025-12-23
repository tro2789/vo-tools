# ScriptTimer ⏱️

**Professional voiceover script timing calculator with intelligent text analysis**

ScriptTimer is a modern web application designed for voiceover artists, content creators, and media professionals who need accurate time estimates for spoken scripts. Unlike simple word counters, ScriptTimer intelligently expands numbers and currency into their spoken equivalents for precise timing calculations.

---

## ✨ Features

### Intelligent Text Processing
- **Number Expansion**: Automatically converts numbers to spoken words (e.g., "10,000" → "ten thousand")
- **Currency Formatting**: Handles currency symbols (e.g., "$100" → "one hundred dollars")
- **Decimal Support**: Properly expands decimal numbers (e.g., "3.5" → "three point five")

### Real-Time Analysis
- **Live Word Count**: Instant calculation of spoken word count as you type
- **Time Estimation**: Accurate duration estimates based on reading speed

### Customizable Settings
- **Adjustable WPM**: Set reading speed from 75 to 160 words per minute
- **Default 150 WPM**: Industry-standard conversational pace
- **Visual Slider**: Easy-to-use speed adjustment interface

### Modern Interface
- **Dark/Light Theme**: Toggle between themes for comfortable viewing
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Clean Layout**: Distraction-free editor with sidebar analytics
- **Professional UI**: Built with Tailwind CSS for a polished look

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 20.x or higher
- **npm** or **yarn** package manager

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd script-calc
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

### Docker Deployment

Run with Docker for easy deployment:

```bash
# Build the image
docker build -t script-timer .

# Run the container
docker run -p 3000:3000 script-timer
```

Or use Docker Compose:

```bash
docker-compose up
```

---

## 🛠️ Tech Stack

- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library with latest features
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling
- **[Lucide React](https://lucide.dev/)** - Beautiful icon library
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Theme management
- **[number-to-words](https://www.npmjs.com/package/number-to-words)** - Number conversion

---

## 💡 How It Works

ScriptTimer uses a sophisticated text analysis algorithm to provide accurate spoken word counts:

1. **Text Preprocessing**: Identifies numbers, currency, and special formats
2. **Number Expansion**: Converts all numeric values to their spoken equivalents
3. **Word Counting**: Counts actual spoken words after expansion
4. **Time Calculation**: Divides word count by WPM to estimate duration

### Example Transformations

| Input | Spoken Output | Word Count |
|-------|---------------|------------|
| `"Call 911"` | "Call nine one one" | 4 words |
| `"$1,500"` | "one thousand five hundred dollars" | 5 words |
| `"3.14"` | "three point fourteen" | 3 words |

This ensures your time estimates match actual speaking duration, not just raw word count.

---

## 📝 Available Scripts

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```

---

## 🎯 Use Cases

- **Voiceover Artists**: Calculate exact script duration for recording sessions
- **Content Creators**: Plan video narration and podcast segments
- **Copywriters**: Estimate commercial and ad read times
- **Educators**: Time instructional content and presentations
- **Media Producers**: Budget recording time and studio sessions

---

## 📄 License

This project is available for personal and commercial use.

---

**Built with ❤️ using Next.js and React**
