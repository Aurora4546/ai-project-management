// ── User ────────────────────────────────────────
export interface IUser {
  email: string
  firstName: string
  lastName: string
}

export interface IUserSearchResult {
  email: string
  firstName: string
  lastName: string
}

// ── Project Members ─────────────────────────────
export interface IProjectMember {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
}

// ── Project ─────────────────────────────────────
export interface IProject {
  id: string
  name: string
  projectKey: string
  description: string
  leads: IProjectMember[]
  members: IProjectMember[]
  createdAt: string
  creatorEmail: string
  currentUserRole: string
}

// ── Requests ────────────────────────────────────
export interface ICreateProjectRequest {
  name: string
  projectKey: string
  description: string
  leads: string[]
  members: string[]
}

export interface IUpdateProjectRequest {
  name: string
  description: string
  leads: string[]
  members: string[]
}

// ── Issues ──────────────────────────────────────
export interface IIssue {
  id: string
  issueKey: string
  title: string
  description: string
  type: string
  status: string
  priority: string
  assigneeName?: string
  assigneeId?: string | number
  assigneeEmail?: string
  assigneeFirstName?: string
  assigneeLastName?: string
  projectKey: string
  projectId: string
  epicKey?: string
  epicId?: string
  parentId?: string | number
  parentKey?: string
  startDate?: string
  endDate?: string
  labels: string[]
  createdAt: string
  updatedAt: string
  position: number
}


export interface IComment {
  id: string
  content: string
  authorName: string
  createdAt: string
  updatedAt: string
}


export interface IHistory {
  id: string
  field: string
  oldValue: string
  newValue: string
  userName: string
  timestamp: string
  action: string
  createdAt: string
}

export type GroupBy = 'NONE' | 'ASSIGNEE' | 'EPIC' | 'STATUS';

export interface FilterState {
    types: string[]
    assignees: string[]
    epics: string[]
    labels: string[]
    priorities: string[]
    statuses: string[]
}

export interface ILabel {
  id: string | number
  name: string
  color: string
}

// ── Chat ────────────────────────────────────────
export interface IChatAttachment {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  downloadUrl: string
  messageId: string
}

export interface IChatMessage {
  id: string
  content: string
  senderEmail: string
  senderFirstName: string
  senderLastName: string
  messageType: 'TEXT' | 'FILE' | 'SYSTEM'
  recipientEmail?: string
  attachments?: IChatAttachment[]
  createdAt: string
  updatedAt?: string
}

export interface IChatEvent {
  type: 'MESSAGE_UPDATED' | 'MESSAGE_DELETED'
  messageId: string
  message?: IChatMessage
  projectId: string
}

export interface IChatTypingEvent {
  projectId: string
  userEmail: string
  firstName: string
  typing: boolean
}



export interface IChatNotification {
  projectId: string
  projectName: string
  senderName: string
  senderEmail: string
  messagePreview: string
  messageId?: string
  isDirect?: boolean
  timestamp: string
}

export interface IAppNotification {
  id: string
  title: string
  message: string
  senderEmail?: string
  senderName?: string
  messageId?: string
  isDirect?: boolean
  relatedProjectId: string
  type: string
  read: boolean
  createdAt: string
}

export interface IOnlineUser {
  id: string | number
  email: string
  firstName: string
  lastName: string
}

export interface IUnreadCountsResponse {
  projects: Record<string, number>
  dms: Record<string, Record<string, number>>
}

// ── Reports ─────────────────────────────────────
export interface IReport {
  id: string
  projectName: string
  projectKey: string
  generatedAt: string
  generatedByName: string

  // AI-generated narrative sections
  executiveSummary: string
  accomplishments: string
  blockers: string
  nextSteps: string
  teamDynamics: string
  sprintHealth: string
  riskAssessment: string
  velocityAnalysis: string

  // Computed statistics
  issuesByStatus: Record<string, number>
  issuesByPriority: Record<string, number>
  issuesByType: Record<string, number>
  issuesByAssignee: Record<string, number>
  totalIssues: number
  completedIssues: number
  totalMessages: number
  overdueIssues: number
  unassignedIssues: number
}
