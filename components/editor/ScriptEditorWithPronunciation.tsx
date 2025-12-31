'use client';

import React, { useState } from 'react';
import { Type, BookOpen } from 'lucide-react';
import { ScriptEditor } from './ScriptEditor';
import { ScriptTextDisplay } from '../pronunciation/ScriptTextDisplay';

interface ScriptEditorWithPronunciationProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  height?: string;
  showPronunciationToggle?: boolean;
}

/**
 * ScriptEditorWithPronunciation Component
 * 
 * Wraps the standard ScriptEditor with an optional pronunciation view mode.
 * Allows users to toggle between editing mode and pronunciation lookup mode.
 * 
 * Features:
 * - Edit mode: Standard textarea for script input
 * - Pronunciation mode: Clickable words for pronunciation lookup
 * - Seamless toggle between modes
 * - Same styling and layout as ScriptEditor
 * 
 * Usage:
 * - Set showPronunciationToggle to true to enable the toggle button
 * - Default mode is edit mode
 */
export const ScriptEditorWithPronunciation: React.FC<ScriptEditorWithPronunciationProps> = ({
  value,
  onChange,
  placeholder = "Paste your script here...",
  label = "Script Input",
  height = "h-[50vh] lg:h-[80vh]",
  showPronunciationToggle = true
}) => {
  const [viewMode, setViewMode] = useState<'edit' | 'pronunciation'>('edit');

  // Only show pronunciation mode if there's text and toggle is enabled
  const canShowPronunciation = showPronunciationToggle && value.trim().length > 0;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800/60 flex flex-col ${height} overflow-hidden transition-all ${viewMode === 'edit' ? 'focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50' : ''}`}>
      {/* Toolbar */}
      <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          {viewMode === 'edit' ? <Type size={14} /> : <BookOpen size={14} />}
          <span className="text-xs font-bold uppercase tracking-wider">
            {viewMode === 'edit' ? label : 'Pronunciation View'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Character count */}
          <div className="text-xs font-mono text-slate-400">
            {value.length} chars
          </div>

          {/* Mode toggle */}
          {canShowPronunciation && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('edit')}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  viewMode === 'edit'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Edit mode"
              >
                <Type size={12} className="inline" />
                <span className="ml-1 hidden sm:inline">Edit</span>
              </button>
              <button
                onClick={() => setViewMode('pronunciation')}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  viewMode === 'pronunciation'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Pronunciation lookup mode - click words to see pronunciations"
              >
                <BookOpen size={12} className="inline" />
                <span className="ml-1 hidden sm:inline">Pronunciation</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content area */}
      {viewMode === 'edit' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 w-full p-6 resize-none bg-transparent border-none focus:ring-0 text-slate-700 dark:text-slate-300 text-lg leading-relaxed placeholder:text-slate-300 dark:placeholder:text-slate-700"
          spellCheck={false}
        />
      ) : (
        <div className="flex-1 w-full p-6 overflow-y-auto">
          {value.trim() ? (
            <ScriptTextDisplay text={value} />
          ) : (
            <div className="text-slate-400 dark:text-slate-600 text-center mt-8">
              Enter some script text to see pronunciation lookup
            </div>
          )}
        </div>
      )}

      {/* Help text when in pronunciation mode */}
      {viewMode === 'pronunciation' && value.trim() && (
        <div className="px-5 py-2 border-t border-slate-100 dark:border-slate-800 bg-blue-50/50 dark:bg-blue-900/10">
          <p className="text-xs text-blue-600 dark:text-blue-400">
            💡 Click any word to see its pronunciation in ARPABET notation
          </p>
        </div>
      )}
    </div>
  );
};
