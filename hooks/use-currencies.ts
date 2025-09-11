import { useState, useEffect, useCallback } from 'react'

export interface Currency {
  id: number
  code: string
  name: string
  symbol: string
  decimal_places: number
  is_base_currency: boolean
  is_active: boolean
  exchange_rate: number
  last_updated: string
  created_at: string
  updated_at: string
}

export interface UseCurrenciesReturn {
  currencies: Currency[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  syncWithExternalAPI: () => Promise<void>
  isSyncing: boolean
}

export function useCurrencies(): UseCurrenciesReturn {
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  const fetchCurrencies = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch('/api/currencies?active=true')
      const data = await response.json()
      
      if (data.success && data.currencies) {
        setCurrencies(data.currencies)
      } else {
        throw new Error(data.message || 'Failed to fetch currencies')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch currencies'
      setError(errorMessage)
      console.error('Error fetching currencies:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const syncWithExternalAPI = useCallback(async () => {
    setIsSyncing(true)
    try {
      setError(null)
      const response = await fetch('/api/currencies/sync', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success && data.currencies) {
        setCurrencies(data.currencies)
      } else {
        throw new Error(data.message || 'Failed to sync currencies')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync currencies'
      setError(errorMessage)
      console.error('Error syncing currencies:', err)
    } finally {
      setIsSyncing(false)
    }
  }, [])

  useEffect(() => {
    fetchCurrencies()
  }, [fetchCurrencies])

  return {
    currencies,
    isLoading,
    error,
    refetch: fetchCurrencies,
    syncWithExternalAPI,
    isSyncing
  }
}

export function useCurrencyByCode(code: string): {
  currency: Currency | null
  isLoading: boolean
  error: string | null
} {
  const [currency, setCurrency] = useState<Currency | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        setError(null)
        const response = await fetch(`/api/currencies/code/${code}`)
        const data = await response.json()
        
        if (data.success && data.currency) {
          setCurrency(data.currency)
        } else {
          throw new Error(data.message || 'Currency not found')
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch currency'
        setError(errorMessage)
        console.error('Error fetching currency:', err)
      } finally {
        setIsLoading(false)
      }
    }

    if (code) {
      fetchCurrency()
    }
  }, [code])

  return { currency, isLoading, error }
}

export function useCurrencyConversion(): {
  convert: (amount: number, from: string, to: string) => Promise<number>
  getRate: (from: string, to: string) => Promise<number>
  isLoading: boolean
  error: string | null
} {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const convert = useCallback(async (amount: number, from: string, to: string): Promise<number> => {
    if (from === to) return amount

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/currencies/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount, from, to })
      })

      const data = await response.json()

      if (data.success && data.conversion) {
        return data.conversion.convertedAmount
      } else {
        throw new Error(data.message || 'Failed to convert currency')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to convert currency'
      setError(errorMessage)
      console.error('Error converting currency:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getRate = useCallback(async (from: string, to: string): Promise<number> => {
    if (from === to) return 1

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/currencies/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: 1, from, to })
      })

      const data = await response.json()

      if (data.success && data.conversion) {
        return data.conversion.exchangeRate
      } else {
        throw new Error(data.message || 'Failed to get exchange rate')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get exchange rate'
      setError(errorMessage)
      console.error('Error getting exchange rate:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { convert, getRate, isLoading, error }
}
