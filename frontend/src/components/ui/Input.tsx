import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium text-gray-400 mb-2"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'w-full px-4 py-3 rounded-lg',
            'bg-zinc-950/50 border-2 border-zinc-900',
            'text-white placeholder-gray-600',
            'backdrop-blur-sm',
            'transition-all duration-200',
            'focus:outline-none focus:border-white focus:bg-zinc-950/70',
            'hover:border-zinc-800',
            error && 'border-red-500/50 focus:border-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red-400 animate-fade-in">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
