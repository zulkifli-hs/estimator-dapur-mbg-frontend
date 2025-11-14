"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, ImageIcon, Trash2 } from 'lucide-react'
import { albumsApi } from "@/lib/api/albums"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ProjectAlbumsProps {
  projectId: string
}

export function ProjectAlbums({ projectId }: ProjectAlbumsProps) {
  const [albums, setAlbums] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newAlbumName, setNewAlbumName] = useState("")

  useEffect(() => {
    loadAlbums()
  }, [projectId])

  const loadAlbums = async () => {
    try {
      const response = await albumsApi.getByProject(projectId)
      if (response.success && response.data) {
        setAlbums(response.data)
      }
    } catch (error) {
      console.error("Failed to load albums:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim()) return

    try {
      const response = await albumsApi.create({
        projectId,
        name: newAlbumName,
      })
      if (response.success) {
        setNewAlbumName("")
        setCreateDialogOpen(false)
        loadAlbums()
      }
    } catch (error) {
      console.error("Failed to create album:", error)
    }
  }

  const handleDeleteAlbum = async (albumId: string) => {
    if (!confirm("Are you sure you want to delete this album?")) return

    try {
      const response = await albumsApi.delete(albumId)
      if (response.success) {
        loadAlbums()
      }
    } catch (error) {
      console.error("Failed to delete album:", error)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Photo Albums</CardTitle>
              <CardDescription>Organize project photos into albums</CardDescription>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Album
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Album</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="album-name">Album Name</Label>
                    <Input
                      id="album-name"
                      value={newAlbumName}
                      onChange={(e) => setNewAlbumName(e.target.value)}
                      placeholder="e.g., Before Photos, Progress Week 1"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateAlbum}>Create Album</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading albums...</p>
          ) : albums.length === 0 ? (
            <Alert>
              <AlertDescription className="text-center">
                No albums created yet. Click "New Album" to organize your project photos.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {albums.map((album) => (
                <Card key={album.id} className="overflow-hidden">
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{album.name}</p>
                        <p className="text-sm text-muted-foreground">0 photos</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteAlbum(album.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
