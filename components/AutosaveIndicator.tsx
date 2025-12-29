'use client';

import { useEffect, useState } from 'react';

interface AutosaveIndicatorProps {
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
}

export default function AutosaveIndicator({ lastSaved, hasUnsavedChanges }: AutosaveIndicatorProps) {
  const [timeAgo, setTimeAgo] = useState<string>('');

  useEffect(() => {
    if (!lastSaved) return;

    const updateTimeAgo = () => {
      const now = new Date();
      const diffMs = now.getTime() - lastSaved.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);

      if (diffSecs < 10) {
        setTimeAgo('just now');
      } else if (diffSecs < 60) {
        setTimeAgo(`${diffSecs}s ago`);
      } else if (diffMins < 60) {
        setTimeAgo(`${diffMins}m ago`);
      } else {
        setTimeAgo('over an hour ago');
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [lastSaved]);

  if (!lastSaved && !hasUnsavedChanges) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      {hasUnsavedChanges ? (
        <>
          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
          <span className="text-gray-600 dark:text-gray-400">Unsaved changes</span>
        </>
      ) : lastSaved ? (
        <>
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-gray-600 dark:text-gray-400">
            Saved {timeAgo}
          </span>
        </>
      ) : null}
    </div>
  );
}
