'use client';

export interface ChipProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Chip({ label, checked, onChange, disabled, className = '' }: ChipProps) {
  return (
    <label
      className={`flex h-6 cursor-pointer items-center gap-[6px] border px-2 ${
        checked ? 'border-line-strong bg-page' : 'border-line bg-panel'
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''} ${className}`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="m-0 h-3 w-3"
      />
      <span className="text-[11px] text-body">{label}</span>
    </label>
  );
}
