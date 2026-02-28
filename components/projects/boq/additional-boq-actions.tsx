"use client"

import { Button } from "@/components/ui/button"
import { Edit, Maximize2, RefreshCw, Save, Trash2 } from "lucide-react"

interface AdditionalBoqActionsProps {
  status: string
  onFullscreen: () => void
  onEdit: () => void
  onSaveTemplate: () => void
  onReplaceTemplate: () => void
  onDelete: () => void
}

export function AdditionalBoqActions({
  status,
  onFullscreen,
  onEdit,
  onSaveTemplate,
  onReplaceTemplate,
  onDelete,
}: AdditionalBoqActionsProps) {
  const statusLower = status.toLowerCase()
  const canDraftActions = ["draft", "rejected"].includes(statusLower)

  return (
    <div className="flex gap-2 w-full sm:w-auto flex-wrap">
      <Button variant="outline" size="sm" onClick={onFullscreen} className="flex-1 sm:flex-none">
        <Maximize2 className="h-4 w-4 mr-2" />
        Full Screen
      </Button>

      {canDraftActions ? (
        <>
          <Button variant="outline" size="sm" onClick={onEdit} className="flex-1 sm:flex-none">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={onSaveTemplate} className="flex-1 sm:flex-none">
            <Save className="h-4 w-4 mr-2" />
            Save as Template
          </Button>
          <Button variant="outline" size="sm" onClick={onReplaceTemplate} className="flex-1 sm:flex-none">
            <RefreshCw className="h-4 w-4 mr-2" />
            Replace with Template
          </Button>
        </>
      ) : (
        <Button variant="outline" size="sm" onClick={onEdit} className="flex-1 sm:flex-none">
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      )}

      <Button variant="outline" size="sm" className="flex-1 sm:flex-none bg-transparent" onClick={onDelete}>
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
      </Button>
    </div>
  )
}
