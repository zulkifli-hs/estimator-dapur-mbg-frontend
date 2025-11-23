"use client"

import type React from "react"
import { useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { RefreshCw, Settings, MessageSquare } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
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
  FileText,
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [boqData, setBoqData] = useState<any[]>([])
  const [terminData, setTerminData] = useState<any[]>([])
  const [foldersData, setFoldersData] = useState<any[]>([])
  const [albumsData, setAlbumsData] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  const [cardStyle, setCardStyle] = useState({
    showBackground: true,
    showPin: true,
    showRotation: true,
  })
  const [showCustomizeDialog, setShowCustomizeDialog] = useState(false)
  const [stickySettings, setStickySettings] = useState({
    useColors: true,
    showPin: true,
    useRotation: true,
  })
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [addingComment, setAddingComment] = useState<string | null>(null)

  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [completenessChecks, setCompletenessChecks] = useState<any[]>([])
  const [hasEmptyRoles, setHasEmptyRoles] = useState(false)
  const [totalTeamMembers, setTotalTeamMembers] = useState(0)

  useEffect(() => {
    loadPosts()
    loadProjectData()
  }, [project._id, currentPage])

  useEffect(() => {
    const savedStyle = localStorage.getItem(`cardStyle-${project._id}`)
    if (savedStyle) {
      setCardStyle(JSON.parse(savedStyle))
    }
  }, [project._id])

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

      // Calculate completion percentage and completeness checks
      const totalChecks = 5
      const completedChecks = [
        project.owner,
        project.companyClient,
        project.type,
        project.area,
        project.building && project.floor,
      ].filter(Boolean).length
      setCompletionPercentage((completedChecks / totalChecks) * 100)

      // Define completeness checks
      setCompletenessChecks([
        { label: "Owner", detail: "Project owner is set", completed: !!project.owner },
        { label: "Client", detail: "Company client is set", completed: !!project.companyClient },
        { label: "Type", detail: "Project type is set", completed: !!project.type },
        { label: "Area", detail: "Project area is set", completed: !!project.area },
        { label: "Location", detail: "Building and floor are set", completed: !!project.building && !!project.floor },
      ])

      // Check for empty roles
      const roles = [
        project.estimators?.length,
        project.projectManagers?.length,
        project.finances?.length,
        project.designers?.length,
        project.admins?.length,
      ]
      setHasEmptyRoles(roles.some((role) => role === 0))

      // Calculate total team members
      setTotalTeamMembers(roles.reduce((sum, role) => sum + (role || 0), 0))
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

  const saveCardStyle = (newStyle: typeof cardStyle) => {
    setCardStyle(newStyle)
    localStorage.setItem(`cardStyle-${project._id}`, JSON.stringify(newStyle))
  }

  const handlePostClick = (post: Post) => {
    setSelectedPostId(post._id)
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
    const commentText = commentInputs[postId]
    if (!commentText?.trim()) return

    try {
      setAddingComment(postId)
      const result = await discussionsApi.createComment(project._id, postId, commentText)
      if (result.success) {
        setCommentInputs({ ...commentInputs, [postId]: "" })
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
      setAddingComment(null)
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

  const getAttachmentUrl = (provider: string, url: string) => {
    return `${API_BASE_URL}/public/${provider}/${url}`
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

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle>Discussion Board</CardTitle>
            <span className="text-sm text-muted-foreground">
              ({posts.length} {posts.length === 1 ? "post" : "posts"})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={loadPosts} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowCustomizeDialog(true)}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {posts.map((post, index) => {
            const colors = [
              {
                bg: "from-blue-200 to-blue-300 dark:from-blue-600 dark:to-blue-700",
                border: "border-blue-400 dark:border-blue-500",
                pin: "bg-blue-500",
                button: "bg-blue-600 hover:bg-blue-700 text-white",
                ring: "focus-visible:ring-blue-400 dark:focus-visible:ring-blue-500",
                text: "text-blue-900 dark:text-blue-50",
              },
              {
                bg: "from-yellow-200 to-yellow-300 dark:from-yellow-600 dark:to-yellow-700",
                border: "border-yellow-400 dark:border-yellow-500",
                pin: "bg-yellow-500",
                button: "bg-yellow-600 hover:bg-yellow-700 text-white",
                ring: "focus-visible:ring-yellow-400 dark:focus-visible:ring-yellow-500",
                text: "text-yellow-900 dark:text-yellow-50",
              },
              {
                bg: "from-pink-200 to-pink-300 dark:from-pink-600 dark:to-pink-700",
                border: "border-pink-400 dark:border-pink-500",
                pin: "bg-pink-500",
                button: "bg-pink-600 hover:bg-pink-700 text-white",
                ring: "focus-visible:ring-pink-400 dark:focus-visible:ring-pink-500",
                text: "text-pink-900 dark:text-pink-50",
              },
              {
                bg: "from-green-200 to-green-300 dark:from-green-600 dark:to-green-700",
                border: "border-green-400 dark:border-green-500",
                pin: "bg-green-500",
                button: "bg-green-600 hover:bg-green-700 text-white",
                ring: "focus-visible:ring-green-400 dark:focus-visible:ring-green-500",
                text: "text-green-900 dark:text-green-50",
              },
              {
                bg: "from-orange-200 to-orange-300 dark:from-orange-600 dark:to-orange-700",
                border: "border-orange-400 dark:border-orange-500",
                pin: "bg-orange-500",
                button: "bg-orange-600 hover:bg-orange-700 text-white",
                ring: "focus-visible:ring-orange-400 dark:focus-visible:ring-orange-500",
                text: "text-orange-900 dark:text-orange-50",
              },
            ]

            const colorIndex = getColorForPost(post._id)
            const color = colors[colorIndex]
            const rotation = getRotationForPost(post._id)

            return (
              <div
                key={post._id}
                className={`relative p-4 rounded-lg shadow-md cursor-pointer transition-all hover:shadow-xl ${
                  stickySettings.useColors
                    ? `bg-gradient-to-br ${color.bg} border-2 ${color.border}`
                    : "bg-card border-2 border-border"
                }`}
                style={{
                  transform: stickySettings.useRotation ? `rotate(${rotation}deg)` : "rotate(0deg)",
                }}
                onClick={() => handlePostClick(post)}
              >
                {/* Pin */}
                {stickySettings.showPin && (
                  <div
                    className={`absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full shadow-md ${
                      stickySettings.useColors ? color.pin : "bg-muted-foreground"
                    }`}
                  />
                )}

                {/* Post Content */}
                <div className="space-y-3">
                  <p
                    className={`text-sm whitespace-pre-wrap line-clamp-5 ${stickySettings.useColors ? color.text : ""}`}
                  >
                    {post.content}
                  </p>

                  {post.attachment && (
                    <div className="mt-2">
                      {post.attachment.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <img
                          src={getAttachmentUrl(post.attachment.provider, post.attachment.url) || "/placeholder.svg"}
                          alt="Attachment"
                          className="w-full h-32 object-cover rounded"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Paperclip className="h-3 w-3" />
                          <span>File attached</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Separator */}
                  <div className={`border-t ${stickySettings.useColors ? color.border : "border-border"}`} />

                  {/* Comment Input */}
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Add a comment..."
                      value={commentInputs[post._id] || ""}
                      onChange={(e) =>
                        setCommentInputs({
                          ...commentInputs,
                          [post._id]: e.target.value,
                        })
                      }
                      onClick={(e) => e.stopPropagation()}
                      className={`flex-1 min-h-[60px] text-xs resize-none ${
                        stickySettings.useColors ? `${color.border} ${color.ring}` : ""
                      }`}
                    />
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddComment(post._id)
                      }}
                      disabled={!commentInputs[post._id]?.trim() || addingComment === post._id}
                      className={stickySettings.useColors ? color.button : ""}
                    >
                      {addingComment === post._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Comments Count */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MessageSquare className="h-3 w-3" />
                    <span>
                      {post.comments?.length || 0} {post.comments?.length === 1 ? "comment" : "comments"}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Dialog open={showCustomizeDialog} onOpenChange={setShowCustomizeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Customize Sticky Notes</DialogTitle>
            <DialogDescription>Customize how the discussion board sticky notes are displayed</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">Colorful Background</label>
                <p className="text-xs text-muted-foreground">Show colored backgrounds for notes</p>
              </div>
              <Button
                variant={stickySettings.useColors ? "default" : "outline"}
                size="sm"
                onClick={() => setStickySettings({ ...stickySettings, useColors: !stickySettings.useColors })}
              >
                {stickySettings.useColors ? "On" : "Off"}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">Pin Icon</label>
                <p className="text-xs text-muted-foreground">Show decorative pin at the top</p>
              </div>
              <Button
                variant={stickySettings.showPin ? "default" : "outline"}
                size="sm"
                onClick={() => setStickySettings({ ...stickySettings, showPin: !stickySettings.showPin })}
              >
                {stickySettings.showPin ? "On" : "Off"}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">Rotation Effect</label>
                <p className="text-xs text-muted-foreground">Tilt notes for a natural look</p>
              </div>
              <Button
                variant={stickySettings.useRotation ? "default" : "outline"}
                size="sm"
                onClick={() => setStickySettings({ ...stickySettings, useRotation: !stickySettings.useRotation })}
              >
                {stickySettings.useRotation ? "On" : "Off"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomizeDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedPostId && (
        <PostDetailDialog
          open={!!selectedPostId}
          onClose={() => setSelectedPostId(null)}
          projectId={project._id}
          postId={selectedPostId}
          onUpdate={loadPosts}
          cardStyle={cardStyle}
        />
      )}
    </div>
  )
}

export { ProjectOverview }
