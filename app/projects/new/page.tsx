"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Calculator, ArrowLeft, Save, Rocket } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface ProjectFormData {
  name: string
  client: string
  currency_code: string
  currency_symbol: string
  hours_per_day: number
  tax_enabled: boolean
  tax_percentage: number
  proposed_price: number | undefined
  working_week: string
}

const currencyOptions = [
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
]

const workingWeekOptions = [
  { value: 'MON_TO_FRI', label: 'Monday to Friday' },
  { value: 'MON_TO_SAT', label: 'Monday to Saturday' },
  { value: 'CUSTOM', label: 'Custom Schedule' },
]

export default function NewProjectPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    client: '',
    currency_code: 'THB',
    currency_symbol: '฿',
    hours_per_day: 7,
    tax_enabled: false,
    tax_percentage: 7,
    proposed_price: undefined,
    working_week: 'MON_TO_FRI'
  })

  const handleInputChange = (field: keyof ProjectFormData, value: string | number | boolean | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCurrencyChange = (currencyCode: string) => {
    const currency = currencyOptions.find(c => c.code === currencyCode)
    if (currency) {
      setFormData(prev => ({
        ...prev,
        currency_code: currency.code,
        currency_symbol: currency.symbol
      }))
    }
  }

  const handleSubmit = async (isDraft: boolean = false) => {
    try {
      setIsLoading(true)

      // Validate required fields
      if (!formData.name.trim()) {
        toast.error('Project name is required')
        return
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          status: isDraft ? 'DRAFT' : 'ACTIVE'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create project')
      }

      const project = await response.json()
      
      toast.success(isDraft ? 'Project saved as draft!' : 'Project created successfully!')
      
      // Redirect to the project workspace where timeline will be configured
      router.push(`/projects/${project.id}`)
    } catch (error) {
      console.error('Error creating project:', error)
      toast.error('Failed to create project. Please check your inputs and try again.')
    } finally {
      setIsLoading(false)
    }
  }

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
              <span className="text-slate-600">New Project</span>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Create New Project</h1>
          <p className="text-slate-600 mt-2">Set up a new project for cost estimation and team allocation</p>
        </div>

        <div className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the fundamental details about your project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., E-commerce Platform Redesign"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="client">Client Name</Label>
                  <Input
                    id="client"
                    placeholder="e.g., TechCorp Ltd."
                    value={formData.client}
                    onChange={(e) => handleInputChange('client', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Project Settings</CardTitle>
              <CardDescription>
                Configure currency, working hours, and tax settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency_code} onValueChange={handleCurrencyChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyOptions.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.symbol} {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="hoursPerDay">Hours per Day</Label>
                  <Input
                    id="hoursPerDay"
                    type="number"
                    min="1"
                    max="24"
                    value={formData.hours_per_day}
                    onChange={(e) => handleInputChange('hours_per_day', parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workingWeek">Working Week</Label>
                  <Select value={formData.working_week} onValueChange={(value) => handleInputChange('working_week', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {workingWeekOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Tax Settings */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="tax"
                    checked={formData.tax_enabled}
                    onCheckedChange={(checked) => handleInputChange('tax_enabled', checked)}
                  />
                  <Label htmlFor="tax">Enable Tax Calculation</Label>
                </div>

                {formData.tax_enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="taxPercentage">Tax Percentage (%)</Label>
                    <Input
                      id="taxPercentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.tax_percentage}
                      onChange={(e) => handleInputChange('tax_percentage', parseFloat(e.target.value))}
                      className="w-32"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pricing (Optional) */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing (Optional)</CardTitle>
              <CardDescription>
                Set an initial proposed price for ROI and margin calculations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="proposedPrice">Proposed Price ({formData.currency_symbol})</Label>
                <Input
                  id="proposedPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g., 3000000"
                  value={formData.proposed_price || ''}
                  onChange={(e) => handleInputChange('proposed_price', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
                <p className="text-xs text-slate-500">
                  You can always update this later in the project workspace
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6">
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </Link>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => handleSubmit(true)}
                disabled={isLoading || !formData.name.trim()}
              >
                <Save className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
              
              <Button
                onClick={() => handleSubmit(false)}
                disabled={isLoading || !formData.name.trim()}
              >
                <Rocket className="h-4 w-4 mr-2" />
                {isLoading ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
