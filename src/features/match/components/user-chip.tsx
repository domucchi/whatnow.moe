'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

import { Avatar } from './avatar';

type Props = {
  index: number;
  value: string;
  onValueChange: (next: string) => void;
  canRemove: boolean;
  onRemove: () => void;
  autoFocus?: boolean;
  invalid?: boolean;
  loading?: boolean;
};

// Controlled so the enclosing sidebar can diff the current edits against the
// URL-seeded initial set and surface a "Match now" button when they diverge.
// The `name` attribute is still set so the server action's FormData reader
// keeps working — React submits the current value regardless of controlled
// vs uncontrolled.
export function UserChip({
  index,
  value,
  onValueChange,
  canRemove,
  onRemove,
  autoFocus = false,
  invalid = false,
  loading = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-[10px] border bg-[var(--bg-2)] py-2 pr-2.5 pl-2 transition-colors',
        invalid ? 'border-primary/40' : 'border-[var(--line-soft)]',
      )}
    >
      <Avatar username={value || '?'} colorIndex={index} size={26} />
      <input
        ref={inputRef}
        id={`username-${index}`}
        name={`username-${index}`}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder="AniList username"
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        maxLength={32}
        required
        className="text-foreground min-w-0 flex-1 border-0 bg-transparent text-[13.5px] font-medium tracking-[-0.005em] outline-none placeholder:text-[var(--ink-3)]"
      />
      {loading ? (
        <div
          aria-hidden
          className="h-3.5 w-3.5 rounded-full border-2 border-[var(--bg-3)]"
          style={{
            borderTopColor: 'var(--color-primary)',
            animation: 'spin-slow 0.8s linear infinite',
          }}
        />
      ) : canRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove user ${index + 1}`}
          className="hover:text-foreground grid place-items-center rounded-md p-1 text-[var(--ink-3)] transition-colors"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
