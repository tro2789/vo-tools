'use client';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface SegmentedProps<T extends string> {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  size?: 26 | 28;
  label?: string;
  className?: string;
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  size = 26,
  label,
  className = '',
}: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`flex border border-line-strong ${size === 28 ? 'h-[28px]' : 'h-[26px]'} ${className}`}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={`px-[10px] text-[11px] whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:text-disabled ${
              index > 0 ? 'border-l border-line-strong' : ''
            } ${
              selected
                ? 'bg-button font-medium text-panel'
                : 'bg-panel text-muted'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
