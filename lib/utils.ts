import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format tier values for display in the UI
 * Converts TEAM_LEAD to "Team Lead", SENIOR to "Senior", JUNIOR to "Junior"
 */
export function formatTier(tier?: string | null): string {
  if (!tier) return 'N/A'
  return tier.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}

/**
 * Format currency with proper decimal places and thousand separators
 */
export function formatCurrency(amount: number, currencySymbol: string = '฿'): string {
  return `${currencySymbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Format percentage with proper decimal places
 */
export function formatPercentage(percentage: number): string {
  return `${percentage.toFixed(2)}%`
}