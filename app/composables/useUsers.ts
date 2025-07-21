import type { 
  ApiResponse, 
  PaginatedResponse, 
  User,
  UserStats,
  Torrent,
  DownloadHistory
} from '~/types'

/**
 * 用户相关的 composable
 */
export const useUsers = () => {
  // API 基础配置
  const API_BASE = '/api'

  // 通用请求函数
  async function apiRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE}${endpoint}`
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    
    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  }

  // 用户管理API
  const getUsers = async (params: { page?: number; limit?: number; search?: string } = {}): Promise<ApiResponse<PaginatedResponse<User>>> => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })
    
    const query = searchParams.toString()
    return apiRequest(`/users${query ? `?${query}` : ''}`)
  }
  
  const getUser = async (id: number): Promise<ApiResponse<User>> => {
    return apiRequest(`/users/${id}`)
  }
  
  const getUserStats = async (id: number): Promise<ApiResponse<UserStats>> => {
    return apiRequest(`/users/${id}/stats`)
  }
  
  const getUserTorrents = async (id: number, params: { page?: number; limit?: number } = {}): Promise<ApiResponse<PaginatedResponse<Torrent>>> => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })
    
    const query = searchParams.toString()
    return apiRequest(`/users/${id}/torrents${query ? `?${query}` : ''}`)
  }
  
  const getUserDownloadHistory = async (id: number, params: { page?: number; limit?: number } = {}): Promise<ApiResponse<PaginatedResponse<DownloadHistory>>> => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })
    
    const query = searchParams.toString()
    return apiRequest(`/users/${id}/download-history${query ? `?${query}` : ''}`)
  }
  
  const updateUser = async (id: number, data: Partial<User>): Promise<ApiResponse<User>> => {
    return apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }
  
  const deleteUser = async (id: number): Promise<ApiResponse<void>> => {
    return apiRequest(`/users/${id}`, {
      method: 'DELETE',
    })
  }
  
  const banUser = async (id: number, reason?: string): Promise<ApiResponse<User>> => {
    return apiRequest(`/users/${id}/ban`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  }
  
  const unbanUser = async (id: number): Promise<ApiResponse<User>> => {
    return apiRequest(`/users/${id}/unban`, {
      method: 'POST',
    })
  }

  return {
    getUsers,
    getUser,
    getUserStats,
    getUserTorrents,
    getUserDownloadHistory,
    updateUser,
    deleteUser,
    banUser,
    unbanUser
  }
}