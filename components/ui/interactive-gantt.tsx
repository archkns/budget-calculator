"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { format, addDays, differenceInDays, startOfWeek, endOfWeek, eachDayOfInterval, isWeekend, addWeeks } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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

interface Holiday {
  id: number
  name: string
  date: Date
  type: 'public' | 'company'
}

interface InteractiveGanttProps {
  tasks: GanttTask[]
  holidays: Holiday[]
  projectStart: Date
  projectEnd: Date
  // eslint-disable-next-line no-unused-vars
  onTaskUpdate: (taskId: number, startDate: Date, endDate: Date) => void
  // eslint-disable-next-line no-unused-vars
  onTaskResize: (taskId: number, newDuration: number) => void
}

export function InteractiveGantt({ 
  tasks, 
  holidays, 
  projectStart, 
  projectEnd, 
  onTaskUpdate, 
  onTaskResize 
}: InteractiveGanttProps) {
  const [draggedTask, setDraggedTask] = useState<number | null>(null)
  const [resizingTask, setResizingTask] = useState<number | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const ganttRef = useRef<HTMLDivElement>(null)

  // Extend timeline to show at least 4 weeks beyond project end
  const timelineStart = startOfWeek(projectStart)
  const timelineEnd = addWeeks(endOfWeek(projectEnd), 4) // Add 4 more weeks
  const timelineDays = eachDayOfInterval({ start: timelineStart, end: timelineEnd })
  
  const dayWidth = 40
  const taskHeight = 32
  const taskSpacing = 6
  const labelWidth = 200
  const headerHeight = 60

  const getDatePosition = useCallback((date: Date) => {
    const dayIndex = differenceInDays(date, timelineStart)
    return dayIndex * dayWidth
  }, [timelineStart, dayWidth])

  const getTaskWidth = (startDate: Date, endDate: Date) => {
    const duration = differenceInDays(endDate, startDate) + 1
    return Math.max(duration * dayWidth, dayWidth)
  }

  const isHoliday = (date: Date) => {
    return holidays.some(h => 
      format(h.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    )
  }

  const handleMouseDown = (e: React.MouseEvent, taskId: number, action: 'drag' | 'resize') => {
    e.preventDefault()
    e.stopPropagation()
    
    if (action === 'drag') {
      setDraggedTask(taskId)
      const rect = ganttRef.current?.getBoundingClientRect()
      if (rect) {
        setDragOffset(e.clientX - rect.left)
      }
    } else {
      setResizingTask(taskId)
    }
  }

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ganttRef.current) return
    const rect = ganttRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left

    if (draggedTask !== null) {
      const task = tasks.find(t => t.id === draggedTask)
      if (!task) return

      const newStartX = x - dragOffset - labelWidth
      const newStartDay = Math.round(newStartX / dayWidth)
      const newStartDate = addDays(timelineStart, Math.max(0, newStartDay))
      const duration = differenceInDays(task.endDate, task.startDate)
      const newEndDate = addDays(newStartDate, duration)

      onTaskUpdate(draggedTask, newStartDate, newEndDate)
    }

    if (resizingTask !== null) {
      const task = tasks.find(t => t.id === resizingTask)
      if (!task) return

      const taskStartX = getDatePosition(task.startDate) + labelWidth
      const newWidth = Math.max(dayWidth, x - taskStartX)
      const newDuration = Math.max(1, Math.round(newWidth / dayWidth))
      
      onTaskResize(resizingTask, newDuration)
    }
  }, [draggedTask, resizingTask, dragOffset, tasks, onTaskUpdate, onTaskResize, timelineStart, dayWidth, labelWidth, getDatePosition])

  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (!ganttRef.current) return
    const rect = ganttRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left

    if (draggedTask !== null) {
      const task = tasks.find(t => t.id === draggedTask)
      if (!task) return

      const newStartX = x - dragOffset - labelWidth
      const newStartDay = Math.round(newStartX / dayWidth)
      const newStartDate = addDays(timelineStart, Math.max(0, newStartDay))
      const duration = differenceInDays(task.endDate, task.startDate)
      const newEndDate = addDays(newStartDate, duration)

      onTaskUpdate(draggedTask, newStartDate, newEndDate)
    }

    if (resizingTask !== null) {
      const task = tasks.find(t => t.id === resizingTask)
      if (!task) return

      const taskStartX = getDatePosition(task.startDate) + labelWidth
      const newWidth = Math.max(dayWidth, x - taskStartX)
      const newDuration = Math.max(1, Math.round(newWidth / dayWidth))
      
      onTaskResize(resizingTask, newDuration)
    }
  }, [draggedTask, resizingTask, dragOffset, tasks, onTaskUpdate, onTaskResize, timelineStart, dayWidth, labelWidth, getDatePosition])

  const handleMouseUp = () => {
    setDraggedTask(null)
    setResizingTask(null)
    setDragOffset(0)
  }

  useEffect(() => {
    const handleGlobalMouseUp = () => handleMouseUp()
    
    document.addEventListener('mouseup', handleGlobalMouseUp)
    document.addEventListener('mousemove', handleGlobalMouseMove)
    
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.removeEventListener('mousemove', handleGlobalMouseMove)
    }
  }, [handleGlobalMouseMove])

  // Fixed height calculation - no vertical scrolling
  const emptyStateHeight = 150
  const tasksAreaHeight = tasks.length > 0 ? tasks.length * (taskHeight + taskSpacing) + 40 : emptyStateHeight
  const totalFixedHeight = headerHeight + tasksAreaHeight
  const chartWidth = timelineDays.length * dayWidth + labelWidth

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-lg">
            📊 Interactive Project Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Fixed height container - NO vertical scrolling */}
          <div 
            className="overflow-x-auto overflow-y-hidden"
            style={{ height: totalFixedHeight }}
          >
            <div 
              ref={ganttRef}
              className="relative bg-white border rounded-lg"
              style={{ 
                width: chartWidth,
                height: totalFixedHeight
              }}
              onMouseMove={handleMouseMove}
            >
              {/* Timeline Header */}
              <div className="absolute top-0 left-0 right-0 z-10 bg-white border-b border-gray-200" style={{ height: headerHeight }}>
                <div className="flex h-full">
                  {/* Label Column Header */}
                  <div 
                    className="flex-shrink-0 bg-gray-50 border-r border-gray-200 p-2 font-semibold text-sm flex items-center"
                    style={{ width: labelWidth }}
                  >
                    Team Member / Task
                  </div>
                  
                  {/* Date Headers */}
                  <div className="flex">
                    {timelineDays.map((day, index) => (
                      <div
                        key={index}
                        className={`flex-shrink-0 text-center py-1 border-r border-gray-100 flex flex-col justify-center ${
                          isWeekend(day) ? 'bg-gray-50' : 'bg-white'
                        } ${isHoliday(day) ? 'bg-red-50' : ''}`}
                        style={{ width: dayWidth }}
                      >
                        <div className="text-xs font-medium text-gray-700">
                          {format(day, 'EEE')}
                        </div>
                        <div className="text-sm font-bold text-gray-900">
                          {format(day, 'dd')}
                        </div>
                        {(index === 0 || format(day, 'dd') === '01') && (
                          <div className="text-xs font-bold text-blue-600">
                            {format(day, 'MMM')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Holiday Markers */}
              <div className="absolute left-0 right-0 pointer-events-none" style={{ top: headerHeight - 5, height: 5 }}>
                {holidays.map((holiday) => {
                  const holidayX = getDatePosition(holiday.date) + labelWidth + dayWidth / 2
                  return (
                    <div
                      key={holiday.id}
                      className="absolute top-0 w-1 h-full bg-red-500 rounded-full"
                      style={{ left: holidayX - 2 }}
                      title={`${holiday.name} - ${format(holiday.date, 'MMM dd')}`}
                    />
                  )
                })}
              </div>

              {/* Tasks Area */}
              <div 
                className="absolute left-0 right-0"
                style={{ 
                  top: headerHeight,
                  height: tasksAreaHeight
                }}
              >
                {tasks.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <div className="text-2xl mb-1">👥</div>
                      <div className="text-sm font-medium">No team members assigned yet</div>
                      <div className="text-xs">Add team members to see their timeline</div>
                    </div>
                  </div>
                ) : (
                  tasks.map((task, index) => {
                    const startX = getDatePosition(task.startDate)
                    const width = getTaskWidth(task.startDate, task.endDate)
                    const y = index * (taskHeight + taskSpacing) + 10

                    return (
                      <div key={task.id} className="absolute">
                        {/* Task Label */}
                        <div 
                          className="flex-shrink-0 pr-2 py-1"
                          style={{ 
                            width: labelWidth,
                            transform: `translateY(${y}px)` 
                          }}
                        >
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                              {task.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 text-xs">
                                {task.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {task.role}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Task Bar */}
                        <div
                          className={`absolute rounded cursor-move transition-all duration-150 hover:shadow-md ${
                            draggedTask === task.id ? 'shadow-lg scale-105 z-20' : 'z-10'
                          }`}
                          style={{
                            left: startX + labelWidth,
                            top: y,
                            width: width,
                            height: taskHeight,
                            backgroundColor: task.color,
                            transform: draggedTask === task.id ? 'translateY(-1px)' : 'none',
                            border: `1px solid ${task.color}`
                          }}
                          onMouseDown={(e) => handleMouseDown(e, task.id, 'drag')}
                        >
                          {/* Task Content */}
                          <div className="flex items-center justify-between h-full px-2 text-white">
                            <div className="flex items-center space-x-1">
                              <span className="text-sm">
                                {task.type === 'execution' ? '🔧' : '🛡️'}
                              </span>
                              <span className="font-medium text-xs truncate">
                                {task.name}
                              </span>
                            </div>
                            <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/20 px-1">
                              {differenceInDays(task.endDate, task.startDate) + 1}d
                            </Badge>
                          </div>

                          {/* Resize Handle */}
                          <div
                            className="absolute right-0 top-0 w-2 h-full cursor-ew-resize bg-black/20 opacity-0 hover:opacity-100 transition-opacity"
                            onMouseDown={(e) => handleMouseDown(e, task.id, 'resize')}
                            title="Drag to resize"
                          />
                        </div>

                        {/* Task Dates */}
                        <div 
                          className="absolute text-xs text-gray-600"
                          style={{ 
                            left: startX + labelWidth,
                            top: y + taskHeight + 2,
                            width: width
                          }}
                        >
                          <div className="flex justify-between px-1">
                            <span>{format(task.startDate, 'MMM dd')}</span>
                            <span>{format(task.endDate, 'MMM dd')}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Weekend Overlays */}
              {timelineDays.map((day, index) => (
                isWeekend(day) && (
                  <div
                    key={`weekend-${index}`}
                    className="absolute bg-gray-100/40 pointer-events-none"
                    style={{
                      left: index * dayWidth + labelWidth,
                      top: headerHeight,
                      width: dayWidth,
                      height: tasksAreaHeight
                    }}
                  />
                )
              ))}

              {/* Holiday Overlays */}
              {timelineDays.map((day, index) => (
                isHoliday(day) && (
                  <div
                    key={`holiday-${index}`}
                    className="absolute bg-red-100/30 pointer-events-none"
                    style={{
                      left: index * dayWidth + labelWidth,
                      top: headerHeight,
                      width: dayWidth,
                      height: tasksAreaHeight
                    }}
                  />
                )
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend - Outside chart */}
      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Execution Phase</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span>Buffer Phase</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
            <span>Weekend</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
            <span>Holiday</span>
          </div>
        </div>
      </div>
    </div>
  )
}
