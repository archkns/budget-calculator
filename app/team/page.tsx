"use client"

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { useDebounce } from '@/hooks/use-debounce'
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Plus, Search, Upload, Download, Edit, Trash2, Calculator } from 'lucide-react'
import Link from 'next/link'
import { formatLevel } from '@/lib/utils'
import { toast } from 'sonner'

interface TeamMember {
  id: number
  name: string
  rate_per_day: number
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
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  
  // Debounce search term for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState<Array<{id: number, name: string}>>([])

  // Fetch team members and roles from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch team members
        const teamResponse = await fetch('/api/team')
        if (teamResponse.ok) {
          const teamData = await teamResponse.json()
          setTeamMembers(teamData)
        } else {
          console.error('Failed to fetch team members:', teamResponse.statusText)
        }

        // Fetch roles
        const rolesResponse = await fetch('/api/roles')
        if (rolesResponse.ok) {
          const rolesData = await rolesResponse.json()
          setRoles(rolesData)
        } else {
          console.error('Failed to fetch roles:', rolesResponse.statusText)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Optimized filter logic with useMemo and debounced search
  const filteredMembers = useMemo(() => {
    return teamMembers.filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                           (member.roles?.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
      
      const matchesStatus = statusFilter === 'all' || member.status === statusFilter
      
      const matchesRole = roleFilter === 'all' || 
                         member.roles?.name === roleFilter
      
      return matchesSearch && matchesStatus && matchesRole
    })
  }, [teamMembers, debouncedSearchTerm, statusFilter, roleFilter])

  const formatCurrency = useCallback((amount: number) => {
    return `฿${amount.toLocaleString()}`
  }, [])

  // Optimized callback functions
  const handleEditMember = useCallback((member: TeamMember) => {
    setEditingMember(member)
    setIsEditDialogOpen(true)
  }, [])

