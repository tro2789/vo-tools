import Link from 'next/link';
import { Calculator, AudioWaveform, ArrowRight, MessageCircle, Heart } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Top Navigation */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex justify-end gap-2">
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
            <span className="hidden sm:inline">Support</span>
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
            VO Tools
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Professional voiceover tools designed for voice actors and audio engineers
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          
          {/* Script Analysis Card */}
          <Link href="/script-analysis">
            <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer h-full">
              
              {/* Gradient Accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
              
              <div className="p-8">
                {/* Icon */}
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Calculator className="w-7 h-7 text-white" />
                </div>

                {/* Content */}
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                  Script Analysis
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                  Analyze scripts for word count, timing, and pricing. Perfect for voice actors to quickly estimate project scope and calculate rates.
                </p>

                {/* Features List */}
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className="text-blue-500 mt-0.5">✓</span>
                    <span>Real-time word and character count</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className="text-blue-500 mt-0.5">✓</span>
                    <span>Adjustable reading speed calculation</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className="text-blue-500 mt-0.5">✓</span>
                    <span>Pricing calculator with custom rates</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className="text-blue-500 mt-0.5">✓</span>
                    <span>Script comparison and diff visualization</span>
                  </li>
                </ul>

                {/* CTA */}
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium group-hover:gap-3 transition-all">
                  <span>Open Tool</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          </Link>

          {/* Telephony Converter Card */}
          <Link href="/telephony-converter">
            <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer h-full">
              
              {/* Gradient Accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
              
              <div className="p-8">
                {/* Icon */}
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <AudioWaveform className="w-7 h-7 text-white" />
                </div>

                {/* Content */}
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                  Telephony Converter
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                  Convert audio files to telephony-compatible formats for IVR systems, VoIP applications, and phone systems.
                </p>

                {/* Features List */}
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className="text-indigo-500 mt-0.5">✓</span>
                    <span>Multiple format support (WAV, G.722)</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className="text-indigo-500 mt-0.5">✓</span>
                    <span>Batch file conversion</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className="text-indigo-500 mt-0.5">✓</span>
                    <span>Volume normalization controls</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className="text-indigo-500 mt-0.5">✓</span>
                    <span>Phone-optimized audio filtering</span>
                  </li>
                </ul>

                {/* CTA */}
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium group-hover:gap-3 transition-all">
                  <span>Open Tool</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          </Link>

        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-slate-600 dark:text-slate-400">
          <p className="text-sm">
            Built with ❤️ for the voiceover community
          </p>
        </div>
      </div>
    </main>
  );
}
