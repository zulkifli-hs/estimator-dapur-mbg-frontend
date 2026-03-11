"use client"

import { useMemo, useState, useRef, forwardRef, useImperativeHandle } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Link2, Pencil, Plus, Trash2 } from 'lucide-react'
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface GanttTask {
  id: string
  mongoId?: string
  name: string
  category: string
  startDate: Date | null
  endDate: Date | null
  duration: number
  dependOn?: string | null  // Gantt task ID (e.g. "preliminary-0")
}

interface GanttChartViewProps {
  tasks: GanttTask[]
  onUpdateTask?: (taskId: string, startDate: Date | null, endDate: Date | null, dependOn?: string | null) => Promise<void>
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

export interface GanttChartViewRef {
  exportPdf: () => Promise<void>
}

export const GanttChartView = forwardRef<GanttChartViewRef, GanttChartViewProps>(
  function GanttChartView({ tasks, onUpdateTask }, ref) {
  const { toast } = useToast()
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editStartDate, setEditStartDate] = useState<string>("")
  const [editEndDate, setEditEndDate] = useState<string>("")
  const [editDependOn, setEditDependOn] = useState<string>("none")
  const [saving, setSaving] = useState(false)
  const DAY_WIDTH = 36 // pixels per day

  // Refs for PDF export
  const ganttRootRef = useRef<HTMLDivElement>(null)
  const overflowContainerRef = useRef<HTMLDivElement>(null)
  const timelineScrollRef = useRef<HTMLDivElement>(null)
  const actionColumnRef = useRef<HTMLDivElement>(null)

  const exportGanttPdf = async () => {
    if (!ganttRootRef.current || !timelineScrollRef.current || !overflowContainerRef.current) return
    try {
      const html2canvas = (await import('html2canvas-pro')).default
      const { jsPDF } = await import('jspdf')

      const timelineEl = timelineScrollRef.current
      const containerEl = overflowContainerRef.current

      // Save original styles
      const origTimelineOverflow = timelineEl.style.overflow
      const origTimelineWidth = timelineEl.style.width
      const origContainerOverflow = containerEl.style.overflow

      // Hide Action column so it doesn't appear in the PDF
      const actionColEl = actionColumnRef.current
      if (actionColEl) actionColEl.style.display = 'none'

      // Expand to reveal full scrollable width
      timelineEl.style.overflow = 'visible'
      timelineEl.style.width = `${timelineEl.scrollWidth}px`
      containerEl.style.overflow = 'visible'

      // Allow browser to reflow
      await new Promise<void>((r) => setTimeout(r, 150))

      // Capture full scroll dimensions (not clipped offsetWidth)
      const fullWidth = ganttRootRef.current!.scrollWidth
      const fullHeight = ganttRootRef.current!.scrollHeight

      const canvas = await html2canvas(ganttRootRef.current!, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: fullWidth,
        height: fullHeight,
        windowWidth: fullWidth,
        scrollX: 0,
        scrollY: 0,
      })

      // Restore styles
      timelineEl.style.overflow = origTimelineOverflow
      timelineEl.style.width = origTimelineWidth
      containerEl.style.overflow = origContainerOverflow
      if (actionColEl) actionColEl.style.display = ''

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const ratio = canvas.width / canvas.height
      let imgWidth = pageWidth - 20
      let imgHeight = imgWidth / ratio
      if (imgHeight > pageHeight - 20) {
        imgHeight = pageHeight - 20
        imgWidth = imgHeight * ratio
      }
      const x = (pageWidth - imgWidth) / 2
      const y = (pageHeight - imgHeight) / 2

      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight)
      pdf.save('gantt-chart.pdf')
    } catch (error) {
      // Restore on error too
      if (actionColumnRef.current) actionColumnRef.current.style.display = ''
      console.error('Failed to export Gantt Chart PDF:', error)
      throw error
    }
  }

  useImperativeHandle(ref, () => ({ exportPdf: exportGanttPdf }))

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
      subcategoryHeader: "h-6 bg-purple-50 text-purple-800",
      hoverColor: "rgba(168, 85, 247, 0.15)",
    },
    "Furniture Work": {
      bar: "bg-green-500",
      categoryHeader: "bg-green-100 text-green-900",
      subcategoryHeader: "h-6 bg-green-50 text-green-800",
      hoverColor: "rgba(34, 197, 94, 0.15)",
    },
    "Mechanical / Electrical / Plumbing": {
      bar: "bg-amber-500",
      categoryHeader: "bg-amber-100 text-amber-900",
      subcategoryHeader: "h-6 bg-amber-50 text-amber-800",
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
    setEditDependOn(task.dependOn || "none")
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
      await onUpdateTask(editingTaskId, null, null, null)
      setEditingTaskId(null)
      setEditStartDate("")
      setEditEndDate("")
      setEditDependOn("none")
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
      await onUpdateTask(editingTaskId, start, end, editDependOn === "none" ? null : editDependOn || null)
      setEditingTaskId(null)
      setEditDependOn("none")
    } catch (error) {
      console.error("Failed to update task:", error)
    } finally {
      setSaving(false)
    }
  }

  // Build row position map for SVG dependency arrows
  const taskRowMap = useMemo(() => {
    const ROW_H = 64, CAT_H = 24, SUB_H = 20
    const map = new Map<string, { centerY: number; left: number; right: number }>()
    let y = 0
    groupedTasks.forEach(({ subcategories }) => {
      y += CAT_H
      subcategories.forEach(({ tasks: subTasks }) => {
        y += SUB_H
        subTasks.forEach((task) => {
          let left = -1, right = -1
          if (task.startDate && task.endDate) {
            const offset = Math.floor((task.startDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
            const dur = task.duration + 1
            left = offset * DAY_WIDTH
            right = left + dur * DAY_WIDTH
          }
          map.set(task.id, { centerY: y + ROW_H / 2, left, right })
          y += ROW_H
        })
      })
    })
    return map
  }, [groupedTasks, startDate])

  const totalTasksHeight = useMemo(() =>
    groupedTasks.reduce((acc, { subcategories }) =>
      acc + 24 + subcategories.reduce((s, { tasks: t }) => s + 20 + t.length * 64, 0), 0)
  , [groupedTasks])

  const dependencyArrows = useMemo(() =>
    tasks
      .filter(t => t.dependOn && taskRowMap.has(t.id) && taskRowMap.has(t.dependOn!))
      .map(t => {
        const from = taskRowMap.get(t.dependOn!)!
        const to = taskRowMap.get(t.id)!
        if (from.right < 0 || to.left < 0) return null
        return { id: t.id, from, to }
      })
      .filter(Boolean) as { id: string; from: { centerY: number; left: number; right: number }; to: { centerY: number; left: number; right: number } }[]
  , [tasks, taskRowMap])

  return (
    <div ref={ganttRootRef} className="space-y-4">
      <div ref={overflowContainerRef} className="border rounded-lg overflow-hidden">
        <div className="flex">
          {/* Sticky Left Panel - Task Name + Action */}
          <div className="flex shrink-0 border-r bg-background z-10">
            {/* Task Name Column */}
            <div className="w-72 border-r">
              {/* Header */}
              <div className="h-11 flex items-center px-3 font-semibold text-sm border-b bg-muted/50">Task Name</div>

              {/* Task Rows */}
              <div>
                {groupedTasks.map(({ category, subcategories }) => (
                  <div key={category} className="border-b last:border-b-0">
                    {/* Category Header */}
                    <div
                      className={cn(
                        "h-6 flex items-center px-2 font-semibold text-xs border-b",
                        getCategoryStyle(category).categoryHeader,
                      )}
                    >
                      {category}
                    </div>

                    {subcategories.map(({ subcategory, tasks: subcategoryTasks }) => (
                      <div key={`${category}-${subcategory}`} className="border-b last:border-b-0">
                        <div
                          className={cn(
                            "h-5 flex items-center px-3 text-[11px] font-medium border-b leading-none",
                            getCategoryStyle(category).subcategoryHeader,
                          )}
                        >
                          {subcategory}
                        </div>

                        {subcategoryTasks.map((task) => (
                          <div
                            key={task.id}
                            className="h-16 flex flex-col justify-center px-3 border-b last:border-b-0 transition-colors"
                            style={{
                              backgroundColor:
                                hoveredTaskId === task.id ? getCategoryStyle(category).hoverColor : "transparent",
                            }}
                            onMouseEnter={() => setHoveredTaskId(task.id)}
                            onMouseLeave={() => setHoveredTaskId(null)}
                          >
                            <p className="text-xs font-medium leading-tight line-clamp-2">{task.name}</p>
                            {task.startDate && task.endDate ? (
                              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                                {formatDate(task.startDate)} – {formatDate(task.endDate)}{" "}
                                <span className="font-medium text-primary">
                                  ({task.duration + 1}d)
                                </span>
                              </p>
                            ) : (
                              <p className="text-[10px] text-muted-foreground mt-0.5">No dates set</p>
                            )}
                            {task.dependOn && (() => {
                              const dep = tasks.find(t => t.id === task.dependOn)
                              return dep ? (
                                <p className="text-[10px] text-amber-600 mt-0.5 leading-tight flex items-center gap-0.5">
                                  <Link2 className="h-2.5 w-2.5 shrink-0" />
                                  <span className="truncate">{dep.name}</span>
                                </p>
                              ) : null
                            })()}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Column */}
            <div ref={actionColumnRef} className="w-14">
              {/* Header */}
              <div className="h-11 flex items-center justify-center px-1 font-semibold border-b bg-muted/50 text-xs">
                Action
              </div>

              {/* Action Rows */}
              <div>
                {groupedTasks.map(({ category, subcategories }) => (
                  <div key={category} className="border-b last:border-b-0">
                    {/* Category Header Spacer */}
                    <div className={cn("h-6 border-b", getCategoryStyle(category).categoryHeader)} />

                    {subcategories.map(({ subcategory, tasks: subcategoryTasks }) => (
                      <div key={`${category}-${subcategory}`} className="border-b last:border-b-0">
                        <div className={cn("h-5 border-b", getCategoryStyle(category).subcategoryHeader)} />

                        {subcategoryTasks.map((task) => (
                          <div
                            key={task.id}
                            className="h-16 flex items-center justify-center border-b last:border-b-0 transition-colors"
                            style={{
                              backgroundColor:
                                hoveredTaskId === task.id ? getCategoryStyle(category).hoverColor : "transparent",
                            }}
                            onMouseEnter={() => setHoveredTaskId(task.id)}
                            onMouseLeave={() => setHoveredTaskId(null)}
                          >
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
                                    size="sm"
                                    variant={task.startDate && task.endDate ? "ghost" : "outline"}
                                    className="h-7 w-7 p-0"
                                    title={task.startDate && task.endDate ? "Edit timeline" : "Add timeline"}
                                    onClick={() => handleEditTask(task)}
                                  >
                                    {task.startDate && task.endDate ? (
                                      <Pencil className="h-3.5 w-3.5" />
                                    ) : (
                                      <Plus className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80" align="start" side="right">
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
                                      <div className="space-y-2">
                                        <Label>Depends On</Label>
                                        <div className="flex gap-1 items-center">
                                          <Select value={editDependOn} onValueChange={setEditDependOn}>
                                            <SelectTrigger className="h-8 text-xs flex-1 min-w-0">
                                              <SelectValue placeholder="No dependency" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-48">
                                              <SelectItem value="none">— No dependency —</SelectItem>
                                              {tasks
                                                .filter(t => t.id !== editingTaskId)
                                                .map(t => (
                                                  <SelectItem key={t.id} value={t.id}>
                                                    <span className="text-xs line-clamp-1">{t.name}</span>
                                                  </SelectItem>
                                                ))}
                                            </SelectContent>
                                          </Select>
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            className={cn(
                                              "h-8 w-8 shrink-0 p-0 text-destructive hover:text-destructive hover:bg-destructive/10",
                                              editDependOn === "none" && "invisible pointer-events-none"
                                            )}
                                            onClick={() => setEditDependOn("none")}
                                            title="Remove dependency"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={handleSaveEdit}
                                        disabled={!editStartDate || !editEndDate || saving}
                                        className="flex-1"
                                      >
                                        {saving ? "Saving..." : task.startDate && task.endDate ? "Save" : "Add Timeline"}
                                      </Button>
                                      {task.startDate && task.endDate && (
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={handleDeleteDates}
                                          disabled={saving}
                                        >
                                          Delete
                                        </Button>
                                      )}
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
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Scrollable Timeline */}
          <div ref={timelineScrollRef} className="flex-1 overflow-x-auto">
            <div style={{ width: `${totalDays * DAY_WIDTH}px` }}>
              {/* Timeline Header - Fixed height to match task names header */}
              <div className="border-b bg-muted/50">
                <div className="flex border-b h-7">
                  {monthHeaders.map((header, index) => (
                    <div
                      key={index}
                      className="border-r last:border-r-0 flex items-center justify-center font-semibold text-xs bg-muted"
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
              <div className="relative">
                {groupedTasks.map(({ category, subcategories }) => (
                  <div key={category} className="border-b last:border-b-0">
                    {/* Category Header Spacer */}
                    <div className={cn("h-6 border-b", getCategoryStyle(category).categoryHeader)}></div>

                    {subcategories.map(({ subcategory, tasks: subcategoryTasks }) => (
                      <div key={`${category}-${subcategory}`} className="border-b last:border-b-0">
                        <div className={cn("h-5 border-b", getCategoryStyle(category).subcategoryHeader)}></div>

                        {/* Task Bars */}
                        {subcategoryTasks.map((task) => {
                          const position = getTaskPosition(task)
                          const duration = task.duration + 1
                          const hasTimeline = task.startDate && task.endDate

                          return (
                            <div
                              key={task.id}
                              className="relative h-16 border-b last:border-b-0 transition-colors"
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
                                      "h-7 rounded transition-all group relative",
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
                                      {/* Edit button on bar (secondary, hover only) */}
                                    </div>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                ))}

                {/* SVG dependency arrows overlay */}
                {dependencyArrows.length > 0 && (
                  <svg
                    className="absolute top-0 left-0 pointer-events-none z-20"
                    width={totalDays * DAY_WIDTH}
                    height={totalTasksHeight}
                    style={{ overflow: "visible" }}
                  >
                    <defs>
                      <marker id="dep-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
                        <path d="M0,0 L7,3 L0,6 Z" fill="#64748b" />
                      </marker>
                    </defs>
                    {dependencyArrows.map(({ id, from, to }) => {
                      const x1 = from.right
                      const y1 = from.centerY
                      const x2 = to.left
                      const y2 = to.centerY
                      let d: string
                      if (x2 > x1 + 5) {
                        // Forward: simple L-elbow
                        const mid = x1 + (x2 - x1) / 2
                        d = `M ${x1},${y1} H ${mid} V ${y2} H ${x2}`
                      } else {
                        // Backward / same column: route around
                        const bypass = Math.max(x1, x2) + 20
                        d = `M ${x1},${y1} H ${bypass} V ${y2} H ${x2}`
                      }
                      return (
                        <path
                          key={id}
                          d={d}
                          fill="none"
                          stroke="#64748b"
                          strokeWidth="1.5"
                          strokeDasharray="5 3"
                          markerEnd="url(#dep-arrow)"
                        />
                      )
                    })}
                  </svg>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 pt-4 border-t flex-wrap">
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
})
