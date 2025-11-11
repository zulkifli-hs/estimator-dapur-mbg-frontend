"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, X, Loader2, Download } from "lucide-react"
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
}

export function AlbumDetailDialog({ open, onOpenChange, projectId, albumId, albumName }: AlbumDetailDialogProps) {
  const [album, setAlbum] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
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

    // Validate file type
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
      // Upload photo
      const uploadResponse = await uploadApi.uploadPhoto(file)

      // Add photo to album
      const response = await albumsApi.addPhoto(projectId, albumId, uploadResponse.url, uploadResponse.provider)

      if (response.success) {
        toast({
          title: "Success",
          description: "Photo uploaded successfully",
        })
        loadAlbum()
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

  const handleDeletePhoto = async (index: number) => {
    try {
      const response = await albumsApi.deletePhoto(projectId, albumId, [index])
      if (response.success) {
        toast({
          title: "Success",
          description: "Photo deleted successfully",
        })
        loadAlbum()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete photo",
        variant: "destructive",
      })
    }
  }

  const getPhotoUrl = (photo: any) => {
    return `${API_BASE_URL}/public/${photo.provider}/${photo.url}`
  }

  return (
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
          <div>
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
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                    <img
                      src={getPhotoUrl(photo) || "/placeholder.svg"}
                      alt={photo.name || "Photo"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Action buttons */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={() => window.open(getPhotoUrl(photo), "_blank")}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8"
                      onClick={() => handleDeletePhoto(index)}
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
  )
}
