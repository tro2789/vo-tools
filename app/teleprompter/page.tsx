import { TeleprompterContainer } from '@/components/teleprompter/TeleprompterContainer';
import { Footer } from '@/components/Footer';

export default function TeleprompterPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <div className="flex-1">
        <TeleprompterContainer />
      </div>
      <Footer />
    </div>
  );
}
