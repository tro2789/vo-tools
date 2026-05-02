import type { Metadata } from 'next';
import { TeleprompterContainer } from '@/components/teleprompter/TeleprompterContainer';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Teleprompter - Auto-Scrolling Script Reader with Phone Remote',
  description: 'Free online teleprompter for voiceover sessions with adjustable scroll speed, font size, and phone remote control.',
  alternates: { canonical: '/teleprompter' },
};

export default function TeleprompterPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#000d15] flex flex-col">
      <div className="flex-1">
        <TeleprompterContainer />
      </div>
      <Footer />
    </div>
  );
}
