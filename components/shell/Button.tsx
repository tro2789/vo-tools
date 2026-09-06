import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 26 | 28 | 32 | 40;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Softens `secondary` / `ghost` text to the muted token. */
  tone?: 'default' | 'muted';
  icon?: LucideIcon;
  /** Fill the icon (play, heart). */
  iconFilled?: boolean;
  children?: ReactNode;
}

const SIZES: Record<ButtonSize, { box: string; icon: number }> = {
  26: { box: 'h-[26px] px-[10px] text-[11px]', icon: 13 },
  28: { box: 'h-[28px] px-[10px] text-[12px]', icon: 13 },
  32: { box: 'h-[32px] px-[12px] text-[12px]', icon: 14 },
  40: { box: 'h-[40px] px-4 text-[13px]', icon: 15 },
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-button text-panel font-medium',
  secondary: 'bg-panel border border-line-strong',
  ghost: 'bg-transparent',
};

export function Button({
  variant = 'secondary',
  size = 26,
  tone = 'default',
  icon: Icon,
  iconFilled = false,
  children,
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  const s = SIZES[size];
  const toneClass =
    variant === 'primary'
      ? ''
      : tone === 'muted'
        ? 'text-muted'
        : 'text-body';

  return (
    <button
      type={type}
      className={`inline-flex shrink-0 items-center justify-center gap-[6px] whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:text-disabled ${s.box} ${VARIANTS[variant]} ${toneClass} ${className}`}
      {...rest}
    >
      {Icon ? (
        <Icon
          width={s.icon}
          height={s.icon}
          className={iconFilled ? 'fill-current' : undefined}
          aria-hidden="true"
        />
      ) : null}
      {children}
    </button>
  );
}
