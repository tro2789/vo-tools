import Link from 'next/link';
import {
  ArrowRight,
  AudioWaveform,
  Calculator,
  CheckCircle2,
  ScrollText,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Footer } from '@/components/Footer';

interface Tool {
  href: string;
  icon: LucideIcon;
  name: string;
  description: string;
  tags: string;
}

const tools: Tool[] = [
  {
    href: '/script-analysis',
    icon: Calculator,
    name: 'Script Analysis',
    description: 'Word count, read time at your speed, pause detection, quoting and PDF.',
    tags: 'WORDS · TIMING · PRICING · DIFF',
  },
  {
    href: '/teleprompter',
    icon: ScrollText,
    name: 'Teleprompter',
    description: 'Fullscreen auto-scroll with mirror mode and a phone remote over QR.',
    tags: 'FULLSCREEN · SPEED · REMOTE · MIRROR',
  },
  {
    href: '/telephony-converter',
    icon: AudioWaveform,
    name: 'Telephony Converter',
    description: 'Batch convert to IVR and VoIP formats with volume and phone filtering.',
    tags: 'µ-LAW · A-LAW · PCM · G.722 · RAW',
  },
  {
    href: '/acx-check',
    icon: CheckCircle2,
    name: 'ACX Compliance',
    description: 'Check audiobook files against ACX limits, then export the report as CSV.',
    tags: 'BITRATE · 44.1K · RMS · PEAK · CSV',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-page">
      <section className="border-b border-line bg-panel px-5 pt-[72px] pb-14">
        <div className="mx-auto max-w-[1000px]">
          <h1 className="max-w-[720px] text-[36px] leading-[1.05] font-semibold tracking-[-0.02em] text-ink sm:text-[52px]">
            Four tools for the working voice actor.
          </h1>
          <p className="mt-5 max-w-[520px] text-[15px] leading-[1.6] text-body">
            Script timing and quoting, a studio teleprompter with a phone remote, telephony
            format conversion, and ACX compliance checking. Free, no account, runs in the
            browser.
          </p>
          <div className="mt-7 flex flex-wrap gap-[10px]">
            <Link
              href="/script-analysis"
              className="flex h-9 items-center gap-2 bg-button px-4 text-[13px] font-medium text-panel"
            >
              Open the workspace
              <ArrowRight width={15} height={15} aria-hidden="true" />
            </Link>
            <a
              href="https://github.com/tro2789/vo-tools"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 items-center border border-line-strong px-4 text-[13px] font-medium text-body"
            >
              Read the source
            </a>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-panel">
        <div className="mx-auto max-w-[1000px]">
          {tools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.href}
                className={`grid grid-cols-1 items-center gap-3 px-5 py-[22px] lg:grid-cols-[200px_1fr_300px_90px] lg:gap-6 ${
                  index < tools.length - 1 ? 'border-b border-line' : ''
                }`}
              >
                <div className="flex items-center gap-[10px]">
                  <Icon width={16} height={16} className="shrink-0 text-ink" aria-hidden="true" />
                  <span className="text-[15px] font-semibold text-ink">{tool.name}</span>
                </div>
                <div className="text-[13px] leading-[1.5] text-body">{tool.description}</div>
                <div className="text-[11px] text-muted">{tool.tags}</div>
                <Link
                  href={tool.href}
                  className="flex items-center gap-[6px] text-[13px] font-medium text-ink lg:justify-end"
                >
                  Open
                  <ArrowRight width={14} height={14} aria-hidden="true" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      <Footer />
    </main>
  );
}
