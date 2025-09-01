import React from 'react';

import { cn } from '../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Simple Card component for content containers
 */
export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn('rounded-lg border border-gray-200 bg-white p-6 shadow-sm', className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  );
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <h3 className={cn('text-lg font-semibold text-gray-900', className)} {...props}>
      {children}
    </h3>
  );
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardContent({ className, children, ...props }: CardContentProps) {
  return (
    <div className={cn('space-y-4', className)} {...props}>
      {children}
    </div>
  );
}
