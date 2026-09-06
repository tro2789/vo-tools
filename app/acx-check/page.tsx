import type { Metadata } from 'next';
import { ACXCheckContainer } from '@/components/acx/ACXCheckContainer';

export const metadata: Metadata = {
  title: 'ACX Audio Check - Audiobook Compliance Analyzer',
  description: 'Check your audiobook files against ACX/Audible technical requirements. Analyzes peak level, RMS, noise floor, and sample rate.',
  alternates: { canonical: '/acx-check' },
};

export default function ACXCheckPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-page">
      <ACXCheckContainer />
    </div>
  );
}
