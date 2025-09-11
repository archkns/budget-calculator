// Shared currency configuration for consistent currency handling across the application

export interface Currency {
  code: string
  symbol: string
  name: string
}

// Fallback currency configuration (used when database is unavailable)
export const FALLBACK_CURRENCIES: Currency[] = [
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' }
]

// For backward compatibility, export CURRENCIES as FALLBACK_CURRENCIES
export const CURRENCIES = FALLBACK_CURRENCIES

// Helper function to get currency symbol from currency code
export function getCurrencySymbol(code: string): string {
  const currency = CURRENCIES.find(c => c.code === code)
  return currency?.symbol || '$'
}

// Helper function to get currency by code
export function getCurrencyByCode(code: string): Currency | undefined {
  return CURRENCIES.find(c => c.code === code)
}

// Helper function to get all currency codes
export function getCurrencyCodes(): string[] {
  return CURRENCIES.map(c => c.code)
}

// Database currency functions
export async function fetchCurrenciesFromDatabase(): Promise<Currency[]> {
  try {
    const response = await fetch('/api/currencies?active=true')
    const data = await response.json()
    
    if (data.success && data.currencies) {
      return data.currencies.map((c: { code: string; symbol: string; name: string }) => ({
        code: c.code,
        symbol: c.symbol,
        name: c.name
      }))
    }
    
    return FALLBACK_CURRENCIES
  } catch (error) {
    console.warn('Failed to fetch currencies from database, using fallback:', error)
    return FALLBACK_CURRENCIES
  }
}

// Helper function to get currency symbol from database or fallback
export async function getCurrencySymbolFromDatabase(code: string): Promise<string> {
  try {
    const currencies = await fetchCurrenciesFromDatabase()
    const currency = currencies.find(c => c.code === code)
    return currency?.symbol || getCurrencySymbol(code)
  } catch {
    return getCurrencySymbol(code)
  }
}
