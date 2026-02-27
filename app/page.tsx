import Link from 'next/link';
import { Calculator, AudioWaveform, ScrollText, ArrowRight, MessageCircle, Heart, CheckCircle2 } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Footer } from '@/components/Footer';

const tools = [
  {
    href: '/script-analysis',
    icon: Calculator,
    title: 'Script Analysis',
    description: 'Analyze scripts for word count, timing, and pricing. Quickly estimate project scope and calculate rates.',
    features: ['Word & character count', 'Timing calculation', 'Pricing calculator', 'Script comparison'],
  },
  {
    href: '/telephony-converter',
    icon: AudioWaveform,
    title: 'Telephony Converter',
    description: 'Convert audio files to telephony-compatible formats for IVR systems, VoIP, and phone systems.',
    features: ['Multiple formats', 'Batch conversion', 'Volume control', 'Bandpass filter'],
  },
  {
    href: '/teleprompter',
    icon: ScrollText,
    title: 'Teleprompter',
    description: 'Professional teleprompter with auto-scrolling, speed control, and phone remote for studio sessions.',
    features: ['Fullscreen mode', 'Speed control', 'Phone remote', 'Mirror mode'],
  },
  {
    href: '/acx-check',
    icon: CheckCircle2,
    title: 'ACX Compliance',
    description: 'Analyze audiobook files for ACX technical requirements. Check format, loudness, and noise floor.',
    features: ['Format & bitrate', 'LUFS analysis', 'Batch processing', 'CSV export'],
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f7fa] dark:bg-[#000d15]">
      {/* Top Navigation */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-5xl mx-auto flex justify-end gap-2">
          <ThemeToggle />
          <a
            href="https://discord.gg/gYg69PbHfR"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg font-medium text-sm transition-all border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-300 dark:hover:border-cyan-600"
          >
            <MessageCircle size={15} />
            <span className="hidden sm:inline">Discord</span>
          </a>
          <a
            href="https://buy.stripe.com/cNi9ATc9WgzM906g7Zbwk02"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg font-medium text-sm transition-all bg-cyan-600 text-white hover:bg-cyan-500 shadow-lg shadow-cyan-600/20"
          >
            <Heart size={15} className="fill-current" />
            <span className="hidden sm:inline">Support</span>
          </a>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-12 sm:pb-16 text-center animate-fade-in-up">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          VO{' '}
          <span className="bg-gradient-to-r from-cyan-500 to-cyan-700 dark:from-cyan-400 dark:to-cyan-600 bg-clip-text text-transparent">Tools</span>
        </h1>
        <div className="w-12 h-px bg-cyan-500/40 mx-auto mt-5 mb-5" />
        <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
          Professional-grade tools designed for voice actors and audio engineers
        </p>
      </div>

      {/* Tool Cards */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-5">
          {tools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.href} href={tool.href}>
                <div
                  className="group relative bg-white dark:bg-[#072030] rounded-xl border border-gray-200 dark:border-gray-700/50 p-5 sm:p-6 transition-all duration-200 hover:border-cyan-400/50 dark:hover:border-cyan-600/40 hover:shadow-lg cursor-pointer h-full animate-fade-in-up"
                  style={{ animationDelay: `${index * 80 + 100}ms` }}
                >
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 flex items-center justify-center shrink-0 group-hover:bg-cyan-100 dark:group-hover:bg-cyan-900/40 transition-colors">
                      <Icon className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-1.5">
                        {tool.title}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
                        {tool.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {tool.features.map((feature) => (
                          <span
                            key={feature}
                            className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 text-sm font-medium group-hover:gap-2.5 transition-all">
                        <span>Open Tool</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <Footer />
    </main>
  );
}
