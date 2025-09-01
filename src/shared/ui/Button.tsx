import React from 'react';

import { cn } from '../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
  children: React.ReactNode;
}

/**
 * Reusable Button component
 *
 * This is part of the shared UI system. Use this instead of
 * creating custom button styles throughout the app.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  asChild = false,
  className,
  children,
  ...props
}: ButtonProps) {
  const baseClassName = cn(
    // Base styles
    'inline-flex items-center justify-center rounded-md font-medium transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',

    // Variants
    {
      'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500': variant === 'primary',
      'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500': variant === 'secondary',
      'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500':
        variant === 'outline',
    },

    // Sizes
    {
      'px-3 py-1.5 text-sm': size === 'sm',
      'px-4 py-2 text-base': size === 'md',
      'px-6 py-3 text-lg': size === 'lg',
    },

    className,
  );

  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      className: baseClassName,
    });
  }

  return (
    <button className={baseClassName} {...props}>
      {children}
    </button>
  );
}
