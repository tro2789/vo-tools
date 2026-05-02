import type { Metadata } from 'next';
import { ScriptCalculator } from '@/components/ScriptCalculator';

export const metadata: Metadata = {
  title: 'Script Analysis - Word Count, Timing & Pricing Calculator',
  description: 'Analyze voiceover scripts for word count, estimated read time at different speeds, and calculate pricing. Free tool for voice actors.',
  alternates: { canonical: '/script-analysis' },
};

export default function ScriptAnalysisPage() {
  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      <ScriptCalculator />
    </main>
  );
}
