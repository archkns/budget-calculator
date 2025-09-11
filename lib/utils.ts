import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format level values for display in the UI
 * Handles both level objects and level names
 */
export function formatLevel(level?: { name?: string; display_name?: string } | string | null): string {
  if (!level) return 'N/A'
  
  // If it's an object with display_name, use that
  if (typeof level === 'object' && level.display_name) {
    return level.display_name
  }
  
  // If it's an object with name, use that
  if (typeof level === 'object' && level.name) {
    return level.name
  }
  
  // If it's a string, format it
  if (typeof level === 'string') {
    return level.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }
  
  return 'N/A'
}

/**
 * @deprecated Use formatLevel instead
 * Format tier values for display in the UI
 * Converts TEAM_LEAD to "Team Lead", SENIOR to "Senior", JUNIOR to "Junior"
 */
export function formatTier(tier?: string | null): string {
  return formatLevel(tier)
}

/**
 * Map currency codes to their symbols
 */
export function getCurrencySymbol(currencyCode: string): string {
  const currencyMap: Record<string, string> = {
    'THB': '฿',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'SGD': 'S$',
    'AUD': 'A$',
    'CAD': 'C$',
    'CHF': 'CHF',
    'CNY': '¥',
    'KRW': '₩',
    'INR': '₹',
    'MYR': 'RM',
    'IDR': 'Rp',
    'PHP': '₱',
    'VND': '₫'
  }
  
  return currencyMap[currencyCode.toUpperCase()] || currencyCode
}

/**
 * Format currency with proper decimal places and thousand separators
 */
export function formatCurrency(amount: number, currencyCode: string = 'THB'): string {
  const symbol = getCurrencySymbol(currencyCode)
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Format percentage with proper decimal places
 */
export function formatPercentage(percentage: number): string {
  return `${percentage.toFixed(2)}%`
}

/**
 * Format date in DD MMM YYYY format (e.g., "11 Sep 2025")
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'Not set'
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return 'Invalid date'
  
  const day = dateObj.getDate().toString().padStart(2, '0')
  const month = dateObj.toLocaleDateString('en-US', { month: 'short' })
  const year = dateObj.getFullYear()
  
  return `${day} ${month} ${year}`
}

/**
 * Get working days based on working week type and custom days
 */
export function getWorkingDays(workingWeek: string, customWorkingDays?: string[] | null): string[] {
  switch (workingWeek) {
    case 'MON_TO_FRI':
      return ['MON', 'TUE', 'WED', 'THU', 'FRI']
    case 'MON_TO_SAT':
      return ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
    case 'CUSTOM':
      return customWorkingDays || []
    default:
      return ['MON', 'TUE', 'WED', 'THU', 'FRI'] // Default to Monday-Friday
  }
}

/**
 * Format working days for display
 */
export function formatWorkingDays(workingWeek: string, customWorkingDays?: string[] | null): string {
  const days = getWorkingDays(workingWeek, customWorkingDays)
  
  if (workingWeek === 'MON_TO_FRI') {
    return 'Monday - Friday'
  } else if (workingWeek === 'MON_TO_SAT') {
    return 'Monday - Saturday'
  } else if (workingWeek === 'CUSTOM') {
    const dayNames = days.map(day => {
      const dayMap: Record<string, string> = {
        'MON': 'Monday',
        'TUE': 'Tuesday', 
        'WED': 'Wednesday',
        'THU': 'Thursday',
        'FRI': 'Friday',
        'SAT': 'Saturday',
        'SUN': 'Sunday'
      }
      return dayMap[day] || day
    })
    return dayNames.join(', ')
  }
  
  return 'Monday - Friday' // Default
}