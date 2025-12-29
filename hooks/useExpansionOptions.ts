import { useState, useCallback } from 'react';
import { ExpansionOptions, DEFAULT_EXPANSION_OPTIONS } from '@/utils/expansionOptions';

/**
 * Custom hook for managing text expansion options
 * Handles state for which text features to expand (numbers, currencies, etc.)
 */
export const useExpansionOptions = () => {
  const [expansionOptions, setExpansionOptions] = useState<ExpansionOptions>(
    DEFAULT_EXPANSION_OPTIONS
  );
  const [showExpansionSettings, setShowExpansionSettings] = useState<boolean>(false);

  // Toggle a specific expansion option
  const toggleExpansionOption = useCallback((key: keyof ExpansionOptions) => {
    setExpansionOptions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);

  // Reset to defaults
  const resetExpansionOptions = useCallback(() => {
    setExpansionOptions(DEFAULT_EXPANSION_OPTIONS);
  }, []);

  return {
    expansionOptions,
    showExpansionSettings,
    setShowExpansionSettings,
    toggleExpansionOption,
    resetExpansionOptions
  };
};
