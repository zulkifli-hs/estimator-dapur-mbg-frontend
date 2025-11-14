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
  const { toast } = useToast()

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
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-4 border-yellow-200 dark:border-yellow-700 shadow-2xl">
        {/* Pin at top */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 dark:bg-yellow-600 h-5 w-5 rounded-full shadow-md border-2 border-white dark:border-gray-800" />

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
                    <div className="h-px bg-yellow-300 dark:bg-yellow-600 flex-1" />
                    <h3 className="font-semibold text-sm text-muted-foreground px-2">
                      {post.comments.length} {post.comments.length === 1 ? 'Comment' : 'Comments'}
                    </h3>
                    <div className="h-px bg-yellow-300 dark:bg-yellow-600 flex-1" />
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
            <div className="p-4 border-t-2 border-yellow-300 dark:border-yellow-600 bg-yellow-100/50 dark:bg-yellow-900/30">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a comment to this note..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[80px] resize-none bg-white/80 dark:bg-black/40 border-yellow-200 dark:border-yellow-700 focus-visible:ring-yellow-400"
                  disabled={submitting}
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || submitting}
                  className="h-[80px] px-4 bg-yellow-500 hover:bg-yellow-600 text-white shadow-md"
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
