import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for autosaving data at regular intervals
 * Only saves when data has actually changed
 * 
 * @param data - The data to autosave
 * @param saveFunction - Function to call when saving
 * @param intervalMs - Interval in milliseconds (default: 30000 = 30 seconds)
 * @returns Object with lastSaved timestamp and manual save function
 */
export function useAutosave<T>(
  data: T,
  saveFunction: (data: T) => void,
  intervalMs: number = 30000
): {
  lastSaved: Date | null;
  saveNow: () => void;
  hasUnsavedChanges: boolean;
} {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const previousDataRef = useRef<T>(data);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Manual save function
  const saveNow = () => {
    saveFunction(data);
    setLastSaved(new Date());
    setHasUnsavedChanges(false);
    previousDataRef.current = data;
  };

  // Detect changes in data
  useEffect(() => {
    const dataChanged = JSON.stringify(data) !== JSON.stringify(previousDataRef.current);
    
    if (dataChanged && lastSaved !== null) {
      setHasUnsavedChanges(true);
    }
  }, [data, lastSaved]);

  // Autosave effect
  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only autosave if data has changed
    const dataChanged = JSON.stringify(data) !== JSON.stringify(previousDataRef.current);
    
    if (dataChanged) {
      timeoutRef.current = setTimeout(() => {
        saveFunction(data);
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        previousDataRef.current = data;
      }, intervalMs);
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, saveFunction, intervalMs]);

  // Save on unmount if there are unsaved changes
  useEffect(() => {
    return () => {
      const dataChanged = JSON.stringify(data) !== JSON.stringify(previousDataRef.current);
      if (dataChanged) {
        saveFunction(data);
      }
    };
  }, [data, saveFunction]);

  return { lastSaved, saveNow, hasUnsavedChanges };
}
