import Link from 'next/link';
import { Calculator, AudioWaveform, ScrollText, ArrowRight, MessageCircle, Heart, CheckCircle2 } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Top Navigation */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-6xl mx-auto flex justify-end gap-2">
          <ThemeToggle />
          <a
            href="https://discord.gg/gYg69PbHfR"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg font-medium text-sm transition-all bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
          >
            <MessageCircle size={16} />
            <span className="hidden sm:inline">Discord</span>
          </a>
          <a
            href="https://buy.stripe.com/cNi9ATc9WgzM906g7Zbwk02"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg font-medium text-sm transition-all bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 shadow-lg shadow-pink-500/20"
          >
            <Heart size={16} className="fill-current" />
            <span className="hidden sm:inline">Buy Me A Coffee</span>
          </a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
            VO Tools
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Handy tools designed for voice actors and audio engineers
          </p>
        </div>

        {/* Feature Cards - 2 Column Grid */}
        <div className="grid lg:grid-cols-2 gap-5 max-w-6xl mx-auto">
          
          {/* Script Analysis Card */}
          <Link href="/script-analysis">
            <div className="group relative bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer h-full">
              
              {/* Gradient Accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
              
              <div className="p-5 flex gap-5">
                {/* Icon */}
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Calculator className="w-6 h-6 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Content */}
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Script Analysis
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
                    Analyze scripts for word count, timing, and pricing. Perfect for voice actors to quickly estimate project scope and calculate rates.
                  </p>

                  {/* Features List - Horizontal */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <span className="text-blue-500">✓</span>
                      <span>Word & character count</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <span className="text-blue-500">✓</span>
                      <span>Timing calculation</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <span className="text-blue-500">✓</span>
                      <span>Pricing calculator</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <span className="text-blue-500">✓</span>
                      <span>Script comparison</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium text-sm group-hover:gap-3 transition-all">
                    <span>Open Tool</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Telephony Converter Card */}
          <Link href="/telephony-converter">
            <div className="group relative bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer h-full">
              
              {/* Gradient Accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
              
              <div className="p-5 flex gap-5">
                {/* Icon */}
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <AudioWaveform className="w-6 h-6 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Content */}
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Telephony Converter
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
                    Convert audio files to telephony-compatible formats for IVR systems, VoIP applications, and phone systems. Adjust loudness and apply bandpass filter.
                  </p>

                  {/* Features List - Horizontal */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <span className="text-indigo-500">✓</span>
                      <span>Multiple formats</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <span className="text-indigo-500">✓</span>
                      <span>Batch conversion</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <span className="text-indigo-500">✓</span>
                      <span>Volume normalization</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <span className="text-indigo-500">✓</span>
                      <span>Phone-optimized filtering</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium text-sm group-hover:gap-3 transition-all">
                    <span>Open Tool</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Teleprompter Card */}
          <Link href="/teleprompter">
            <div className="group relative bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 cursor-pointer h-full">
              
              {/* Gradient Accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600"></div>
              
              <div className="p-5 flex gap-5">
                {/* Icon */}
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <ScrollText className="w-6 h-6 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Content */}
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Teleprompter
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
                    Professional teleprompter with auto-scrolling, speed control, and timing display. Perfect for studio recording sessions.
                  </p>

                  {/* Features List - Horizontal */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <span className="text-emerald-500">✓</span>
                      <span>Fullscreen mode</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <span className="text-emerald-500">✓</span>
                      <span>Auto-scroll & speed control</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <span className="text-emerald-500">✓</span>
                      <span>Time display</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <span className="text-emerald-500">✓</span>
                      <span>Keyboard controls</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium text-sm group-hover:gap-3 transition-all">
                    <span>Open Tool</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* ACX Compliance Checker Card */}
          <Link href="/acx-check">
            <div className="group relative bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500 cursor-pointer h-full">
              
              {/* Gradient Accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-600"></div>
              
              <div className="p-5 flex gap-5">
                {/* Icon */}
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Content */}
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    ACX Compliance Checker
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
                    Analyze audiobook files for ACX technical requirements compliance. Check format, bitrate, loudness, and noise floor automatically.
                  </p>

                  {/* Features List - Horizontal */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <span className="text-amber-500">✓</span>
                      <span>Format & bitrate check</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <span className="text-amber-500">✓</span>
                      <span>LUFS analysis</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <span className="text-amber-500">✓</span>
                      <span>Batch processing</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <span className="text-amber-500">✓</span>
                      <span>CSV export</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium text-sm group-hover:gap-3 transition-all">
                    <span>Open Tool</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </Link>

        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-slate-600 dark:text-slate-400">
          <p className="text-sm">
            Built with ❤️ for the voiceover community
          </p>
        </div>
      </div>
    </main>
  );
}
