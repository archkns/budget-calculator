"use client"

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { RefreshCw, DollarSign, TrendingUp, TrendingDown, ArrowUpDown, Wifi, WifiOff, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface Currency {
  code: string
  symbol: string
  name: string
}


interface RealtimeCurrencyConverterProps {
  currentCurrency: string
  currentSymbol: string
  proposedPrice: number
  hoursPerDay: number
  taxEnabled: boolean
  taxPercentage: number
  onCurrencyChange: (currency: string, symbol: string, rate: number) => void
  onProposedPriceChange: (price: number) => void
  onHoursPerDayChange: (hours: number) => void
  onTaxEnabledChange: (enabled: boolean) => void
  onTaxPercentageChange: (percentage: number) => void
}

const CURRENCIES: Currency[] = [
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

// Fallback exchange rates (updated periodically)
const FALLBACK_RATES: Record<string, Record<string, number>> = {
  THB: { USD: 0.0278, EUR: 0.0256, GBP: 0.0218, JPY: 4.18, SGD: 0.0374, AUD: 0.0418, CAD: 0.0377, CHF: 0.0248, CNY: 0.199, INR: 2.33, KRW: 37.2, THB: 1 },
  USD: { THB: 35.97, EUR: 0.92, GBP: 0.785, JPY: 150.3, SGD: 1.345, AUD: 1.504, CAD: 1.356, CHF: 0.892, CNY: 7.16, INR: 83.8, KRW: 1338, USD: 1 },
  EUR: { THB: 39.06, USD: 1.087, GBP: 0.853, JPY: 163.4, SGD: 1.462, AUD: 1.635, CAD: 1.474, CHF: 0.970, CNY: 7.78, INR: 91.1, KRW: 1454, EUR: 1 }
}

export const RealtimeCurrencyConverter = memo(function RealtimeCurrencyConverter({
  currentCurrency,
  currentSymbol,
  proposedPrice,
  hoursPerDay,
  taxEnabled,
  taxPercentage,
  onCurrencyChange,
  onProposedPriceChange,
  onHoursPerDayChange,
  onTaxEnabledChange,
  onTaxPercentageChange
}: RealtimeCurrencyConverterProps) {
  const [selectedCurrency, setSelectedCurrency] = useState(currentCurrency)
  const [manualRate, setManualRate] = useState<string>('')
  const [useManualRate, setUseManualRate] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [showConversionPreview, setShowConversionPreview] = useState(false)
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({})
  const [isLoadingRates, setIsLoadingRates] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'loading'>('loading')
  const [rateSource, setRateSource] = useState<'api' | 'fallback' | 'manual'>('api')

  // Fetch real-time exchange rates from external Exchange Rate API via our backend
  const fetchExchangeRates = useCallback(async (baseCurrency: string = currentCurrency) => {
    setIsLoadingRates(true)
    setApiStatus('loading')
    
    try {
      // Use our backend API which integrates with Open Exchange Rates
      const response = await fetch(`/api/currency?base=${baseCurrency}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.currencies) {
        // Convert currencies array to rates object
        const rates: Record<string, number> = {}
        data.currencies.forEach((currency: { currency: string; rate: number }) => {
          rates[currency.currency] = currency.rate
        })
        
        setExchangeRates(rates)
        setLastUpdated(new Date())
        setApiStatus('online')
        setRateSource('api')
        toast.success(`Exchange rates updated from live API`)
      } else {
        throw new Error('Invalid API response')
      }
    } catch (error) {
      console.warn('Failed to fetch live rates, using fallback:', error)
      
      // Use fallback rates
      const fallbackRates = FALLBACK_RATES[baseCurrency] || FALLBACK_RATES.USD
      setExchangeRates(fallbackRates)
      setLastUpdated(new Date())
      setApiStatus('offline')
      setRateSource('fallback')
      toast.warning('Using fallback exchange rates (API unavailable)')
    } finally {
      setIsLoadingRates(false)
    }
  }, [currentCurrency])

  // Initialize exchange rates on component mount
  useEffect(() => {
    fetchExchangeRates(currentCurrency)
  }, [currentCurrency, fetchExchangeRates])

  // Auto-refresh rates every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (rateSource === 'api') {
        fetchExchangeRates(currentCurrency)
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [currentCurrency, rateSource, fetchExchangeRates])

  // Get current exchange rate (memoized)
  const getCurrentRate = useCallback((): number => {
    if (useManualRate && manualRate) {
      setRateSource('manual')
      return parseFloat(manualRate)
    }
    
    const rate = exchangeRates[selectedCurrency] || 1
    return rate
  }, [useManualRate, manualRate, exchangeRates, selectedCurrency])

  // Calculate converted amount (memoized)
  const convertedAmount = useMemo(() => {
    return Math.round(proposedPrice * getCurrentRate())
  }, [proposedPrice, getCurrentRate])
  
  const selectedCurrencyData = useMemo(() => {
    return CURRENCIES.find(c => c.code === selectedCurrency)
  }, [selectedCurrency])

  // Handle currency selection change
  const handleCurrencySelection = (newCurrency: string) => {
    setSelectedCurrency(newCurrency)
    setShowConversionPreview(newCurrency !== currentCurrency)
    
    // If switching to a currency we don't have rates for, fetch new rates
    if (!exchangeRates[newCurrency] && newCurrency !== currentCurrency) {
      fetchExchangeRates(currentCurrency)
    }
  }

  // Apply currency conversion
  const applyCurrencyConversion = async () => {
    if (selectedCurrency === currentCurrency) return

    setIsConverting(true)
    
    // Fetch fresh rates before conversion if using API
    if (rateSource === 'api' && !useManualRate) {
      await fetchExchangeRates(currentCurrency)
    }
    
    const rate = getCurrentRate()
    const newCurrencyData = CURRENCIES.find(c => c.code === selectedCurrency)
    
    setTimeout(() => {
      if (newCurrencyData) {
        onCurrencyChange(selectedCurrency, newCurrencyData.symbol, rate)
        onProposedPriceChange(convertedAmount)
        setShowConversionPreview(false)
        
        // Update exchange rates for the new base currency
        fetchExchangeRates(selectedCurrency)
        
        toast.success(`Currency converted to ${newCurrencyData.name} (Rate: ${rate.toFixed(4)})`)
      }
      setIsConverting(false)
    }, 500)
  }

  // Reset to THB
  const resetToTHB = () => {
    setSelectedCurrency('THB')
    setUseManualRate(false)
    setManualRate('')
    setShowConversionPreview(false)
    onCurrencyChange('THB', '฿', 1)
    fetchExchangeRates('THB')
    toast.success('Reset to Thai Baht')
  }

  // Handle manual rate change
  const handleManualRateChange = (value: string) => {
    setManualRate(value)
    if (value && !isNaN(parseFloat(value))) {
      setShowConversionPreview(true)
      setRateSource('manual')
    }
  }

  // Refresh rates manually
  const refreshRates = () => {
    fetchExchangeRates(currentCurrency)
  }

  const currentRate = useMemo(() => getCurrentRate(), [getCurrentRate])
  const rateDirection = useMemo(() => {
    return currentRate > 1 ? 'up' : currentRate < 1 ? 'down' : 'neutral'
  }, [currentRate])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Project Settings & Currency
          </div>
          <div className="flex items-center space-x-2">
            {apiStatus === 'online' && <Wifi className="h-4 w-4 text-green-500" />}
            {apiStatus === 'offline' && <WifiOff className="h-4 w-4 text-orange-500" />}
            {apiStatus === 'loading' && <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />}
            <Badge variant={apiStatus === 'online' ? 'default' : 'secondary'} className="text-xs">
              {apiStatus === 'online' ? 'Live Rates' : apiStatus === 'offline' ? 'Cached Rates' : 'Loading...'}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Hours/Day</Label>
            <Input
              type="number"
              value={hoursPerDay}
              onChange={(e) => onHoursPerDayChange(parseInt(e.target.value))}
            />
          </div>
          <div>
            <Label>Proposed Price ({currentSymbol})</Label>
            <Input
              type="number"
              value={proposedPrice}
              onChange={(e) => onProposedPriceChange(parseInt(e.target.value))}
            />
          </div>
        </div>

        {/* Tax Settings */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="tax-enabled"
                checked={taxEnabled}
                onCheckedChange={onTaxEnabledChange}
              />
              <Label htmlFor="tax-enabled">Enable Tax Calculation</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Label htmlFor="tax-percentage" className={!taxEnabled ? "text-gray-400" : ""}>
                Tax Percentage (%)
              </Label>
              <Input
                id="tax-percentage"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={taxPercentage}
                onChange={(e) => onTaxPercentageChange(parseFloat(e.target.value))}
                className={`w-20 ${!taxEnabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""}`}
                disabled={!taxEnabled}
              />
            </div>
          </div>
        </div>

        {/* Currency Conversion Section */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-sm">Real-time Currency Conversion</h4>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Current: {currentCurrency} ({currentSymbol})
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshRates}
                disabled={isLoadingRates}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className={`h-3 w-3 ${isLoadingRates ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Rate Source and Last Updated */}
          {lastUpdated && (
            <div className="flex items-center justify-between text-xs text-gray-500 mb-4 p-2 bg-gray-50 rounded">
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>Source: </span>
                <Badge variant="outline" className="text-xs">
                  {rateSource === 'api' ? 'Live API' : rateSource === 'fallback' ? 'Cached' : 'Manual'}
                </Badge>
              </div>
            </div>
          )}

          {/* Currency Selection */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="text-xs">Convert To</Label>
              <Select value={selectedCurrency} onValueChange={handleCurrencySelection}>
                <SelectTrigger>
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

            <div>
              <Label className="text-xs">Exchange Rate</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  step="0.0001"
                  placeholder={useManualRate ? "Enter rate" : currentRate.toFixed(4)}
                  value={manualRate}
                  onChange={(e) => handleManualRateChange(e.target.value)}
                  disabled={!useManualRate}
                  className="text-sm"
                />
                <div className="flex items-center space-x-1">
                  <Switch
                    checked={useManualRate}
                    onCheckedChange={setUseManualRate}
                    className="scale-75"
                  />
                  <span className="text-xs text-gray-600">Manual</span>
                </div>
              </div>
            </div>
          </div>

          {/* Exchange Rate Display */}
          {!useManualRate && (
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm mb-4">
              <div className="flex items-center space-x-2">
                <span>1 {currentCurrency} = {currentRate.toFixed(4)} {selectedCurrency}</span>
                {rateDirection === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                {rateDirection === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
              </div>
              <Badge variant="outline" className="text-xs">
                {rateSource === 'api' ? 'Live' : rateSource === 'fallback' ? 'Cached' : 'Manual'}
              </Badge>
            </div>
          )}

          {/* Conversion Preview */}
          {showConversionPreview && selectedCurrency !== currentCurrency && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">Conversion Preview</span>
                <ArrowUpDown className="h-4 w-4 text-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Current Amount</div>
                  <div className="font-bold">{currentSymbol}{proposedPrice.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-600">Converted Amount</div>
                  <div className="font-bold text-blue-700">
                    {selectedCurrencyData?.symbol}{convertedAmount.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-600 mt-2 flex items-center justify-between">
                <span>Rate: 1 {currentCurrency} = {currentRate.toFixed(4)} {selectedCurrency}</span>
                <Badge variant="outline" className="text-xs">
                  {rateSource === 'api' ? 'Live Rate' : rateSource === 'fallback' ? 'Cached Rate' : 'Manual Rate'}
                </Badge>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button 
              onClick={applyCurrencyConversion}
              disabled={isConverting || selectedCurrency === currentCurrency || isLoadingRates}
              className="flex-1"
              size="sm"
            >
              {isConverting ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <ArrowUpDown className="h-3 w-3 mr-2" />
                  Apply Conversion
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={resetToTHB}
              size="sm"
              disabled={currentCurrency === 'THB'}
            >
              Reset to THB
            </Button>
          </div>

          {/* Information */}
          <div className="text-xs text-gray-500 space-y-1 mt-4">
            <div>• Exchange rates using secure fallback rates</div>
            <div>• Rates update automatically every 5 minutes</div>
            <div>• Manual rates override live rates when enabled</div>
            <div>• Currency symbols update throughout the interface</div>
            <div>• All financial calculations use the selected currency</div>
            <div>• Fallback to cached rates if API is unavailable</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
