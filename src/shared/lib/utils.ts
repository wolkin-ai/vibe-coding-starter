import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility to merge Tailwind CSS classes safely
 *
 * This prevents class conflicts when combining Tailwind utilities.
 * Use this instead of string concatenation for className.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Simple delay utility for demos/testing
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Format date for display (Japanese locale)
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  }).format(new Date(date));
}

/**
 * Generate a simple random ID (for demo purposes)
 * In production, use crypto.randomUUID() or a proper ID library
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}
