"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Building2, Calendar, User, Ruler, Layers, MessageSquare, Send } from "lucide-react"
import { useState } from "react"

interface ProjectOverviewProps {
  project: any
  onUpdate: () => void
}

const DUMMY_POSTS = [
  {
    id: "1",
    author: {
      name: "Sarah Johnson",
      avatar: "/diverse-woman-portrait.png",
      role: "Project Manager",
    },
    content:
      "Tim, saya sudah review BOQ yang terbaru. Ada beberapa item yang perlu kita diskusikan untuk fitting out area meeting room. Bisa kita schedule meeting besok?",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    comments: [
      {
        id: "c1",
        author: {
          name: "Michael Chen",
          avatar: "/man.jpg",
          role: "Estimator",
        },
        content:
          "Sure Sarah, saya available besok jam 10 pagi. Saya juga sudah prepare beberapa alternatif material yang bisa kita consider.",
        timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
      },
    ],
  },
  {
    id: "2",
    author: {
      name: "David Lee",
      avatar: "/diverse-businessman.png",
      role: "Designer",
    },
    content:
      "Update: Shop drawing untuk furniture sudah 80% selesai. Target minggu ini bisa submit untuk approval. Ada feedback dari client mengenai warna finishing?",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    comments: [
      {
        id: "c2",
        author: {
          name: "Sarah Johnson",
          avatar: "/diverse-woman-portrait.png",
          role: "Project Manager",
        },
        content:
          "Great progress David! Client prefer warm tone untuk finishing. Saya akan share color palette yang sudah di-approve.",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      },
      {
        id: "c3",
        author: {
          name: "David Lee",
          avatar: "/diverse-businessman.png",
          role: "Designer",
        },
        content: "Perfect, thanks Sarah! Saya akan adjust sesuai color palette tersebut.",
        timestamp: new Date(Date.now() - 3.5 * 60 * 60 * 1000),
      },
    ],
  },
  {
    id: "3",
    author: {
      name: "Amanda Wong",
      avatar: "/professional-woman.png",
      role: "Finance",
    },
    content: "Reminder: Invoice untuk termin 1 sudah dikirim ke client. Mohon follow up untuk payment timeline.",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    comments: [],
  },
]

export function ProjectOverview({ project }: ProjectOverviewProps) {
  const [posts, setPosts] = useState(DUMMY_POSTS)
  const [newPost, setNewPost] = useState("")
  const [newComments, setNewComments] = useState<Record<string, string>>({})

  const totalTeamMembers =
    (project.estimators?.length || 0) +
    (project.projectManagers?.length || 0) +
    (project.finances?.length || 0) +
    (project.designers?.length || 0) +
    (project.admins?.length || 0)

  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "Baru saja"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
  }

  const handleAddPost = () => {
    if (!newPost.trim()) return

    const post = {
      id: Date.now().toString(),
      author: {
        name: "Current User",
        avatar: "/abstract-geometric-shapes.png",
        role: "Team Member",
      },
      content: newPost,
      timestamp: new Date(),
      comments: [],
    }

    setPosts([post, ...posts])
    setNewPost("")
  }

  const handleAddComment = (postId: string) => {
    const commentText = newComments[postId]
    if (!commentText?.trim()) return

    const comment = {
      id: Date.now().toString(),
      author: {
        name: "Current User",
        avatar: "/abstract-geometric-shapes.png",
        role: "Team Member",
      },
      content: commentText,
      timestamp: new Date(),
    }

    setPosts(posts.map((post) => (post.id === postId ? { ...post, comments: [...post.comments, comment] } : post)))

    setNewComments({ ...newComments, [postId]: "" })
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
            />
            <div className="flex justify-end">
              <Button onClick={handleAddPost} disabled={!newPost.trim()}>
                <Send className="h-4 w-4 mr-2" />
                Post
              </Button>
            </div>
          </div>

          {/* Posts List */}
          <div className="space-y-6 pt-4 border-t">
            {posts.map((post) => (
              <div key={post.id} className="space-y-4">
                {/* Post Header */}
                <div className="flex gap-3">
                  <Avatar>
                    <AvatarImage src={post.author.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {post.author.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{post.author.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {post.author.role}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatRelativeTime(post.timestamp)}</span>
                    </div>
                    <p className="text-sm mt-2 text-foreground">{post.content}</p>
                  </div>
                </div>

                {/* Comments */}
                {post.comments.length > 0 && (
                  <div className="ml-12 space-y-3 pl-4 border-l-2">
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.author.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="text-xs">
                            {comment.author.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{comment.author.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(comment.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm mt-1 text-muted-foreground">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment Input */}
                <div className="ml-12 flex gap-2">
                  <Textarea
                    placeholder="Tulis komentar..."
                    value={newComments[post.id] || ""}
                    onChange={(e) => setNewComments({ ...newComments, [post.id]: e.target.value })}
                    className="min-h-[60px] text-sm"
                  />
                  <Button size="sm" onClick={() => handleAddComment(post.id)} disabled={!newComments[post.id]?.trim()}>
                    <Send className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
