import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2 w-full text-left">
        {label && (
          <label className="font-bold text-foreground text-sm uppercase tracking-wide">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "h-14 rounded-2xl border-2 border-zinc-200 bg-zinc-50 px-4 py-2 text-base font-semibold transition-colors placeholder:text-zinc-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-0 disabled:opacity-50",
            error && "border-error focus:border-error focus:ring-error text-error",
            className
          )}
          {...props}
        />
        {error && <span className="text-error text-xs font-bold">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";
