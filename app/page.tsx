import type { Metadata } from 'next';
import { ScriptWorkspace } from '@/components/ScriptWorkspace';

export const metadata: Metadata = {
  title: 'VO Tools — Script analysis, teleprompter, telephony converter, ACX check',
  description:
    'Script timing and quoting, a studio teleprompter with a phone remote, telephony format conversion, and ACX compliance checking. Free, no account, runs in the browser.',
  alternates: { canonical: '/' },
};

export default function Home() {
  return <ScriptWorkspace />;
}
