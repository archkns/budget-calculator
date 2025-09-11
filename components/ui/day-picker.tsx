"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface DayPickerProps {
  selectedDays: string[]
  onDaysChange: (days: string[]) => void
  className?: string
}

const DAYS = [
  { value: 'MON', label: 'M', fullLabel: 'Monday' },
  { value: 'TUE', label: 'T', fullLabel: 'Tuesday' },
  { value: 'WED', label: 'W', fullLabel: 'Wednesday' },
  { value: 'THU', label: 'T', fullLabel: 'Thursday' },
  { value: 'FRI', label: 'F', fullLabel: 'Friday' },
  { value: 'SAT', label: 'S', fullLabel: 'Saturday' },
  { value: 'SUN', label: 'S', fullLabel: 'Sunday' },
]

export function DayPicker({ selectedDays, onDaysChange, className }: DayPickerProps) {
  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      onDaysChange(selectedDays.filter(d => d !== day))
    } else {
      onDaysChange([...selectedDays, day])
    }
  }

  const selectAll = () => {
    onDaysChange(DAYS.map(day => day.value))
  }

  const selectWeekdays = () => {
    onDaysChange(['MON', 'TUE', 'WED', 'THU', 'FRI'])
  }

  const selectWeekends = () => {
    onDaysChange(['SAT', 'SUN'])
  }

  const clearAll = () => {
    onDaysChange([])
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm">Custom Working Days</CardTitle>
        <Label className="text-xs text-muted-foreground">
          Select the days of the week when work will be performed
        </Label>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Day Buttons */}
        <div className="flex justify-center space-x-2">
          {DAYS.map((day) => (
            <Button
              key={day.value}
              variant={selectedDays.includes(day.value) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleDay(day.value)}
              className={cn(
                "w-10 h-10 p-0 font-semibold",
                selectedDays.includes(day.value) 
                  ? "bg-blue-600 hover:bg-blue-700 text-white" 
                  : "hover:bg-slate-100"
              )}
              title={day.fullLabel}
            >
              {day.label}
            </Button>
          ))}
        </div>

        {/* Quick Selection Buttons */}
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={selectAll}
            className="text-xs"
          >
            All Days
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={selectWeekdays}
            className="text-xs"
          >
            Weekdays
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={selectWeekends}
            className="text-xs"
          >
            Weekends
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearAll}
            className="text-xs"
          >
            Clear All
          </Button>
        </div>

        {/* Selected Days Display */}
        {selectedDays.length > 0 && (
          <div className="text-center">
            <Label className="text-xs text-muted-foreground">
              Selected: {selectedDays.map(day => DAYS.find(d => d.value === day)?.fullLabel).join(', ')}
            </Label>
          </div>
        )}

        {selectedDays.length === 0 && (
          <div className="text-center">
            <Label className="text-xs text-muted-foreground">
              No working days selected
            </Label>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