  const handleDeleteMember = useCallback(async (memberId: number) => {
    try {
      const response = await fetch(`/api/team/${memberId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Team member deleted successfully')
        // Refresh the team members list
        setTeamMembers(prev => prev.filter(member => member.id !== memberId))
      } else {
        const errorData = await response.json()
        console.error('Failed to delete team member:', errorData)
        toast.error(`Failed to delete team member: ${errorData.error || response.statusText}`)
      }
    } catch (error) {
      console.error('Error deleting team member:', error)
      toast.error('Error deleting team member. Please try again.')
    }
  }, [])

  const refreshTeamMembers = useCallback(async (optimisticMember?: TeamMember) => {
    // If we have an optimistic member, add it immediately for instant feedback
    if (optimisticMember) {
      setTeamMembers(prev => [...prev, optimisticMember])
    }
    
    try {
      const response = await fetch('/api/team')
      if (response.ok) {
        const data = await response.json()
        setTeamMembers(data)
      } else {
        console.error('Failed to fetch team members:', response.statusText)
        // If the API call failed and we added an optimistic member, remove it
        if (optimisticMember) {
          setTeamMembers(prev => prev.filter(member => member.id !== optimisticMember.id))
        }
      }
    } catch (error) {
      console.error('Error fetching team members:', error)
      // If the API call failed and we added an optimistic member, remove it
      if (optimisticMember) {
        setTeamMembers(prev => prev.filter(member => member.id !== optimisticMember.id))
      }
    }
  }, [])


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
                <AddTeamMemberForm 
                  onClose={() => setIsAddDialogOpen(false)} 
                  onSuccess={refreshTeamMembers}
                />
              </DialogContent>
            </Dialog>
            
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Edit Team Member</DialogTitle>
                  <DialogDescription>
                    Update the team member's information.
                  </DialogDescription>
                </DialogHeader>
                {editingMember && (
                  <EditTeamMemberForm 
                    member={editingMember} 
                    onClose={() => {
                      setIsEditDialogOpen(false)
                      setEditingMember(null)
                    }}
                    onSuccess={refreshTeamMembers}
                  />
                )}
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
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.name}>
                      {role.name}
                    </SelectItem>
                  ))}
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
                        {member.roles?.name}
                      </TableCell>
                      <TableCell>{formatLevel(member.levels)}</TableCell>
                      <TableCell className="font-mono">{formatCurrency(member.rate_per_day)}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={member.status === 'ACTIVE' ? 'default' : 'secondary'}
                          className={member.status === 'ACTIVE' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-500 hover:bg-gray-600'}
                        >
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {member.notes || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditMember(member)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Team Member</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{member.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteMember(member.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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

const AddTeamMemberForm = memo(function AddTeamMemberForm({ 
  onClose, 
  onSuccess 
}: { 
  onClose: () => void
  onSuccess: (optimisticMember?: TeamMember) => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    role_id: '',
    level_id: '',
    defaultRate: '',
    notes: '',
    status: 'ACTIVE'
  })
  const [roles, setRoles] = useState<Array<{id: number, name: string}>>([])
  const [levels, setLevels] = useState<Array<{id: number, name: string, display_name: string}>>([])
  const [loading, setLoading] = useState(false)
  const [showNewRoleInput, setShowNewRoleInput] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [rateLookupLoading, setRateLookupLoading] = useState(false)

  // Fetch roles and levels when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch roles
        const rolesResponse = await fetch('/api/roles')
        if (rolesResponse.ok) {
          const rolesData = await rolesResponse.json()
          setRoles(rolesData)
        } else {
          console.error('Failed to fetch roles:', rolesResponse.statusText)
        }

        // Fetch levels
        const levelsResponse = await fetch('/api/levels')
        if (levelsResponse.ok) {
          const levelsData = await levelsResponse.json()
          setLevels(levelsData)
        } else {
          console.error('Failed to fetch levels:', levelsResponse.statusText)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }
    fetchData()
  }, [])

  // Function to lookup rate card when both role and level are selected
  const lookupRateCard = async (roleId: string, levelId: string) => {
    if (!roleId || !levelId) return

    setRateLookupLoading(true)
    try {
      const response = await fetch(`/api/rate-cards/lookup?role_id=${roleId}&level_id=${levelId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.rateCard) {
          setFormData(prev => ({ ...prev, defaultRate: data.rateCard.daily_rate.toString() }))
          toast.success(`Rate auto-filled: ฿${data.rateCard.daily_rate.toLocaleString()}`)
        } else {
          toast.info('No rate card found for this role and level combination')
        }
      } else {
        console.error('Failed to lookup rate card:', response.statusText)
      }
    } catch (error) {
      console.error('Error looking up rate card:', error)
    } finally {
      setRateLookupLoading(false)
    }
  }

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
        setFormData(prev => ({ ...prev, role_id: newRole.id.toString() }))
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Create optimistic team member for immediate UI feedback
    const selectedRole = roles.find(role => role.id.toString() === formData.role_id)
    const selectedLevel = levels.find(level => level.id.toString() === formData.level_id)
    
    const optimisticMember: TeamMember = {
      id: Date.now(), // Temporary ID for optimistic update
      name: formData.name,
      rate_per_day: parseFloat(formData.defaultRate),
      status: formData.status,
      notes: formData.notes,
      roles: selectedRole,
      levels: selectedLevel
    }
    
    // Add optimistic member immediately for instant feedback
    onSuccess(optimisticMember)
    onClose()
    
    try {
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          role_id: parseInt(formData.role_id),
          level_id: parseInt(formData.level_id),
          rate_per_day: parseFloat(formData.defaultRate),
          notes: formData.notes,
          status: formData.status
        })
      })

      if (response.ok) {
        toast.success('Team member added successfully')
        // Refresh with the actual data from the server
        onSuccess()
      } else {
        const errorData = await response.json()
        console.error('Failed to add team member:', errorData)
        toast.error(`Failed to add team member: ${errorData.error || response.statusText}`)
        // The optimistic member will be removed by the refreshTeamMembers function
        onSuccess()
      }
    } catch (error) {
      console.error('Error adding team member:', error)
      toast.error('Error adding team member. Please try again.')
      // The optimistic member will be removed by the refreshTeamMembers function
      onSuccess()
    } finally {
      setLoading(false)
    }
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
          <Label htmlFor="level">Level *</Label>
          <Select value={formData.level_id} onValueChange={(value) => {
            setFormData({ ...formData, level_id: value })
            // Auto-fill rate when both role and level are selected
            if (formData.role_id && value) {
              lookupRateCard(formData.role_id, value)
            }
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              {levels.map((level) => (
                <SelectItem key={level.id} value={level.id.toString()}>
                  {level.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="role">Role *</Label>
        <Select value={formData.role_id} onValueChange={(value) => {
          if (value === 'add_new') {
            setShowNewRoleInput(true)
          } else {
            setFormData({ ...formData, role_id: value })
            // Auto-fill rate when both role and level are selected
            if (value && formData.level_id) {
              lookupRateCard(value, formData.level_id)
            }
          }
        }}>
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id.toString()}>
                {role.name}
              </SelectItem>
            ))}
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

      <div>
        <div className="flex items-center gap-2">
          <Label htmlFor="defaultRate">Default Rate per Day (THB) *</Label>
          <div className="group relative">
            <div className="cursor-help text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              To edit rates, go to the <Link href="/rate-cards" className="underline hover:text-blue-300">Rate Cards page</Link>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
        <div className="relative">
          <Input
            id="defaultRate"
            type="number"
            value={formData.defaultRate}
            placeholder="15000"
            required
            disabled={true}
            className="bg-gray-50 cursor-not-allowed"
          />
          {rateLookupLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Rate is automatically filled from rate cards. To modify rates, visit the{' '}
          <Link href="/rate-cards" className="text-blue-600 hover:text-blue-800 underline">
            Rate Cards page
          </Link>.
        </p>
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
})

const EditTeamMemberForm = memo(function EditTeamMemberForm({ 
  member, 
  onClose, 
  onSuccess 
}: { 
  member: TeamMember
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    name: member.name,
    role_id: member.roles?.id?.toString() || '',
    level_id: member.levels?.id?.toString() || '',
    defaultRate: member.rate_per_day.toString(),
    notes: member.notes || '',
    status: member.status
  })
  const [roles, setRoles] = useState<Array<{id: number, name: string}>>([])
  const [levels, setLevels] = useState<Array<{id: number, name: string, display_name: string}>>([])
  const [loading, setLoading] = useState(false)
  const [showNewRoleInput, setShowNewRoleInput] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [rateLookupLoading, setRateLookupLoading] = useState(false)

  // Fetch roles and levels when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch roles
        const rolesResponse = await fetch('/api/roles')
        if (rolesResponse.ok) {
          const rolesData = await rolesResponse.json()
          setRoles(rolesData)
        } else {
          console.error('Failed to fetch roles:', rolesResponse.statusText)
        }

        // Fetch levels
        const levelsResponse = await fetch('/api/levels')
        if (levelsResponse.ok) {
          const levelsData = await levelsResponse.json()
          setLevels(levelsData)
        } else {
          console.error('Failed to fetch levels:', levelsResponse.statusText)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }
    fetchData()
  }, [])

  // Function to lookup rate card when both role and level are selected
  const lookupRateCard = async (roleId: string, levelId: string) => {
    if (!roleId || !levelId) return

    setRateLookupLoading(true)
    try {
      const response = await fetch(`/api/rate-cards/lookup?role_id=${roleId}&level_id=${levelId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.rateCard) {
          setFormData(prev => ({ ...prev, defaultRate: data.rateCard.daily_rate.toString() }))
          toast.success(`Rate auto-filled: ฿${data.rateCard.daily_rate.toLocaleString()}`)
        } else {
          toast.info('No rate card found for this role and level combination')
        }
      } else {
        console.error('Failed to lookup rate card:', response.statusText)
      }
    } catch (error) {
      console.error('Error looking up rate card:', error)
    } finally {
      setRateLookupLoading(false)
    }
  }

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
        setFormData(prev => ({ ...prev, role_id: newRole.id.toString() }))
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch(`/api/team/${member.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          role_id: parseInt(formData.role_id),
          level_id: parseInt(formData.level_id),
          rate_per_day: parseFloat(formData.defaultRate),
          notes: formData.notes,
          status: formData.status
        })
      })

      if (response.ok) {
        toast.success('Team member updated successfully')
        onSuccess()
        onClose()
      } else {
        const errorData = await response.json()
        console.error('Failed to update team member:', errorData)
        toast.error(`Failed to update team member: ${errorData.error || response.statusText}`)
      }
    } catch (error) {
      console.error('Error updating team member:', error)
      toast.error('Error updating team member. Please try again.')
    } finally {
      setLoading(false)
    }
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
          <Label htmlFor="level">Level *</Label>
          <Select value={formData.level_id} onValueChange={(value) => {
            setFormData({ ...formData, level_id: value })
            // Auto-fill rate when both role and level are selected
            if (formData.role_id && value) {
              lookupRateCard(formData.role_id, value)
            }
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              {levels.map((level) => (
                <SelectItem key={level.id} value={level.id.toString()}>
                  {level.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="role">Role *</Label>
        <Select value={formData.role_id} onValueChange={(value) => {
          if (value === 'add_new') {
            setShowNewRoleInput(true)
          } else {
            setFormData({ ...formData, role_id: value })
            // Auto-fill rate when both role and level are selected
            if (value && formData.level_id) {
              lookupRateCard(value, formData.level_id)
            }
          }
        }}>
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id.toString()}>
                {role.name}
              </SelectItem>
            ))}
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

      <div>
        <div className="flex items-center gap-2">
          <Label htmlFor="defaultRate">Default Rate per Day (THB) *</Label>
          <div className="group relative">
            <div className="cursor-help text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              To edit rates, go to the <Link href="/rate-cards" className="underline hover:text-blue-300">Rate Cards page</Link>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
        <div className="relative">
          <Input
            id="defaultRate"
            type="number"
            value={formData.defaultRate}
            placeholder="15000"
            required
            disabled={true}
            className="bg-gray-50 cursor-not-allowed"
          />
          {rateLookupLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Rate is automatically filled from rate cards. To modify rates, visit the{' '}
          <Link href="/rate-cards" className="text-blue-600 hover:text-blue-800 underline">
            Rate Cards page
          </Link>.
        </p>
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
          {loading ? 'Updating...' : 'Update Team Member'}
        </Button>
      </div>
    </form>
  )
})
