import React from 'react';
import { Settings2 } from 'lucide-react';

interface SpeedControlProps {
  wpm: number;
  setWpm: (wpm: number) => void;
  minWpm?: number;
  maxWpm?: number;
}

export const SpeedControl: React.FC<SpeedControlProps> = ({
  wpm,
  setWpm,
  minWpm = 75,
  maxWpm = 160
}) => {
  return (
    <div className="bg-slate-50 dark:bg-slate-950/30 rounded-xl p-5 border border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
          <Settings2 size={16} />
          Reading Speed
        </label>
        <span className="text-xs font-mono font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
          {wpm} WPM
        </span>
      </div>

      <input
        type="range"
        min={minWpm}
        max={maxWpm}
        value={wpm}
        onChange={(e) => setWpm(parseInt(e.target.value))}
        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
      
      <div className="flex justify-between mt-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
        <span>Slow ({minWpm})</span>
        <span>Fast ({maxWpm})</span>
      </div>
    </div>
  );
};
