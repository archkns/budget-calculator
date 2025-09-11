"use client"

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { RefreshCw, TrendingUp, TrendingDown, ArrowUpDown, Wifi, WifiOff, Clock, Database } from 'lucide-react'
import { toast } from 'sonner'

interface Currency {
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

interface DatabaseCurrencyConverterProps {
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

export const DatabaseCurrencyConverter = memo(function DatabaseCurrencyConverter({
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
}: DatabaseCurrencyConverterProps) {
  const [selectedCurrency, setSelectedCurrency] = useState(currentCurrency)
  const [manualRate, setManualRate] = useState<string>('')
  const [useManualRate, setUseManualRate] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [showConversionPreview, setShowConversionPreview] = useState(false)
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [isLoadingRates, setIsLoadingRates] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'loading'>('loading')
  const [rateSource, setRateSource] = useState<'database' | 'manual'>('database')

  // Fetch currencies from database
  const fetchCurrencies = useCallback(async () => {
    setIsLoadingRates(true)
    setApiStatus('loading')
    
    try {
      const response = await fetch('/api/currencies?active=true')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.currencies) {
        setCurrencies(data.currencies)
        setLastUpdated(new Date())
        setApiStatus('online')
        setRateSource('database')
        toast.success('Currency data loaded from database')
      } else {
        throw new Error('Invalid API response')
      }
    } catch (error) {
      console.warn('Failed to fetch currencies from database:', error)
      setApiStatus('offline')
      toast.warning('Failed to load currency data from database')
    } finally {
      setIsLoadingRates(false)
    }
  }, [])

  // Sync with external API
  const syncWithExternalAPI = useCallback(async () => {
    setIsLoadingRates(true)
    setApiStatus('loading')
    
    try {
      const response = await fetch('/api/currencies/sync', {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.currencies) {
        setCurrencies(data.currencies)
        setLastUpdated(new Date())
        setApiStatus('online')
        setRateSource('database')
        toast.success('Exchange rates synced with external API')
      } else {
        throw new Error('Invalid API response')
      }
    } catch (error) {
      console.warn('Failed to sync with external API:', error)
      setApiStatus('offline')
      toast.warning('Failed to sync with external API')
    } finally {
      setIsLoadingRates(false)
    }
  }, [])

  // Sync internal state with props
  useEffect(() => {
    setSelectedCurrency(currentCurrency)
    setShowConversionPreview(false)
  }, [currentCurrency])

  // Initialize currencies on component mount
  useEffect(() => {
    fetchCurrencies()
  }, [fetchCurrencies])

  // Get current exchange rate (memoized)
  const getCurrentRate = useCallback((): number => {
    if (useManualRate && manualRate) {
      setRateSource('manual')
      return parseFloat(manualRate)
    }
    
    // If current currency and selected currency are the same, rate should be 1
    if (currentCurrency === selectedCurrency) {
      return 1
    }
    
    // Find currencies in the database
    const currentCurrencyData = currencies.find(c => c.code === currentCurrency)
    const selectedCurrencyData = currencies.find(c => c.code === selectedCurrency)
    
    if (!currentCurrencyData || !selectedCurrencyData) {
      return 1
    }
    
    // Calculate exchange rate between currencies
    // Both rates are relative to base currency, so we can calculate directly
    const rate = currentCurrencyData.exchange_rate / selectedCurrencyData.exchange_rate
    return rate
  }, [useManualRate, manualRate, currencies, selectedCurrency, currentCurrency])

  // Calculate converted amount (memoized)
  const convertedAmount = useMemo(() => {
    return Math.round(proposedPrice * getCurrentRate())
  }, [proposedPrice, getCurrentRate])
  
  const selectedCurrencyData = useMemo(() => {
    return currencies.find(c => c.code === selectedCurrency)
  }, [currencies, selectedCurrency])

  // Handle currency selection change
  const handleCurrencySelection = (newCurrency: string) => {
    setSelectedCurrency(newCurrency)
    setShowConversionPreview(newCurrency !== currentCurrency)
  }

  // Apply currency conversion
  const applyCurrencyConversion = async () => {
    if (selectedCurrency === currentCurrency) return

    setIsConverting(true)
    
    const rate = getCurrentRate()
    const newCurrencyData = currencies.find(c => c.code === selectedCurrency)
    
    setTimeout(() => {
      if (newCurrencyData) {
        onCurrencyChange(selectedCurrency, newCurrencyData.symbol, rate)
        onProposedPriceChange(convertedAmount)
        setShowConversionPreview(false)
        
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

  const currentRate = useMemo(() => getCurrentRate(), [getCurrentRate])
  const rateDirection = useMemo(() => {
    return currentRate > 1 ? 'up' : currentRate < 1 ? 'down' : 'neutral'
  }, [currentRate])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Project Settings & Currency (Database)
          </div>
          <div className="flex items-center space-x-2">
            {apiStatus === 'online' && <Wifi className="h-4 w-4 text-green-500" />}
            {apiStatus === 'offline' && <WifiOff className="h-4 w-4 text-orange-500" />}
            {apiStatus === 'loading' && <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />}
            <Badge variant={apiStatus === 'online' ? 'default' : 'secondary'} className="text-xs">
              {apiStatus === 'online' ? 'Database Connected' : apiStatus === 'offline' ? 'Database Offline' : 'Loading...'}
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
              type="text"
              value={proposedPrice ? proposedPrice.toLocaleString() : ''}
              onChange={(e) => {
                const numericValue = e.target.value.replace(/[^\d]/g, '')
                const parsedValue = numericValue ? parseInt(numericValue) : 0
                onProposedPriceChange(parsedValue)
              }}
              placeholder="Enter amount"
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
            <h4 className="font-medium text-sm">Database Currency Conversion</h4>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Current: {currentCurrency} ({currentSymbol})
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={syncWithExternalAPI}
                disabled={isLoadingRates}
                className="h-6 w-6 p-0"
                title="Sync with external API"
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
                  {rateSource === 'database' ? 'Database' : 'Manual'}
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
                  {currencies.map(currency => (
                    <SelectItem key={currency.id} value={currency.code}>
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
                {rateSource === 'database' ? 'Database' : 'Manual'}
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
                  {rateSource === 'database' ? 'Database Rate' : 'Manual Rate'}
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
            <div>• Currency data loaded from database</div>
            <div>• Click sync button to update exchange rates from external API</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
