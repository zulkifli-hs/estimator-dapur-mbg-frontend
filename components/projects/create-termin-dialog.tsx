"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, RotateCcw, ImageOff } from "lucide-react"
import { terminApi } from "@/lib/api/termin"
import { useToast } from "@/hooks/use-toast"

interface CreateTerminDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  onSuccess: () => void
  existingTermins?: any[]
  mode?: "create" | "update"
}

interface TerminEntry {
  id?: string
  name: string
  percentage: number
  note?: string
  isNew?: boolean
  isDeleteTermin?: boolean
  isDeleteAlbum?: boolean
}

export function CreateTerminDialog({ open, onOpenChange, projectId, onSuccess, existingTermins, mode = "create" }: CreateTerminDialogProps) {
  const [termins, setTermins] = useState<TerminEntry[]>([
    { name: "Down Payment", percentage: 30, note: "" },
    { name: "Progress 1", percentage: 30, note: "" },
    { name: "Progress 2", percentage: 30, note: "" },
    { name: "Final Payment", percentage: 10, note: "" },
  ])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Load existing termins when in update mode
  useEffect(() => {
    if (mode === "update" && existingTermins && existingTermins.length > 0) {
      const mappedTermins = existingTermins.map((t) => ({
        id: t._id,
        name: t.name,
        percentage: t.valueType === "%" ? t.value : 0,
        note: t.note || "",
        isNew: false,
        isDeleteTermin: false,
        isDeleteAlbum: false,
      }))
      setTermins(mappedTermins)
    }
  }, [mode, existingTermins])

  const handleAddTermin = () => {
    setTermins([...termins, { name: "", percentage: 0, note: "", isNew: true, isDeleteTermin: false, isDeleteAlbum: false }])
  }

  const handleRemoveTermin = (index: number) => {
    const termin = termins[index]
    // In update mode, existing termins are marked for deletion instead of removed
    if (mode === "update" && termin.id && !termin.isNew) {
      const updated = [...termins]
      const willDelete = !updated[index].isDeleteTermin
      updated[index] = {
        ...updated[index],
        isDeleteTermin: willDelete,
        // Reset album deletion when undoing termin deletion
        isDeleteAlbum: willDelete ? updated[index].isDeleteAlbum : false,
      }
      setTermins(updated)
      return
    }
    // New termins or create mode: remove from list
    const activeTermins = termins.filter((t) => !t.isDeleteTermin)
    if (activeTermins.length <= 1 && !termin.isDeleteTermin) {
      toast({
        title: "Cannot remove",
        description: "At least one payment term is required",
        variant: "destructive",
      })
      return
    }
    setTermins(termins.filter((_, i) => i !== index))
  }

  const handleToggleDeleteAlbum = (index: number) => {
    const updated = [...termins]
    updated[index] = { ...updated[index], isDeleteAlbum: !updated[index].isDeleteAlbum }
    setTermins(updated)
  }

  const handleTerminChange = (index: number, field: keyof TerminEntry, value: string | number) => {
    const updated = [...termins]
    updated[index] = { ...updated[index], [field]: value }
    setTermins(updated)
  }

  const getTotalPercentage = () => {
    // Exclude termins marked for deletion from total
    return termins
      .filter((t) => !t.isDeleteTermin)
      .reduce((sum, t) => sum + (Number(t.percentage) || 0), 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    // Only validate active (non-deleted) termins
    const activeTermins = termins.filter((t) => !t.isDeleteTermin)
    const hasEmptyName = activeTermins.some((t) => !t.name.trim())
    if (hasEmptyName) {
      toast({
        title: "Validation Error",
        description: "All payment terms must have a name",
        variant: "destructive",
      })
      return
    }

    const hasInvalidPercentage = activeTermins.some((t) => !t.percentage || t.percentage <= 0)
    if (hasInvalidPercentage) {
      toast({
        title: "Validation Error",
        description: "All payment terms must have a valid percentage greater than 0",
        variant: "destructive",
      })
      return
    }

    const totalPercentage = getTotalPercentage()
    if (totalPercentage !== 100) {
      toast({
        title: "Validation Error",
        description: `Total percentage must equal 100%. Current total: ${totalPercentage}%`,
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      if (mode === "update") {
        // Update existing termins — send _id, isNew, isDeleteTermin, isDeleteAlbum flags
        console.log("Submitting update with termins:", termins.map(t => ({
          _id: t.id || "",
          id: t.id || "",
          name: t.name,
          value: t.percentage,
          valueType: "%",
          note: t.note || "",
          isNew: t.isNew === true,
          isDeleteTermin: t.isDeleteTermin === true,
          isDeleteAlbum: t.isDeleteAlbum === true,
        })))
        await terminApi.updateFormat(projectId, termins.map(t => ({
          _id: t.id || "",
          id: t.id || "",
          name: t.name,
          value: t.percentage,
          valueType: "%",
          note: t.note || "",
          isNew: t.isNew === true,
          isDeleteTermin: t.isDeleteTermin === true,
          isDeleteAlbum: t.isDeleteAlbum === true,
        })))
        toast({
          title: "Success",
          description: "Payment terms updated successfully",
        })
      } else {
        // Create new termins
        await terminApi.createFormat(projectId, termins)
        toast({
          title: "Success",
          description: "Payment terms created successfully",
        })
      }
      onSuccess()
      onOpenChange(false)
      // Reset form
      if (mode === "create") {
        setTermins([
          { name: "Down Payment", percentage: 30, note: "" },
          { name: "Progress 1", percentage: 30, note: "" },
          { name: "Progress 2", percentage: 30, note: "" },
          { name: "Final Payment", percentage: 10, note: "" },
        ])
      }
    } catch (error) {
      console.error(`Failed to ${mode} termins:`, error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${mode} payment terms`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const totalPercentage = getTotalPercentage()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "update" ? "Update Payment Terms (Termin)" : "Create Payment Terms (Termin)"}</DialogTitle>
          <DialogDescription>
            {mode === "update" 
              ? "Update the payment schedule for this project. Total percentage must equal 100%."
              : "Define the payment schedule for this project. Total percentage must equal 100%."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {termins.map((termin, index) => (
              <div
                key={index}
                className={`space-y-3 p-4 border rounded-lg transition-opacity ${
                  termin.isDeleteTermin ? "opacity-50 border-destructive bg-destructive/5" : ""
                }`}
              >
                <div className="flex gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="mb-1.5 block">Payment Term Name</Label>
                      {termin.isNew && (
                        <Badge variant="secondary" className="text-xs">New</Badge>
                      )}
                      {termin.isDeleteTermin && (
                        <Badge variant="destructive" className="text-xs">To be deleted</Badge>
                      )}
                      {termin.isDeleteAlbum && !termin.isDeleteTermin && (
                        <Badge variant="outline" className="text-xs text-destructive border-destructive">Album to be deleted</Badge>
                      )}
                    </div>
                    <Input
                      placeholder="e.g., Down Payment, Progress 1"
                      value={termin.name}
                      onChange={(e) => handleTerminChange(index, "name", e.target.value)}
                      disabled={termin.isDeleteTermin}
                      required={!termin.isDeleteTermin}
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <Label className="mb-1.5 block">Percentage (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="0"
                      value={termin.percentage || ""}
                      onChange={(e) => handleTerminChange(index, "percentage", Number.parseFloat(e.target.value) || 0)}
                      disabled={termin.isDeleteTermin}
                      required={!termin.isDeleteTermin}
                    />
                  </div>
                  <div className="flex gap-1">
                    {/* Delete / undo button */}
                    <Button
                      type="button"
                      variant={termin.isDeleteTermin ? "outline" : "ghost"}
                      size="icon"
                      onClick={() => handleRemoveTermin(index)}
                      title={termin.isDeleteTermin ? "Undo deletion" : "Delete termin"}
                    >
                      {termin.isDeleteTermin
                        ? <RotateCcw className="h-4 w-4" />
                        : <Trash2 className="h-4 w-4 text-destructive" />}
                    </Button>
                  </div>
                </div>
                {!termin.isDeleteTermin && (
                  <div className="space-y-2">
                    <Label className="mb-1.5 block">Note (Optional)</Label>
                    <Input
                      placeholder="Add a note for this payment term"
                      value={termin.note || ""}
                      onChange={(e) => handleTerminChange(index, "note", e.target.value)}
                    />
                  </div>
                )}
                {/* Album deletion option — only shown when termin is marked for deletion */}
                {mode === "update" && termin.id && !termin.isNew && termin.isDeleteTermin && (
                  <div className="flex items-center justify-between rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2">
                    <div>
                      <p className="text-xs font-medium text-destructive">Also delete album?</p>
                      <p className="text-[11px] text-muted-foreground">Remove the progress album linked to this termin</p>
                    </div>
                    <Button
                      type="button"
                      variant={termin.isDeleteAlbum ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => handleToggleDeleteAlbum(index)}
                    >
                      <ImageOff className="h-3.5 w-3.5 mr-1.5" />
                      {termin.isDeleteAlbum ? "Yes, delete album" : "Keep album"}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <span className="font-medium">Total Percentage:</span>
              <span className={`text-lg font-bold ${totalPercentage === 100 ? "text-green-600" : "text-destructive"}`}>
                {totalPercentage}%
              </span>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleAddTermin}>
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Term
            </Button>
          </div>

          {totalPercentage !== 100 && (
            <p className="text-sm text-destructive">
              Warning: Total percentage must equal 100% before creating payment terms.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || totalPercentage !== 100}>
              {loading 
                ? (mode === "update" ? "Updating..." : "Creating...") 
                : (mode === "update" ? "Update Payment Terms" : "Create Payment Terms")
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
