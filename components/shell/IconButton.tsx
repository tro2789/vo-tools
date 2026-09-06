import type { ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  /** Accessible name; also used as the tooltip. */
  label: string;
  iconSize?: number;
}

export function IconButton({
  icon: Icon,
  label,
  iconSize = 14,
  className = '',
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center bg-transparent text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:text-disabled ${className}`}
      {...rest}
    >
      <Icon width={iconSize} height={iconSize} aria-hidden="true" />
    </button>
  );
}
