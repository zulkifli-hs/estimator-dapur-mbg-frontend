"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Building2, Calendar, User, Ruler, Layers, MessageSquare, Send, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { discussionsApi, type Post } from "@/lib/api/discussions"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/api/config"

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
  const { toast } = useToast()

  useEffect(() => {
    loadPosts()
  }, [project._id])

  const loadPosts = async () => {
    try {
      setLoading(true)
      const result = await discussionsApi.getPosts(project._id, 10)
      if (result.success) {
        setPosts(result.data)
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

  const totalTeamMembers =
    (project.estimators?.length || 0) +
    (project.projectManagers?.length || 0) +
    (project.finances?.length || 0) +
    (project.designers?.length || 0) +
    (project.admins?.length || 0)

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

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Type</span>
              <Badge variant="secondary">{project.type}</Badge>
            </div>

            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Client Company</p>
                <p className="text-sm text-muted-foreground">{project.companyClient?.name || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Building</p>
                <p className="text-sm text-muted-foreground">{project.building || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Ruler className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Area & Floor</p>
                <p className="text-sm text-muted-foreground">
                  {project.area} m² • Floor {project.floor}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Layers className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Owner Company</p>
                <p className="text-sm text-muted-foreground">{project.companyOwner?.name || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(project.createdAt).toLocaleDateString("id-ID", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team & Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Team Members</span>
              <span className="text-2xl font-bold">{totalTeamMembers}</span>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Estimators</span>
                <span className="font-medium">{project.estimators?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Project Managers</span>
                <span className="font-medium">{project.projectManagers?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Finances</span>
                <span className="font-medium">{project.finances?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Designers</span>
                <span className="font-medium">{project.designers?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Clients</span>
                <span className="font-medium">{project.clients?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Admins</span>
                <span className="font-medium">{project.admins?.length || 0}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Layout Document</span>
                <span className="font-medium">{project.detail?.layout ? "✓" : "—"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Contract Document</span>
                <span className="font-medium">{project.detail?.contract ? "✓" : "—"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Discussion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* New Post Input */}
          <div className="space-y-3">
            <Textarea
              placeholder="Tulis update atau diskusi dengan tim..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="min-h-[100px]"
              disabled={submitting}
            />
            <div className="flex justify-end">
              <Button onClick={handleAddPost} disabled={!newPost.trim() || submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Post
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Posts List */}
          <div className="space-y-6 pt-4 border-t">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Belum ada diskusi. Mulai diskusi pertama!</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post._id} className="space-y-4">
                  {/* Post Header */}
                  <div className="flex gap-3">
                    <Avatar>
                      <AvatarImage src={getUserAvatar(post.createdBy) || "/placeholder.svg"} />
                      <AvatarFallback>
                        {getUserName(post.createdBy)
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{getUserName(post.createdBy)}</span>
                        <span className="text-xs text-muted-foreground">{formatRelativeTime(post.createdAt)}</span>
                      </div>
                      <p className="text-sm mt-2 text-foreground whitespace-pre-wrap">{post.content}</p>
                    </div>
                  </div>

                  {/* Comments */}
                  {post.comments.length > 0 && (
                    <div className="ml-12 space-y-3 pl-4 border-l-2">
                      {post.comments.map((comment) => (
                        <div key={comment._id} className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={getUserAvatar(comment.createdBy) || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">
                              {getUserName(comment.createdBy)
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{getUserName(comment.createdBy)}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatRelativeTime(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm mt-1 text-muted-foreground whitespace-pre-wrap">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Comment Input */}
                  <div className="ml-12 flex gap-2">
                    <Textarea
                      placeholder="Tulis komentar..."
                      value={newComments[post._id] || ""}
                      onChange={(e) => setNewComments({ ...newComments, [post._id]: e.target.value })}
                      className="min-h-[60px] text-sm"
                      disabled={commentingPostId === post._id}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddComment(post._id)}
                      disabled={!newComments[post._id]?.trim() || commentingPostId === post._id}
                    >
                      {commentingPostId === post._id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Send className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
