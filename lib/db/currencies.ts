import { supabaseAdmin } from '@/lib/supabase'

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

export interface CreateCurrencyData {
  code: string
  name: string
  symbol: string
  decimal_places?: number
  is_base_currency?: boolean
  is_active?: boolean
  exchange_rate?: number
}

export interface UpdateCurrencyData {
  name?: string
  symbol?: string
  decimal_places?: number
  is_base_currency?: boolean
  is_active?: boolean
  exchange_rate?: number
}

export class CurrencyService {
  private supabase = supabaseAdmin()

  /**
   * Get all active currencies
   */
  async getActiveCurrencies(): Promise<Currency[]> {
    const { data, error } = await this.supabase
      .from('currencies')
      .select('*')
      .eq('is_active', true)
      .order('code')

    if (error) {
      console.error('Error fetching active currencies:', error)
      throw new Error('Failed to fetch currencies')
    }

    return data || []
  }

  /**
   * Get all currencies (including inactive)
   */
  async getAllCurrencies(): Promise<Currency[]> {
    const { data, error } = await this.supabase
      .from('currencies')
      .select('*')
      .order('code')

    if (error) {
      console.error('Error fetching all currencies:', error)
      throw new Error('Failed to fetch currencies')
    }

    return data || []
  }

  /**
   * Get currency by code
   */
  async getCurrencyByCode(code: string): Promise<Currency | null> {
    const { data, error } = await this.supabase
      .from('currencies')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      console.error('Error fetching currency by code:', error)
      throw new Error('Failed to fetch currency')
    }

