import React from 'react';

import { cn } from '../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | undefined;
  helperText?: string;
}

/**
 * Reusable Input component
 *
 * Supports labels, error states, and helper text.
 * Use this for all text inputs in the app.
 * Compatible with react-hook-form via forwardRef.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          className={cn(
            'block w-full rounded-md border px-3 py-2 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'disabled:cursor-not-allowed disabled:opacity-50',
            {
              'border-gray-300 focus:border-blue-500 focus:ring-blue-500': !error,
              'border-red-300 focus:border-red-500 focus:ring-red-500': error,
            },
            className,
          )}
          {...props}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        {helperText && !error && <p className="text-sm text-gray-500">{helperText}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
