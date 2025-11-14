"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Pencil } from 'lucide-react'
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface GanttTask {
  id: string
  name: string
  category: string
  startDate: Date
  endDate: Date
  duration: number
}

interface GanttChartViewProps {
  tasks: GanttTask[]
  onUpdateTask?: (taskId: string, startDate: Date | null, endDate: Date | null) => Promise<void>
}

export function GanttChartView({ tasks, onUpdateTask }: GanttChartViewProps) {
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editStartDate, setEditStartDate] = useState<string>("")
  const [editEndDate, setEditEndDate] = useState<string>("")
  const [saving, setSaving] = useState(false)
  const { startDate, endDate, totalDays, monthHeaders } = useMemo(() => {
    if (tasks.length === 0) return { startDate: new Date(), endDate: new Date(), totalDays: 0, monthHeaders: [] }

    const dates = tasks.flatMap((t) => [t.startDate, t.endDate])
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())))
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())))

    // Add padding
    minDate.setDate(minDate.getDate() - 3)
    maxDate.setDate(maxDate.getDate() + 3)

    const diffTime = maxDate.getTime() - minDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    // Generate month headers
    const headers: { month: string; days: number; startDay: number }[] = []
    const currentDate = new Date(minDate)
    let dayCounter = 0

    while (currentDate <= maxDate) {
      const month = currentDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })
      const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
      const startDay = currentDate.getDate()
      const daysToShow = Math.min(daysInMonth - startDay + 1, diffDays - dayCounter)

      if (daysToShow > 0) {
        headers.push({ month, days: daysToShow, startDay: dayCounter })
      }

      dayCounter += daysToShow
      currentDate.setMonth(currentDate.getMonth() + 1)
      currentDate.setDate(1)
    }

    return { startDate: minDate, endDate: maxDate, totalDays: diffDays, monthHeaders: headers }
  }, [tasks])

  const getTaskPosition = (task: GanttTask) => {
    const taskStart = task.startDate.getTime()
    const chartStart = startDate.getTime()
    const dayWidth = 100 / totalDays

    const startOffset = Math.floor((taskStart - chartStart) / (1000 * 60 * 60 * 24))
    const duration = task.duration + 1

    return {
      left: `${startOffset * dayWidth}%`,
      width: `${duration * dayWidth}%`,
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  // Group tasks by category
  const groupedTasks = useMemo(() => {
    const groups: { [key: string]: GanttTask[] } = {}
    tasks.forEach((task) => {
      const mainCategory = task.category.split(" - ")[0]
      if (!groups[mainCategory]) {
        groups[mainCategory] = []
      }
      groups[mainCategory].push(task)
    })
    return groups
  }, [tasks])

  const categoryColors: { [key: string]: string } = {
    Preliminary: "bg-blue-500",
    "Fitting Out": "bg-purple-500",
    "Furniture Work": "bg-green-500",
  }

  const handleEditTask = (task: GanttTask) => {
    setEditingTaskId(task.id)
    setEditStartDate(format(task.startDate, "yyyy-MM-dd"))
    setEditEndDate(format(task.endDate, "yyyy-MM-dd"))
  }

  const handleStartDateChange = (value: string) => {
    setEditStartDate(value)
    // If end date exists and new start date is after it, clear end date
    if (editEndDate && value > editEndDate) {
      setEditEndDate(value)
    }
  }

  const handleEndDateChange = (value: string) => {
    // Only allow end date if it's >= start date
    if (editStartDate && value >= editStartDate) {
      setEditEndDate(value)
    } else if (!editStartDate) {
      setEditEndDate(value)
    }
  }

  const handleDeleteDates = async () => {
    if (!editingTaskId || !onUpdateTask) return

    setSaving(true)
    try {
      // Send empty dates or null to backend to remove them
      await onUpdateTask(editingTaskId, null as any, null as any)
      setEditingTaskId(null)
      setEditStartDate("")
      setEditEndDate("")
    } catch (error) {
      console.error("Failed to delete dates:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingTaskId || !editStartDate || !editEndDate || !onUpdateTask) return

    setSaving(true)
    try {
      await onUpdateTask(editingTaskId, new Date(editStartDate), new Date(editEndDate))
      setEditingTaskId(null)
    } catch (error) {
      console.error("Failed to update task:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <div className="flex">
          {/* Sticky Task Names Column */}
          <div className="w-80 flex-shrink-0 border-r bg-background z-10">
            {/* Header */}
            <div className="h-[53px] flex items-center px-4 font-semibold border-b bg-muted/50">Task Name</div>

            {/* Task Rows */}
            <div>
              {Object.entries(groupedTasks).map(([category, categoryTasks]) => (
                <div key={category} className="border-b last:border-b-0">
                  {/* Category Header - Fixed height to match timeline */}
                  <div className="h-[33px] flex items-center px-2 font-semibold text-sm bg-muted/30 border-b">
                    {category}
                  </div>

                  {/* Tasks in this category - Fixed height to match timeline */}
                  {categoryTasks.map((task) => (
                    <div
                      key={task.id}
                      className="h-[73px] flex flex-col justify-center px-3 border-b last:border-b-0 transition-colors"
                      style={{
                        backgroundColor:
                          hoveredTaskId === task.id
                            ? category === "Preliminary"
                              ? "rgba(59, 130, 246, 0.15)"
                              : category === "Fitting Out"
                                ? "rgba(168, 85, 247, 0.15)"
                                : "rgba(34, 197, 94, 0.15)"
                            : "transparent",
                      }}
                      onMouseEnter={() => setHoveredTaskId(task.id)}
                      onMouseLeave={() => setHoveredTaskId(null)}
                    >
                      <p className="text-sm font-medium truncate">{task.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(task.startDate)} - {formatDate(task.endDate)}
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Scrollable Timeline */}
          <div className="flex-1 overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Timeline Header - Fixed height to match task names header */}
              <div className="border-b bg-muted/50">
                <div className="flex border-b h-[37px]">
                  {monthHeaders.map((header, index) => (
                    <div
                      key={index}
                      className="border-r last:border-r-0 flex items-center justify-center font-semibold text-sm bg-muted"
                      style={{ width: `${(header.days / totalDays) * 100}%` }}
                    >
                      {header.month}
                    </div>
                  ))}
                </div>
                <div className="flex h-4">
                  {Array.from({ length: totalDays }).map((_, i) => {
                    const currentDay = new Date(startDate)
                    currentDay.setDate(currentDay.getDate() + i)
                    return (
                      <div key={i} className="border-r flex-1 text-center text-[10px] text-muted-foreground leading-4">
                        {currentDay.getDate()}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Timeline Task Bars */}
              <div>
                {Object.entries(groupedTasks).map(([category, categoryTasks]) => (
                  <div key={category} className="border-b last:border-b-0">
                    {/* Category Header Spacer */}
                    <div className="h-[33px] bg-muted/30 border-b"></div>

                    {/* Task Bars */}
                    {categoryTasks.map((task) => {
                      const position = getTaskPosition(task)
                      return (
                        <div
                          key={task.id}
                          className="relative h-[73px] border-b last:border-b-0 transition-colors"
                          style={{
                            backgroundColor:
                              hoveredTaskId === task.id
                                ? category === "Preliminary"
                                  ? "rgba(59, 130, 246, 0.15)"
                                  : category === "Fitting Out"
                                    ? "rgba(168, 85, 247, 0.15)"
                                    : "rgba(34, 197, 94, 0.15)"
                                : "transparent",
                          }}
                          onMouseEnter={() => setHoveredTaskId(task.id)}
                          onMouseLeave={() => setHoveredTaskId(null)}
                        >
                          {/* Grid background */}
                          <div className="absolute inset-0 flex">
                            {Array.from({ length: totalDays }).map((_, i) => (
                              <div key={i} className="border-r flex-1"></div>
                            ))}
                          </div>

                          {/* Task bar */}
                          <div className="relative h-full flex items-center px-3">
                            <div
                              className={`h-8 rounded ${
                                categoryColors[category] || "bg-gray-500"
                              } opacity-80 hover:opacity-100 transition-opacity group relative`}
                              style={{
                                marginLeft: position.left,
                                width: position.width,
                              }}
                            >
                              <div className="relative h-full flex items-center justify-between px-2">
                                <div className="text-xs text-white font-medium truncate flex-1">{task.duration + 1}d</div>
                                {onUpdateTask && (
                                  <Popover
                                    open={editingTaskId === task.id}
                                    onOpenChange={(open) => {
                                      if (open) {
                                        handleEditTask(task)
                                      } else {
                                        setEditingTaskId(null)
                                      }
                                    }}
                                  >
                                    <PopoverTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleEditTask(task)
                                        }}
                                      >
                                        <Pencil className="h-3 w-3 text-gray-700" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80" align="start">
                                      <div className="space-y-4">
                                        <div className="space-y-2">
                                          <h4 className="font-semibold text-sm">{task.name}</h4>
                                          <p className="text-xs text-muted-foreground">{category}</p>
                                        </div>
                                        <div className="space-y-3">
                                          <div className="space-y-2">
                                            <Label>Start Date</Label>
                                            <Input
                                              type="date"
                                              value={editStartDate}
                                              onChange={(e) => handleStartDateChange(e.target.value)}
                                              max={editEndDate || undefined}
                                            />
                                          </div>
                                          <div className="space-y-2">
                                            <Label>End Date</Label>
                                            <Input
                                              type="date"
                                              value={editEndDate}
                                              onChange={(e) => handleEndDateChange(e.target.value)}
                                              min={editStartDate || undefined}
                                            />
                                          </div>
                                        </div>
                                        <div className="flex gap-2">
                                          <Button
                                            size="sm"
                                            onClick={handleSaveEdit}
                                            disabled={!editStartDate || !editEndDate || saving}
                                            className="flex-1"
                                          >
                                            {saving ? "Saving..." : "Save"}
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={handleDeleteDates}
                                            disabled={saving}
                                          >
                                            Delete
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setEditingTaskId(null)}
                                            disabled={saving}
                                          >
                                            Cancel
                                          </Button>
                                        </div>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 pt-4 border-t">
        <p className="text-sm font-semibold text-muted-foreground">Legend:</p>
        {Object.entries(categoryColors).map(([category, color]) => (
          <div key={category} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded ${color}`}></div>
            <span className="text-sm">{category}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
