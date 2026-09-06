'use client';

import { FileText } from 'lucide-react';
import { DocumentBar, SavedIndicator, StatusBar, Workspace } from './shell';
import { ScriptCalculator } from './ScriptCalculator';
import { useHydrated } from '@/hooks/useHydrated';

/**
 * The empty shell frame, rendered on the server and during hydration so the
 * workspace does not jump when `ScriptCalculator` takes over.
 */
function WorkspaceFrame() {
  return (
    <div className="flex min-h-[calc(100vh-44px)] flex-col bg-page">
      <DocumentBar
        icon={FileText}
        title={<span className="text-[15px] text-muted">Untitled script</span>}
        meta={<SavedIndicator state="empty" />}
      />
      <Workspace main={null} rail={null} mainClassName="min-h-[420px] lg:min-h-[640px]" />
      <StatusBar />
    </div>
  );
}

/**
 * `ScriptCalculator` restores its state from localStorage, which cannot happen
 * during the hydration render without the server HTML and the first client
 * render disagreeing. Render the static frame until hydration is done.
 */
export function ScriptWorkspace() {
  const hydrated = useHydrated();
  return hydrated ? <ScriptCalculator /> : <WorkspaceFrame />;
}
