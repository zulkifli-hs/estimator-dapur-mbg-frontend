"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { albumsApi } from "@/lib/api/albums"
import { useToast } from "@/hooks/use-toast"

interface CreateAlbumDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  onSuccess: () => void
}

export function CreateAlbumDialog({ open, onOpenChange, projectId, onSuccess }: CreateAlbumDialogProps) {
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Album name is required",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await albumsApi.create({ projectId, name: name.trim() })

      if (response.success) {
        toast({
          title: "Success",
          description: "Album created successfully",
        })
        setName("")
        onOpenChange(false)
        onSuccess()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create album",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Album</DialogTitle>
            <DialogDescription>Create a new photo album for this project</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="albumName">Album Name</Label>
              <Input
                id="albumName"
                placeholder="e.g., Site Preparation, Foundation Work"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Album"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