    return data
  }

  /**
   * Get base currency
   */
  async getBaseCurrency(): Promise<Currency | null> {
    const { data, error } = await this.supabase
      .from('currencies')
      .select('*')
      .eq('is_base_currency', true)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      console.error('Error fetching base currency:', error)
      throw new Error('Failed to fetch base currency')
    }

    return data
  }

  /**
   * Create a new currency
   */
  async createCurrency(currencyData: CreateCurrencyData): Promise<Currency> {
    // If this is set as base currency, unset other base currencies
    if (currencyData.is_base_currency) {
      await this.unsetBaseCurrency()
    }

    const { data, error } = await this.supabase
      .from('currencies')
      .insert([{
        ...currencyData,
        code: currencyData.code.toUpperCase(),
        exchange_rate: currencyData.exchange_rate || 1.0
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating currency:', error)
      throw new Error('Failed to create currency')
    }

    return data
  }

  /**
   * Update a currency
   */
  async updateCurrency(id: number, currencyData: UpdateCurrencyData): Promise<Currency> {
    // If this is set as base currency, unset other base currencies
    if (currencyData.is_base_currency) {
      await this.unsetBaseCurrency()
    }

    const { data, error } = await this.supabase
      .from('currencies')
      .update(currencyData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating currency:', error)
      throw new Error('Failed to update currency')
    }

    return data
  }

  /**
   * Update exchange rates for multiple currencies
   */
  async updateExchangeRates(rates: Record<string, number>): Promise<void> {
    const updates = Object.entries(rates).map(([code, rate]) => ({
      code: code.toUpperCase(),
      exchange_rate: rate,
      last_updated: new Date().toISOString()
    }))

    for (const update of updates) {
      const { error } = await this.supabase
        .from('currencies')
        .update({
          exchange_rate: update.exchange_rate,
          last_updated: update.last_updated
        })
        .eq('code', update.code)

      if (error) {
        console.error(`Error updating exchange rate for ${update.code}:`, error)
        throw new Error(`Failed to update exchange rate for ${update.code}`)
      }
    }
  }

  /**
   * Convert amount between currencies
   */
  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount
    }

    const [fromCurrencyData, toCurrencyData] = await Promise.all([
      this.getCurrencyByCode(fromCurrency),
      this.getCurrencyByCode(toCurrency)
    ])

    if (!fromCurrencyData || !toCurrencyData) {
      throw new Error('Currency not found')
    }

    if (!fromCurrencyData.is_active || !toCurrencyData.is_active) {
      throw new Error('Currency is not active')
    }

    // Convert to base currency first, then to target currency
    const baseCurrency = await this.getBaseCurrency()
    if (!baseCurrency) {
      throw new Error('Base currency not found')
    }

    let convertedAmount = amount

    // Convert from source currency to base currency
    if (fromCurrency !== baseCurrency.code) {
      convertedAmount = amount * fromCurrencyData.exchange_rate
    }

    // Convert from base currency to target currency
    if (toCurrency !== baseCurrency.code) {
      convertedAmount = convertedAmount / toCurrencyData.exchange_rate
    }

    return Number(convertedAmount.toFixed(toCurrencyData.decimal_places))
  }

  /**
   * Get exchange rate between two currencies
   */
  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) {
      return 1
    }

    const [fromCurrencyData, toCurrencyData] = await Promise.all([
      this.getCurrencyByCode(fromCurrency),
      this.getCurrencyByCode(toCurrency)
    ])

    if (!fromCurrencyData || !toCurrencyData) {
      throw new Error('Currency not found')
    }

    if (!fromCurrencyData.is_active || !toCurrencyData.is_active) {
      throw new Error('Currency is not active')
    }

    const baseCurrency = await this.getBaseCurrency()
    if (!baseCurrency) {
      throw new Error('Base currency not found')
    }

    // Calculate rate: fromCurrency -> baseCurrency -> toCurrency
    let rate = 1

    // Convert from source currency to base currency
    if (fromCurrency !== baseCurrency.code) {
      rate = fromCurrencyData.exchange_rate
    }

    // Convert from base currency to target currency
    if (toCurrency !== baseCurrency.code) {
      rate = rate / toCurrencyData.exchange_rate
    }

    return Number(rate.toFixed(8))
  }

  /**
   * Delete a currency (soft delete by setting is_active to false)
   */
  async deleteCurrency(id: number): Promise<void> {
    const { error } = await this.supabase
      .from('currencies')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('Error deleting currency:', error)
      throw new Error('Failed to delete currency')
    }
  }

  /**
   * Hard delete a currency (permanent removal)
   */
  async hardDeleteCurrency(id: number): Promise<void> {
    const { error } = await this.supabase
      .from('currencies')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error hard deleting currency:', error)
      throw new Error('Failed to delete currency')
    }
  }

  /**
   * Unset all base currencies (helper method)
   */
  private async unsetBaseCurrency(): Promise<void> {
    const { error } = await this.supabase
      .from('currencies')
      .update({ is_base_currency: false })
      .eq('is_base_currency', true)

    if (error) {
      console.error('Error unsetting base currency:', error)
      throw new Error('Failed to unset base currency')
    }
  }

  /**
   * Sync currencies with external API and update exchange rates
   */
  async syncWithExternalAPI(): Promise<void> {
    try {
      // Fetch rates from external API directly
      const apiKey = process.env.EXCHANGE_RATE_API_KEY
      const apiUrl = process.env.EXCHANGE_RATE_API_URL || 'https://api.exchangerate-api.com/v4/latest'
      
      const url = `${apiUrl}/USD${apiKey ? `?access_key=${apiKey}` : ''}`
      
      const response = await fetch(url)
      const data = await response.json()

      if (!data.success && !data.rates) {
        throw new Error('Failed to fetch external rates')
      }

      // Get base currency (THB)
      const baseCurrency = await this.getBaseCurrency()
      if (!baseCurrency) {
        throw new Error('Base currency not found')
      }

      // Convert USD-based rates to THB-based rates
      const rates: Record<string, number> = {}
      const thbToUSD = data.rates[baseCurrency.code] || 1

      Object.entries(data.rates).forEach(([currency, rate]) => {
        if (currency === baseCurrency.code) {
          rates[currency] = 1.0 // Base currency to itself is always 1
        } else {
          // Convert: if 1 USD = rate currency and 1 USD = thbToUSD THB
          // Then: 1 THB = (rate / thbToUSD) currency
          rates[currency] = (rate as number) / thbToUSD
        }
      })

      await this.updateExchangeRates(rates)
    } catch (error) {
      console.error('Error syncing with external API:', error)
      throw new Error('Failed to sync with external API')
    }
  }
}

// Export singleton instance
export const currencyService = new CurrencyService()
