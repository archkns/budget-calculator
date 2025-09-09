"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calculator, Plus, Edit, Trash2, FileText, TrendingUp, TrendingDown } from 'lucide-react'
import Link from 'next/link'

interface ProjectAssignment {
  id: number
  name: string
  role: string
  tier: string
  dailyRate: number
  daysAllocated: number
  utilization: number
  multiplier: number
  isBillable: boolean
  rowCost: number
}

interface ProjectSummary {
  subtotal: number
  tax: number
  cost: number
  proposedPrice: number
  roi: number
  margin: number
}

export default function ProjectWorkspace() {
  const [project, setProject] = useState({
    id: 1,
    name: 'E-commerce Platform Redesign',
    client: 'TechCorp Ltd.',
    currency: { code: 'THB', symbol: '฿' },
    hoursPerDay: 7,
    taxEnabled: false,
    taxPercentage: 7,
    proposedPrice: 3000000,
    executionDays: 45,
    bufferDays: 5,
    finalDays: 50
  })

  const [assignments, setAssignments] = useState<ProjectAssignment[]>([
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Experience Designer (UX/UI)',
      tier: 'Team Lead',
      dailyRate: 18000,
      daysAllocated: 20,
      utilization: 100,
      multiplier: 1.0,
      isBillable: true,
      rowCost: 360000
    },
    {
      id: 2,
      name: 'John Smith',
      role: 'Frontend Dev',
      tier: 'Senior',
      dailyRate: 14000,
      daysAllocated: 35,
      utilization: 100,
      multiplier: 1.0,
      isBillable: true,
      rowCost: 490000
    },
    {
      id: 3,
      name: 'Mike Chen',
      role: 'Backend Dev',
      tier: 'Senior',
      dailyRate: 14000,
      daysAllocated: 40,
      utilization: 100,
      multiplier: 1.0,
      isBillable: true,
      rowCost: 560000
    }
  ])

  const calculateSummary = (): ProjectSummary => {
    const subtotal = assignments.reduce((sum, assignment) => sum + assignment.rowCost, 0)
    const tax = project.taxEnabled ? subtotal * (project.taxPercentage / 100) : 0
    const cost = subtotal + tax
    const proposedPrice = project.proposedPrice
    
    const roi = cost > 0 ? ((proposedPrice - cost) / cost) * 100 : 0
    const margin = proposedPrice > 0 ? ((proposedPrice - cost) / proposedPrice) * 100 : 0

    return { subtotal, tax, cost, proposedPrice, roi, margin }
  }

  const summary = calculateSummary()

  const formatCurrency = (amount: number) => {
    return `${project.currency.symbol}${amount.toLocaleString()}`
  }

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(2)}%`
  }

  const updateAssignment = (id: number, field: string, value: string | number | boolean) => {
    setAssignments(prev => prev.map(assignment => {
      if (assignment.id === id) {
        const updated = { ...assignment, [field]: value }
        // Recalculate row cost
        if (['dailyRate', 'daysAllocated', 'utilization', 'multiplier', 'isBillable'].includes(field)) {
          updated.rowCost = updated.isBillable 
            ? updated.dailyRate * updated.daysAllocated * (updated.utilization / 100) * updated.multiplier
            : 0
        }
        return updated
      }
      return assignment
    }))
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
              <span className="text-slate-600">{project.name}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline">Save Template</Button>
              <Button variant="outline">Export</Button>
              <Button>Save Project</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">{project.name}</h1>
          <p className="text-slate-600 mt-2">Client: {project.client}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subtotal</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.subtotal)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.cost)}</div>
              {project.taxEnabled && (
                <p className="text-xs text-muted-foreground">
                  +{formatCurrency(summary.tax)} tax ({project.taxPercentage}%)
                </p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ROI</CardTitle>
              {summary.roi >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(summary.roi)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Margin</CardTitle>
              {summary.margin >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(summary.margin)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="people">People</TabsTrigger>
            <TabsTrigger value="holidays">Holidays</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Project Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Settings</CardTitle>
                  <CardDescription>Configure project parameters and pricing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select value={project.currency.code}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="THB">THB (฿)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="hoursPerDay">Hours/Day</Label>
                      <Input
                        id="hoursPerDay"
                        type="number"
                        value={project.hoursPerDay}
                        onChange={(e) => setProject(prev => ({ ...prev, hoursPerDay: parseInt(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="tax"
                      checked={project.taxEnabled}
                      onCheckedChange={(checked) => setProject(prev => ({ ...prev, taxEnabled: checked }))}
                    />
                    <Label htmlFor="tax">Enable Tax</Label>
                  </div>

                  {project.taxEnabled && (
                    <div>
                      <Label htmlFor="taxPercentage">Tax Percentage (%)</Label>
                      <Input
                        id="taxPercentage"
                        type="number"
                        value={project.taxPercentage}
                        onChange={(e) => setProject(prev => ({ ...prev, taxPercentage: parseFloat(e.target.value) }))}
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="proposedPrice">Proposed Price</Label>
                    <Input
                      id="proposedPrice"
                      type="number"
                      value={project.proposedPrice}
                      onChange={(e) => setProject(prev => ({ ...prev, proposedPrice: parseFloat(e.target.value) }))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Day Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Day Configuration</CardTitle>
                  <CardDescription>Set execution and buffer days</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="executionDays">Execution Days</Label>
                      <Input
                        id="executionDays"
                        type="number"
                        value={project.executionDays}
                        onChange={(e) => setProject(prev => ({ 
                          ...prev, 
                          executionDays: parseInt(e.target.value),
                          finalDays: parseInt(e.target.value) + prev.bufferDays
                        }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="bufferDays">Buffer Days</Label>
                      <Input
                        id="bufferDays"
                        type="number"
                        value={project.bufferDays}
                        onChange={(e) => setProject(prev => ({ 
                          ...prev, 
                          bufferDays: parseInt(e.target.value),
                          finalDays: prev.executionDays + parseInt(e.target.value)
                        }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="finalDays">Final Days</Label>
                      <Input
                        id="finalDays"
                        type="number"
                        value={project.finalDays}
                        onChange={(e) => {
                          const finalDays = parseInt(e.target.value)
                          const bufferDays = Math.max(0, finalDays - project.executionDays)
                          setProject(prev => ({ 
                            ...prev, 
                            finalDays,
                            bufferDays
                          }))
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="people" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Team Assignments</CardTitle>
                    <CardDescription>Manage team member allocations and rates</CardDescription>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Person
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Rate/Day</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Utilization</TableHead>
                      <TableHead>Multiplier</TableHead>
                      <TableHead>Billable</TableHead>
                      <TableHead>Row Cost</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">{assignment.name}</TableCell>
                        <TableCell>
                          {assignment.role}
                          <Badge variant="outline" className="ml-2 text-xs">
                            {assignment.tier}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={assignment.dailyRate}
                            onChange={(e) => updateAssignment(assignment.id, 'dailyRate', parseFloat(e.target.value))}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={assignment.daysAllocated}
                            onChange={(e) => updateAssignment(assignment.id, 'daysAllocated', parseFloat(e.target.value))}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={assignment.utilization}
                            onChange={(e) => updateAssignment(assignment.id, 'utilization', parseFloat(e.target.value))}
                            className="w-20"
                            min="0"
                            max="100"
                          />
                          <span className="text-xs text-muted-foreground ml-1">%</span>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={assignment.multiplier}
                            onChange={(e) => updateAssignment(assignment.id, 'multiplier', parseFloat(e.target.value))}
                            className="w-20"
                            step="0.1"
                          />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={assignment.isBillable}
                            onCheckedChange={(checked) => updateAssignment(assignment.id, 'isBillable', checked)}
                          />
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatCurrency(assignment.rowCost)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600">
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
          </TabsContent>

          <TabsContent value="holidays">
            <Card>
              <CardHeader>
                <CardTitle>Public Holidays</CardTitle>
                <CardDescription>Manage holidays and their treatment in calculations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-slate-500">
                  Holiday management feature coming soon...
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export">
            <Card>
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
                <CardDescription>Export project data in various formats</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col">
                    <FileText className="h-6 w-6 mb-2" />
                    Export CSV
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col">
                    <FileText className="h-6 w-6 mb-2" />
                    Export XLSX
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col">
                    <FileText className="h-6 w-6 mb-2" />
                    Export PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
