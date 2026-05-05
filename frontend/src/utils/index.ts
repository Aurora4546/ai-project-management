/**
 * Returns a consistent color for a given string (used for avatar backgrounds).
 * Deterministic: the same input always produces the same color.
 */
export const getAvatarColor = (text: string): string => {
  if (!text) return '#94a3b8' // Default slate-400
  
  const normalizedText = text.toLowerCase()
  
  const colors = [
    '#ef4444', // red-500
    '#f59e0b', // amber-500
    '#10b981', // emerald-500
    '#3b82f6', // blue-500
    '#6366f1', // indigo-500
    '#8b5cf6', // violet-500
    '#d946ef', // fuchsia-500
    '#f43f5e', // rose-500
    '#06b6d4', // cyan-500
    '#84cc16', // lime-500
  ]
  
  let hash = 0
  for (let i = 0; i < normalizedText.length; i++) {
    hash = normalizedText.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

/**
 * Formats enum-like strings (e.g., IN_PROGRESS) into user-friendly titles (e.g., In Progress).
 */
export const formatEnum = (text: string | null | undefined): string => {
  if (!text) return ''
  return text
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Returns a human-readable relative time string (e.g., "5 minutes ago").
 */
export const formatRelativeTime = (date: string | number | Date): string => {
  const now = new Date()
  const then = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return then.toLocaleDateString()
}

/**
 * Returns consistent theme tokens for an issue type.
 */
export const getIssueTheme = (type: string) => {
    switch (type?.toUpperCase()) {
        case 'BUG':
            return {
                icon: 'bug_report',
                color: 'text-red-500',
                hex: '#ef4444',
                bgColor: 'bg-red-50',
                borderColor: 'border-red-200'
            }
        case 'STORY':
            return {
                icon: 'bookmark',
                color: 'text-green-500',
                hex: '#22c55e',
                bgColor: 'bg-green-50',
                borderColor: 'border-green-200'
            }
        case 'EPIC':
            return {
                icon: 'electric_bolt',
                color: 'text-purple-500',
                hex: '#a855f7',
                bgColor: 'bg-purple-50',
                borderColor: 'border-purple-200'
            }
        case 'TASK':
        default:
            return {
                icon: 'check_box',
                color: 'text-blue-500',
                hex: '#3b82f6',
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-200'
            }
    }
}

/**
 * Strips HTML tags from a string and decodes HTML entities for plain text display.
 * Uses DOMParser for robust parsing of entities like &nbsp; and handling various tag structures.
 */
export const stripHtml = (html: string | null | undefined): string => {
  if (!html) return ''
  
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    return doc.body.textContent || ''
  } catch (error) {
    // Fallback for non-browser environments or parsing errors
    return html.replace(/<[^>]*>?/gm, '')
  }
}
