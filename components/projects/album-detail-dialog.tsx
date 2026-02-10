"use client"

import type React from "react"
import { ImageIcon } from "lucide-react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, Loader2, Download, Maximize2 } from "lucide-react"
import { albumsApi } from "@/lib/api/albums"
import { uploadApi } from "@/lib/api/upload"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/api/config"

interface AlbumDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  albumId: string
  albumName: string
  onPhotoAdded?: () => void
}

export function AlbumDetailDialog({
  open,
  onOpenChange,
  projectId,
  albumId,
  albumName,
  onPhotoAdded,
}: AlbumDetailDialogProps) {
  const [album, setAlbum] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [photoToDelete, setPhotoToDelete] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [fullPhotoUrl, setFullPhotoUrl] = useState<string | null>(null)
  const [photoNote, setPhotoNote] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    if (open && albumId) {
      loadAlbum()
    }
  }, [open, albumId])

  const loadAlbum = async () => {
    setLoading(true)
    try {
      const response = await albumsApi.getAlbum(projectId, albumId)
      if (response.success) {
        setAlbum(response.data)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load album",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      const uploadResponse = await uploadApi.uploadPhoto(file)

      const response = await albumsApi.addPhoto(
        projectId,
        albumId,
        uploadResponse.url,
        uploadResponse.provider,
        photoNote || undefined
      )

      if (response.success) {
        toast({
          title: "Success",
          description: "Photo uploaded and added to album successfully",
        })
        setPhotoNote("")
        await loadAlbum()
        onPhotoAdded?.()
      } else {
        throw new Error("Failed to add photo to album")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload photo",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const handleDeletePhotoClick = (index: number) => {
    setPhotoToDelete(index)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (photoToDelete === null) return

    setDeleting(true)
    try {
      const response = await albumsApi.deletePhoto(projectId, albumId, [photoToDelete])
      if (response.success) {
        toast({
          title: "Success",
          description: "Photo deleted successfully",
        })
        await loadAlbum()
        onPhotoAdded?.()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete photo",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setDeleteConfirmOpen(false)
      setPhotoToDelete(null)
    }
  }

  const getPhotoUrl = (photo: any) => {
    if (!photo?.provider || !photo?.url) {
      return null
    }
    return `${API_BASE_URL}/public/${photo.provider}/${photo.url}`
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{albumName}</DialogTitle>
            <DialogDescription>
              {album?.list?.length || 0} photo{album?.list?.length !== 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Upload Button */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="photo-note">Note (Optional)</Label>
                <Input
                  id="photo-note"
                  placeholder="Add a note for the photo..."
                  value={photoNote}
                  onChange={(e) => setPhotoNote(e.target.value)}
                  disabled={uploading}
                />
              </div>
              <Button onClick={() => document.getElementById(`album-upload-${albumId}`)?.click()} disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </>
                )}
              </Button>
              <input
                id={`album-upload-${albumId}`}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUploadPhoto}
              />
            </div>

            {/* Photos Grid */}
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : album?.list && album.list.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {album.list.map((photo: any, index: number) => (
                  <div key={photo._id} className="relative group">
                    <div className="space-y-2">
                      <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                        {getPhotoUrl(photo) ? (
                          <img
                            src={(getPhotoUrl(photo) as string) || "/placeholder.svg"}
                            alt={photo.name || "Photo"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      {photo.note && (
                        <p className="text-xs text-muted-foreground px-1 line-clamp-2">{photo.note}</p>
                      )}
                    </div>
                    {/* Action buttons */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        onClick={() => setFullPhotoUrl(getPhotoUrl(photo))}
                        title="View full size"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        onClick={() => window.open(getPhotoUrl(photo), "_blank")}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                        onClick={() => handleDeletePhotoClick(index)}
                        title="Delete"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No photos in this album</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Photo</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this photo? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!fullPhotoUrl} onOpenChange={(open) => !open && setFullPhotoUrl(null)}>
        <DialogContent className="max-w-7xl max-h-[90vh] p-0">
          <div className="relative w-full h-full flex items-center justify-center bg-black/90 p-4">
            {fullPhotoUrl && (
              <img
                src={fullPhotoUrl || "/placeholder.svg"}
                alt="Full size photo"
                className="max-w-full max-h-[85vh] object-contain"
              />
            )}
            <Button
              size="icon"
              variant="secondary"
              className="absolute top-4 right-4"
              onClick={() => setFullPhotoUrl(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
