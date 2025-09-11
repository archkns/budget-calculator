"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Calculator, Edit, X, Check } from 'lucide-react'
import Link from 'next/link'
import { formatLevel } from '@/lib/utils'

interface RateCard {
  id: number
  role_name: string
  level_name: string
  level_display_name: string
  daily_rate: number
  is_active: boolean
}

export default function RateCards() {
  const [rateCards, setRateCards] = useState<RateCard[]>([])
  const [editingCard, setEditingCard] = useState<number | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Fetch rate cards from database
  useEffect(() => {
    const fetchRateCards = async () => {
      try {
        const response = await fetch('/api/rate-cards')
        if (response.ok) {
          const data = await response.json()
          // Transform the data to match the expected format
          const transformedData = data.map((card: { id: number; roles?: { name: string }; levels?: { name: string; display_name: string }; daily_rate: number; is_active: boolean }) => ({
            id: card.id,
            role_name: card.roles?.name || 'Unknown Role',
            level_name: card.levels?.name || 'Unknown Level',
            level_display_name: card.levels?.display_name || 'Unknown Level',
            daily_rate: card.daily_rate,
            is_active: card.is_active
          }))
          setRateCards(transformedData)
        } else {
          console.error('Failed to fetch rate cards:', response.statusText)
        }
      } catch (error) {
        console.error('Error fetching rate cards:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRateCards()
  }, [])

  const formatCurrency = (amount: number) => {
    return `฿${amount.toLocaleString()}`
  }


  const startEditing = (cardId: number, currentRate: number) => {
    setEditingCard(cardId)
    setEditValue(currentRate.toString())
  }

  const saveEdit = async (cardId: number) => {
    const newRate = parseFloat(editValue)
    if (!isNaN(newRate) && newRate > 0) {
      try {
        const response = await fetch(`/api/rate-cards/${cardId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            daily_rate: newRate
          })
        })

        if (response.ok) {
          setRateCards(prev => prev.map(card => 
            card.id === cardId ? { ...card, daily_rate: newRate } : card
          ))
        } else {
          console.error('Failed to update rate card:', response.statusText)
          alert('Failed to update rate card. Please try again.')
        }
      } catch (error) {
        console.error('Error updating rate card:', error)
        alert('Error updating rate card. Please try again.')
      }
    }
    setEditingCard(null)
    setEditValue('')
  }

  const cancelEdit = () => {
    setEditingCard(null)
    setEditValue('')
  }

  const toggleActive = async (cardId: number) => {
    const card = rateCards.find(c => c.id === cardId)
    if (!card) return

    try {
      const response = await fetch(`/api/rate-cards/${cardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !card.is_active
        })
      })

      if (response.ok) {
        setRateCards(prev => prev.map(c => 
          c.id === cardId ? { ...c, is_active: !c.is_active } : c
        ))
      } else {
        console.error('Failed to toggle rate card status:', response.statusText)
        alert('Failed to update rate card status. Please try again.')
      }
    } catch (error) {
      console.error('Error toggling rate card status:', error)
      alert('Error updating rate card status. Please try again.')
    }
  }

  // Group rate cards by role
  const groupedRates = rateCards.reduce((acc, card) => {
    if (!acc[card.role_name]) {
      acc[card.role_name] = []
    }
    acc[card.role_name].push(card)
    return acc
  }, {} as Record<string, RateCard[]>)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <Calculator className="h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold text-slate-900">Budget Calculator</span>
              </Link>
              <span className="text-slate-400">/</span>
              <span className="text-slate-600">Rate Cards</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Rate Cards</h1>
            <p className="text-slate-600 mt-2">Manage daily rates for different roles and levels</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline">Import Rates</Button>
            <Button variant="outline">Export Rates</Button>
            <Button>Add New Role</Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(groupedRates).length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Rate Cards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rateCards.filter(c => c.is_active).length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(() => {
                  const activeRates = rateCards.filter(c => c.is_active)
                  if (activeRates.length === 0) return formatCurrency(0)
                  const average = activeRates.reduce((sum, c) => sum + c.daily_rate, 0) / activeRates.length
                  return formatCurrency(Math.round(average))
                })()}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Highest Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(() => {
                  const activeRates = rateCards.filter(c => c.is_active).map(c => c.daily_rate)
                  if (activeRates.length === 0) return formatCurrency(0)
                  return formatCurrency(Math.max(...activeRates))
                })()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rate Cards Grid */}
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedRates).map(([roleName, cards]) => (
              <Card key={roleName}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{roleName}</span>
                    <Badge variant="outline">
                      {cards.filter(c => c.is_active).length} active levels
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Daily rates for different experience levels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {cards.map(card => {
                      return (
                        <div key={card.id} className={`p-4 border rounded-lg ${card.is_active ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-slate-900">{card.level_display_name}</h4>
                            <Badge variant={card.is_active ? 'default' : 'secondary'}>
                              {card.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          
                          <div className="mb-3">
                            {editingCard === card.id ? (
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="number"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="text-lg font-bold"
                                  autoFocus
                                />
                                <Button size="sm" onClick={() => saveEdit(card.id)}>
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={cancelEdit}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold text-slate-900">
                                  {formatCurrency(card.daily_rate)}
                                </span>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => startEditing(card.id, card.daily_rate)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">per day</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleActive(card.id)}
                              className={card.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                            >
                              {card.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
