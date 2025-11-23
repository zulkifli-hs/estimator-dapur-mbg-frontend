import { apiRequest, type ApiResponse } from "./config"

export interface Post {
  _id: string
  project: string
  content: string
  attachment?: {
    // Added attachment field
    url: string
    provider: string
  }
  createdBy: {
    _id: string
    email: string
    profile?: {
      name: string
      photo?: {
        url: string
        provider: string
      }
      phone?: string
    }
    createdAt: string
    updatedAt: string
  }
  comments: Array<{
    _id: string
    content: string
    createdBy: {
      _id: string
      email: string
      profile?: {
        name: string
        photo?: {
          url: string
          provider: string
        }
        phone?: string
      }
      createdAt: string
      updatedAt: string
    }
    createdAt: string
    updatedAt: string
  }>
  createdAt: string
  updatedAt: string
}

export interface GetPostsResponse {
  page: number
  totalData: number
  totalPage: number
  list: Post[]
}

const getPosts = async (projectId: string, limit = 10, page = 1): Promise<ApiResponse<GetPostsResponse>> => {
  return apiRequest<GetPostsResponse>(`/projects/${projectId}/post?limit=${limit}&page=${page}`, { method: "GET" })
}

const createPost = async (
  projectId: string,
  content: string,
  attachment?: { url: string; provider: string },
): Promise<ApiResponse<Post>> => {
  const body: any = { content }
  if (attachment) {
    body.attachment = attachment
  }
  return apiRequest<Post>(`/projects/${projectId}/post`, {
    method: "POST",
    body: JSON.stringify(body),
  })
}

const createComment = async (projectId: string, postId: string, content: string): Promise<ApiResponse<any>> => {
  return apiRequest<any>(`/projects/${projectId}/post/${postId}/comment`, {
    method: "POST",
    body: JSON.stringify({ content }),
  })
}

const getPostDetail = async (projectId: string, postId: string): Promise<ApiResponse<Post>> => {
  return apiRequest<Post>(`/projects/${projectId}/post/${postId}`, { method: "GET" })
}

export const discussionsApi = {
  getPosts: async (projectId: string, limit?: number, page?: number) => {
    const response = await getPosts(projectId, limit, page)
    return {
      success: response.code === 200,
      data: response.data.list,
      page: response.data.page,
      totalData: response.data.totalData,
      totalPage: response.data.totalPage,
    }
  },
  createPost: async (projectId: string, content: string, attachment?: { url: string; provider: string }) => {
    const response = await createPost(projectId, content, attachment)
    return {
      success: response.code === 200 || response.code === 201,
      data: response.data,
    }
  },
  createComment: async (projectId: string, postId: string, content: string) => {
    const response = await createComment(projectId, postId, content)
    return {
      success: response.code === 200 || response.code === 201,
      data: response.data,
    }
  },
  getPostDetail: async (projectId: string, postId: string) => {
    const response = await getPostDetail(projectId, postId)
    return {
      success: response.code === 200,
      data: response.data,
    }
  },
}
