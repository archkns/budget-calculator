"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { InteractiveGantt } from '@/components/ui/interactive-gantt'
import { Calculator, Plus, Trash2, FileText, TrendingUp, TrendingDown, CalendarIcon } from 'lucide-react'
import { format, addDays, isWeekend, differenceInDays } from 'date-fns'
import { toast } from 'sonner'
import { RealtimeCurrencyConverter } from "@/components/ui/realtime-currency-converter"
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface TeamMember {
  id: number
  name: string
  role: string
  level: string
  dailyRate: number
  status: 'ACTIVE' | 'INACTIVE'
  notes?: string
}

interface ProjectAssignment {
  id: number
  teamMemberId: number
  name: string
  role: string
  tier: string
  dailyRate: number
  daysAllocated: number
  bufferDays: number
  totalMandays: number
  totalPrice: number
  startDate: Date
  endDate: Date
}

interface Holiday {
  id: number
  name: string
  date: Date
  type: 'public' | 'company'
  project_id?: number
}

interface ProjectSummary {
  subtotal: number
  additionalCost: number
  cost: number
  proposedPrice: number
  roi: number
  margin: number
}

interface GanttTask {
  id: number
  name: string
  role: string
  startDate: Date
  endDate: Date
  type: 'execution' | 'buffer'
  color: string
  assigneeId: number
}

