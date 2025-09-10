"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Calendar, Download, RefreshCw, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Holiday {
  id: number
  name: string
  date: string
  treatment: 'EXCLUDE' | 'BILLABLE' | 'INFO_ONLY'
  multiplier: number
  is_custom: boolean
  project_id: number | null
  created_at: string
}

interface ExternalHoliday {
  id: string
  name: string
  date: string
  type: string
  notes: string
  country: string
  source: string
}

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [externalHolidays, setExternalHolidays] = useState<ExternalHoliday[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [selectedSource, setSelectedSource] = useState('myHora')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)

  // Fetch holidays from database
  useEffect(() => {
    fetchHolidays()
  }, [])

  const fetchHolidays = async () => {
    try {
      const response = await fetch('/api/holidays')
      if (response.ok) {
        const data = await response.json()
        setHolidays(data)
      } else {
        toast.error('Failed to fetch holidays')
      }
    } catch (error) {
      console.error('Error fetching holidays:', error)
      toast.error('Error fetching holidays')
    } finally {
      setLoading(false)
    }
  }

  const fetchExternalHolidays = async () => {
    try {
      const response = await fetch(`/api/holidays/external?source=${selectedSource}&year=${selectedYear}`)
      if (response.ok) {
        const data = await response.json()
        setExternalHolidays(data.holidays || [])
      } else {
        toast.error('Failed to fetch external holidays')
      }
    } catch (error) {
      console.error('Error fetching external holidays:', error)
      toast.error('Error fetching external holidays')
    }
  }

  const syncExternalHolidays = async () => {
    setSyncing(true)
    try {
      const response = await fetch(`/api/holidays/external?source=${selectedSource}&year=${selectedYear}`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        toast.success(data.message)
        fetchHolidays() // Refresh the holidays list
        setIsImportDialogOpen(false)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to sync holidays')
      }
    } catch (error) {
      console.error('Error syncing holidays:', error)
      toast.error('Error syncing holidays')
    } finally {
      setSyncing(false)
    }
  }

  const deleteHoliday = async (id: number) => {
    try {
      const response = await fetch(`/api/holidays?id=${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast.success('Holiday deleted successfully')
        fetchHolidays() // Refresh the holidays list
      } else {
        toast.error('Failed to delete holiday')
      }
    } catch (error) {
      console.error('Error deleting holiday:', error)
      toast.error('Error deleting holiday')
    }
  }

  const getTreatmentBadgeVariant = (treatment: string) => {
    switch (treatment) {
      case 'EXCLUDE':
        return 'destructive'
      case 'BILLABLE':
        return 'default'
      case 'INFO_ONLY':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Public Holidays</h1>
          <p className="text-muted-foreground">
            Manage public holidays for your projects
          </p>
        </div>
        
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Import Holidays
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Import External Holidays</DialogTitle>
              <DialogDescription>
                Import public holidays from external sources
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Select value={selectedSource} onValueChange={setSelectedSource}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="myHora">MyHora API (Thai Holidays)</SelectItem>
                    <SelectItem value="thaiLocal">Thai Holidays (Local)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  min="2020"
                  max="2030"
                />
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={fetchExternalHolidays}
                  className="flex-1"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button
                  onClick={syncExternalHolidays}
                  disabled={syncing}
                  className="flex-1"
                >
                  {syncing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Import
                </Button>
              </div>
              
              {externalHolidays.length > 0 && (
                <div className="space-y-2">
                  <Label>Preview ({externalHolidays.length} holidays)</Label>
                  <div className="max-h-32 overflow-y-auto border rounded p-2">
                    {externalHolidays.slice(0, 5).map((holiday) => (
                      <div key={holiday.id} className="text-sm">
                        {formatDate(holiday.date)} - {holiday.name}
                      </div>
                    ))}
                    {externalHolidays.length > 5 && (
                      <div className="text-sm text-muted-foreground">
                        ... and {externalHolidays.length - 5} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Holidays ({holidays.length})</CardTitle>
          <CardDescription>
            Public holidays that will be excluded from project calculations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {holidays.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No holidays found. Import some holidays to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Treatment</TableHead>
                  <TableHead>Multiplier</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidays.map((holiday) => (
                  <TableRow key={holiday.id}>
                    <TableCell>{formatDate(holiday.date)}</TableCell>
                    <TableCell className="font-medium">{holiday.name}</TableCell>
                    <TableCell>
                      <Badge variant={getTreatmentBadgeVariant(holiday.treatment)}>
                        {holiday.treatment}
                      </Badge>
                    </TableCell>
                    <TableCell>{holiday.multiplier}x</TableCell>
                    <TableCell>
                      <Badge variant={holiday.is_custom ? 'default' : 'secondary'}>
                        {holiday.is_custom ? 'Custom' : 'Public'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteHoliday(holiday.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
