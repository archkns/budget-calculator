"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Calculator, Edit, X, Check } from 'lucide-react'
import Link from 'next/link'

interface RateCard {
  id: number
  role_name: string
  tier: string
  daily_rate: number
  is_active: boolean
}

export default function RateCards() {
  const [rateCards, setRateCards] = useState<RateCard[]>([])
  const [editingCard, setEditingCard] = useState<number | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Mock data based on Omelet rates
  useEffect(() => {
    const mockData: RateCard[] = [
      { id: 1, role_name: 'Project Director', tier: 'TEAM_LEAD', daily_rate: 60000, is_active: true },
      { id: 2, role_name: 'Experience Designer (UX/UI)', tier: 'TEAM_LEAD', daily_rate: 18000, is_active: true },
      { id: 3, role_name: 'Experience Designer (UX/UI)', tier: 'SENIOR', daily_rate: 14000, is_active: true },
      { id: 4, role_name: 'Experience Designer (UX/UI)', tier: 'JUNIOR', daily_rate: 10000, is_active: true },
      { id: 5, role_name: 'Project Owner', tier: 'TEAM_LEAD', daily_rate: 20000, is_active: true },
      { id: 6, role_name: 'Project Owner', tier: 'SENIOR', daily_rate: 16000, is_active: true },
      { id: 7, role_name: 'Project Owner', tier: 'JUNIOR', daily_rate: 12000, is_active: true },
      { id: 8, role_name: 'Business Innovation Analyst (BA)', tier: 'TEAM_LEAD', daily_rate: 20000, is_active: true },
      { id: 9, role_name: 'Business Innovation Analyst (BA)', tier: 'SENIOR', daily_rate: 16000, is_active: true },
      { id: 10, role_name: 'Business Innovation Analyst (BA)', tier: 'JUNIOR', daily_rate: 12000, is_active: true },
      { id: 11, role_name: 'System Analyst', tier: 'TEAM_LEAD', daily_rate: 18000, is_active: true },
      { id: 12, role_name: 'System Analyst', tier: 'SENIOR', daily_rate: 14000, is_active: true },
      { id: 13, role_name: 'System Analyst', tier: 'JUNIOR', daily_rate: 12000, is_active: true },
      { id: 14, role_name: 'Frontend Dev', tier: 'TEAM_LEAD', daily_rate: 18000, is_active: true },
      { id: 15, role_name: 'Frontend Dev', tier: 'SENIOR', daily_rate: 14000, is_active: true },
      { id: 16, role_name: 'Frontend Dev', tier: 'JUNIOR', daily_rate: 12000, is_active: true },
      { id: 17, role_name: 'Backend Dev', tier: 'TEAM_LEAD', daily_rate: 20000, is_active: true },
      { id: 18, role_name: 'Backend Dev', tier: 'SENIOR', daily_rate: 14000, is_active: true },
      { id: 19, role_name: 'Backend Dev', tier: 'JUNIOR', daily_rate: 12000, is_active: true },
      { id: 20, role_name: 'LINE Dev', tier: 'TEAM_LEAD', daily_rate: 22000, is_active: true },
      { id: 21, role_name: 'LINE Dev', tier: 'SENIOR', daily_rate: 16000, is_active: true },
      { id: 22, role_name: 'LINE Dev', tier: 'JUNIOR', daily_rate: 12000, is_active: true },
      { id: 23, role_name: 'DevOps', tier: 'TEAM_LEAD', daily_rate: 25000, is_active: true },
      { id: 24, role_name: 'DevOps', tier: 'SENIOR', daily_rate: 18000, is_active: true },
      { id: 25, role_name: 'QA Tester', tier: 'TEAM_LEAD', daily_rate: 16000, is_active: true },
      { id: 26, role_name: 'QA Tester', tier: 'SENIOR', daily_rate: 13000, is_active: true },
      { id: 27, role_name: 'QA Tester', tier: 'JUNIOR', daily_rate: 10000, is_active: true },
      { id: 28, role_name: 'Operation', tier: 'TEAM_LEAD', daily_rate: 12000, is_active: true },
      { id: 29, role_name: 'Operation', tier: 'SENIOR', daily_rate: 10500, is_active: true },
      { id: 30, role_name: 'Operation', tier: 'JUNIOR', daily_rate: 9000, is_active: true },
    ]
    
    setRateCards(mockData)
    setLoading(false)
  }, [])

  const formatCurrency = (amount: number) => {
    return `฿${amount.toLocaleString()}`
  }

  const formatTier = (tier: string) => {
    return tier.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const startEditing = (cardId: number, currentRate: number) => {
    setEditingCard(cardId)
    setEditValue(currentRate.toString())
  }

  const saveEdit = (cardId: number) => {
    const newRate = parseFloat(editValue)
    if (!isNaN(newRate) && newRate > 0) {
      setRateCards(prev => prev.map(card => 
        card.id === cardId ? { ...card, daily_rate: newRate } : card
      ))
    }
    setEditingCard(null)
    setEditValue('')
  }

  const cancelEdit = () => {
    setEditingCard(null)
    setEditValue('')
  }

  const toggleActive = (cardId: number) => {
    setRateCards(prev => prev.map(card => 
      card.id === cardId ? { ...card, is_active: !card.is_active } : card
    ))
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
            <p className="text-slate-600 mt-2">Manage daily rates for different roles and tiers</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline">Import Rates</Button>
            <Button variant="outline">Export Rates</Button>
            <Button>Add New Role</Button>
          </div>
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
                      {cards.filter(c => c.is_active).length} active tiers
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Daily rates for different experience levels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['TEAM_LEAD', 'SENIOR', 'JUNIOR'].map(tier => {
                      const card = cards.find(c => c.tier === tier)
                      
                      if (!card) {
                        return (
                          <div key={tier} className="p-4 border-2 border-dashed border-slate-200 rounded-lg text-center">
                            <p className="text-slate-500 text-sm mb-2">{formatTier(tier)}</p>
                            <p className="text-slate-400 text-xs">Not Available</p>
                            <Button variant="ghost" size="sm" className="mt-2 text-xs">
                              Add Rate
                            </Button>
                          </div>
                        )
                      }

                      return (
                        <div key={card.id} className={`p-4 border rounded-lg ${card.is_active ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-slate-900">{formatTier(card.tier)}</h4>
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

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
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
              <CardTitle className="text-sm font-medium">Avg Team Lead Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  Math.round(
                    rateCards
                      .filter(c => c.tier === 'TEAM_LEAD' && c.is_active)
                      .reduce((sum, c) => sum + c.daily_rate, 0) /
                    rateCards.filter(c => c.tier === 'TEAM_LEAD' && c.is_active).length
                  )
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Highest Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(Math.max(...rateCards.filter(c => c.is_active).map(c => c.daily_rate)))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
