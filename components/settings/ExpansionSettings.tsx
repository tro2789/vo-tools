import React from 'react';
import { Sparkles } from 'lucide-react';
import { ExpansionOptions, EXPANSION_LABELS, EXPANSION_DESCRIPTIONS } from '@/utils/expansionOptions';

interface ExpansionSettingsProps {
  showExpansionSettings: boolean;
  setShowExpansionSettings: (show: boolean) => void;
  expansionOptions: ExpansionOptions;
  toggleExpansionOption: (key: keyof ExpansionOptions) => void;
}

export const ExpansionSettings: React.FC<ExpansionSettingsProps> = ({
  showExpansionSettings,
  setShowExpansionSettings,
  expansionOptions,
  toggleExpansionOption
}) => {
  return (
    <div className="bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
      <button
        onClick={() => setShowExpansionSettings(!showExpansionSettings)}
        className="w-full px-5 py-4 flex items-center justify-between text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Sparkles size={16} />
          Expansion Settings
        </span>
        <span className={`text-slate-400 transition-transform ${showExpansionSettings ? 'rotate-180' : ''}`}>▼</span>
      </button>
      
      {showExpansionSettings && (
        <div className="px-5 pb-4 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
          {(Object.keys(expansionOptions) as Array<keyof ExpansionOptions>).map((key) => (
            <label key={key} className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={expansionOptions[key]}
                onChange={() => toggleExpansionOption(key)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {EXPANSION_LABELS[key]}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {EXPANSION_DESCRIPTIONS[key]}
                </div>
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};
