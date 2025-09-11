"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RefreshCw, Plus, Edit, Trash2, Database, Globe, Star } from 'lucide-react'
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

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    symbol: '',
    decimal_places: 2,
    is_base_currency: false,
    is_active: true,
    exchange_rate: 1.0
  })

  // Fetch currencies from database
  const fetchCurrencies = async () => {
    try {
      const response = await fetch('/api/currencies')
      const data = await response.json()
      
      if (data.success) {
        setCurrencies(data.currencies)
      } else {
        toast.error('Failed to fetch currencies')
      }
    } catch (error) {
      console.error('Error fetching currencies:', error)
      toast.error('Failed to fetch currencies')
    } finally {
      setIsLoading(false)
    }
  }

  // Sync with external API
  const syncWithExternalAPI = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch('/api/currencies/sync', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        setCurrencies(data.currencies)
        toast.success('Exchange rates synced successfully')
      } else {
        toast.error('Failed to sync exchange rates')
      }
    } catch (error) {
      console.error('Error syncing currencies:', error)
      toast.error('Failed to sync exchange rates')
    } finally {
      setIsSyncing(false)
    }
  }

  // Create or update currency
  const saveCurrency = async () => {
    try {
      const url = editingCurrency 
        ? `/api/currencies/${editingCurrency.id}`
        : '/api/currencies'
      
      const method = editingCurrency ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(editingCurrency ? 'Currency updated successfully' : 'Currency created successfully')
        setIsDialogOpen(false)
        setEditingCurrency(null)
        resetForm()
        fetchCurrencies()
      } else {
        toast.error(data.message || 'Failed to save currency')
      }
    } catch (error) {
      console.error('Error saving currency:', error)
      toast.error('Failed to save currency')
    }
  }

  // Delete currency
  const deleteCurrency = async (id: number) => {
    if (!confirm('Are you sure you want to delete this currency?')) {
      return
    }

    try {
      const response = await fetch(`/api/currencies/${id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Currency deleted successfully')
        fetchCurrencies()
      } else {
        toast.error('Failed to delete currency')
      }
    } catch (error) {
      console.error('Error deleting currency:', error)
      toast.error('Failed to delete currency')
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      symbol: '',
      decimal_places: 2,
      is_base_currency: false,
      is_active: true,
      exchange_rate: 1.0
    })
  }

  // Open edit dialog
  const openEditDialog = (currency: Currency) => {
    setEditingCurrency(currency)
    setFormData({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      decimal_places: currency.decimal_places,
      is_base_currency: currency.is_base_currency,
      is_active: currency.is_active,
      exchange_rate: currency.exchange_rate
    })
    setIsDialogOpen(true)
  }

  // Open create dialog
  const openCreateDialog = () => {
    setEditingCurrency(null)
    resetForm()
    setIsDialogOpen(true)
  }

  // Close dialog
  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingCurrency(null)
    resetForm()
  }

  useEffect(() => {
    fetchCurrencies()
  }, [])

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading currencies...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Currency Management</h1>
          <p className="text-gray-600">Manage currencies and exchange rates</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={syncWithExternalAPI}
            disabled={isSyncing}
            variant="outline"
          >
            {isSyncing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Globe className="h-4 w-4 mr-2" />
            )}
            Sync Exchange Rates
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Currency
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingCurrency ? 'Edit Currency' : 'Add New Currency'}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="code" className="text-right">
                    Code
                  </Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    className="col-span-3"
                    placeholder="USD"
                    disabled={!!editingCurrency}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="col-span-3"
                    placeholder="US Dollar"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="symbol" className="text-right">
                    Symbol
                  </Label>
                  <Input
                    id="symbol"
                    value={formData.symbol}
                    onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                    className="col-span-3"
                    placeholder="$"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="decimal_places" className="text-right">
                    Decimals
                  </Label>
                  <Input
                    id="decimal_places"
                    type="number"
                    min="0"
                    max="4"
                    value={formData.decimal_places}
                    onChange={(e) => setFormData({...formData, decimal_places: parseInt(e.target.value)})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="exchange_rate" className="text-right">
                    Rate
                  </Label>
                  <Input
                    id="exchange_rate"
                    type="number"
                    step="0.00000001"
                    value={formData.exchange_rate}
                    onChange={(e) => setFormData({...formData, exchange_rate: parseFloat(e.target.value)})}
                    className="col-span-3"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_base_currency"
                      checked={formData.is_base_currency}
                      onCheckedChange={(checked) => setFormData({...formData, is_base_currency: checked})}
                    />
                    <Label htmlFor="is_base_currency">Base Currency</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button onClick={saveCurrency}>
                  {editingCurrency ? 'Update' : 'Create'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Currencies ({currencies.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Exchange Rate</TableHead>
                <TableHead>Decimals</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currencies.map((currency) => (
                <TableRow key={currency.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <span>{currency.code}</span>
                      {currency.is_base_currency && (
                        <Star className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{currency.name}</TableCell>
                  <TableCell>{currency.symbol}</TableCell>
                  <TableCell>{currency.exchange_rate.toFixed(8)}</TableCell>
                  <TableCell>{currency.decimal_places}</TableCell>
                  <TableCell>
                    <Badge variant={currency.is_active ? 'default' : 'secondary'}>
                      {currency.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(currency.last_updated).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(currency)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCurrency(currency.id)}
                        disabled={currency.is_base_currency}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
