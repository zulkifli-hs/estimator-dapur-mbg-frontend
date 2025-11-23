"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Building2,
  Send,
  Loader2,
  Users,
  AlertTriangle,
  Crown,
  Briefcase,
  PenTool,
  DollarSign,
  Shield,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Paperclip,
  X,
  FileText,
  Download,
  ImageIcon,
} from "lucide-react"
import { useState, useEffect } from "react"
import { discussionsApi, type Post } from "@/lib/api/discussions"
import { boqApi } from "@/lib/api/boq"
import { terminApi } from "@/lib/api/termin"
import { foldersApi } from "@/lib/api/folders"
import { albumsApi } from "@/lib/api/albums"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/api/config"
import { PostDetailDialog } from "./post-detail-dialog"
import { cn } from "@/lib/utils"
import { uploadApi } from "@/lib/api/upload" // Import uploadApi

interface ProjectOverviewProps {
  project: any
  onUpdate: () => void
}

function ProjectOverview({ project }: ProjectOverviewProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [newPost, setNewPost] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isUploading, setIsUploading] = useState(false)
  const [newComments, setNewComments] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalPosts, setTotalPosts] = useState(0)
  const postsPerPage = 12
  const { toast } = useToast()

  const [boqData, setBoqData] = useState<any[]>([])
  const [terminData, setTerminData] = useState<any[]>([])
  const [foldersData, setFoldersData] = useState<any[]>([])
  const [albumsData, setAlbumsData] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    loadPosts()
    loadProjectData()
  }, [project._id, currentPage])

  const loadProjectData = async () => {
    try {
      setDataLoading(true)
      const [boqResult, terminResult, foldersResult, albumsResult] = await Promise.all([
        boqApi.getByProject(project._id),
        terminApi.getByProject(project._id),
        foldersApi.getByProject(project._id),
        albumsApi.getByProject(project._id, { limit: 100 }),
      ])

      if (boqResult.success) setBoqData(boqResult.data || [])
      if (terminResult.success) setTerminData(terminResult.data || [])
      if (foldersResult.success) setFoldersData(foldersResult.data || [])
      if (albumsResult.success) {
        const albumsList = Array.isArray(albumsResult.data) ? albumsResult.data : albumsResult.data?.list || []
        setAlbumsData(albumsList)
      }
    } catch (error) {
      console.error("Failed to load project data:", error)
    } finally {
      setDataLoading(false)
    }
  }

  const loadPosts = async () => {
    try {
      setLoading(true)
      const result = await discussionsApi.getPosts(project._id, postsPerPage, currentPage)
      if (result.success) {
        setPosts(result.data)
        setTotalPages(result.totalPage)
        setTotalPosts(result.totalData)
      }
    } catch (error) {
      console.error("Failed to load posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const hasLayoutFiles = !!(project.detail?.layout && project.detail.layout.length > 0)
  const hasContractFiles = !!(
    project.detail?.contract &&
    Array.isArray(project.detail.contract) &&
    project.detail.contract.length > 0
  )
  const hasMainBOQ = boqData.some((boq: any) => boq.number === 1)
  const hasAdditionalBOQ = boqData.some((boq: any) => boq.number > 1)
  const hasTermins = terminData.length > 0
  const hasFolders = foldersData.length > 0
  const totalFolderFiles = foldersData.reduce((sum: number, folder: any) => sum + (folder.files?.length || 0), 0)

  const mainBOQ = boqData.find((boq: any) => boq.number === 1)
  const hasGanttChart =
    !!mainBOQ &&
    ((Array.isArray(mainBOQ.preliminary) && mainBOQ.preliminary.some((item: any) => item.startDate && item.endDate)) ||
      (Array.isArray(mainBOQ.fittingOut) &&
        mainBOQ.fittingOut.some(
          (cat: any) => Array.isArray(cat.products) && cat.products.some((p: any) => p.startDate && p.endDate),
        )) ||
      (Array.isArray(mainBOQ.furnitureWork) &&
        mainBOQ.furnitureWork.some(
          (cat: any) => Array.isArray(cat.products) && cat.products.some((p: any) => p.startDate && p.endDate),
        )))

  const totalAlbums = albumsData.length
  const totalPhotos = albumsData.reduce((sum: number, album: any) => sum + (album.list?.length || 0), 0)

  const completenessChecks = [
    {
      label: "Layout Files",
      completed: hasLayoutFiles,
      detail: hasLayoutFiles ? `${project.detail.layout.length} file(s)` : "Not uploaded",
    },
    {
      label: "Contract Files",
      completed: hasContractFiles,
      detail: hasContractFiles ? `${project.detail.contract.length} file(s)` : "Not uploaded",
    },
    {
      label: "Main BOQ",
      completed: hasMainBOQ,
      detail: hasMainBOQ ? "Created" : "Not created",
    },
    {
      label: "Gantt Chart",
      completed: hasGanttChart,
      detail: hasGanttChart ? "Timeline set" : "No timeline",
    },
    {
      label: "Payment Terms",
      completed: hasTermins,
      detail: hasTermins ? `${terminData.length} termin(s)` : "Not set",
    },
    {
      label: "Documents",
      completed: hasFolders && totalFolderFiles > 0,
      detail: hasFolders ? `${foldersData.length} folder(s), ${totalFolderFiles} file(s)` : "No documents",
    },
    {
      label: "Albums & Photos",
      completed: totalAlbums > 0 && totalPhotos > 0,
      detail: totalAlbums > 0 ? `${totalAlbums} album(s), ${totalPhotos} photo(s)` : "No photos",
    },
  ]

  const completedCount = completenessChecks.filter((check) => check.completed).length
  const completionPercentage = Math.round((completedCount / completenessChecks.length) * 100)

  const totalTeamMembers =
    (project.estimators?.length || 0) +
    (project.projectManagers?.length || 0) +
    (project.finances?.length || 0) +
    (project.designers?.length || 0) +
    (project.admins?.length || 0)

  const emptyRoles = [
    { name: "Estimators", count: project.estimators?.length || 0 },
    { name: "Project Managers", count: project.projectManagers?.length || 0 },
    { name: "Finances", count: project.finances?.length || 0 },
    { name: "Designers", count: project.designers?.length || 0 },
    { name: "Admins", count: project.admins?.length || 0 },
  ].filter((role) => role.count === 0)

  const hasEmptyRoles = emptyRoles.length > 0

  const formatRelativeTime = (date: string | Date) => {
    const timestamp = typeof date === "string" ? new Date(date) : date
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000)

    if (diffInSeconds < 60) return "Baru saja"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`
    return timestamp.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
  }

  const handleAddPost = async () => {
    if (!newPost.trim() && !selectedFile) return

    try {
      setSubmitting(true)
      let attachment: { url: string; provider: string } | undefined

      // Upload file if selected
      if (selectedFile) {
        setIsUploading(true)
        try {
          const uploadResult = await uploadApi.uploadFile(selectedFile, (progress) => {
            setUploadProgress(progress)
          })
          attachment = {
            url: uploadResult.url,
            provider: uploadResult.provider,
          }
        } catch (error) {
          console.error("Failed to upload file:", error)
          toast({
            title: "Error",
            description: "Failed to upload file",
            variant: "destructive",
          })
          setIsUploading(false)
          setSubmitting(false)
          return
        }
        setIsUploading(false)
      }

      // Create post with or without attachment
      const result = await discussionsApi.createPost(project._id, newPost, attachment)
      if (result.success) {
        setNewPost("")
        handleRemoveFile() // Clear file selection
        setCurrentPage(1)
        await loadPosts()
        toast({
          title: "Success",
          description: "Post created successfully",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to create post",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to create post:", error)
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddComment = async (postId: string) => {
    const commentText = newComments[postId]
    if (!commentText?.trim()) return

    try {
      setCommentingPostId(postId)
      const result = await discussionsApi.createComment(project._id, postId, commentText)
      if (result.success) {
        setNewComments({ ...newComments, [postId]: "" })
        await loadPosts()
        toast({
          title: "Success",
          description: "Comment added successfully",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to add comment",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to add comment:", error)
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      })
    } finally {
      setCommentingPostId(null)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)

    // Generate preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setFilePreview(null)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setFilePreview(null)
    setUploadProgress(0)
  }

  const getUserName = (user: any) => {
    return user?.profile?.name || user?.email?.split("@")[0] || "Unknown User"
  }

  const getUserAvatar = (user: any) => {
    if (user?.profile?.photo?.url && user?.profile?.photo?.provider) {
      return `${API_BASE_URL}/public/${user.profile.photo.provider}/${user.profile.photo.url}`
    }
    return undefined
  }

  const getColorForPost = (id: string) => {
    let hash = 0
    for (let i = 0; i < id.length; i++) {
      hash = (hash * 31 + id.charCodeAt(i) * (i + 1)) & 0xffffffff
    }
    hash = ((hash >> 16) ^ hash) * 0x45d9f3b
    hash = ((hash >> 16) ^ hash) * 0x45d9f3b
    hash = (hash >> 16) ^ hash
    return Math.abs(hash) % 5
  }

  const getRotationForPost = (id: string) => {
    let hash = 0
    for (let i = 0; i < id.length; i++) {
      hash = (hash * 37 + id.charCodeAt(i) * (i + 7)) & 0xffffffff
    }
    const rotations = [-1, -0.5, 0, 0.5, 1]
    return rotations[Math.abs(hash) % rotations.length]
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase()
    if (["pdf"].includes(ext || "")) return <FileText className="h-4 w-4" />
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) return <ImageIcon className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const canPreviewFile = (url: string) => {
    const ext = url.split(".").pop()?.toLowerCase()
    return ["jpg", "jpeg", "png", "gif", "webp", "pdf"].includes(ext || "")
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-5 w-5 text-primary" />
              Project Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                <Crown className="h-4 w-4 text-yellow-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Owner</p>
                  <p className="text-sm font-semibold truncate">
                    {project.owner?.profile?.name || project.owner?.email || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                <Briefcase className="h-4 w-4 text-blue-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Client</p>
                  <p className="text-sm font-semibold truncate">{project.companyClient?.name || "N/A"}</p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs pt-2 border-t">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">{project.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Area</span>
                <span className="font-medium">{project.area} m²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location</span>
                <span className="font-medium">
                  {project.building}, Floor {project.floor}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Completeness</CardTitle>
              <Badge variant={completionPercentage === 100 ? "default" : "secondary"} className="text-xs">
                {completionPercentage}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {dataLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-1.5">
                {completenessChecks.map((check, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-1.5 rounded hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {check.completed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{check.label}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{check.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Team</CardTitle>
              <Badge variant={hasEmptyRoles ? "outline" : "secondary"} className="text-xs">
                {totalTeamMembers}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {[
                { name: "Estimators", count: project.estimators?.length || 0, icon: Users },
                { name: "Project Managers", count: project.projectManagers?.length || 0, icon: TrendingUp },
                { name: "Finances", count: project.finances?.length || 0, icon: DollarSign },
                { name: "Designers", count: project.designers?.length || 0, icon: PenTool },
                { name: "Admins", count: project.admins?.length || 0, icon: Shield },
              ].map((role) => {
                const Icon = role.icon
                return (
                  <div
                    key={role.name}
                    className="flex items-center justify-between p-1.5 rounded hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs truncate">{role.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {role.count === 0 && <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />}
                      <span className={`text-xs font-semibold ${role.count === 0 ? "text-orange-500" : ""}`}>
                        {role.count}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base">
            Discussion Board
            {totalPosts > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {totalPosts}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-3 rounded-lg shadow border-2 border-green-200 dark:border-green-700 relative">
            <div className="absolute -top-2 left-4 bg-green-500 px-2 py-0.5 rounded-full text-xs font-medium text-white">
              New
            </div>
            <Textarea
              placeholder="Write a note..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="min-h-[80px] bg-transparent border-none focus-visible:ring-0 resize-none text-sm"
              disabled={submitting || isUploading}
            />

            {/* File preview section */}
            {selectedFile && (
              <div className="mt-2 p-2 bg-white/50 dark:bg-gray-800/50 rounded border border-green-300 dark:border-green-600">
                {filePreview ? (
                  <div className="relative">
                    <img src={filePreview || "/placeholder.svg"} alt="Preview" className="max-h-40 rounded" />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={handleRemoveFile}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getFileIcon(selectedFile.name)}
                      <span className="text-xs">{selectedFile.name}</span>
                    </div>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleRemoveFile}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                {isUploading && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-green-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between items-center mt-2">
              {/* File attachment button */}
              <label htmlFor="post-file-upload" className="cursor-pointer">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-green-600 hover:text-green-700 hover:bg-green-100"
                  disabled={submitting || isUploading}
                  onClick={(e) => {
                    e.preventDefault()
                    document.getElementById("post-file-upload")?.click()
                  }}
                >
                  <Paperclip className="h-3 w-3 mr-1" />
                  Attach
                </Button>
                <input
                  id="post-file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={submitting || isUploading}
                />
              </label>

              <Button
                onClick={handleAddPost}
                disabled={(!newPost.trim() && !selectedFile) || submitting || isUploading}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {submitting || isUploading ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    {isUploading ? "Uploading..." : "Posting..."}
                  </>
                ) : (
                  <>
                    <Send className="h-3 w-3 mr-1" />
                    Post
                  </>
                )}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No notes yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {posts.map((post, index) => {
                const colors = [
                  {
                    bg: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20",
                    border: "border-blue-200 dark:border-blue-700",
                    pin: "bg-blue-400",
                    button: "bg-blue-500 hover:bg-blue-600",
                    ring: "focus-visible:ring-blue-200 dark:focus-visible:ring-blue-700",
                  },
                  {
                    bg: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20",
                    border: "border-green-200 dark:border-green-700",
                    pin: "bg-green-400",
                    button: "bg-green-500 hover:bg-green-600",
                    ring: "focus-visible:ring-green-200 dark:focus-visible:ring-green-700",
                  },
                  {
                    bg: "from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20",
                    border: "border-pink-200 dark:border-pink-700",
                    pin: "bg-pink-400",
                    button: "bg-pink-500 hover:bg-pink-600",
                    ring: "focus-visible:ring-pink-200 dark:focus-visible:ring-pink-700",
                  },
                  {
                    bg: "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20",
                    border: "border-purple-200 dark:border-purple-700",
                    pin: "bg-purple-400",
                    button: "bg-purple-500 hover:bg-purple-600",
                    ring: "focus-visible:ring-purple-200 dark:focus-visible:ring-purple-700",
                  },
                  {
                    bg: "from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20",
                    border: "border-orange-200 dark:border-orange-700",
                    pin: "bg-orange-400",
                    button: "bg-orange-500 hover:bg-orange-600",
                    ring: "focus-visible:ring-orange-200 dark:focus-visible:ring-orange-700",
                  },
                ]
                const color = colors[getColorForPost(post._id)]
                return (
                  <div
                    key={post._id}
                    onClick={() => setSelectedPostId(post._id)}
                    className={cn(
                      "cursor-pointer p-3 rounded-lg shadow-md border-2 transition-all hover:shadow-lg hover:scale-[1.02]",
                      color.bg,
                      color.border,
                    )}
                    style={{
                      transform: `rotate(${getRotationForPost(post._id)}deg)`,
                    }}
                  >
                    <div className="flex gap-2 items-start mb-2">
                      <Avatar className="h-7 w-7 border-2 border-white dark:border-gray-700">
                        <AvatarImage src={getUserAvatar(post.createdBy) || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs">
                          {getUserName(post.createdBy)
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs truncate">{getUserName(post.createdBy)}</p>
                        <p className="text-[10px] text-muted-foreground">{formatRelativeTime(post.createdAt)}</p>
                      </div>
                    </div>

                    <p className="text-xs mb-2 whitespace-pre-wrap">{post.content}</p>

                    {/* Attachment display */}
                    {post.attachment && (
                      <div className="mb-2 mt-2 p-2 bg-white/30 dark:bg-black/20 rounded border border-current/20">
                        {post.attachment.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img
                            src={`${API_BASE_URL.replace("/api/v1", "")}/${post.attachment.url}`}
                            alt="Attachment"
                            className="w-full h-24 object-cover rounded"
                          />
                        ) : (
                          <div className="flex items-center gap-2 text-xs">
                            {getFileIcon(post.attachment.url)}
                            <span className="truncate flex-1">{post.attachment.url.split("/").pop()}</span>
                            <a
                              href={`${API_BASE_URL.replace("/api/v1", "")}/${post.attachment.url}`}
                              download
                              onClick={(e) => e.stopPropagation()}
                              className="hover:underline"
                            >
                              <Download className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {post.comments.length > 0 && (
                      <div className="bg-white/50 dark:bg-black/20 rounded p-2 space-y-1 mb-2 max-h-24 overflow-y-auto">
                        {post.comments.slice(0, 2).map((comment) => (
                          <div key={comment._id} className="flex gap-1.5 text-[10px]">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={getUserAvatar(comment.createdBy) || "/placeholder.svg"} />
                              <AvatarFallback className="text-[8px]">
                                {getUserName(comment.createdBy)
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{getUserName(comment.createdBy)}</p>
                              <p className="text-muted-foreground line-clamp-1">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                        {post.comments.length > 2 && (
                          <p className="text-[10px] text-center text-muted-foreground">
                            +{post.comments.length - 2} more
                          </p>
                        )}
                      </div>
                    )}

                    <div className="space-y-1 border-t pt-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1.5">
                        <Textarea
                          placeholder="Comment..."
                          value={newComments[post._id] || ""}
                          onChange={(e) => setNewComments({ ...newComments, [post._id]: e.target.value })}
                          className={`min-h-[50px] text-xs resize-none bg-white/70 dark:bg-black/30 border ${color.border} ${color.ring}`}
                          disabled={commentingPostId === post._id}
                        />
                        <Button
                          onClick={() => handleAddComment(post._id)}
                          disabled={!newComments[post._id]?.trim() || commentingPostId === post._id}
                          size="sm"
                          className={`h-[50px] px-2 text-white ${color.button}`}
                        >
                          {commentingPostId === post._id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Send className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || loading}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedPostId && (
        <PostDetailDialog
          open={!!selectedPostId}
          onClose={() => setSelectedPostId(null)}
          projectId={project._id}
          postId={selectedPostId}
          onUpdate={loadPosts}
        />
      )}
    </div>
  )
}

export { ProjectOverview }
