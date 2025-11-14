"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Send } from 'lucide-react'
import { useState, useEffect } from "react"
import { discussionsApi, type Post } from "@/lib/api/discussions"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/api/config"

interface PostDetailDialogProps {
  open: boolean
  onClose: () => void
  projectId: string
  postId: string
  onUpdate?: () => void
}

export function PostDetailDialog({ open, onClose, projectId, postId, onUpdate }: PostDetailDialogProps) {
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [colorIndex, setColorIndex] = useState(0)
  const { toast } = useToast()

  const colors = [
    { bg: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20", border: "border-blue-200 dark:border-blue-700", pin: "bg-blue-400 dark:bg-blue-600", accent: "bg-blue-300 dark:bg-blue-600" },
    { bg: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20", border: "border-green-200 dark:border-green-700", pin: "bg-green-400 dark:bg-green-600", accent: "bg-green-300 dark:bg-green-600" },
    { bg: "from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20", border: "border-pink-200 dark:border-pink-700", pin: "bg-pink-400 dark:bg-pink-600", accent: "bg-pink-300 dark:bg-pink-600" },
    { bg: "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20", border: "border-purple-200 dark:border-purple-700", pin: "bg-purple-400 dark:bg-purple-600", accent: "bg-purple-300 dark:bg-purple-600" },
    { bg: "from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20", border: "border-orange-200 dark:border-orange-700", pin: "bg-orange-400 dark:bg-orange-600", accent: "bg-orange-300 dark:bg-orange-600" },
  ]
  
  const getColorForPost = (id: string) => {
    let hash = 0
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash)
    }
    return Math.abs(hash) % colors.length
  }

  const color = colors[getColorForPost(postId)]

  useEffect(() => {
    if (open && postId) {
      loadPostDetail()
    }
  }, [open, postId])

  const loadPostDetail = async () => {
    try {
      setLoading(true)
      const result = await discussionsApi.getPostDetail(projectId, postId)
      if (result.success) {
        setPost(result.data)
      } else {
        toast({
          title: "Error",
          description: "Failed to load post details",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to load post detail:", error)
      toast({
        title: "Error",
        description: "Failed to load post details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    try {
      setSubmitting(true)
      const result = await discussionsApi.createComment(projectId, postId, newComment)
      if (result.success) {
        setNewComment("")
        await loadPostDetail()
        onUpdate?.()
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
      setSubmitting(false)
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`max-w-2xl max-h-[85vh] flex flex-col p-0 bg-gradient-to-br ${color.bg} border-4 ${color.border} shadow-2xl`}>
        {/* Pin at top */}
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 ${color.pin} h-5 w-5 rounded-full shadow-md border-2 border-white dark:border-gray-800`} />

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : post ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 px-6 pt-8">
              {/* Post Content */}
              <div className="pb-4 space-y-4">
                <div className="flex gap-3 items-start">
                  <Avatar className="h-12 w-12 border-2 border-white dark:border-gray-700 shadow-md">
                    <AvatarImage src={getUserAvatar(post.createdBy) || "/placeholder.svg"} />
                    <AvatarFallback className="font-semibold">
                      {getUserName(post.createdBy)
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-lg">{getUserName(post.createdBy)}</p>
                      <span className="text-xs text-muted-foreground">•</span>
                      <p className="text-sm text-muted-foreground">{formatRelativeTime(post.createdAt)}</p>
                    </div>
                    <p className="text-base mt-3 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                  </div>
                </div>

                {/* Comments */}
                <div className="pt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={`h-px ${color.accent} flex-1`} />
                    <h3 className="font-semibold text-sm text-muted-foreground px-2">
                      {post.comments.length} {post.comments.length === 1 ? 'Comment' : 'Comments'}
                    </h3>
                    <div className={`h-px ${color.accent} flex-1`} />
                  </div>
                  
                  {post.comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8 italic">No comments yet. Be the first to comment!</p>
                  ) : (
                    <div className="space-y-3">
                      {post.comments.map((comment) => (
                        <div key={comment._id} className="flex gap-3 items-start bg-white/60 dark:bg-black/30 rounded-lg p-3 shadow-sm">
                          <Avatar className="h-9 w-9 border-2 border-white dark:border-gray-700 shadow-sm">
                            <AvatarImage src={getUserAvatar(comment.createdBy) || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs font-semibold">
                              {getUserName(comment.createdBy)
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-sm">{getUserName(comment.createdBy)}</p>
                              <span className="text-xs text-muted-foreground">•</span>
                              <p className="text-xs text-muted-foreground">{formatRelativeTime(comment.createdAt)}</p>
                            </div>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            {/* Add Comment Section */}
            <div className={`p-4 border-t-2 ${color.border} bg-white/40 dark:bg-black/20`}>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a comment to this note..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className={`min-h-[80px] resize-none bg-white/80 dark:bg-black/40 ${color.border} focus-visible:ring-primary`}
                  disabled={submitting}
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || submitting}
                  className="h-[80px] px-4 shadow-md"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center py-12 text-muted-foreground">
            <p>Failed to load post</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
