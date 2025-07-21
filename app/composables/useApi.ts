import type { ApiResponse } from '~/types'

/**
 * 通用 API 请求 composable
 * 提供统一的 API 请求方法和错误处理
 */
export const useApi = () => {
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
    
    return await response.json() as ApiResponse<T>
  }

  // GET 请求
  const get = async <T>(endpoint: string): Promise<ApiResponse<T>> => {
    return apiRequest<T>(endpoint)
  }

  // POST 请求
  const post = async <T>(endpoint: string, data?: any): Promise<ApiResponse<T>> => {
    return apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // PUT 请求
  const put = async <T>(endpoint: string, data?: any): Promise<ApiResponse<T>> => {
    return apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // DELETE 请求
  const del = async <T>(endpoint: string): Promise<ApiResponse<T>> => {
    return apiRequest<T>(endpoint, {
      method: 'DELETE',
    })
  }

  // 文件上传请求
  const upload = async <T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> => {
    return apiRequest<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers: {}, // 让浏览器自动设置Content-Type
    })
  }

  return {
    get,
    post,
    put,
    del,
    upload,
    apiRequest
  }
}