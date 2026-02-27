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
    <div className="bg-gray-50 dark:bg-gray-950/30 rounded-xl p-5 border border-gray-100 dark:border-gray-700/50">
      <div className="flex items-center justify-between mb-4">
        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200">
          <Settings2 size={16} />
          Reading Speed
        </label>
        <span className="text-xs font-mono font-medium bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 px-2 py-1 rounded-sm text-gray-600 dark:text-gray-300">
          {wpm} WPM
        </span>
      </div>

      <input
        type="range"
        min={minWpm}
        max={maxWpm}
        value={wpm}
        onChange={(e) => setWpm(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
      />

      <div className="flex justify-between mt-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">
        <span>Slow ({minWpm})</span>
        <span>Fast ({maxWpm})</span>
      </div>
    </div>
  );
};
