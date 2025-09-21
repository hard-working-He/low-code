// 通用 API 响应接口
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
}
import { getStoredToken } from './authApi'

// API基础URL
const API_BASE_URL = 'https://81.68.224.194:8080/api/v1'

// 历史记录数据接口
export interface HistoryRecord {
  id: number
  user_id: number
  title: string
  description: string
  json_data: string
  created_at: string
  updated_at: string
}

// 创建历史记录请求接口
export interface CreateHistoryRequest {
  title: string
  description: string
  json_data: string
}

// 更新历史记录请求接口
export interface UpdateHistoryRequest {
  title?: string
  description?: string
  json_data?: string
}



// 通用的带认证的API请求函数
async function authenticatedApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken()
  
  if (!token) {
    throw new Error('用户未登录')
  }

  const url = `${API_BASE_URL}${endpoint}`
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
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

// 创建历史记录
export async function createHistory(historyData: CreateHistoryRequest): Promise<ApiResponse<HistoryRecord>> {
  return authenticatedApiRequest<ApiResponse<HistoryRecord>>('/lowcode/histories', {
    method: 'POST',
    body: JSON.stringify(historyData),
  })
}

// 获取所有历史记录
export async function getHistories(): Promise<ApiResponse<HistoryRecord[]>> {
  return authenticatedApiRequest<ApiResponse<HistoryRecord[]>>('/lowcode/histories')
}

// 获取特定历史记录
export async function getHistoryById(id: number): Promise<ApiResponse<HistoryRecord>> {
  return authenticatedApiRequest<ApiResponse<HistoryRecord>>(`/lowcode/histories/${id}`)
}

// 更新历史记录
export async function updateHistory(id: number, historyData: UpdateHistoryRequest): Promise<ApiResponse<HistoryRecord>> {
  return authenticatedApiRequest<ApiResponse<HistoryRecord>>(`/lowcode/histories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(historyData),
  })
}

// 删除历史记录
export async function deleteHistory(id: number): Promise<ApiResponse> {
  return authenticatedApiRequest<ApiResponse>(`/lowcode/histories/${id}`, {
    method: 'DELETE',
  })
} 