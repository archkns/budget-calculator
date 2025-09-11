"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
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
import { Calculator, Plus, Trash2, FileText, TrendingUp, TrendingDown, CalendarIcon, Edit, Check, AlertTriangle, Copy } from 'lucide-react'
import { format, addDays, isWeekend, differenceInDays } from 'date-fns'
import { toast } from 'sonner'
import { RealtimeCurrencyConverter } from "@/components/ui/realtime-currency-converter"
import { InlineEdit } from '@/components/ui/inline-edit'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatLevel } from '@/lib/utils'
import { getCurrencySymbol } from '@/lib/currencies'

interface TeamMember {
  id: number
  name: string
  role_id?: number | null
  level_id?: number | null
  default_rate_per_day: number
  status: 'ACTIVE' | 'INACTIVE'
  notes?: string
  roles?: {
    id: number
    name: string
  }
  levels?: {
    id: number
    name: string
    display_name: string
  }
}

interface ProjectAssignment {
  id: number
  project_id: number
  team_member_id?: number
  role_id?: number
  level_id?: number
  daily_rate: number
  days_allocated: number
  buffer_days: number
  total_mandays: number
  allocated_budget: number
  start_date?: string
  end_date?: string
  created_at: string
  updated_at: string
  // Team member data from join
  team_members?: {
    id: number
    name: string
    default_rate_per_day: number
    roles?: {
      id: number
      name: string
    }
    levels?: {
      id: number
      name: string
      display_name: string
    }
  }
  // Direct role and level data
  roles?: {
    id: number
    name: string
  }
  levels?: {
    id: number
    name: string
    display_name: string
  }
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
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  
  const [project, setProject] = useState({
    id: parseInt(projectId) || 1,
    name: '',
    client: '',
    currency: { code: 'THB', symbol: '฿' },
    exchangeRate: 1,
    hoursPerDay: 7,
    taxEnabled: false,
    taxPercentage: 7,
    proposedPrice: 0,
    totalPrice: 0,
    startDate: new Date(),
    executionDays: 0,
    guaranteePeriod: 30,
    finalDays: 0,
    status: 'ACTIVE' as 'ACTIVE' | 'DRAFT' | 'COMPLETED' | 'CANCELLED'
  })

  const [assignments, setAssignments] = useState<ProjectAssignment[]>([])
  const [teamLibrary, setTeamLibrary] = useState<TeamMember[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [, setLoading] = useState(false)
  const [showAddTeamMember, setShowAddTeamMember] = useState(false)
  const [selectedTeamMember, setSelectedTeamMember] = useState<TeamMember | null>(null)
  const [showStatusEdit, setShowStatusEdit] = useState(false)
  const [selectedNewStatus, setSelectedNewStatus] = useState<'ACTIVE' | 'DRAFT' | 'COMPLETED' | 'CANCELLED'>('ACTIVE')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)
  const [duplicateProjectName, setDuplicateProjectName] = useState('')
  const [duplicateClient, setDuplicateClient] = useState('')
  const [duplicateStartDate, setDuplicateStartDate] = useState<Date | undefined>(undefined)
  const [duplicateEndDate, setDuplicateEndDate] = useState<Date | undefined>(undefined)

  // Initialize selected new status when status edit dialog opens
  useEffect(() => {
    if (showStatusEdit) {
      setSelectedNewStatus(project.status)
    }
  }, [showStatusEdit, project.status])

