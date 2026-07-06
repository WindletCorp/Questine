import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', fullWidth, children, ...props }, ref) => {
    
    // Core duolingo style: thick border bottom acting as a shadow, and translation on active.
    const baseStyles = "inline-flex items-center justify-center font-bold transition-all uppercase tracking-widest active:translate-y-[4px] active:shadow-none disabled:opacity-50 disabled:pointer-events-none rounded-2xl select-none";
    
    const variants = {
      primary: "bg-primary text-white shadow-[0_4px_0_0_var(--color-primary-shadow)] hover:brightness-110",
      secondary: "bg-accent text-white shadow-[0_4px_0_0_var(--color-accent-shadow)] hover:brightness-110",
      danger: "bg-error text-white shadow-[0_4px_0_0_var(--color-error-shadow)] hover:brightness-110",
      outline: "bg-white text-zinc-400 border-2 border-zinc-200 shadow-[0_4px_0_0_theme(colors.zinc.200)] hover:bg-zinc-50",
      ghost: "bg-transparent text-zinc-500 hover:bg-zinc-100 active:translate-y-0 active:shadow-none normal-case tracking-normal font-semibold",
    };

    const sizes = {
      default: "h-14 px-6 text-sm",
      sm: "h-10 px-4 text-xs shadow-[0_3px_0_0] active:translate-y-[3px]",
      lg: "h-16 px-8 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles, 
          variants[variant], 
          sizes[size], 
          fullWidth && "w-full flex",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
