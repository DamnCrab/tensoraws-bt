import type { 
  ApiResponse, 
  PaginatedResponse, 
  LoginRequest, 
  RegisterRequest,
  User
} from '~/types'

/**
 * 认证相关的 composable
 */
export const useAuth = () => {
  const { post, get } = useApi()
  const login = async (data: LoginRequest): Promise<ApiResponse<User>> => {
  return post('/auth/login', data)
}
  
  const register = async (data: RegisterRequest): Promise<ApiResponse<User>> => {
  return post('/auth/register', data)
}
  
  const logout = async (): Promise<ApiResponse<unknown>> => {
  return post('/auth/logout')
}
  
  const getProfile = async (): Promise<ApiResponse<User>> => {
  return get('/auth/profile')
}

  return {
    login,
    register,
    logout,
    getProfile
  }
}