import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Telephony Converter - Audio Format Conversion for IVR & VoIP',
  description: 'Convert audio files to telephony formats for IVR, VoIP, and phone systems. Supports PCM, u-law, A-law, GSM, and more.',
  alternates: { canonical: '/telephony-converter' },
};

export default function TelephonyConverterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
