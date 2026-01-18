"use client"

import { useState, useEffect } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Calendar, User } from "lucide-react"
import { format } from "date-fns"

type BugScale = "critical" | "high" | "medium" | "low"
type BugStatus = "open" | "in_progress" | "review" | "resolved" | "closed"

interface BugReport {
  _id: string
  title: string
  description: string
  userId: string
  userEmail?: string
  url?: string
  images?: string[]
  scale: BugScale
  status: BugStatus
  createdAt: string
  updatedAt: string
}

interface BugKanbanBoardProps {
  refreshTrigger?: number
}

const columns: { id: BugStatus; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "in_progress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "resolved", label: "Resolved" },
  { id: "closed", label: "Closed" },
]

const scaleColors: Record<BugScale, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500",
}

const scaleLabels: Record<BugScale, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
}

export function BugKanbanBoard({ refreshTrigger }: BugKanbanBoardProps) {
  const [bugs, setBugs] = useState<BugReport[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPreview, setIsPreview] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    fetchBugs()
  }, [refreshTrigger])

  const fetchBugs = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/bug-report")
      const result = await response.json()

      if (result.success) {
        setBugs(result.data || [])
        setIsPreview(result.preview || false)
      } else {
        setError(result.error || "Failed to fetch bug reports")
      }
    } catch (err) {
      setError("Failed to load bug reports")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const bugId = active.id as string
    const newStatus = over.id as BugStatus

    // Optimistic update
    setBugs((prev) =>
      prev.map((bug) =>
        bug._id === bugId ? { ...bug, status: newStatus } : bug
      )
    )

    // Send update to server
    try {
      const response = await fetch(`/api/bug-report/${bugId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      const result = await response.json()

      if (!result.success) {
        // Revert on failure
        await fetchBugs()
        setError("Failed to update bug status")
      }
    } catch (err) {
      // Revert on error
      await fetchBugs()
      setError("Failed to update bug status")
    }
  }

  const getBugsByStatus = (status: BugStatus) => {
    return bugs.filter((bug) => bug.status === status)
  }

  const activeBug = activeId ? bugs.find((bug) => bug._id === activeId) : null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading bug reports...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {isPreview && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Preview mode – bug reports are not persisted. Deploy to production to enable full functionality.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              label={column.label}
              bugs={getBugsByStatus(column.id)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeBug && <BugCard bug={activeBug} isDragging />}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

interface KanbanColumnProps {
  id: BugStatus
  label: string
  bugs: BugReport[]
}

function KanbanColumn({ id, label, bugs }: KanbanColumnProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">{label}</h3>
        <Badge variant="secondary">{bugs.length}</Badge>
      </div>

      <div
        className="flex-1 space-y-3 min-h-[200px] bg-muted/20 rounded-lg p-3 border-2 border-dashed"
        data-status={id}
      >
        {bugs.map((bug) => (
          <BugCard key={bug._id} bug={bug} />
        ))}
      </div>
    </div>
  )
}

interface BugCardProps {
  bug: BugReport
  isDragging?: boolean
}

function BugCard({ bug, isDragging }: BugCardProps) {
  return (
    <Card
      className={`cursor-move hover:shadow-lg transition-shadow ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium line-clamp-2">
            {bug.title}
          </CardTitle>
          <div
            className={`w-2 h-2 rounded-full flex-shrink-0 ${scaleColors[bug.scale]}`}
            title={scaleLabels[bug.scale]}
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-2">
        <p className="text-xs text-muted-foreground line-clamp-2">
          {bug.description}
        </p>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          <span className="truncate">{bug.userEmail || bug.userId}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{format(new Date(bug.createdAt), "MMM d, yyyy")}</span>
        </div>

        <Badge variant="outline" className="text-xs">
          {scaleLabels[bug.scale]}
        </Badge>
      </CardContent>
    </Card>
  )
}
