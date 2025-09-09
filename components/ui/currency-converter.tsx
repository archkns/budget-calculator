"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'

interface Currency {
  code: string
  symbol: string
  name: string
}

interface CurrencyConverterProps {
  currentCurrency: string
  currentSymbol: string
  currentAmount: number
  onCurrencyChange: (currency: string, symbol: string, rate: number, convertedAmount: number) => void
}

const CURRENCIES: Currency[] = [
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' }
]

// Fallback exchange rates (updated periodically)
const FALLBACK_RATES: Record<string, Record<string, number>> = {
  THB: { USD: 0.028, EUR: 0.026, GBP: 0.022, JPY: 4.2, SGD: 0.038, AUD: 0.042, CAD: 0.038, THB: 1 },
  USD: { THB: 35.7, EUR: 0.92, GBP: 0.79, JPY: 149.8, SGD: 1.35, AUD: 1.49, CAD: 1.36, USD: 1 },
  EUR: { THB: 38.8, USD: 1.09, GBP: 0.86, JPY: 163.2, SGD: 1.47, AUD: 1.62, CAD: 1.48, EUR: 1 },
  GBP: { THB: 45.1, USD: 1.27, EUR: 1.16, JPY: 189.8, SGD: 1.71, AUD: 1.89, CAD: 1.72, GBP: 1 },
  JPY: { THB: 0.24, USD: 0.0067, EUR: 0.0061, GBP: 0.0053, SGD: 0.009, AUD: 0.01, CAD: 0.009, JPY: 1 },
  SGD: { THB: 26.4, USD: 0.74, EUR: 0.68, GBP: 0.58, JPY: 111.0, AUD: 1.10, CAD: 1.01, SGD: 1 },
  AUD: { THB: 23.9, USD: 0.67, EUR: 0.62, GBP: 0.53, JPY: 100.5, SGD: 0.91, CAD: 0.91, AUD: 1 },
  CAD: { THB: 26.2, USD: 0.73, EUR: 0.68, GBP: 0.58, JPY: 110.1, SGD: 0.99, AUD: 1.10, CAD: 1 }
}

