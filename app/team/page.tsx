"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Plus, Search, Upload, Download, Edit, Trash2, Calculator } from 'lucide-react'
import Link from 'next/link'
import { formatLevel } from '@/lib/utils'
import { toast } from 'sonner'

interface TeamMember {
  id: number
  name: string
  default_rate_per_day: number
  status: string
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

export default function TeamLibrary() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Fetch team members from database
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await fetch('/api/team')
        if (response.ok) {
          const data = await response.json()
          setTeamMembers(data)
          setFilteredMembers(data)
        } else {
          console.error('Failed to fetch team members:', response.statusText)
        }
      } catch (error) {
        console.error('Error fetching team members:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTeamMembers()
  }, [])

  // Filter logic
  useEffect(() => {
    const filtered = teamMembers.filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (member.roles?.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (member.custom_role?.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesStatus = statusFilter === 'all' || member.status === statusFilter
      
      const matchesRole = roleFilter === 'all' || 
                         member.roles?.name === roleFilter || 
                         member.custom_role === roleFilter
      
      return matchesSearch && matchesStatus && matchesRole
    })
    
    setFilteredMembers(filtered)
  }, [teamMembers, searchTerm, statusFilter, roleFilter])

  const formatCurrency = (amount: number) => {
    return `฿${amount.toLocaleString()}`
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
              <span className="text-slate-600">Team Library</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Team Library</h1>
            <p className="text-slate-600 mt-2">Manage your team members, roles, and default rates</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Team Member
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add Team Member</DialogTitle>
                  <DialogDescription>
                    Add a new team member to your library with their role and default rate.
                  </DialogDescription>
                </DialogHeader>
                <AddTeamMemberForm onClose={() => setIsAddDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Search by name or role..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="Frontend Dev">Frontend Dev</SelectItem>
                  <SelectItem value="Backend Dev">Backend Dev</SelectItem>
                  <SelectItem value="Experience Designer (UX/UI)">UX/UI Designer</SelectItem>
                  <SelectItem value="Project Owner">Project Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Team Members Table */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members ({filteredMembers.length})</CardTitle>
            <CardDescription>
              Manage your team library with roles, levels, and default rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Default Rate/Day</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>
                        {member.roles?.name || member.custom_role}
                        {member.custom_role && (
                          <Badge variant="outline" className="ml-2 text-xs">Custom</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatLevel(member.levels)}</TableCell>
                      <TableCell className="font-mono">{formatCurrency(member.default_rate_per_day)}</TableCell>
                      <TableCell>
                        <Badge variant={member.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {member.notes || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            
            {!loading && filteredMembers.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                No team members found matching your criteria.
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

function AddTeamMemberForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    customRole: '',
    level: '',
    defaultRate: '',
    notes: '',
    status: 'ACTIVE'
  })
  const [roles, setRoles] = useState<Array<{id: number, name: string}>>([])
  const [loading, setLoading] = useState(false)
  const [showNewRoleInput, setShowNewRoleInput] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [showNewLevelInput, setShowNewLevelInput] = useState(false)
  const [newLevelName, setNewLevelName] = useState('')

  // Fetch roles when component mounts
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch('/api/roles')
        if (response.ok) {
          const data = await response.json()
          setRoles(data)
        } else {
          console.error('Failed to fetch roles:', response.statusText)
        }
      } catch (error) {
        console.error('Error fetching roles:', error)
      }
    }
    fetchRoles()
  }, [])

  // Function to create a new role
  const createNewRole = async () => {
    if (!newRoleName.trim()) return

    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newRoleName.trim()
        })
      })

      if (response.ok) {
        const newRole = await response.json()
        setRoles(prev => [...prev, newRole])
        setFormData(prev => ({ ...prev, role: newRole.name }))
        setNewRoleName('')
        setShowNewRoleInput(false)
        toast.success(`Role "${newRole.name}" created successfully`)
      } else {
        const errorData = await response.json()
        console.error('Failed to create role:', errorData)
        toast.error(`Failed to create role: ${errorData.error || response.statusText}`)
      }
    } catch (error) {
      console.error('Error creating role:', error)
      toast.error('Error creating role. Please try again.')
    }
  }

  // Function to handle new level creation (since levels are predefined, we'll just add it to the form)
  const handleNewLevel = () => {
    if (!newLevelName.trim()) return
    
    // Add the new level to the form data
    setFormData(prev => ({ ...prev, level: newLevelName.trim().toUpperCase() }))
    setNewLevelName('')
    setShowNewLevelInput(false)
    toast.success(`Level "${newLevelName.trim().toUpperCase()}" added successfully`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Find the role ID from the selected role name
      const selectedRole = roles.find(role => role.name === formData.role)
      
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          role_id: formData.role === 'custom' ? null : selectedRole?.id,
          level_id: formData.level,
          default_rate_per_day: parseFloat(formData.defaultRate),
          notes: formData.notes,
          status: formData.status
        })
      })

      if (response.ok) {
        toast.success('Team member added successfully')
        // Refresh the page to show the new team member
        window.location.reload()
      } else {
        const errorData = await response.json()
        console.error('Failed to add team member:', errorData)
        toast.error(`Failed to add team member: ${errorData.error || response.statusText}`)
      }
    } catch (error) {
      console.error('Error adding team member:', error)
      toast.error('Error adding team member. Please try again.')
    } finally {
      setLoading(false)
    }
    
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="level">Level</Label>
          <Select value={formData.level} onValueChange={(value) => {
            if (value === 'add_new') {
              setShowNewLevelInput(true)
            } else {
              setFormData({ ...formData, level: value })
            }
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TEAM_LEAD">Team Lead</SelectItem>
              <SelectItem value="SENIOR">Senior</SelectItem>
              <SelectItem value="JUNIOR">Junior</SelectItem>
              <SelectItem value="add_new" className="text-blue-600 font-medium">
                + Add New Level
              </SelectItem>
            </SelectContent>
          </Select>
          
          {showNewLevelInput && (
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="Enter new level name"
                value={newLevelName}
                onChange={(e) => setNewLevelName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleNewLevel()}
              />
              <Button 
                type="button" 
                size="sm" 
                onClick={handleNewLevel}
                disabled={!newLevelName.trim()}
              >
                Add
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setShowNewLevelInput(false)
                  setNewLevelName('')
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="role">Role</Label>
        <Select value={formData.role} onValueChange={(value) => {
          if (value === 'add_new') {
            setShowNewRoleInput(true)
          } else {
            setFormData({ ...formData, role: value })
          }
        }}>
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.name}>
                {role.name}
              </SelectItem>
            ))}
            <SelectItem value="custom">Custom Role</SelectItem>
            <SelectItem value="add_new" className="text-blue-600 font-medium">
              + Add New Role
            </SelectItem>
          </SelectContent>
        </Select>
        
        {showNewRoleInput && (
          <div className="mt-2 flex gap-2">
            <Input
              placeholder="Enter new role name"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createNewRole()}
            />
            <Button 
              type="button" 
              size="sm" 
              onClick={createNewRole}
              disabled={!newRoleName.trim()}
            >
              Add
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setShowNewRoleInput(false)
                setNewRoleName('')
              }}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {formData.role === 'custom' && (
        <div>
          <Label htmlFor="customRole">Custom Role</Label>
          <Input
            id="customRole"
            value={formData.customRole}
            onChange={(e) => setFormData({ ...formData, customRole: e.target.value })}
            placeholder="Enter custom role"
          />
        </div>
      )}

      <div>
        <Label htmlFor="defaultRate">Default Rate per Day (THB) *</Label>
        <Input
          id="defaultRate"
          type="number"
          value={formData.defaultRate}
          onChange={(e) => setFormData({ ...formData, defaultRate: e.target.value })}
          placeholder="15000"
          required
        />
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes about this team member..."
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="status"
          checked={formData.status === 'ACTIVE'}
          onCheckedChange={(checked) => setFormData({ ...formData, status: checked ? 'ACTIVE' : 'INACTIVE' })}
        />
        <Label htmlFor="status">Active</Label>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Team Member'}
        </Button>
      </div>
    </form>
  )
}
