import type { Metadata } from 'next';
import { ACXCheckContainer } from '@/components/acx/ACXCheckContainer';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'ACX Audio Check - Audiobook Compliance Analyzer',
  description: 'Check your audiobook files against ACX/Audible technical requirements. Analyzes peak level, RMS, noise floor, and sample rate.',
  alternates: { canonical: '/acx-check' },
};

export default function ACXCheckPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#000d15] flex flex-col">
      <div className="flex-1">
        <ACXCheckContainer />
      </div>
      <Footer />
    </div>
  );
}
