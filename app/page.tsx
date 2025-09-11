"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Calculator, Users, FileText, Settings, Edit, Trash2, Copy } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Project {
  id: number
  name: string
  client: string | null
  status: string
  currency_code: string
  proposed_price: number | null
  allocated_budget: number
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteProjectId, setDeleteProjectId] = useState<number | null>(null)
  const [duplicateProjectId, setDuplicateProjectId] = useState<number | null>(null)
  const [duplicateProjectName, setDuplicateProjectName] = useState('')
  const [duplicateClient, setDuplicateClient] = useState('')
  const [duplicateStartDate, setDuplicateStartDate] = useState('')
  const [duplicateEndDate, setDuplicateEndDate] = useState('')

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      } else {
        console.error('Failed to fetch projects:', response.statusText)
        toast.error('Failed to load projects')
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleDeleteProject = useCallback(async (projectId: number) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Project deleted successfully')
        // Remove the project from the local state
        setProjects(prev => prev.filter(project => project.id !== projectId))
      } else {
        const errorData = await response.json()
        console.error('Delete project error:', errorData)
        toast.error(`Failed to delete project: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Failed to delete project')
    } finally {
      setDeleteProjectId(null)
    }
  }, [])

  const handleDuplicateProject = useCallback(async (projectId: number) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: duplicateProjectName || undefined,
          client: duplicateClient || undefined,
          startDate: duplicateStartDate || undefined,
          endDate: duplicateEndDate || undefined
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Project duplicated successfully')
        // Add the new project to the local state
        setProjects(prev => [data.project, ...prev])
        setDuplicateProjectId(null)
        setDuplicateProjectName('')
        setDuplicateClient('')
        setDuplicateStartDate('')
        setDuplicateEndDate('')
      } else {
        const errorData = await response.json()
        console.error('Duplicate project error:', errorData)
        toast.error(`Failed to duplicate project: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error duplicating project:', error)
      toast.error('Failed to duplicate project')
    }
  }, [duplicateProjectName, duplicateClient, duplicateStartDate, duplicateEndDate])

  const stats = useMemo(() => ({
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'ACTIVE').length,
    totalRevenue: projects
      .filter(p => p.status !== 'DRAFT' && p.status !== 'CANCELLED') // Exclude draft and cancelled projects from revenue calculation
      .reduce((sum, p) => sum + (p.proposed_price || 0), 0),
    avgROI: (() => {
      const activeProjects = projects.filter(p => p.status !== 'DRAFT' && p.status !== 'CANCELLED' && p.proposed_price && p.allocated_budget)
      if (activeProjects.length === 0) return 0
      
      const totalROI = activeProjects.reduce((sum, p) => {
        const roi = ((p.proposed_price! - p.allocated_budget) / p.allocated_budget) * 100
        return sum + roi
      }, 0)
      
      return totalROI / activeProjects.length
    })()
  }), [projects])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Calculator className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-slate-900">Budget Calculator</h1>
            </div>
            <nav className="flex items-center space-x-4">
              <Link href="/team" className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium">
                Team Library
              </Link>
              <Link href="/rate-cards" className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium">
                Rate Cards
              </Link>
              <Link href="/projects/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProjects}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeProjects}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average ROI</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.avgROI.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>
                  Your latest project cost estimations and proposals
                </CardDescription>
              </div>
              <Link href="/projects/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-slate-500">
                Loading projects...
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No projects found. Create your first project to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="flex items-center p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-slate-900">{project.name}</h3>
                        <Badge 
                          variant={
                            project.status === 'ACTIVE' ? 'default' :
                            project.status === 'COMPLETED' ? 'default' :
                            project.status === 'CANCELLED' ? 'destructive' :
                            'secondary'
                          }
                          className={`${
                            project.status === 'ACTIVE' ? 'bg-green-600 hover:bg-green-700' :
                            project.status === 'COMPLETED' ? 'bg-blue-600 hover:bg-blue-700' :
                            project.status === 'DRAFT' ? 'bg-gray-600 hover:bg-gray-700' :
                            'bg-red-600 hover:bg-red-700'
                          } text-white`}
                        >
                          {project.status === 'ACTIVE' ? 'ACTIVE' :
                           project.status === 'COMPLETED' ? 'COMPLETED' :
                           project.status === 'DRAFT' ? 'DRAFT' :
                           project.status === 'CANCELLED' ? 'CANCELLED' :
                           project.status.toLowerCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{project.client || 'No client specified'}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Last updated: {new Date(project.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center">
                      {/* Fixed width columns for better alignment */}
                      <div className="w-24 text-right mr-6">
                        <p className="text-sm font-medium text-slate-900">Start Date</p>
                        <p className="text-sm text-slate-600">
                          {formatDate(project.start_date)}
                        </p>
                      </div>
                      <div className="w-24 text-right mr-6">
                        <p className="text-sm font-medium text-slate-900">End Date</p>
                        <p className="text-sm text-slate-600">
                          {formatDate(project.end_date)}
                        </p>
                      </div>
                      <div className="w-36 text-right mr-6">
                        <p className="text-sm font-medium text-slate-900">Allocated Budget</p>
                        <p className="text-sm text-slate-600">
                          {formatCurrency(project.allocated_budget || 0, project.currency_code)}
                        </p>
                      </div>
                      <div className="w-32 text-right mr-6">
                        <p className="text-sm font-medium text-slate-900">Proposed Price</p>
                        <p className="text-sm text-slate-600">
                          {formatCurrency(project.proposed_price || 0, project.currency_code)}
                        </p>
                      </div>
                      <div className="w-28 flex items-center space-x-2">
                        <Link href={`/projects/${project.id}`}>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Dialog open={duplicateProjectId === project.id} onOpenChange={(open) => {
                          if (!open) {
                            setDuplicateProjectId(null)
                            setDuplicateProjectName('')
                            setDuplicateClient('')
                            setDuplicateStartDate('')
                            setDuplicateEndDate('')
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => {
                                setDuplicateProjectId(project.id)
                                setDuplicateProjectName(`${project.name} (Copy)`)
                                setDuplicateClient(project.client || '')
                                setDuplicateStartDate('')
                                setDuplicateEndDate('')
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className="flex items-center text-blue-600">
                                <Copy className="h-5 w-5 mr-2" />
                                Duplicate Project
                              </DialogTitle>
                              <DialogDescription>
                                Create a copy of this project with all its settings and team assignments.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <div className="space-y-4">
                                <div>
                                  <label htmlFor="duplicate-name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Project Name <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    id="duplicate-name"
                                    type="text"
                                    value={duplicateProjectName}
                                    onChange={(e) => setDuplicateProjectName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter project name"
                                    required
                                  />
                                </div>
                                
                                <div>
                                  <label htmlFor="duplicate-client" className="block text-sm font-medium text-gray-700 mb-2">
                                    Client Name <span className="text-gray-400 text-xs">(optional)</span>
                                  </label>
                                  <input
                                    id="duplicate-client"
                                    type="text"
                                    value={duplicateClient}
                                    onChange={(e) => setDuplicateClient(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter client name"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label htmlFor="duplicate-start-date" className="block text-sm font-medium text-gray-700 mb-2">
                                      Start Date <span className="text-gray-400 text-xs">(optional)</span>
                                    </label>
                                    <input
                                      id="duplicate-start-date"
                                      type="date"
                                      value={duplicateStartDate}
                                      onChange={(e) => setDuplicateStartDate(e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                  
                                  <div>
                                    <label htmlFor="duplicate-end-date" className="block text-sm font-medium text-gray-700 mb-2">
                                      End Date <span className="text-gray-400 text-xs">(optional)</span>
                                    </label>
                                    <input
                                      id="duplicate-end-date"
                                      type="date"
                                      value={duplicateEndDate}
                                      onChange={(e) => setDuplicateEndDate(e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                  <p className="text-sm text-blue-800">
                                    <strong>Original Project:</strong> {project.name}
                                  </p>
                                  <p className="text-sm text-blue-800 mt-1">
                                    <strong>Client:</strong> {project.client || 'No client'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => {
                                setDuplicateProjectId(null)
                                setDuplicateProjectName('')
                                setDuplicateClient('')
                                setDuplicateStartDate('')
                                setDuplicateEndDate('')
                              }}>
                                Cancel
                              </Button>
                              <Button 
                                onClick={() => handleDuplicateProject(project.id)}
                                className="bg-blue-600 hover:bg-blue-700"
                                disabled={!duplicateProjectName.trim()}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate Project
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Dialog open={deleteProjectId === project.id} onOpenChange={(open) => !open && setDeleteProjectId(null)}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setDeleteProjectId(project.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className="flex items-center text-red-600">
                                <Trash2 className="h-5 w-5 mr-2" />
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
                                  <li>• Client: <strong>{project.client || 'No client'}</strong></li>
                                  <li>• All team assignments and data</li>
                                  <li>• All project calculations and settings</li>
                                </ul>
                              </div>
                              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-800 font-medium">
                                  ⚠️ This action cannot be reverted. Please make sure you want to permanently delete this project.
                                </p>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setDeleteProjectId(null)}>
                                Cancel
                              </Button>
                              <Button 
                                variant="destructive" 
                                onClick={() => handleDeleteProject(project.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Project
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Link href="/projects/new">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2 text-blue-600" />
                  Create Project
                </CardTitle>
                <CardDescription>
                  Start a new project cost estimation with team allocation
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
          
          <Link href="/team">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-green-600" />
                  Manage Team
                </CardTitle>
                <CardDescription>
                  Add, edit, or import team members and their rates
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
          
          <Link href="/rate-cards">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-purple-600" />
                  Rate Cards
                </CardTitle>
                <CardDescription>
                  Configure daily rates for different roles and levels
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  )
}
