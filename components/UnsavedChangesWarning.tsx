'use client';

import { useEffect } from 'react';

interface UnsavedChangesWarningProps {
  hasUnsavedChanges: boolean;
  isResetting?: React.MutableRefObject<boolean>;
}

/**
 * Component that warns users when they try to leave the page with unsaved changes
 * Uses the browser's beforeunload event to show a confirmation dialog
 */
export default function UnsavedChangesWarning({ hasUnsavedChanges, isResetting }: UnsavedChangesWarningProps) {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Skip warning if we're resetting
      if (isResetting?.current) {
        return;
      }
      
      if (hasUnsavedChanges) {
        e.preventDefault();
        // Modern browsers require returnValue to be set
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, isResetting]);

  // This component doesn't render anything
  return null;
}
