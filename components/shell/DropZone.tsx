'use client';

import { useRef, useState } from 'react';
import type { DragEvent } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface DropZoneProps {
  icon: LucideIcon;
  title: string;
  /** Secondary line under the title. */
  hint?: string;
  /** Accepted formats, rendered as a 10px uppercase caption. */
  formats?: string;
  /** Box height in px. Defaults to 96. */
  height?: number;
  iconSize?: number;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
  className?: string;
}

export function DropZone({
  icon: Icon,
  title,
  hint,
  formats,
  height = 96,
  iconSize,
  accept,
  multiple = true,
  disabled = false,
  onFiles,
  className = '',
}: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const resolvedIconSize = iconSize ?? (height >= 140 ? 22 : 18);

  const emit = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    onFiles(Array.from(list));
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setOver(false);
    if (disabled) return;
    emit(event.dataTransfer.files);
  };

  return (
    <label
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
      style={{ height }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-[6px] border border-dashed px-4 text-center ${
        over ? 'border-ink bg-page' : 'border-line-strong bg-subtle'
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''} ${className}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        aria-label={title}
        onChange={(event) => {
          emit(event.target.files);
          event.target.value = '';
        }}
      />
      <Icon width={resolvedIconSize} height={resolvedIconSize} className="text-muted" aria-hidden="true" />
      <span className="text-[13px] font-medium text-body">{title}</span>
      {hint ? <span className="text-[12px] text-muted">{hint}</span> : null}
      {formats ? (
        <span className="mt-1 text-[10px] tracking-[0.08em] text-muted uppercase">{formats}</span>
      ) : null}
    </label>
  );
}