  const fetchProject = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      if (response.ok) {
        const projectData = await response.json()
        setProject({
          id: projectData.id,
          name: projectData.name,
          client: projectData.client || '',
          currency: { 
            code: projectData.currency_code || 'THB', 
            symbol: projectData.currency_symbol || getCurrencySymbol(projectData.currency_code || 'THB')
          },
          exchangeRate: 1, // Default exchange rate
          hoursPerDay: projectData.hours_per_day,
          taxEnabled: projectData.tax_enabled,
          taxPercentage: projectData.tax_percentage,
          proposedPrice: projectData.proposed_price || 0,
          totalPrice: projectData.allocated_budget || 0,
          startDate: projectData.start_date ? new Date(projectData.start_date) : new Date(),
          executionDays: projectData.execution_days || 0,
          guaranteePeriod: projectData.guarantee_days || 30,
          finalDays: (projectData.execution_days || 0) + (projectData.guarantee_days || 30),
          status: projectData.status || 'ACTIVE'
        })
      } else {
        console.error('Failed to fetch project:', response.statusText)
        toast.error('Failed to load project data')
      }
    } catch (error) {
      console.error('Error fetching project:', error)
      toast.error('Failed to load project data')
    }
  }, [projectId])

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

  const fetchAssignments = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/assignments`)
      if (response.ok) {
        const data = await response.json()
        setAssignments(data)
      } else {
        console.error('Failed to fetch assignments:', response.statusText)
        toast.error('Failed to load team assignments')
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
      toast.error('Failed to load team assignments')
    }
  }, [projectId])

  // Fetch project data, team library, assignments and holidays on load
  useEffect(() => {
    fetchProject()
    fetchTeamLibrary()
    fetchAssignments()
    fetchHolidays()
  }, [fetchHolidays, fetchAssignments, projectId, fetchProject])

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
    // Calculate the maximum assignment duration (execution_days + buffer_days) for parallel work
    // This handles the case where team members work in parallel, so we take the longest individual assignment
    const maxAssignmentDuration = assignments.length > 0 
      ? Math.max(...assignments.map(a => (a.days_allocated || 0) + (a.buffer_days || 0)), 0)
      : (project.executionDays || 0)
    
    const executionEndDate = calculateWorkdays(project.startDate, maxAssignmentDuration, holidays)
    const projectEndDate = calculateWorkdays(executionEndDate, project.guaranteePeriod, holidays)
    
    return {
      executionEndDate,
      projectEndDate,
      totalExecutionDays: maxAssignmentDuration,
      guaranteePeriod: project.guaranteePeriod
    }
  }

  const projectDates = calculateProjectDates()

  const updateProjectStatus = useCallback(async (newStatus: 'ACTIVE' | 'DRAFT' | 'COMPLETED' | 'CANCELLED') => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        toast.success(`Project status updated to ${newStatus.toLowerCase()}`)
      } else {
        console.error('Failed to update project status:', response.statusText)
        toast.error('Failed to update project status')
      }
    } catch (error) {
      console.error('Error updating project status:', error)
      toast.error('Failed to update project status')
    }
  }, [projectId])

  const updateProjectName = useCallback(async (newName: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      })

      if (response.ok) {
        setProject(prev => ({ ...prev, name: newName }))
        toast.success('Project name updated successfully')
      } else {
        console.error('Failed to update project name:', response.statusText)
        toast.error('Failed to update project name')
        throw new Error('Failed to update project name')
      }
    } catch (error) {
      console.error('Error updating project name:', error)
      toast.error('Failed to update project name')
      throw error
    }
  }, [projectId])

  const updateProjectClient = useCallback(async (newClient: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client: newClient })
      })

      if (response.ok) {
        setProject(prev => ({ ...prev, client: newClient }))
        toast.success('Client name updated successfully')
      } else {
        console.error('Failed to update client name:', response.statusText)
        toast.error('Failed to update client name')
        throw new Error('Failed to update client name')
      }
    } catch (error) {
      console.error('Error updating client name:', error)
      toast.error('Failed to update client name')
      throw error
    }
  }, [projectId])

  // Check if project end date has passed and update status automatically
  useEffect(() => {
    const checkProjectStatus = () => {
      const today = new Date()
      const endDate = projectDates.projectEndDate
      
      if (project.status !== 'COMPLETED' && project.status !== 'CANCELLED' && today > endDate) {
        setProject(prev => ({ ...prev, status: 'COMPLETED' }))
        // Update status in database
        updateProjectStatus('COMPLETED')
      }
    }
    
    checkProjectStatus()
  }, [projectDates.projectEndDate, project.status, updateProjectStatus])

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default' // Will be styled as green
      case 'DRAFT':
        return 'secondary'
      case 'COMPLETED':
        return 'default' // Will be styled as blue
      case 'CANCELLED':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getStatusDisplayText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'ACTIVE'
      case 'DRAFT':
        return 'DRAFT'
      case 'COMPLETED':
        return 'COMPLETED'
      case 'CANCELLED':
        return 'CANCELLED'
      default:
        return status.toLowerCase()
    }
  }

  const summary = useMemo((): ProjectSummary => {
    const subtotal = assignments.reduce((sum, assignment) => sum + assignment.allocated_budget, 0)
    
    // Calculate tax if enabled
    const taxRate = project.taxEnabled ? project.taxPercentage / 100 : 0
    const tax = subtotal * taxRate
    
    // Calculate total cost (subtotal + tax)
    const cost = subtotal + tax
    const proposedPrice = project.proposedPrice
    
    const roi = cost > 0 ? ((proposedPrice - cost) / cost) * 100 : 0
    const margin = proposedPrice > 0 ? ((proposedPrice - cost) / proposedPrice) * 100 : 0

    return { subtotal, additionalCost: tax, cost, proposedPrice, roi, margin }
  }, [assignments, project.proposedPrice, project.taxEnabled, project.taxPercentage])

  const formatCurrency = useCallback((amount: number) => {
    return `${project.currency.symbol}${amount.toLocaleString()}`
  }, [project.currency.symbol])

  const formatPercentage = useCallback((percentage: number) => {
    return `${percentage.toFixed(2)}%`
  }, [])

  const handleAddTeamMember = async (teamMember: TeamMember) => {
    try {
      const assignmentData = {
        team_member_id: teamMember.id,
        role_id: teamMember.role_id,
        level_id: teamMember.level_id,
        daily_rate: teamMember.default_rate_per_day,
        days_allocated: 0,
        buffer_days: 0,
        start_date: project.startDate?.toISOString().split('T')[0],
        end_date: project.startDate?.toISOString().split('T')[0]
      }

      const response = await fetch(`/api/projects/${projectId}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignmentData)
      })

      if (response.ok) {
        const newAssignment = await response.json()
        setAssignments(prev => [...prev, newAssignment])
        toast.success('Team member added successfully')
      } else {
        const errorData = await response.json()
        console.error('Failed to add team member:', errorData)
        toast.error(`Failed to add team member: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error adding team member:', error)
      toast.error('Failed to add team member')
    } finally {
      setShowAddTeamMember(false)
      setSelectedTeamMember(null)
    }
  }

  const updateAssignment = async (id: number, field: string, value: string | number) => {
    try {
      // Map frontend field names to database field names
      const dbFieldMap: { [key: string]: string } = {
        'dailyRate': 'dailyRate',
        'daysAllocated': 'daysAllocated',
        'bufferDays': 'bufferDays'
      }

      const dbField = dbFieldMap[field] || field
      const updateData = { [dbField]: value }

      const response = await fetch(`/api/projects/${projectId}/assignments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        const updatedAssignment = await response.json()
        
        // Update local state with the response from database
        setAssignments(prev => prev.map(assignment => {
          if (assignment.id === id) {
            return updatedAssignment
          }
          return assignment
        }))
      } else {
        const errorData = await response.json()
        console.error('Failed to update assignment:', errorData)
        toast.error(`Failed to update assignment: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating assignment:', error)
      toast.error('Failed to update assignment')
    }
  }

  const handleDeleteAssignment = async (id: number) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/assignments/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setAssignments(prev => prev.filter(assignment => assignment.id !== id))
        toast.success('Team member removed successfully')
      } else {
        const errorData = await response.json()
        console.error('Failed to delete assignment:', errorData)
        toast.error(`Failed to remove team member: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting assignment:', error)
      toast.error('Failed to remove team member')
    }
  }

  // Generate Gantt tasks (memoized)
  const ganttTasks = useMemo((): GanttTask[] => {
    const tasks: GanttTask[] = []
    
    assignments.forEach(assignment => {
      // Use start_date from database if available, otherwise fall back to project start date
      const startDate = assignment.start_date ? new Date(assignment.start_date) : project.startDate
      const name = assignment.team_members?.name || 'Unknown'
      const role = assignment.team_members?.roles?.name || 'No role'
      
      // Execution phase
      const executionEnd = calculateWorkdays(startDate, assignment.days_allocated, holidays)
      tasks.push({
        id: assignment.id * 2 - 1,
        name: name,
        role: role,
        startDate: startDate,
        endDate: executionEnd,
        type: 'execution',
        color: '#3b82f6', // Blue
        assigneeId: assignment.id
      })
      
      // Buffer phase
      if (assignment.buffer_days > 0) {
        const bufferEnd = calculateWorkdays(executionEnd, assignment.buffer_days, holidays)
        tasks.push({
          id: assignment.id * 2,
          name: name,
          role: role,
          startDate: executionEnd,
          endDate: bufferEnd,
          type: 'buffer',
          color: '#f97316', // Orange
          assigneeId: assignment.id
        })
      }
    })
    
    return tasks
  }, [assignments, holidays, project.startDate])

  const handleTaskUpdate = async (taskId: number, startDate: Date, endDate: Date) => {
    const assigneeId = Math.ceil(taskId / 2)
    const isBuffer = taskId % 2 === 0
    
    const assignment = assignments.find(a => a.id === assigneeId)
    if (!assignment) return

    try {
      let updateData: {
        bufferDays?: number;
        daysAllocated?: number;
        startDate?: string;
        endDate?: string;
      } = {}
      
      if (isBuffer) {
        // Update buffer phase
        const newBufferDays = differenceInDays(endDate, startDate) + 1
        updateData = { bufferDays: newBufferDays }
      } else {
        // Update execution phase
        const newExecutionDays = differenceInDays(endDate, startDate) + 1
        updateData = { 
          daysAllocated: newExecutionDays,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }
      }

      const response = await fetch(`/api/projects/${projectId}/assignments/${assigneeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        const updatedAssignment = await response.json()
        setAssignments(prev => prev.map(assignment => {
          if (assignment.id === assigneeId) {
            return updatedAssignment
          }
          return assignment
        }))
      }
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
    }
  }

  const handleSaveProject = async () => {
    try {
      // Transform project data to match API schema
      const projectData = {
        name: project.name,
        client: project.client,
        currency_code: project.currency.code,
        currency_symbol: project.currency.symbol,
        hours_per_day: project.hoursPerDay,
        tax_enabled: project.taxEnabled,
        tax_percentage: project.taxPercentage,
        proposed_price: project.proposedPrice,
        working_week: 'MON_TO_FRI', // Default value
        execution_days: project.executionDays,
        buffer_days: 0, // Default value
        guarantee_days: project.guaranteePeriod,
        start_date: project.startDate?.toISOString().split('T')[0],
        status: project.status
      }

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      })

      if (response.ok) {
        const updatedProject = await response.json()
        // Update local state with the updated project data
        setProject(prev => ({
          ...prev,
          ...updatedProject,
          currency: { code: updatedProject.currency_code, symbol: updatedProject.currency_symbol },
          hoursPerDay: updatedProject.hours_per_day,
          taxEnabled: updatedProject.tax_enabled,
          taxPercentage: updatedProject.tax_percentage,
          proposedPrice: updatedProject.proposed_price,
          executionDays: updatedProject.execution_days,
          guaranteePeriod: updatedProject.guarantee_days,
          startDate: updatedProject.start_date ? new Date(updatedProject.start_date) : prev.startDate,
          status: updatedProject.status
        }))
        toast.success('Project updated successfully')
        // Redirect to home page after successful save
        router.push('/')
      } else {
        const errorData = await response.json()
        console.error('Update project error:', errorData)
        toast.error(`Failed to update project: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating project:', error)
      toast.error('Failed to update project')
    }
  }

  const handleSaveDraft = async () => {
    try {
      // Transform project data to match API schema
      const projectData = {
        name: project.name,
        client: project.client,
        currency_code: project.currency.code,
        currency_symbol: project.currency.symbol,
        hours_per_day: project.hoursPerDay,
        tax_enabled: project.taxEnabled,
        tax_percentage: project.taxPercentage,
        proposed_price: project.proposedPrice,
        working_week: 'MON_TO_FRI', // Default value
        execution_days: project.executionDays,
        buffer_days: 0, // Default value
        guarantee_days: project.guaranteePeriod,
        start_date: project.startDate?.toISOString().split('T')[0],
        status: 'DRAFT'
      }

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      })

      if (response.ok) {
        const updatedProject = await response.json()
        // Update local state with the updated project data
        setProject(prev => ({
          ...prev,
          ...updatedProject,
          currency: { code: updatedProject.currency_code, symbol: updatedProject.currency_symbol },
          hoursPerDay: updatedProject.hours_per_day,
          taxEnabled: updatedProject.tax_enabled,
          taxPercentage: updatedProject.tax_percentage,
          proposedPrice: updatedProject.proposed_price,
          executionDays: updatedProject.execution_days,
          guaranteePeriod: updatedProject.guarantee_days,
          startDate: updatedProject.start_date ? new Date(updatedProject.start_date) : prev.startDate,
          status: updatedProject.status
        }))
        toast.success('Draft saved successfully')
      } else {
        const errorData = await response.json()
        console.error('Save draft error:', errorData)
        toast.error(`Failed to save draft: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error saving draft:', error)
      toast.error('Failed to save draft')
    }
  }

  const handleDeleteProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Project deleted successfully')
        // Redirect to projects list page
        router.push('/')
      } else {
        const errorData = await response.json()
        console.error('Delete project error:', errorData)
        toast.error(`Failed to delete project: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Failed to delete project')
    } finally {
      setShowDeleteConfirm(false)
    }
  }

  const handleDuplicateProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: duplicateProjectName || `${project.name} (Copy)`,
          client: duplicateClient || project.client,
          startDate: duplicateStartDate?.toISOString().split('T')[0] || null,
          endDate: duplicateEndDate?.toISOString().split('T')[0] || null
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Project duplicated successfully! ${result.duplicatedAssignments} assignments copied.`)
        setShowDuplicateDialog(false)
        // Reset form
        setDuplicateProjectName('')
        setDuplicateClient('')
        setDuplicateStartDate(undefined)
        setDuplicateEndDate(undefined)
        // Redirect to the new project
        router.push(`/projects/${result.project.id}`)
      } else {
        const errorData = await response.json()
        console.error('Duplicate project error:', errorData)
        toast.error(`Failed to duplicate project: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error duplicating project:', error)
      toast.error('Failed to duplicate project')
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
              <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Duplicate Project</DialogTitle>
                    <DialogDescription>
                      Create a copy of this project with all assignments and settings.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="duplicate-name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="duplicate-name"
                        value={duplicateProjectName}
                        onChange={(e) => setDuplicateProjectName(e.target.value)}
                        placeholder={`${project.name} (Copy)`}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="duplicate-client" className="text-right">
                        Client
                      </Label>
                      <Input
                        id="duplicate-client"
                        value={duplicateClient}
                        onChange={(e) => setDuplicateClient(e.target.value)}
                        placeholder={project.client || 'Enter client name'}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="col-span-3 justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {duplicateStartDate ? format(duplicateStartDate, 'PPP') : 'Select start date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={duplicateStartDate}
                            onSelect={setDuplicateStartDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="col-span-3 justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {duplicateEndDate ? format(duplicateEndDate, 'PPP') : 'Select end date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={duplicateEndDate}
                            onSelect={setDuplicateEndDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDuplicateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleDuplicateProject}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate Project
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Project
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center text-red-600">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      Delete Project
                    </DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this project? This action cannot be undone and will permanently remove:
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <ul className="text-sm text-red-800 space-y-1">
                        <li>• Project: <strong>{project.name}</strong></li>
                        <li>• Client: <strong>{project.client}</strong></li>
                        <li>• All team assignments and data</li>
                        <li>• All project calculations and settings</li>
                        <li>• All associated holidays and timeline data</li>
                      </ul>
                    </div>
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800 font-medium">
                        ⚠️ This action cannot be reverted. Please make sure you want to permanently delete this project.
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDeleteProject}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Project
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <InlineEdit
                value={project.name}
                onSave={updateProjectName}
                placeholder="Enter project name"
                className="mb-2"
                displayClassName="text-3xl font-bold text-slate-900"
                inputClassName="text-3xl font-bold"
                maxLength={100}
              />
              <div className="text-slate-600 mt-2 flex items-center">
                <span className="mr-2">Client:</span>
                <InlineEdit
                  value={project.client}
                  onSave={updateProjectClient}
                  placeholder="Enter client name"
                  displayClassName="text-slate-600"
                  maxLength={100}
                />
              </div>
              <p className="text-slate-500 text-sm mt-1">
                {format(project.startDate, 'dd MMM yyyy')} - {format(projectDates.projectEndDate, 'dd MMM yyyy')}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge 
                variant={getStatusBadgeVariant(project.status)}
                className={`${
                  project.status === 'ACTIVE' ? 'bg-green-600 hover:bg-green-700' :
                  project.status === 'COMPLETED' ? 'bg-blue-600 hover:bg-blue-700' :
                  project.status === 'DRAFT' ? 'bg-gray-600 hover:bg-gray-700' :
                  'bg-red-600 hover:bg-red-700'
                } text-white`}
              >
                {getStatusDisplayText(project.status)}
              </Badge>
              <Dialog open={showStatusEdit} onOpenChange={setShowStatusEdit}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Status
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Update Project Status</DialogTitle>
                    <DialogDescription>
                      Change the current status of this project
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Current Status</Label>
                      <div className="mt-2">
                        <Badge 
                          variant={getStatusBadgeVariant(project.status)}
                          className={`${
                            project.status === 'ACTIVE' ? 'bg-green-600' :
                            project.status === 'COMPLETED' ? 'bg-blue-600' :
                            project.status === 'DRAFT' ? 'bg-gray-600' :
                            'bg-red-600'
                          } text-white`}
                        >
                          {getStatusDisplayText(project.status)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label>New Status</Label>
                      <Select
                        value={selectedNewStatus}
                        onValueChange={(value: 'ACTIVE' | 'DRAFT' | 'COMPLETED' | 'CANCELLED') => {
                          setSelectedNewStatus(value)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                          <SelectItem value="DRAFT">DRAFT</SelectItem>
                          <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                          <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowStatusEdit(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => {
                        updateProjectStatus(selectedNewStatus)
                        setShowStatusEdit(false)
                      }}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Update Status
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
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
                {formatCurrency(summary.subtotal)} + {formatCurrency(summary.additionalCost)} {project.taxEnabled ? '(Tax)' : ''}
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
                taxEnabled={project.taxEnabled}
                taxPercentage={project.taxPercentage}
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
                onTaxEnabledChange={(enabled) => {
                  setProject(prev => ({ ...prev, taxEnabled: enabled }))
                }}
                onTaxPercentageChange={(percentage) => {
                  setProject(prev => ({ ...prev, taxPercentage: percentage }))
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
                          {format(project.startDate, 'dd MMM yyyy')}
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
                        value={format(projectDates.executionEndDate, 'dd MMM yyyy')}
                        disabled
                        className="bg-slate-50"
                      />
                    </div>
                    
                    <div>
                      <Label>Project End</Label>
                      <Input
                        value={format(projectDates.projectEndDate, 'dd MMM yyyy')}
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
                                  {member.name} - {member.roles?.name || 'No role'}
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
                        <TableCell className="font-medium">{assignment.team_members?.name || 'Unknown'}</TableCell>
                        <TableCell>{assignment.team_members?.roles?.name || 'No role'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {formatLevel(assignment.levels || assignment.team_members?.levels)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={assignment.daily_rate}
                            onChange={(e) => updateAssignment(assignment.id, 'dailyRate', parseFloat(e.target.value))}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={assignment.days_allocated}
                            onChange={(e) => updateAssignment(assignment.id, 'daysAllocated', parseFloat(e.target.value))}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={assignment.buffer_days}
                            onChange={(e) => updateAssignment(assignment.id, 'bufferDays', parseFloat(e.target.value))}
                            className="w-20"
                            min="0"
                          />
                        </TableCell>
                        <TableCell className="font-mono">
                          {assignment.total_mandays}
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatCurrency(assignment.allocated_budget)}
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
                          <TableCell>{format(holiday.date, 'dd MMM yyyy')}</TableCell>
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

            {/* Save Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-6">
              <Button variant="outline" onClick={handleSaveDraft}>
                Save Draft
              </Button>
              <Button onClick={handleSaveProject}>
                Save Project
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="gantt" className="space-y-6">
            <InteractiveGantt
              tasks={ganttTasks}
              holidays={holidays}
              projectStart={project.startDate}
              projectEnd={projectDates.projectEndDate}
              onTaskUpdate={handleTaskUpdate}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
