import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Strips HTML tags from a string and returns plain text
 * Useful for displaying rich text content in card previews
 * @param html - HTML string to strip tags from
 * @returns Plain text without HTML tags, with normalized whitespace
 */
export function stripHtmlTags(html: string): string {
  if (!html) return '';

  // Create a temporary div element to parse HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Get text content and normalize whitespace
  const text = temp.textContent || temp.innerText || '';

  // Replace multiple whitespace characters (including newlines) with a single space
  // and trim leading/trailing whitespace
  return text.replace(/\s+/g, ' ').trim();
}