export function CurrencyConverter({ 
  currentCurrency, 
  currentSymbol, 
  currentAmount, 
  onCurrencyChange 
}: CurrencyConverterProps) {
  const [selectedCurrency, setSelectedCurrency] = useState(currentCurrency)
  const [manualRate, setManualRate] = useState<string>('')
  const [useManualRate, setUseManualRate] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({})

  // Fetch exchange rates from our API
  const fetchExchangeRates = useCallback(async (baseCurrency: string = currentCurrency) => {
    
    try {
      const response = await fetch(`/api/currency?base=${baseCurrency}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.currencies) {
        const rates: Record<string, number> = {}
        data.currencies.forEach((currency: { currency: string; rate: number }) => {
          rates[currency.currency] = currency.rate
        })
        setExchangeRates(rates)
        toast.success('Exchange rates updated from secure fallback rates')
      } else {
        throw new Error('Invalid API response')
      }
    } catch (error) {
      console.warn('Failed to fetch live rates, using fallback:', error)
      const fallbackRates = FALLBACK_RATES[baseCurrency] || FALLBACK_RATES.USD
      setExchangeRates(fallbackRates)
      toast.warning('Using cached exchange rates (API unavailable)')
    } finally {
      // Loading completed
    }
  }, [currentCurrency])

  // Initialize exchange rates on component mount
  useEffect(() => {
    fetchExchangeRates(currentCurrency)
  }, [currentCurrency, fetchExchangeRates])

  // Get current exchange rate
  const getCurrentRate = (): number => {
    if (useManualRate && manualRate) {
      return parseFloat(manualRate)
    }
    
    // Use live rates if available, otherwise fallback
    if (Object.keys(exchangeRates).length > 0) {
      return exchangeRates[selectedCurrency] || 1
    }
    
    return FALLBACK_RATES[currentCurrency]?.[selectedCurrency] || 1
  }

  // Calculate converted amount
  const convertedAmount = currentAmount * getCurrentRate()
  const selectedCurrencyData = CURRENCIES.find(c => c.code === selectedCurrency)

  // Handle currency change
  const handleCurrencyChange = (newCurrency: string) => {
    setSelectedCurrency(newCurrency)
    const newCurrencyData = CURRENCIES.find(c => c.code === newCurrency)
    if (newCurrencyData) {
      const rate = getCurrentRate()
      const converted = currentAmount * rate
      onCurrencyChange(newCurrency, newCurrencyData.symbol, rate, converted)
      toast.success(`Currency changed to ${newCurrencyData.name}`)
    }
  }

  // Apply conversion
  const applyConversion = () => {
    setIsConverting(true)
    const rate = getCurrentRate()
    const converted = currentAmount * rate
    
    setTimeout(() => {
      onCurrencyChange(selectedCurrency, selectedCurrencyData?.symbol || '$', rate, converted)
      toast.success(`Converted ${currentSymbol}${currentAmount.toLocaleString()} to ${selectedCurrencyData?.symbol}${converted.toLocaleString()}`)
      setIsConverting(false)
    }, 500)
  }

  // Reset to original currency
  const resetCurrency = () => {
    setSelectedCurrency('THB')
    setUseManualRate(false)
    setManualRate('')
    onCurrencyChange('THB', '฿', 1, currentAmount)
    toast.success('Reset to Thai Baht')
  }

  // Update manual rate
  const handleManualRateChange = (value: string) => {
    setManualRate(value)
    if (value && !isNaN(parseFloat(value))) {
      const rate = parseFloat(value)
      const converted = currentAmount * rate
      onCurrencyChange(selectedCurrency, selectedCurrencyData?.symbol || '$', rate, converted)
    }
  }

  const currentRate = getCurrentRate()
  const rateDirection = currentRate > 1 ? 'up' : currentRate < 1 ? 'down' : 'neutral'

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-blue-700 flex items-center">
          <DollarSign className="h-4 w-4 mr-2" />
          Currency Converter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Currency Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-gray-600">From Currency</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="outline" className="bg-white">
                {currentCurrency} ({currentSymbol})
              </Badge>
              <span className="text-sm text-gray-500">
                {currentSymbol}{currentAmount.toLocaleString()}
              </span>
            </div>
          </div>
          
          <div>
            <Label className="text-xs text-gray-600">To Currency</Label>
            <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(currency => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.code} ({currency.symbol}) - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Exchange Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-gray-600">Exchange Rate</Label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="manual-rate"
                checked={useManualRate}
                onChange={(e) => setUseManualRate(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="manual-rate" className="text-xs text-gray-600">
                Manual Rate
              </Label>
            </div>
          </div>
          
          {useManualRate ? (
            <Input
              type="number"
              step="0.0001"
              placeholder="Enter exchange rate"
              value={manualRate}
              onChange={(e) => handleManualRateChange(e.target.value)}
              className="text-sm"
            />
          ) : (
            <div className="flex items-center space-x-2 p-2 bg-white rounded border">
              <span className="text-sm font-medium">
                1 {currentCurrency} = {currentRate.toFixed(4)} {selectedCurrency}
              </span>
              {rateDirection === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
              {rateDirection === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
            </div>
          )}
        </div>

        {/* Conversion Preview */}
        <div className="p-3 bg-white rounded border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-600">Converted Amount</div>
              <div className="text-lg font-bold text-blue-700">
                {selectedCurrencyData?.symbol}{convertedAmount.toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-600">Rate Used</div>
              <div className="text-sm font-medium">
                {currentRate.toFixed(4)}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button 
            onClick={applyConversion}
            disabled={isConverting || selectedCurrency === currentCurrency}
            className="flex-1"
            size="sm"
          >
            {isConverting ? (
              <>
                <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                Converting...
              </>
            ) : (
              'Apply Conversion'
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={resetCurrency}
            size="sm"
          >
            Reset
          </Button>
        </div>

        {/* Rate Information */}
        <div className="text-xs text-gray-500 space-y-1">
          <div>• Exchange rates using secure fallback rates</div>
          <div>• Use manual rate for custom conversions</div>
          <div>• All amounts will be converted throughout the interface</div>
          <div>• Fallback to cached rates if API is unavailable</div>
        </div>
      </CardContent>
    </Card>
  )
}
