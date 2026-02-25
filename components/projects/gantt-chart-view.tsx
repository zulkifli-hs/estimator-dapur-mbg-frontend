"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Pencil, Plus } from 'lucide-react'
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface GanttTask {
  id: string
  name: string
  category: string
  startDate: Date | null  // Allow null for tasks without dates
  endDate: Date | null    // Allow null for tasks without dates
  duration: number
}

interface GanttChartViewProps {
  tasks: GanttTask[]
  onUpdateTask?: (taskId: string, startDate: Date | null, endDate: Date | null) => Promise<void>
}

interface CategoryStyle {
  bar: string
  categoryHeader: string
  subcategoryHeader: string
  hoverColor: string
}

interface SubcategoryGroup {
  subcategory: string
  tasks: GanttTask[]
}

interface GroupedCategory {
  category: string
  subcategories: SubcategoryGroup[]
}

export function GanttChartView({ tasks, onUpdateTask }: GanttChartViewProps) {
  const { toast } = useToast()
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editStartDate, setEditStartDate] = useState<string>("")
  const [editEndDate, setEditEndDate] = useState<string>("")
  const [saving, setSaving] = useState(false)
  const DAY_WIDTH = 50 // pixels per day

  const { startDate, endDate, totalDays, monthHeaders } = useMemo(() => {
    const tasksWithDates = tasks.filter(t => t.startDate && t.endDate)
    
    if (tasksWithDates.length === 0) {
      const today = new Date()
      const start = new Date(today.getFullYear(), today.getMonth(), 1)
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      
      const diffTime = end.getTime() - start.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      const monthName = start.toLocaleDateString("en-US", { month: "short", year: "numeric" })
      
      return { 
        startDate: start, 
        endDate: end, 
        totalDays: diffDays, 
        monthHeaders: [{ month: monthName, days: diffDays, startDay: 0 }] 
      }
    }

    const dates = tasksWithDates.flatMap((t) => [t.startDate!, t.endDate!])
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
    if (!task.startDate || !task.endDate) return null
    
    const taskStart = task.startDate.getTime()
    const chartStart = startDate.getTime()

    const startOffset = Math.floor((taskStart - chartStart) / (1000 * 60 * 60 * 24))
    const duration = task.duration + 1

    return {
      left: startOffset * DAY_WIDTH,
      width: duration * DAY_WIDTH,
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "Not set"
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const normalizeCategoryName = (category: string) => {
    const normalized = category.trim()

    if (normalized === "mechanicalElectrical" || normalized === "Mechanical Electrical") {
      return "Mechanical / Electrical / Plumbing"
    }

    return normalized
  }

  // Group tasks by category and subcategory
  const groupedTasks = useMemo(() => {
    const groups: Record<string, Record<string, GanttTask[]>> = {}

    tasks.forEach((task) => {
      const [rawMainCategory, rawSubcategory] = task.category.split(" - ")
      const mainCategory = normalizeCategoryName(rawMainCategory || "General")
      const subcategory = rawSubcategory?.trim() || "General"

      if (!groups[mainCategory]) {
        groups[mainCategory] = {}
      }

      if (!groups[mainCategory][subcategory]) {
        groups[mainCategory][subcategory] = []
      }

      groups[mainCategory][subcategory].push(task)
    })

    return Object.entries(groups).map(([category, subgroups]): GroupedCategory => ({
      category,
      subcategories: Object.entries(subgroups).map(([subcategory, subcategoryTasks]) => ({
        subcategory,
        tasks: subcategoryTasks,
      })),
    }))
  }, [tasks])

  const categoryStyles: { [key: string]: CategoryStyle } = {
    Preliminary: {
      bar: "bg-blue-500",
      categoryHeader: "bg-blue-100 text-blue-900",
      subcategoryHeader: "bg-blue-50 text-blue-800",
      hoverColor: "rgba(59, 130, 246, 0.15)",
    },
    "Fitting Out": {
      bar: "bg-purple-500",
      categoryHeader: "bg-purple-100 text-purple-900",
      subcategoryHeader: "bg-purple-50 text-purple-800",
      hoverColor: "rgba(168, 85, 247, 0.15)",
    },
    "Furniture Work": {
      bar: "bg-green-500",
      categoryHeader: "bg-green-100 text-green-900",
      subcategoryHeader: "bg-green-50 text-green-800",
      hoverColor: "rgba(34, 197, 94, 0.15)",
    },
    "Mechanical / Electrical / Plumbing": {
      bar: "bg-amber-500",
      categoryHeader: "bg-amber-100 text-amber-900",
      subcategoryHeader: "bg-amber-50 text-amber-800",
      hoverColor: "rgba(245, 158, 11, 0.15)",
    },
  }

  const getCategoryStyle = (category: string): CategoryStyle => {
    return (
      categoryStyles[category] || {
        bar: "bg-slate-500",
        categoryHeader: "bg-slate-100 text-slate-900",
        subcategoryHeader: "bg-slate-50 text-slate-800",
        hoverColor: "rgba(100, 116, 139, 0.15)",
      }
    )
  }

  const handleEditTask = (task: GanttTask) => {
    setEditingTaskId(task.id)
    setEditStartDate(task.startDate ? task.startDate.toISOString().split('T')[0] : "")
    setEditEndDate(task.endDate ? task.endDate.toISOString().split('T')[0] : "")
  }

  const handleStartDateChange = (value: string) => {
    setEditStartDate(value)
  }

  const handleEndDateChange = (value: string) => {
    setEditEndDate(value)
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

    const start = new Date(editStartDate)
    const end = new Date(editEndDate)

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      toast({
        title: "Invalid date",
        description: "Please enter valid start and end dates.",
        variant: "destructive",
      })
      return
    }

    if (end < start) {
      toast({
        title: "Invalid date range",
        description: "End date cannot be earlier than start date.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      await onUpdateTask(editingTaskId, start, end)
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
              {groupedTasks.map(({ category, subcategories }) => (
                <div key={category} className="border-b last:border-b-0">
                  {/* Category Header - Fixed height to match timeline */}
                  <div
                    className={cn(
                      "h-[33px] flex items-center px-2 font-semibold text-sm border-b",
                      getCategoryStyle(category).categoryHeader,
                    )}
                  >
                    {category}
                  </div>

                  {subcategories.map(({ subcategory, tasks: subcategoryTasks }) => (
                    <div key={`${category}-${subcategory}`} className="border-b last:border-b-0">
                      <div
                        className={cn(
                          "h-7 flex items-center px-3 text-xs font-medium border-b",
                          getCategoryStyle(category).subcategoryHeader,
                        )}
                      >
                        {subcategory}
                      </div>

                      {subcategoryTasks.map((task) => (
                        <div
                          key={task.id}
                          className="h-[73px] flex flex-col justify-center px-3 border-b last:border-b-0 transition-colors"
                          style={{
                            backgroundColor:
                              hoveredTaskId === task.id ? getCategoryStyle(category).hoverColor : "transparent",
                          }}
                          onMouseEnter={() => setHoveredTaskId(task.id)}
                          onMouseLeave={() => setHoveredTaskId(null)}
                        >
                          <p className="text-sm font-medium truncate">{task.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {task.startDate && task.endDate
                              ? `${formatDate(task.startDate)} - ${formatDate(task.endDate)}`
                              : "No dates set"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Scrollable Timeline */}
          <div className="flex-1 overflow-x-auto">
            <div style={{ width: `${totalDays * DAY_WIDTH}px` }}>
              {/* Timeline Header - Fixed height to match task names header */}
              <div className="border-b bg-muted/50">
                <div className="flex border-b h-[37px]">
                  {monthHeaders.map((header, index) => (
                    <div
                      key={index}
                      className="border-r last:border-r-0 flex items-center justify-center font-semibold text-sm bg-muted"
                      style={{ width: `${header.days * DAY_WIDTH}px` }}
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
                      <div 
                        key={i} 
                        className="border-r text-center text-[10px] text-muted-foreground leading-4"
                        style={{ width: `${DAY_WIDTH}px` }}
                      >
                        {currentDay.getDate()}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Timeline Task Bars */}
              <div>
                {groupedTasks.map(({ category, subcategories }) => (
                  <div key={category} className="border-b last:border-b-0">
                    {/* Category Header Spacer */}
                    <div className={cn("h-[33px] border-b", getCategoryStyle(category).categoryHeader)}></div>

                    {subcategories.map(({ subcategory, tasks: subcategoryTasks }) => (
                      <div key={`${category}-${subcategory}`} className="border-b last:border-b-0">
                        <div className={cn("h-7 border-b", getCategoryStyle(category).subcategoryHeader)}></div>

                        {/* Task Bars */}
                        {subcategoryTasks.map((task) => {
                          const position = getTaskPosition(task)
                          const duration = task.duration + 1
                          const hasTimeline = task.startDate && task.endDate

                          return (
                            <div
                              key={task.id}
                              className="relative h-[73px] border-b last:border-b-0 transition-colors"
                              style={{
                                backgroundColor:
                                  hoveredTaskId === task.id ? getCategoryStyle(category).hoverColor : "transparent",
                              }}
                              onMouseEnter={() => setHoveredTaskId(task.id)}
                              onMouseLeave={() => setHoveredTaskId(null)}
                            >
                              {/* Grid background */}
                              <div className="absolute inset-0 flex">
                                {Array.from({ length: totalDays }).map((_, i) => (
                                  <div
                                    key={i}
                                    className="border-r"
                                    style={{ width: `${DAY_WIDTH}px` }}
                                  ></div>
                                ))}
                              </div>

                              {hasTimeline && position ? (
                                <div className="absolute inset-0 flex items-center">
                                  <div
                                    className={cn(
                                      "h-10 rounded transition-all group relative",
                                      getCategoryStyle(category).bar,
                                      hoveredTaskId === task.id ? "opacity-100 shadow-lg" : "opacity-80",
                                    )}
                                    style={{
                                      position: "absolute",
                                      left: `${position.left}px`,
                                      width: `${position.width}px`,
                                      minWidth: "60px",
                                    }}
                                    title={`${task.name}\n${formatDate(task.startDate)} - ${formatDate(task.endDate)}\n${duration} day${duration > 1 ? "s" : ""}`}
                                  >
                                    <div className="relative h-full flex items-center justify-between px-2 text-white">
                                      <span className="text-xs font-semibold truncate flex-1">
                                        {duration}d
                                      </span>
                                      {position.width >= 120 && task.startDate && task.endDate && (
                                        <span className="text-[10px] opacity-90 ml-1">
                                          {task.startDate.toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                          })}{" "}
                                          -{" "}
                                          {task.endDate.toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                          })}
                                        </span>
                                      )}
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
                                              className="h-6 w-6 ml-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white shrink-0"
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
                                                  />
                                                </div>
                                                <div className="space-y-2">
                                                  <Label>End Date</Label>
                                                  <Input
                                                    type="date"
                                                    value={editEndDate}
                                                    onChange={(e) => handleEndDateChange(e.target.value)}
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
                              ) : (
                                onUpdateTask && (
                                  <div className="absolute inset-0 flex items-center justify-center">
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
                                          size="sm"
                                          variant="outline"
                                          className="opacity-50 hover:opacity-100 transition-opacity"
                                          onClick={() => handleEditTask(task)}
                                        >
                                          <Plus className="h-4 w-4 mr-2" />
                                          Add Timeline
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-80" align="center">
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
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label>End Date</Label>
                                              <Input
                                                type="date"
                                                value={editEndDate}
                                                onChange={(e) => handleEndDateChange(e.target.value)}
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
                                              {saving ? "Saving..." : "Add Timeline"}
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
                                  </div>
                                )
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ))}
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
        {Object.entries(categoryStyles).map(([category, style]) => (
          <div key={category} className="flex items-center gap-2">
            <div className={cn("w-4 h-4 rounded", style.bar)}></div>
            <span className="text-sm">{category}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
