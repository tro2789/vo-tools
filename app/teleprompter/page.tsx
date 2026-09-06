import type { Metadata } from 'next';
import { TeleprompterContainer } from '@/components/teleprompter/TeleprompterContainer';

export const metadata: Metadata = {
  title: 'Teleprompter - Auto-Scrolling Script Reader with Phone Remote',
  description: 'Free online teleprompter for voiceover sessions with adjustable scroll speed, font size, and phone remote control.',
  alternates: { canonical: '/teleprompter' },
};

export default function TeleprompterPage() {
  return <TeleprompterContainer />;
}
