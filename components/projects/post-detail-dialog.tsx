"use client"

import type React from "react"
import cn from "classnames"

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
  onUpdate: () => void
  cardStyle?: {
    showBackground: boolean
    showPin: boolean
    showRotation: boolean
  }
}

export function PostDetailDialog({ open, onClose, projectId, postId, onUpdate, cardStyle }: PostDetailDialogProps) {
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
      bg: "from-blue-200 to-blue-300 dark:from-blue-600 dark:to-blue-700",
      border: "border-blue-400 dark:border-blue-500",
      pin: "bg-blue-500",
      accent: "bg-blue-400",
      button: "bg-blue-600 hover:bg-blue-700 text-white border-blue-600",
      ring: "ring-blue-400 dark:ring-blue-500",
      text: "text-blue-900 dark:text-blue-50",
    },
    {
      bg: "from-yellow-200 to-yellow-300 dark:from-yellow-600 dark:to-yellow-700",
      border: "border-yellow-400 dark:border-yellow-500",
      pin: "bg-yellow-500",
      accent: "bg-yellow-400",
      button: "bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600",
      ring: "ring-yellow-400 dark:ring-yellow-500",
      text: "text-yellow-900 dark:text-yellow-50",
    },
    {
      bg: "from-pink-200 to-pink-300 dark:from-pink-600 dark:to-pink-700",
      border: "border-pink-400 dark:border-pink-500",
      pin: "bg-pink-500",
      accent: "bg-pink-400",
      button: "bg-pink-600 hover:bg-pink-700 text-white border-pink-600",
      ring: "ring-pink-400 dark:ring-pink-500",
      text: "text-pink-900 dark:text-pink-50",
    },
    {
      bg: "from-green-200 to-green-300 dark:from-green-600 dark:to-green-700",
      border: "border-green-400 dark:border-green-500",
      pin: "bg-green-500",
      accent: "bg-green-400",
      button: "bg-green-600 hover:bg-green-700 text-white border-green-600",
      ring: "ring-green-400 dark:ring-green-500",
      text: "text-green-900 dark:text-green-50",
    },
    {
      bg: "from-orange-200 to-orange-300 dark:from-orange-600 dark:to-orange-700",
      border: "border-orange-400 dark:border-orange-500",
      pin: "bg-orange-500",
      accent: "bg-orange-400",
      button: "bg-orange-600 hover:bg-orange-700 text-white border-orange-600",
      ring: "ring-orange-400 dark:ring-orange-500",
      text: "text-orange-900 dark:text-orange-50",
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
        onUpdate()
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

  const appliedCardStyle = cardStyle || {
    showBackground: true,
    showPin: true,
    showRotation: false,
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "max-w-2xl h-[90vh] flex flex-col p-0 shadow-2xl",
          appliedCardStyle.showBackground ? `bg-gradient-to-br ${color.bg} border-4 ${color.border}` : "border-2",
        )}
      >
        {appliedCardStyle.showPin && (
          <div
            className={cn(
              "absolute -top-3 left-1/2 -translate-x-1/2 h-5 w-5 rounded-full shadow-md border-2 border-white dark:border-gray-800",
              color.pin,
            )}
          />
        )}

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
                      <p className={`font-bold text-lg ${color.text}`}>{getUserName(post.createdBy)}</p>
                      <span className="text-xs text-muted-foreground">•</span>
                      <p className={`text-sm text-muted-foreground ${color.text}`}>
                        {formatRelativeTime(post.createdAt)}
                      </p>
                    </div>
                    <p className={`text-base mt-3 whitespace-pre-wrap leading-relaxed ${color.text}`}>{post.content}</p>

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
                                <p className={`font-medium truncate ${color.text}`}>
                                  {post.attachment.url.split("/").pop()}
                                </p>
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
                    <h3 className={`font-semibold text-sm text-muted-foreground px-2 ${color.text}`}>
                      {post.comments.length} {post.comments.length === 1 ? "Comment" : "Comments"}
                    </h3>
                    <div className={`h-px ${color.accent} flex-1`} />
                  </div>

                  {post.comments.length === 0 ? (
                    <p className={`text-sm text-muted-foreground text-center py-8 italic ${color.text}`}>
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
                              <p className={`font-semibold text-sm ${color.text}`}>{getUserName(comment.createdBy)}</p>
                              <span className="text-xs text-muted-foreground">•</span>
                              <p className={`text-xs text-muted-foreground ${color.text}`}>
                                {formatRelativeTime(comment.createdAt)}
                              </p>
                            </div>
                            <p className={`text-sm whitespace-pre-wrap leading-relaxed ${color.text}`}>
                              {comment.content}
                            </p>

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
                                      <span className={`text-xs truncate ${color.text}`}>
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
                      ? "focus-visible:ring-blue-400 dark:focus-visible:ring-blue-500"
                      : getColorForPost(postId) === 1
                        ? "focus-visible:ring-yellow-400 dark:focus-visible:ring-yellow-500"
                        : getColorForPost(postId) === 2
                          ? "focus-visible:ring-pink-400 dark:focus-visible:ring-pink-500"
                          : getColorForPost(postId) === 3
                            ? "focus-visible:ring-green-400 dark:focus-visible:ring-green-500"
                            : "focus-visible:ring-orange-400 dark:focus-visible:ring-orange-500"
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
                    disabled={submitting || isUploading || !!selectedFile}
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
