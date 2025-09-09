"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Calculator, Users, FileText, Settings } from 'lucide-react'
import Link from 'next/link'

export default function Dashboard() {
  const [projects] = useState([
    {
      id: 1,
      name: 'E-commerce Platform Redesign',
      client: 'TechCorp Ltd.',
      status: 'active',
      cost: 2450000,
      proposedPrice: 3000000,
      roi: 22.4,
      lastUpdated: '2025-09-08'
    },
    {
      id: 2,
      name: 'Mobile Banking App',
      client: 'FinanceBank',
      status: 'draft',
      cost: 1800000,
      proposedPrice: 2200000,
      roi: 22.2,
      lastUpdated: '2025-09-07'
    }
  ])

  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'active').length,
    totalRevenue: projects.reduce((sum, p) => sum + p.proposedPrice, 0),
    avgROI: projects.reduce((sum, p) => sum + p.roi, 0) / projects.length
  }

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
              <div className="text-2xl font-bold">฿{stats.totalRevenue.toLocaleString()}</div>
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
            <div className="space-y-4">
              {projects.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-semibold text-slate-900">{project.name}</h3>
                      <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                        {project.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{project.client}</p>
                    <p className="text-xs text-slate-500 mt-1">Last updated: {project.lastUpdated}</p>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-right">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Cost</p>
                      <p className="text-sm text-slate-600">฿{project.cost.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Proposed</p>
                      <p className="text-sm text-slate-600">฿{project.proposedPrice.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">ROI</p>
                      <p className="text-sm text-green-600 font-medium">{project.roi}%</p>
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
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
                  Configure daily rates for different roles and tiers
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  )
}
