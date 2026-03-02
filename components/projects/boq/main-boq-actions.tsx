"use client"

import { Button } from "@/components/ui/button"
import { Edit, Maximize2, RefreshCw, Save, Send } from "lucide-react"

interface MainBoqActionsProps {
  status: string
  onFullscreen: () => void
  onEdit: () => void
  onSaveTemplate: () => void
  onReplaceTemplate: () => void
  onRequestApproval: () => void
}

export function MainBoqActions({
  status,
  onFullscreen,
  onEdit,
  onSaveTemplate,
  onReplaceTemplate,
  onRequestApproval,
}: MainBoqActionsProps) {
  const statusLower = status.toLowerCase()
  const canDraftActions = ["draft", "rejected"].includes(statusLower)
  const canRerequest = statusLower === "request"

  return (
    <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
      <Button variant="outline" size="sm" onClick={onFullscreen}>
        <Maximize2 className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Full Screen</span>
      </Button>

      {canDraftActions && (
        <>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
        </>
      )}

      <Button variant="outline" size="sm" onClick={onSaveTemplate}>
        <Save className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Save as Template</span>
      </Button>

      {canDraftActions && (
        <>
          <Button variant="outline" size="sm" onClick={onReplaceTemplate}>
            <RefreshCw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Replace with Template</span>
          </Button>
          <Button variant="default" size="sm" onClick={onRequestApproval}>
            <Send className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Request Approval</span>
          </Button>
        </>
      )}

      {canRerequest && (
        <Button variant="outline" size="sm" onClick={onRequestApproval} className="col-span-2 sm:col-span-1">
          <Send className="h-4 w-4 mr-2" />
          Re-request Approval
        </Button>
      )}
    </div>
  )
}
