import React from 'react';
import { Type } from 'lucide-react';

interface ScriptEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  height?: string;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  value,
  onChange,
  placeholder = "Paste your script here...",
  label = "Script Input",
  height = "h-[50vh] lg:h-[80vh]"
}) => {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800/60 flex flex-col ${height} overflow-hidden transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50`}>
      {/* Toolbar */}
      <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <Type size={14} />
          <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
        </div>
        <div className="text-xs font-mono text-slate-400">
          {value.length} chars
        </div>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 w-full p-6 resize-none bg-transparent border-none focus:ring-0 text-slate-700 dark:text-slate-300 text-lg leading-relaxed placeholder:text-slate-300 dark:placeholder:text-slate-700"
        spellCheck={false}
      />
    </div>
  );
};
