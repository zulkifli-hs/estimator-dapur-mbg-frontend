"use client"

import { useMemo } from "react"

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
}

export function GanttChartView({ tasks }: GanttChartViewProps) {
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
    const duration = task.duration

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
                      className="h-[73px] flex flex-col justify-center px-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors"
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
                {/* Day grid lines */}
                <div className="flex h-4">
                  {Array.from({ length: totalDays }).map((_, i) => (
                    <div key={i} className="border-r flex-1 text-center text-xs text-muted-foreground">
                      {i % 5 === 0 && i > 0 ? i : ""}
                    </div>
                  ))}
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
                          className="relative h-[73px] border-b last:border-b-0 hover:bg-muted/50 transition-colors"
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
                              } opacity-80 hover:opacity-100 transition-opacity cursor-pointer shadow-sm`}
                              style={{
                                marginLeft: position.left,
                                width: position.width,
                              }}
                              title={`${task.name} (${task.duration} days)`}
                            >
                              <div className="px-2 py-1 text-xs text-white font-medium truncate h-full flex items-center">
                                {task.duration}d
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
