import type { User } from '@/stores/useAuthStore'

// API基础URL，您可以根据实际情况修改
const API_BASE_URL = 'http://localhost:8080/api/v1' // 假设后端服务运行在3001端口

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
}

// 通用的API请求函数
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
  }

  const finalOptions = { ...defaultOptions, ...options }

  try {
    const response = await fetch(url, finalOptions)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('API request failed:', error)
    throw error
  }
}

// 获取存储的token
export function getStoredToken(): string | null {
  try {
    const authStorage = localStorage.getItem('auth-storage')
    if (authStorage) {
      const parsed = JSON.parse(authStorage)
      return parsed.state?.token || null
    }
  } catch (error) {
    console.error('Error getting stored token:', error)
  }
  return null
}

// 用户注册
export async function registerUser(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  })
}

// 用户登录
export async function loginUser(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

// 用户登出
export async function logoutUser(): Promise<ApiResponse<{ user_id: number; username: string }>> {
  const token = getStoredToken()
  
  if (!token) {
    throw new Error('No token found')
  }

  return apiRequest<{ user_id: number; username: string }>('/auth/logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
} 