export default function ProjectWorkspace() {
  const router = useRouter()
  const [project, setProject] = useState({
    id: 1,
    name: 'E-commerce Platform Redesign',
    client: 'TechCorp Ltd.',
    currency: { code: 'THB', symbol: '฿' },
    hoursPerDay: 7,
    taxEnabled: false,
    taxPercentage: 7,
    proposedPrice: 3000000,
    startDate: new Date('2025-09-15'),
    executionDays: 45,
    guaranteePeriod: 8, // New: Guarantee period in days
    finalDays: 53 // New: Total days including guarantee period
  })

  const [assignments, setAssignments] = useState<ProjectAssignment[]>([])
  const [teamLibrary, setTeamLibrary] = useState<TeamMember[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [, setLoading] = useState(false)
  const [showAddTeamMember, setShowAddTeamMember] = useState(false)
  const [selectedTeamMember, setSelectedTeamMember] = useState<TeamMember | null>(null)

  const fetchTeamLibrary = async () => {
    try {
      const response = await fetch('/api/team')
      if (response.ok) {
        const data = await response.json()
        setTeamLibrary(data)
      }
    } catch (error) {
      console.error('Error fetching team library:', error)
      toast.error('Failed to fetch team library')
    }
  }

  const fetchHolidays = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/holidays?project_id=${project.id}`)
      if (response.ok) {
        const data = await response.json()
        setHolidays(data.map((h: { id: number; name: string; date: string; type: string; project_id?: number }) => ({
          ...h,
          date: new Date(h.date)
        })))
      }
    } catch (error) {
      console.error('Error fetching holidays:', error)
      toast.error('Failed to fetch holidays')
    } finally {
      setLoading(false)
    }
  }, [project.id])

  // Fetch team library and holidays on load
  useEffect(() => {
    fetchTeamLibrary()
    fetchHolidays()
  }, [fetchHolidays])

  const calculateWorkdays = (startDate: Date, days: number, holidays: Holiday[]): Date => {
    let currentDate = new Date(startDate)
    let workdaysAdded = 0
    
    while (workdaysAdded < days) {
      currentDate = addDays(currentDate, 1)
      
      // Skip weekends and holidays
      if (!isWeekend(currentDate) && !holidays.some(h => 
        format(h.date, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')
      )) {
        workdaysAdded++
      }
    }
    
    return currentDate
  }

  const calculateProjectDates = () => {
    const totalExecutionDays = Math.max(...assignments.map(a => a.daysAllocated), 0)
    const executionEndDate = calculateWorkdays(project.startDate, totalExecutionDays, holidays)
    const projectEndDate = calculateWorkdays(executionEndDate, project.guaranteePeriod, holidays)
    
    return {
      executionEndDate,
      projectEndDate,
      totalExecutionDays,
      guaranteePeriod: project.guaranteePeriod
    }
  }

  const projectDates = calculateProjectDates()

  const calculateSummary = (): ProjectSummary => {
    const subtotal = assignments.reduce((sum, assignment) => sum + (assignment.dailyRate * assignment.daysAllocated), 0)
    const additionalCost = 98700 // Fixed additional cost
    const cost = subtotal + additionalCost
    const proposedPrice = project.proposedPrice
    
    const roi = cost > 0 ? ((proposedPrice - cost) / cost) * 100 : 0
    const margin = proposedPrice > 0 ? ((proposedPrice - cost) / proposedPrice) * 100 : 0

    return { subtotal, additionalCost, cost, proposedPrice, roi, margin }
  }

  const summary = calculateSummary()

  const formatCurrency = (amount: number) => {
    return `${project.currency.symbol}${amount.toLocaleString()}`
  }

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(2)}%`
  }

  const handleAddTeamMember = (teamMember: TeamMember) => {
    const newAssignment: ProjectAssignment = {
      id: assignments.length + 1,
      teamMemberId: teamMember.id,
      name: teamMember.name,
      role: teamMember.role,
      tier: teamMember.level,
      dailyRate: teamMember.dailyRate,
      daysAllocated: 0,
      bufferDays: 0,
      totalMandays: 0,
      totalPrice: 0,
      startDate: project.startDate,
      endDate: project.startDate
    }
    
    setAssignments(prev => [...prev, newAssignment])
    setShowAddTeamMember(false)
    setSelectedTeamMember(null)
  }

  const updateAssignment = (id: number, field: string, value: string | number) => {
    setAssignments(prev => prev.map(assignment => {
      if (assignment.id === id) {
        const updated = { ...assignment, [field]: value }
        
        // Recalculate total mandays and total price
        if (['daysAllocated', 'bufferDays'].includes(field)) {
          updated.totalMandays = updated.daysAllocated + updated.bufferDays
          updated.totalPrice = updated.dailyRate * updated.totalMandays
          
          // Update dates
          const executionEnd = calculateWorkdays(updated.startDate, updated.daysAllocated, holidays)
          updated.endDate = calculateWorkdays(executionEnd, updated.bufferDays, holidays)
        } else if (field === 'dailyRate') {
          updated.totalPrice = updated.dailyRate * updated.totalMandays
        }
        
        return updated
      }
      return assignment
    }))
  }

  const handleDeleteAssignment = (id: number) => {
    setAssignments(prev => prev.filter(assignment => assignment.id !== id))
  }

  // Generate Gantt tasks
  const generateGanttTasks = (): GanttTask[] => {
    const tasks: GanttTask[] = []
    
    assignments.forEach(assignment => {
      // Execution phase
      const executionEnd = calculateWorkdays(assignment.startDate, assignment.daysAllocated, holidays)
      tasks.push({
        id: assignment.id * 2 - 1,
        name: assignment.name,
        role: assignment.role,
        startDate: assignment.startDate,
        endDate: executionEnd,
        type: 'execution',
        color: '#3b82f6', // Blue
        assigneeId: assignment.id
      })
      
      // Buffer phase
      if (assignment.bufferDays > 0) {
        const bufferEnd = calculateWorkdays(executionEnd, assignment.bufferDays, holidays)
        tasks.push({
          id: assignment.id * 2,
          name: assignment.name,
          role: assignment.role,
          startDate: executionEnd,
          endDate: bufferEnd,
          type: 'buffer',
          color: '#f97316', // Orange
          assigneeId: assignment.id
        })
      }
    })
    
    return tasks
  }

  const handleTaskUpdate = (taskId: number, startDate: Date, endDate: Date) => {
    const assigneeId = Math.ceil(taskId / 2)
    const isBuffer = taskId % 2 === 0
    
    setAssignments(prev => prev.map(assignment => {
      if (assignment.id === assigneeId) {
        const updated = { ...assignment }
        
        if (isBuffer) {
          // Update buffer phase
          const newBufferDays = differenceInDays(endDate, startDate) + 1
          updated.bufferDays = newBufferDays
          updated.totalMandays = updated.daysAllocated + newBufferDays
          updated.totalPrice = updated.dailyRate * updated.totalMandays
        } else {
          // Update execution phase
          updated.startDate = startDate
          const newExecutionDays = differenceInDays(endDate, startDate) + 1
          updated.daysAllocated = newExecutionDays
          updated.totalMandays = newExecutionDays + updated.bufferDays
          updated.totalPrice = updated.dailyRate * updated.totalMandays
        }
        
        return updated
      }
      return assignment
    }))
  }

  const handleTaskResize = (taskId: number, newDuration: number) => {
    const assigneeId = Math.ceil(taskId / 2)
    const isBuffer = taskId % 2 === 0
    
    setAssignments(prev => prev.map(assignment => {
      if (assignment.id === assigneeId) {
        const updated = { ...assignment }
        
        if (isBuffer) {
          updated.bufferDays = newDuration
        } else {
          updated.daysAllocated = newDuration
        }
        
        updated.totalMandays = updated.daysAllocated + updated.bufferDays
        updated.totalPrice = updated.dailyRate * updated.totalMandays
        
        return updated
      }
      return assignment
    }))
  }

  const handleSaveProject = async () => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project,
          assignments,
          holidays: holidays.filter(h => h.type === 'company')
        })
      })

      if (response.ok) {
        toast.success('Project saved successfully')
        router.push('/')
      } else {
        toast.error('Failed to save project')
      }
    } catch (error) {
      console.error('Error saving project:', error)
      toast.error('Failed to save project')
    }
  }

  const handleSaveDraft = async () => {
    try {
      const response = await fetch('/api/projects/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project,
          assignments,
          holidays: holidays.filter(h => h.type === 'company')
        })
      })

      if (response.ok) {
        toast.success('Draft saved successfully')
      } else {
        toast.error('Failed to save draft')
      }
    } catch (error) {
      console.error('Error saving draft:', error)
      toast.error('Failed to save draft')
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
              <span className="text-slate-600">{project.name}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={handleSaveDraft}>Save Draft</Button>
              <Button onClick={handleSaveProject}>Save Project</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">{project.name}</h1>
          <p className="text-slate-600 mt-2">Client: {project.client}</p>
          <p className="text-slate-500 text-sm mt-1">
            {format(project.startDate, 'MMM dd, yyyy')} - {format(projectDates.projectEndDate, 'MMM dd, yyyy')}
          </p>
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
              <p className="text-xs text-muted-foreground">
                {formatCurrency(summary.subtotal)} + {formatCurrency(summary.additionalCost)}
              </p>
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
            <TabsTrigger value="gantt">Interactive Gantt</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Enhanced Project Settings & Currency */}
              <RealtimeCurrencyConverter
                currentCurrency={project.currency.code}
                currentSymbol={project.currency.symbol}
                proposedPrice={project.proposedPrice}
                hoursPerDay={project.hoursPerDay}
                onCurrencyChange={(currency, symbol, rate) => {
                  setProject(prev => ({
                    ...prev,
                    currency: { code: currency, symbol },
                    exchangeRate: rate
                  }))
                }}
                onProposedPriceChange={(price) => {
                  setProject(prev => ({ ...prev, proposedPrice: price }))
                }}
                onHoursPerDayChange={(hours) => {
                  setProject(prev => ({ ...prev, hoursPerDay: hours }))
                }}
              />
              <Card>
                <CardHeader>
                  <CardTitle>Day Configuration</CardTitle>
                  <CardDescription>Set project timeline and dates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Project Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(project.startDate, 'PPP')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={project.startDate}
                          onSelect={(date) => date && setProject(prev => ({ ...prev, startDate: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Execution End</Label>
                      <Input
                        value={format(projectDates.executionEndDate, 'MMM dd, yyyy')}
                        disabled
                        className="bg-slate-50"
                      />
                    </div>
                    
                    <div>
                      <Label>Project End</Label>
                      <Input
                        value={format(projectDates.projectEndDate, 'MMM dd, yyyy')}
                        disabled
                        className="bg-slate-50"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="guaranteePeriod">Guarantee Period (Days)</Label>
                    <Input
                      id="guaranteePeriod"
                      type="number"
                      value={project.guaranteePeriod}
                      onChange={(e) => setProject(prev => ({ ...prev, guaranteePeriod: parseInt(e.target.value) }))}
                      min="0"
                    />
                  </div>
                  
                  <div className="text-sm text-slate-600">
                    <p>Max Execution Days: {projectDates.totalExecutionDays} workdays</p>
                    <p>Guarantee Period: {projectDates.guaranteePeriod} workdays</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Team Assignments */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Team Assignments</CardTitle>
                    <CardDescription>Add team members from team library</CardDescription>
                  </div>
                  <Dialog open={showAddTeamMember} onOpenChange={setShowAddTeamMember}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Person
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Team Member</DialogTitle>
                        <DialogDescription>
                          Select a team member from the team library
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Select
                          value={selectedTeamMember?.id.toString()}
                          onValueChange={(value) => {
                            const member = teamLibrary.find(m => m.id === parseInt(value))
                            setSelectedTeamMember(member || null)
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select team member" />
                          </SelectTrigger>
                          <SelectContent>
                            {teamLibrary
                              .filter(member => member.status === 'ACTIVE')
                              .map(member => (
                                <SelectItem key={member.id} value={member.id.toString()}>
                                  {member.name} - {member.role}
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddTeamMember(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => selectedTeamMember && handleAddTeamMember(selectedTeamMember)}
                          disabled={!selectedTeamMember}
                        >
                          Add Member
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Rate/Day</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Buffer Days</TableHead>
                      <TableHead>Total Mandays</TableHead>
                      <TableHead>Total Price</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">{assignment.name}</TableCell>
                        <TableCell>{assignment.role}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
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
                            value={assignment.bufferDays}
                            onChange={(e) => updateAssignment(assignment.id, 'bufferDays', parseFloat(e.target.value))}
                            className="w-20"
                            min="0"
                          />
                        </TableCell>
                        <TableCell className="font-mono">
                          {assignment.totalMandays}
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatCurrency(assignment.totalPrice)}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600"
                            onClick={() => handleDeleteAssignment(assignment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Holidays */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Public Holidays</CardTitle>
                    <CardDescription>Holidays during project timeline</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Holiday Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holidays
                      .filter(holiday => {
                        const holidayDate = new Date(holiday.date)
                        return holidayDate >= project.startDate && 
                               holidayDate <= projectDates.projectEndDate
                      })
                      .map((holiday) => (
                        <TableRow key={holiday.id}>
                          <TableCell className="font-medium">{holiday.name}</TableCell>
                          <TableCell>{format(holiday.date, 'MMM dd, yyyy')}</TableCell>
                          <TableCell>
                            <Badge variant={holiday.type === 'public' ? 'default' : 'secondary'}>
                              {holiday.type}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    }
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gantt" className="space-y-6">
            <InteractiveGantt
              tasks={generateGanttTasks()}
              holidays={holidays}
              projectStart={project.startDate}
              projectEnd={projectDates.projectEndDate}
              onTaskUpdate={handleTaskUpdate}
              onTaskResize={handleTaskResize}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
