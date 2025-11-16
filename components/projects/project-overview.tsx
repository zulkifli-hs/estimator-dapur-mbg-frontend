"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Building2, Calendar, User, Ruler, Layers, MessageSquare, Send, Loader2, Users, UserCheck, AlertTriangle, Crown, Briefcase, PenTool, DollarSign, Shield, TrendingUp, FileText, FolderOpen } from 'lucide-react'
import { useState, useEffect } from "react"
import { discussionsApi, type Post } from "@/lib/api/discussions"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/api/config"
import { PostDetailDialog } from "./post-detail-dialog"

interface ProjectOverviewProps {
  project: any
  onUpdate: () => void
}

export function ProjectOverview({ project }: ProjectOverviewProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [newPost, setNewPost] = useState("")
  const [newComments, setNewComments] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalPosts, setTotalPosts] = useState(0)
  const postsPerPage = 12
  const { toast } = useToast()

  useEffect(() => {
    loadPosts()
  }, [project._id, currentPage])

  const loadPosts = async () => {
    try {
      setLoading(true)
      const result = await discussionsApi.getPosts(project._id, postsPerPage, currentPage)
      if (result.success) {
        setPosts(result.data)
        setTotalPages(result.totalPage)
        setTotalPosts(result.totalData)
      } else {
        toast({
          title: "Error",
          description: "Failed to load discussions",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to load posts:", error)
      toast({
        title: "Error",
        description: "Failed to load discussions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const completenessChecks = [
    {
      label: "Layout Files Uploaded",
      completed: project.detail?.layout,
      description: "Check Layout menu"
    },
    {
      label: "Contract Files Uploaded",
      completed: project.detail?.contract,
      description: "Check Project menu"
    },
    {
      label: "Main BOQ Created",
      completed: false, // Will be checked via API in future
      description: "Check BOQ menu"
    },
    {
      label: "Additional BOQ Created",
      completed: false, // Will be checked via API in future
      description: "Check BOQ menu"
    },
    {
      label: "Invoice/Payment Terms Set",
      completed: false, // Will be checked via API in future
      description: "Check Invoice menu"
    },
    {
      label: "Documents Uploaded",
      completed: false, // Will be checked via API in future
      description: "Check Documents menu"
    },
  ]

  const completedCount = completenessChecks.filter(check => check.completed).length
  const completionPercentage = Math.round((completedCount / completenessChecks.length) * 100)

  const totalTeamMembers =
    (project.estimators?.length || 0) +
    (project.projectManagers?.length || 0) +
    (project.finances?.length || 0) +
    (project.designers?.length || 0) +
    (project.admins?.length || 0)

  const emptyRoles = [
    { name: 'Estimators', count: project.estimators?.length || 0 },
    { name: 'Project Managers', count: project.projectManagers?.length || 0 },
    { name: 'Finances', count: project.finances?.length || 0 },
    { name: 'Designers', count: project.designers?.length || 0 },
    { name: 'Admins', count: project.admins?.length || 0 },
  ].filter(role => role.count === 0)

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
    if (!newPost.trim()) return

    try {
      setSubmitting(true)
      const result = await discussionsApi.createPost(project._id, newPost)
      if (result.success) {
        setNewPost("")
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

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Project Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Owner and Client Section */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3 p-3 bg-gradient-to-br from-yellow-50/50 to-yellow-100/50 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
              <div className="bg-yellow-500/10 p-2 rounded-full">
                <Crown className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-1">Project Owner</p>
                <p className="text-sm font-semibold truncate">{project.companyOwner?.name || "N/A"}</p>
                {project.owner && (
                  <p className="text-xs text-muted-foreground truncate">
                    {project.owner.profile?.name || project.owner.email}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gradient-to-br from-blue-50/50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="bg-blue-500/10 p-2 rounded-full">
                <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-1">Client</p>
                <p className="text-sm font-semibold truncate">{project.companyClient?.name || "N/A"}</p>
                {project.clients && project.clients.length > 0 && (
                  <p className="text-xs text-muted-foreground truncate">
                    {project.clients[0].user?.profile?.name || project.clients[0].user?.email}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <span className="text-sm text-muted-foreground">Project Type</span>
                <p className="text-base font-medium mt-1">
                  <Badge variant="secondary">{project.type}</Badge>
                </p>
              </div>

              <div>
                <span className="text-sm text-muted-foreground">Area & Floor</span>
                <p className="text-base font-medium mt-1">
                  {project.area} m² • {project.floor} {project.floor > 1 ? 'Floors' : 'Floor'}
                </p>
              </div>

              {project.building && (
                <div>
                  <span className="text-sm text-muted-foreground">Building</span>
                  <p className="text-base font-medium mt-1">{project.building}</p>
                </div>
              )}

              <div>
                <span className="text-sm text-muted-foreground">Created</span>
                <p className="text-base font-medium mt-1">
                  {new Date(project.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Project Data Completeness
            </CardTitle>
            <Badge variant={completionPercentage === 100 ? "default" : "secondary"} className="text-lg px-3">
              {completionPercentage}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="mb-4">
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {completenessChecks.map((check, index) => (
            <div 
              key={index}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                check.completed 
                  ? 'bg-green-50/50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
                  : 'bg-orange-50/50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700'
              }`}
            >
              <div className={`mt-0.5 ${check.completed ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                {check.completed ? (
                  <UserCheck className="h-5 w-5" />
                ) : (
                  <AlertTriangle className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{check.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{check.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className={`border-2 ${hasEmptyRoles ? 'border-orange-200 dark:border-orange-700' : 'border-green-200 dark:border-green-700'}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Team Members
            {hasEmptyRoles && (
              <Badge variant="outline" className="ml-auto border-orange-500 text-orange-700 dark:text-orange-400">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {emptyRoles.length} role{emptyRoles.length > 1 ? 's' : ''} empty
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-700">
            <div className="flex items-center gap-3">
              <UserCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <span className="text-base font-medium">Total Team Members</span>
            </div>
            <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totalTeamMembers}</span>
          </div>

          <div className="space-y-2">
            {[
              { name: 'Estimators', count: project.estimators?.length || 0, icon: Users, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
              { name: 'Project Managers', count: project.projectManagers?.length || 0, icon: TrendingUp, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-900/20' },
              { name: 'Finances', count: project.finances?.length || 0, icon: DollarSign, color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' },
              { name: 'Designers', count: project.designers?.length || 0, icon: PenTool, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
              { name: 'Admins', count: project.admins?.length || 0, icon: Shield, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/20' },
            ].map((role) => {
              const Icon = role.icon
              return (
                <div 
                  key={role.name} 
                  className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                    role.count === 0 
                      ? 'bg-orange-50/50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700' 
                      : `${role.bgColor} border-transparent`
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${role.color}`} />
                    <span className="text-sm font-medium">{role.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {role.count === 0 && (
                      <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    )}
                    <span className={`text-lg font-bold ${role.count === 0 ? 'text-orange-600 dark:text-orange-400' : role.color}`}>
                      {role.count}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          <p className="text-xs text-muted-foreground text-center pt-2 border-t">
            Note: Owner and Client are not included in team member counts
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Discussion Board
            {totalPosts > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {totalPosts} {totalPosts === 1 ? "note" : "notes"}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg shadow-md border-2 border-green-200 dark:border-green-700 relative">
            <div className="absolute -top-3 left-4 bg-green-500 dark:bg-green-600 px-3 py-1 rounded-full text-xs font-medium shadow-sm text-white">
              New Post
            </div>
            <Textarea
              placeholder="Write a note for the team..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="min-h-[100px] bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-green-600/60 dark:placeholder:text-green-400/60 resize-none"
              disabled={submitting}
            />
            <div className="flex justify-end mt-2">
              <Button 
                onClick={handleAddPost} 
                disabled={!newPost.trim() || submitting}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white shadow-md"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="h-3 w-3 mr-2" />
                    Pin Note
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-16 w-16 mx-auto mb-3 opacity-30" />
                <p className="text-lg font-medium">No notes yet</p>
                <p className="text-sm">Pin your first note to the board!</p>
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {posts.map((post, index) => {
                    const colors = [
                      { bg: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20", border: "border-blue-200 dark:border-blue-700", pin: "bg-blue-400 dark:bg-blue-600" },
                      { bg: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20", border: "border-green-200 dark:border-green-700", pin: "bg-green-400 dark:bg-green-600" },
                      { bg: "from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20", border: "border-pink-200 dark:border-pink-700", pin: "bg-pink-400 dark:bg-pink-600" },
                      { bg: "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20", border: "border-purple-200 dark:border-purple-700", pin: "bg-purple-400 dark:bg-purple-600" },
                      { bg: "from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20", border: "border-orange-200 dark:border-orange-700", pin: "bg-orange-400 dark:bg-orange-600" },
                    ]
                    const color = colors[getColorForPost(post._id)]
                    const rotation = getRotationForPost(post._id)
                    
                    return (
                      <div
                        key={post._id}
                        onClick={() => setSelectedPostId(post._id)}
                        className={`bg-gradient-to-br ${color.bg} p-4 rounded-lg shadow-lg border-2 ${color.border} relative transform hover:scale-105 transition-transform duration-200 hover:shadow-xl cursor-pointer`}
                        style={{ transform: `rotate(${rotation}deg)` }}
                      >
                        <div className={`absolute -top-2 left-1/2 -translate-x-1/2 ${color.pin} h-4 w-4 rounded-full shadow-md border-2 border-white dark:border-gray-800`} />
                        
                        <div 
                          onClick={() => setSelectedPostId(post._id)}
                          className="cursor-pointer"
                        >
                          <div className="flex gap-2 items-start mb-3">
                            <Avatar className="h-8 w-8 border-2 border-white dark:border-gray-700 shadow-sm">
                              <AvatarImage src={getUserAvatar(post.createdBy) || "/placeholder.svg"} />
                              <AvatarFallback className="text-xs font-semibold">
                                {getUserName(post.createdBy)
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{getUserName(post.createdBy)}</p>
                              <p className="text-xs text-muted-foreground">{formatRelativeTime(post.createdAt)}</p>
                            </div>
                          </div>

                          <p className="text-sm mb-4 whitespace-pre-wrap line-clamp-6 leading-relaxed">{post.content}</p>

                          {post.comments.length > 0 && (
                            <div className="bg-white/50 dark:bg-black/20 rounded-md p-2 space-y-2 max-h-40 overflow-y-auto mb-3">
                              {post.comments.slice(0, 2).map((comment) => (
                                <div key={comment._id} className="flex gap-2 text-xs">
                                  <Avatar className="h-6 w-6 border border-white dark:border-gray-700">
                                    <AvatarImage src={getUserAvatar(comment.createdBy) || "/placeholder.svg"} />
                                    <AvatarFallback className="text-[10px]">
                                      {getUserName(comment.createdBy)
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{getUserName(comment.createdBy)}</p>
                                    <p className="text-muted-foreground line-clamp-2">{comment.content}</p>
                                  </div>
                                </div>
                              ))}
                              {post.comments.length > 2 && (
                                <p className="text-xs text-center text-muted-foreground font-medium">
                                  +{post.comments.length - 2} more comments
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div 
                          className="space-y-2 border-t pt-3 mt-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex gap-2">
                            <Textarea
                              placeholder="Add a comment..."
                              value={newComments[post._id] || ""}
                              onChange={(e) => setNewComments({ ...newComments, [post._id]: e.target.value })}
                              className={`min-h-[60px] text-xs resize-none bg-white/70 dark:bg-black/30 border ${color.border} focus-visible:ring-1 ${
                                getColorForPost(post._id) === 0 ? 'focus-visible:ring-blue-200 dark:focus-visible:ring-blue-700' :
                                getColorForPost(post._id) === 1 ? 'focus-visible:ring-green-200 dark:focus-visible:ring-green-700' :
                                getColorForPost(post._id) === 2 ? 'focus-visible:ring-pink-200 dark:focus-visible:ring-pink-700' :
                                getColorForPost(post._id) === 3 ? 'focus-visible:ring-purple-200 dark:focus-visible:ring-purple-700' :
                                'focus-visible:ring-orange-200 dark:focus-visible:ring-orange-700'
                              }`}
                              disabled={commentingPostId === post._id}
                            />
                            <Button
                              onClick={() => handleAddComment(post._id)}
                              disabled={!newComments[post._id]?.trim() || commentingPostId === post._id}
                              size="sm"
                              className={`h-[60px] px-3 shadow-md text-white ${
                                getColorForPost(post._id) === 0 ? 'bg-blue-500 hover:bg-blue-600' :
                                getColorForPost(post._id) === 1 ? 'bg-green-500 hover:bg-green-600' :
                                getColorForPost(post._id) === 2 ? 'bg-pink-500 hover:bg-pink-600' :
                                getColorForPost(post._id) === 3 ? 'bg-purple-500 hover:bg-purple-600' :
                                'bg-orange-500 hover:bg-orange-600'
                              }`}
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
                
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1 || loading}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            disabled={loading}
                            className="w-10"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
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
              </>
            )}
          </div>
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
