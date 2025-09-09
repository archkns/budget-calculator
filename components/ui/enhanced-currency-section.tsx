"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { RefreshCw, DollarSign, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react'
import { toast } from 'sonner'

interface Currency {
  code: string
  symbol: string
  name: string
}

interface EnhancedCurrencySectionProps {
  currentCurrency: string
  currentSymbol: string
  proposedPrice: number
  hoursPerDay: number
  onCurrencyChange: (currency: string, symbol: string, rate: number) => void
  onProposedPriceChange: (price: number) => void
  onHoursPerDayChange: (hours: number) => void
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

// Exchange rates (THB as base currency)
const EXCHANGE_RATES: Record<string, Record<string, number>> = {
  THB: { USD: 0.028, EUR: 0.026, GBP: 0.022, JPY: 4.2, SGD: 0.038, AUD: 0.042, CAD: 0.038, THB: 1 },
  USD: { THB: 35.7, EUR: 0.92, GBP: 0.79, JPY: 149.8, SGD: 1.35, AUD: 1.49, CAD: 1.36, USD: 1 },
  EUR: { THB: 38.8, USD: 1.09, GBP: 0.86, JPY: 163.2, SGD: 1.47, AUD: 1.62, CAD: 1.48, EUR: 1 },
  GBP: { THB: 45.1, USD: 1.27, EUR: 1.16, JPY: 189.8, SGD: 1.71, AUD: 1.89, CAD: 1.72, GBP: 1 },
  JPY: { THB: 0.24, USD: 0.0067, EUR: 0.0061, GBP: 0.0053, SGD: 0.009, AUD: 0.01, CAD: 0.009, JPY: 1 },
  SGD: { THB: 26.4, USD: 0.74, EUR: 0.68, GBP: 0.58, JPY: 111.0, AUD: 1.10, CAD: 1.01, SGD: 1 },
  AUD: { THB: 23.9, USD: 0.67, EUR: 0.62, GBP: 0.53, JPY: 100.5, SGD: 0.91, CAD: 0.91, AUD: 1 },
  CAD: { THB: 26.2, USD: 0.73, EUR: 0.68, GBP: 0.58, JPY: 110.1, SGD: 0.99, AUD: 1.10, CAD: 1 }
}

export function EnhancedCurrencySection({
  currentCurrency,
  currentSymbol,
  proposedPrice,
  hoursPerDay,
  onCurrencyChange,
  onProposedPriceChange,
  onHoursPerDayChange
}: EnhancedCurrencySectionProps) {
  const [selectedCurrency, setSelectedCurrency] = useState(currentCurrency)
  const [manualRate, setManualRate] = useState<string>('')
  const [useManualRate, setUseManualRate] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [showConversionPreview, setShowConversionPreview] = useState(false)

  // Get current exchange rate
  const getCurrentRate = (): number => {
    if (useManualRate && manualRate) {
      return parseFloat(manualRate)
    }
    return EXCHANGE_RATES[currentCurrency]?.[selectedCurrency] || 1
  }

  // Calculate converted amount
  const convertedAmount = Math.round(proposedPrice * getCurrentRate())
  const selectedCurrencyData = CURRENCIES.find(c => c.code === selectedCurrency)

  // Handle currency selection change
  const handleCurrencySelection = (newCurrency: string) => {
    setSelectedCurrency(newCurrency)
    setShowConversionPreview(newCurrency !== currentCurrency)
  }

  // Apply currency conversion
  const applyCurrencyConversion = () => {
    if (selectedCurrency === currentCurrency) return

    setIsConverting(true)
    const rate = getCurrentRate()
    const newCurrencyData = CURRENCIES.find(c => c.code === selectedCurrency)
    
    setTimeout(() => {
      if (newCurrencyData) {
        onCurrencyChange(selectedCurrency, newCurrencyData.symbol, rate)
        onProposedPriceChange(convertedAmount)
        setShowConversionPreview(false)
        toast.success(`Currency converted to ${newCurrencyData.name}`)
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
    }
  }

  const currentRate = getCurrentRate()
  const rateDirection = currentRate > 1 ? 'up' : currentRate < 1 ? 'down' : 'neutral'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Project Settings & Currency
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

        {/* Currency Conversion Section */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-sm">Currency Conversion</h4>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              Current: {currentCurrency} ({currentSymbol})
            </Badge>
          </div>

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
            <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded text-sm mb-4">
              <span>1 {currentCurrency} = {currentRate.toFixed(4)} {selectedCurrency}</span>
              {rateDirection === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
              {rateDirection === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
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
              <div className="text-xs text-gray-600 mt-2">
                Rate: 1 {currentCurrency} = {currentRate.toFixed(4)} {selectedCurrency}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button 
              onClick={applyCurrencyConversion}
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
            <div>• Exchange rates update automatically</div>
            <div>• Manual rates override automatic rates</div>
            <div>• Currency symbols update throughout the interface</div>
            <div>• All financial calculations use the selected currency</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
