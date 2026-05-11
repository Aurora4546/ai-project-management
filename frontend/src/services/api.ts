import axios from 'axios'
import type { 
  IProject, 
  ICreateProjectRequest, 
  IUpdateProjectRequest, 
  IUserSearchResult,
  IIssue,
  IComment,
  IHistory,
  ILabel,
  IChatMessage,
  IChatAttachment,
  IOnlineUser,
  IReport,
  IAiAssignmentResponse
} from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

/**
 * Axios instance with JWT interceptor.
 * Automatically attaches the Authorization header to every request.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Project APIs ────────────────────────────────

export const fetchProjects = async (): Promise<IProject[]> => {
  const { data } = await api.get<IProject[]>('/api/v1/projects')
  return data
}

export const fetchProjectById = async (projectId: string): Promise<IProject> => {
  const { data } = await api.get<IProject>(`/api/v1/projects/${projectId}`)
  return data
}

export const createProject = async (request: ICreateProjectRequest): Promise<IProject> => {
  const { data } = await api.post<IProject>('/api/v1/projects', request)
  return data
}

export const updateProject = async (projectId: string, request: IUpdateProjectRequest): Promise<IProject> => {
  const { data } = await api.put<IProject>(`/api/v1/projects/${projectId}`, request)
  return data
}

export const deleteProject = async (projectId: string): Promise<void> => {
  await api.delete(`/api/v1/projects/${projectId}`)
}

// ── Issue APIs ──────────────────────────────────

export const fetchProjectEpics = async (projectId: string): Promise<IIssue[]> => {
  const { data } = await api.get<IIssue[]>(`/api/issues/project/${projectId}/epics`)
  return data
}

export const fetchProjectIssues = async (projectId: string): Promise<IIssue[]> => {
  const { data } = await api.get<IIssue[]>(`/api/issues/project/${projectId}`)
  return data
}

export const createIssue = async (request: any): Promise<IIssue> => {
  const { data } = await api.post<IIssue>('/api/issues', request)
  return data
}

export const updateIssue = async (issueId: string, request: any): Promise<IIssue> => {
  const { data } = await api.put<IIssue>(`/api/issues/${issueId}`, request)
  return data
}

export const deleteIssue = async (issueId: string): Promise<void> => {
  await api.delete(`/api/issues/${issueId}`)
}

export const aiAssignIssue = async (request: any): Promise<IAiAssignmentResponse> => {
  const { data } = await api.post<IAiAssignmentResponse>('/api/issues/ai-assign', request)
  return data
}

export const fetchIssueComments = async (issueId: string): Promise<IComment[]> => {
  const { data } = await api.get<IComment[]>(`/api/issues/${issueId}/comments`)
  return data
}

export const addIssueComment = async (issueId: string, content: string): Promise<IComment> => {
  const { data } = await api.post<IComment>(`/api/issues/${issueId}/comments`, { content, issueId })
  return data
}

export const updateIssueComment = async (commentId: string, content: string, issueId: string): Promise<IComment> => {
  const { data } = await api.put<IComment>(`/api/issues/comments/${commentId}`, { content, issueId })
  return data
}

export const deleteIssueComment = async (commentId: string): Promise<void> => {
  await api.delete(`/api/issues/comments/${commentId}`)
}

export const fetchIssueHistory = async (issueId: string): Promise<IHistory[]> => {
  const { data } = await api.get<IHistory[]>(`/api/issues/${issueId}/history`)
  return data
}

// ── User APIs ───────────────────────────────────

export const searchUsers = async (query: string): Promise<IUserSearchResult[]> => {
  if (!query || query.trim().length < 2) return []
  const { data } = await api.get<IUserSearchResult[]>('/api/v1/users/search', {
    params: { q: query.trim() },
  })
  return data
}

export const checkEmailExists = async (email: string): Promise<boolean> => {
  const { data } = await api.get<boolean>('/api/v1/auth/check-email', {
    params: { email },
  })
  return data
}

// ── Label APIs ──────────────────────────────────

export const fetchProjectLabels = async (projectId: string): Promise<ILabel[]> => {
  const { data } = await api.get<ILabel[]>(`/api/issues/project/${projectId}/labels`)
  return data
}

export const createProjectLabel = async (projectId: string, name: string, color: string): Promise<ILabel> => {
  const { data } = await api.post<ILabel>(`/api/issues/project/${projectId}/labels`, { name, color })
  return data
}

// ── Chat APIs ───────────────────────────────────

export const fetchChatMessages = async (projectId: string, page = 0, size = 50): Promise<IChatMessage[]> => {
  const { data } = await api.get<IChatMessage[]>(`/api/chat/${projectId}/messages`, {
    params: { page, size },
  })
  return data
}

export const fetchDirectMessages = async (projectId: string, targetUserId: string, page = 0, size = 50): Promise<IChatMessage[]> => {
  const { data } = await api.get<IChatMessage[]>(`/api/chat/${projectId}/messages/direct/${targetUserId}`, {
    params: { page, size },
  })
  return data
}

export const searchChatMessages = async (projectId: string, q: string): Promise<IChatMessage[]> => {
  const { data } = await api.get<IChatMessage[]>(`/api/chat/${projectId}/search`, {
    params: { q },
  })
  return data
}

export const searchChatFiles = async (projectId: string, q: string): Promise<IChatAttachment[]> => {
  const { data } = await api.get<IChatAttachment[]>(`/api/chat/${projectId}/files/search`, {
    params: { q },
  })
  return data
}

export const fetchProjectFiles = async (projectId: string): Promise<IChatAttachment[]> => {
  const { data } = await api.get<IChatAttachment[]>(`/api/chat/${projectId}/files`)
  return data
}

export const searchDirectMessages = async (projectId: string, targetUserId: string | number, query: string): Promise<IChatMessage[]> => {
  const { data } = await api.get<IChatMessage[]>(`/api/chat/${projectId}/search/direct/${targetUserId}`, {
    params: { q: query }
  })
  return data
}

export const searchDirectFiles = async (projectId: string, targetUserId: string | number, query: string): Promise<IChatAttachment[]> => {
  const { data } = await api.get<IChatAttachment[]>(`/api/chat/${projectId}/files/direct/${targetUserId}/search`, {
    params: { q: query }
  })
  return data
}

export const fetchDirectFiles = async (projectId: string, targetUserId: string | number): Promise<IChatAttachment[]> => {
  const { data } = await api.get<IChatAttachment[]>(`/api/chat/${projectId}/files/direct/${targetUserId}`)
  return data
}

export const fetchOnlineUsers = async (projectId: string): Promise<IOnlineUser[]> => {
  const { data } = await api.get<IOnlineUser[]>(`/api/chat/${projectId}/online-users`)
  return data
}

export const uploadChatFile = async (projectId: string, file: File, recipientId?: string | number): Promise<IChatMessage> => {
  const formData = new FormData()
  formData.append('file', file)
  if (recipientId) {
    formData.append('recipientId', recipientId.toString())
  }
  const { data } = await api.post<IChatMessage>(`/api/chat/${projectId}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return data
}

export const updateChatMessage = async (projectId: string, messageId: string, content: string): Promise<IChatMessage> => {
  const { data } = await api.put<IChatMessage>(`/api/chat/${projectId}/messages/${messageId}`, content, {
    headers: { 'Content-Type': 'text/plain' }
  })
  return data
}

export const deleteChatMessage = async (projectId: string, messageId: string): Promise<void> => {
  await api.delete(`/api/chat/${projectId}/messages/${messageId}`)
}

export const markChatAsRead = async (projectId: string, recipientId?: string | number): Promise<void> => {
    await api.put(`/api/chat/projects/${projectId}/chat/read`, null, {
        params: { recipientId }
    })
}

// ── Report APIs ─────────────────────────────────

export const generateProjectReport = async (projectId: string): Promise<IReport> => {
  const { data } = await api.post<IReport>(`/api/reports/project/${projectId}`)
  return data
}

export const getReportHistory = async (projectId: string): Promise<IReport[]> => {
  const { data } = await api.get<IReport[]>(`/api/reports/project/${projectId}`)
  return data
}

export const getReportById = async (projectId: string, reportId: string): Promise<IReport> => {
  const { data } = await api.get<IReport>(`/api/reports/project/${projectId}/${reportId}`)
  return data
}

export const deleteReport = async (projectId: string, reportId: string): Promise<void> => {
  await api.delete(`/api/reports/project/${projectId}/${reportId}`)
}

export const downloadProjectReportPdf = async (projectId: string, reportId: string): Promise<Blob> => {
  const { data } = await api.get(`/api/reports/project/${projectId}/${reportId}/pdf`, {
    responseType: 'blob'
  })
  return data
}

export default api
