import type { 
  User, 
  LoginRequest, 
  RegisterRequest, 
  Torrent, 
  TorrentFile,
  TorrentUpdateRequest,
  TorrentUploadRequest,
  Category, 
  PublishGroup, 
  Comment,
  ApiResponse,
  PaginatedResponse,
  TorrentSearchParams,
  DownloadResponse,
  UserStats,
  DownloadHistory
} from '~/types'

// 基础 API 配置
const API_BASE = '/api'

// 通用请求函数
async function apiRequest<T>(
  endpoint: string, 
  options: any = {}
): Promise<ApiResponse<T>> {
  const response = await $fetch<ApiResponse<T>>(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  return response
}

// 认证 API
export const authApi = {
  async login(data: LoginRequest): Promise<ApiResponse<{ user: User; token: string }>> {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async register(data: RegisterRequest): Promise<ApiResponse<User>> {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async logout(): Promise<ApiResponse<void>> {
    return apiRequest('/auth/logout', {
      method: 'POST',
    })
  },

  async getProfile(): Promise<ApiResponse<User>> {
    return apiRequest('/auth/profile')
  },
}

// 种子 API
export const torrentApi = {
  async getTorrents(params?: TorrentSearchParams): Promise<ApiResponse<PaginatedResponse<Torrent>>> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.append(key, String(value))
        }
      })
    }
    const queryString = query.toString()
    return apiRequest(`/torrents${queryString ? `?${queryString}` : ''}`)
  },

  async getTorrent(id: number): Promise<ApiResponse<Torrent>> {
    return apiRequest(`/torrents/${id}`)
  },

  async getTorrentFiles(id: number): Promise<ApiResponse<TorrentFile[]>> {
    return apiRequest(`/torrents/${id}/files`)
  },

  async updateTorrent(id: number, data: TorrentUpdateRequest): Promise<ApiResponse<Torrent>> {
    return apiRequest(`/torrents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async deleteTorrent(id: number): Promise<ApiResponse<void>> {
    return apiRequest(`/torrents/${id}`, {
      method: 'DELETE',
    })
  },

  async uploadTorrent(data: TorrentUploadRequest): Promise<ApiResponse<Torrent>> {
    const formData = new FormData()
    formData.append('title', data.title)
    if (data.description) formData.append('description', data.description)
    formData.append('categoryId', String(data.categoryId))
    if (data.publishGroupId) formData.append('publishGroupId', String(data.publishGroupId))
    if (data.tags) formData.append('tags', JSON.stringify(data.tags))
    formData.append('torrentFile', data.torrentFile)
    if (data.coverImage) formData.append('coverImage', data.coverImage)
    if (data.isPrivate) formData.append('isPrivate', String(data.isPrivate))
    if (data.allowComments) formData.append('allowComments', String(data.allowComments))

    return $fetch(`${API_BASE}/torrents/upload`, {
      method: 'POST',
      body: formData,
    })
  },

  async downloadTorrent(id: number): Promise<DownloadResponse> {
    return $fetch(`${API_BASE}/torrents/${id}/download`, {
      method: 'GET',
    })
  },
}

// 分类 API
export const categoryApi = {
  async getCategories(): Promise<ApiResponse<Category[]>> {
    return apiRequest('/categories')
  },

  async getCategory(id: number): Promise<ApiResponse<Category>> {
    return apiRequest(`/categories/${id}`)
  },

  async createCategory(data: Partial<Category>): Promise<ApiResponse<Category>> {
    return apiRequest('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async updateCategory(id: number, data: Partial<Category>): Promise<ApiResponse<Category>> {
    return apiRequest(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async deleteCategory(id: number): Promise<ApiResponse<void>> {
    return apiRequest(`/categories/${id}`, {
      method: 'DELETE',
    })
  },
}

// 发布组 API
export const publishGroupApi = {
  async getPublishGroups(): Promise<ApiResponse<PublishGroup[]>> {
    return apiRequest('/publish-groups')
  },

  async getPublishGroup(id: number): Promise<ApiResponse<PublishGroup>> {
    return apiRequest(`/publish-groups/${id}`)
  },

  async createPublishGroup(data: Partial<PublishGroup>): Promise<ApiResponse<PublishGroup>> {
    return apiRequest('/publish-groups', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async updatePublishGroup(id: number, data: Partial<PublishGroup>): Promise<ApiResponse<PublishGroup>> {
    return apiRequest(`/publish-groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async deletePublishGroup(id: number): Promise<ApiResponse<void>> {
    return apiRequest(`/publish-groups/${id}`, {
      method: 'DELETE',
    })
  },
}

// 评论 API
export const commentApi = {
  async getComments(torrentId: number): Promise<ApiResponse<Comment[]>> {
    return apiRequest(`/torrents/${torrentId}/comments`)
  },

  async createComment(torrentId: number, content: string): Promise<ApiResponse<Comment>> {
    return apiRequest(`/torrents/${torrentId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    })
  },

  async updateComment(commentId: number, content: string): Promise<ApiResponse<Comment>> {
    return apiRequest(`/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    })
  },

  async deleteComment(commentId: number): Promise<ApiResponse<void>> {
    return apiRequest(`/comments/${commentId}`, {
      method: 'DELETE',
    })
  },
}

// 用户 API
export const userApi = {
  async getUsers(): Promise<ApiResponse<User[]>> {
    return apiRequest('/users')
  },

  async getUser(id: number): Promise<ApiResponse<User>> {
    return apiRequest(`/users/${id}`)
  },

  async updateUser(id: number, data: Partial<User>): Promise<ApiResponse<User>> {
    return apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async deleteUser(id: number): Promise<ApiResponse<void>> {
    return apiRequest(`/users/${id}`, {
      method: 'DELETE',
    })
  },

  async getUserStats(id: number): Promise<ApiResponse<UserStats>> {
    return apiRequest(`/users/${id}/stats`)
  },

  async getUserDownloadHistory(id: number): Promise<ApiResponse<DownloadHistory[]>> {
    return apiRequest(`/users/${id}/download-history`)
  },
}

// 文件上传 API
export const uploadApi = {
  async uploadFile(file: File, type: 'image' | 'torrent' = 'image'): Promise<ApiResponse<{ url: string; filename: string }>> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    return $fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    })
  },
}