"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X } from "lucide-react"

interface FullscreenBoqDialogProps {
  open: boolean
  title: string
  onOpenChange: (open: boolean) => void
  renderContent: () => React.ReactNode
}

export function FullscreenBoqDialog({ open, title, onOpenChange, renderContent }: FullscreenBoqDialogProps) {
  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-screen h-screen max-w-none max-h-none rounded-none p-0 flex flex-col gap-0"
      >
        <DialogHeader className="h-auto border-b px-6 py-4 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>Viewing BOQ in full-screen mode</DialogDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto p-6">{renderContent()}</div>
      </DialogContent>
    </Dialog>
  )
}
