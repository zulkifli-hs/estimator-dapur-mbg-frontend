"use client"

import type React from "react"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Send, Download, FileText, ImageIcon, Paperclip, X } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { discussionsApi, type Post } from "@/lib/api/discussions"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/api/config"
import { uploadApi } from "@/lib/api/upload"

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const colors = [
    {
      bg: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20",
      border: "border-blue-200 dark:border-blue-700",
      pin: "bg-blue-400 dark:bg-blue-600",
      accent: "bg-blue-300 dark:bg-blue-600",
      button: "bg-blue-500 hover:bg-blue-600 text-white border-blue-600",
      ring: "ring-blue-200 dark:ring-blue-700",
    },
    {
      bg: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20",
      border: "border-green-200 dark:border-green-700",
      pin: "bg-green-400 dark:bg-green-600",
      accent: "bg-green-300 dark:bg-green-600",
      button: "bg-green-500 hover:bg-green-600 text-white border-green-600",
      ring: "ring-green-200 dark:ring-green-700",
    },
    {
      bg: "from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20",
      border: "border-pink-200 dark:border-pink-700",
      pin: "bg-pink-400 dark:bg-pink-600",
      accent: "bg-pink-300 dark:bg-pink-600",
      button: "bg-pink-500 hover:bg-pink-600 text-white border-pink-600",
      ring: "ring-pink-200 dark:ring-pink-700",
    },
    {
      bg: "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20",
      border: "border-purple-200 dark:border-purple-700",
      pin: "bg-purple-400 dark:bg-purple-600",
      accent: "bg-purple-300 dark:bg-purple-600",
      button: "bg-purple-500 hover:bg-purple-600 text-white border-purple-600",
      ring: "ring-purple-200 dark:ring-purple-700",
    },
    {
      bg: "from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20",
      border: "border-orange-200 dark:border-orange-700",
      pin: "bg-orange-400 dark:bg-orange-600",
      accent: "bg-orange-300 dark:bg-orange-600",
      button: "bg-orange-500 hover:bg-orange-600 text-white border-orange-600",
      ring: "ring-orange-200 dark:ring-orange-700",
    },
  ]

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
    if (!newComment.trim() && !selectedFile) return

    try {
      setSubmitting(true)
      let attachment: { url: string; provider: string } | undefined

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

      const result = await discussionsApi.createComment(projectId, postId, newComment, attachment)
      if (result.success) {
        setNewComment("")
        handleRemoveFile()
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)

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
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const getAttachmentUrl = (attachment: { url: string; provider: string }) => {
    return `${API_BASE_URL}/public/${attachment.provider}/${attachment.url}`
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

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase()
    if (["pdf"].includes(ext || "")) return <FileText className="h-5 w-5" />
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) return <ImageIcon className="h-5 w-5" />
    return <FileText className="h-5 w-5" />
  }

  const isImageFile = (url: string) => {
    return url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
  }

  const isPdfFile = (url: string) => {
    return url.match(/\.pdf$/i)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={`max-w-2xl h-[90vh] flex flex-col p-0 bg-gradient-to-br ${color.bg} border-4 ${color.border} shadow-2xl`}
      >
        <div
          className={`absolute -top-3 left-1/2 -translate-x-1/2 ${color.pin} h-5 w-5 rounded-full shadow-md border-2 border-white dark:border-gray-800`}
        />

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : post ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 h-0 px-6 pt-8 pb-4">
              <div className="space-y-4">
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

                    {post.attachment && (
                      <div className="mt-4 p-3 bg-white/60 dark:bg-black/30 rounded-lg border-2 border-white dark:border-gray-700 shadow-sm">
                        {isImageFile(post.attachment.url) ? (
                          <div className="space-y-2">
                            <img
                              src={getAttachmentUrl(post.attachment) || "/placeholder.svg"}
                              alt="Attachment"
                              className="w-full rounded-lg shadow-sm max-h-96 object-contain"
                            />
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground truncate flex-1">
                                {post.attachment.url.split("/").pop()}
                              </span>
                              <a
                                href={getAttachmentUrl(post.attachment)}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-primary hover:underline ml-2"
                              >
                                <Download className="h-4 w-4" />
                                <span>Download</span>
                              </a>
                            </div>
                          </div>
                        ) : isPdfFile(post.attachment.url) ? (
                          <div className="space-y-3">
                            <iframe
                              src={getAttachmentUrl(post.attachment)}
                              className="w-full h-96 rounded border"
                              title="PDF Preview"
                            />
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {getFileIcon(post.attachment.url)}
                                <span className="text-muted-foreground truncate">
                                  {post.attachment.url.split("/").pop()}
                                </span>
                              </div>
                              <a
                                href={getAttachmentUrl(post.attachment)}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-primary hover:underline ml-2"
                              >
                                <Download className="h-4 w-4" />
                                <span>Download</span>
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {getFileIcon(post.attachment.url)}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{post.attachment.url.split("/").pop()}</p>
                                <p className="text-xs text-muted-foreground">{post.attachment.provider}</p>
                              </div>
                            </div>
                            <a
                              href={getAttachmentUrl(post.attachment)}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-primary hover:underline ml-2"
                            >
                              <Download className="h-4 w-4" />
                              <span>Download</span>
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={`h-px ${color.accent} flex-1`} />
                    <h3 className="font-semibold text-sm text-muted-foreground px-2">
                      {post.comments.length} {post.comments.length === 1 ? "Comment" : "Comments"}
                    </h3>
                    <div className={`h-px ${color.accent} flex-1`} />
                  </div>

                  {post.comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8 italic">
                      No comments yet. Be the first to comment!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {post.comments.map((comment) => (
                        <div
                          key={comment._id}
                          className="flex gap-3 items-start bg-white/60 dark:bg-black/30 rounded-lg p-3 shadow-sm"
                        >
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

                            {comment.attachment && (
                              <div className="mt-2 p-2 bg-white/40 dark:bg-black/20 rounded border">
                                {isImageFile(comment.attachment.url) ? (
                                  <div className="space-y-1">
                                    <img
                                      src={getAttachmentUrl(comment.attachment) || "/placeholder.svg"}
                                      alt="Attachment"
                                      className="w-full rounded max-h-48 object-contain"
                                    />
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-muted-foreground truncate flex-1">
                                        {comment.attachment.url.split("/").pop()}
                                      </span>
                                      <a
                                        href={getAttachmentUrl(comment.attachment)}
                                        download
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline ml-2"
                                      >
                                        <Download className="h-3 w-3" />
                                      </a>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      {getFileIcon(comment.attachment.url)}
                                      <span className="text-xs truncate">
                                        {comment.attachment.url.split("/").pop()}
                                      </span>
                                    </div>
                                    <a
                                      href={getAttachmentUrl(comment.attachment)}
                                      download
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline ml-2"
                                    >
                                      <Download className="h-3 w-3" />
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            <div className={`p-4 border-t-2 ${color.border} bg-white/40 dark:bg-black/20 flex-shrink-0`}>
              <div className="space-y-2">
                <Textarea
                  placeholder="Add a comment to this note..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className={`min-h-[80px] resize-none bg-white/80 dark:bg-black/40 border-2 ${color.border} focus-visible:ring-offset-0 focus-visible:ring-2 ${
                    getColorForPost(postId) === 0
                      ? "focus-visible:ring-blue-200 dark:focus-visible:ring-blue-700"
                      : getColorForPost(postId) === 1
                        ? "focus-visible:ring-green-200 dark:focus-visible:ring-green-700"
                        : getColorForPost(postId) === 2
                          ? "focus-visible:ring-pink-200 dark:focus-visible:ring-pink-700"
                          : getColorForPost(postId) === 3
                            ? "focus-visible:ring-purple-200 dark:focus-visible:ring-purple-700"
                            : "focus-visible:ring-orange-200 dark:focus-visible:ring-orange-700"
                  }`}
                  disabled={submitting || isUploading}
                />

                {selectedFile && (
                  <div className="p-2 bg-white/60 dark:bg-black/30 rounded border space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getFileIcon(selectedFile.name)}
                        <span className="text-xs font-medium truncate max-w-[150px]">{selectedFile.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={handleRemoveFile}
                        disabled={submitting || isUploading}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>

                    {filePreview && (
                      <img
                        src={filePreview || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full h-20 object-cover rounded"
                      />
                    )}

                    {isUploading && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Uploading...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 flex-row justify-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={submitting || isUploading}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={submitting || isUploading || !!selectedFile}
                    className={`gap-1 ${color.border}`}
                  >
                    <Paperclip className="h-3 w-3" />
                    Attach
                  </Button>
                  <Button
                    onClick={handleAddComment}
                    disabled={(!newComment.trim() && !selectedFile) || submitting || isUploading}
                    size="sm"
                    className={`gap-1 ml-auto ${color.button}`}
                  >
                    {submitting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-3 w-3" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
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
