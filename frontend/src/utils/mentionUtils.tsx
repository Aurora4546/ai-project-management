import { getAvatarColor, getIssueTheme } from './index'
import type { IProjectMember, IIssue } from '../types'

interface RenderOptions {
    members?: IProjectMember[]
    issues?: IIssue[]
    isMe?: boolean
    navigate?: (path: string) => void
    onIssueClick?: (issueId: string) => void
    size?: 'small' | 'normal'
}

/**
 * Standard utility to parse and render message content with styled mentions and tags.
 * Preserves the exact styling used in the live chat (ChatMessage.tsx).
 */
export const renderFormattedContent = (content: string, options: RenderOptions = {}) => {
    const { members = [], issues = [], isMe = false, navigate, onIssueClick, size = 'normal' } = options
    
    if (!content) return null

    // Match @[Name](id) or #[Key](id)
    const parts = content.split(/(@\[[^\]]+\]\([^)]+\)|#\[[^\]]+\]\([^)]+\))/g);
    
    return parts.map((part, index) => {
        const userMention = part.match(/@\[([^\]]+)\]\(([^)]+)\)/);
        if (userMention) {
            const name = userMention[1];
            const userId = userMention[2];
            const member = members.find(m => m.id.toString() === userId || m.email === userId);
            const avatarColor = member ? getAvatarColor(member.email) : getAvatarColor(name);
            const initial = name.charAt(0).toUpperCase();
            const isSmall = size === 'small'

            return (
                <span 
                    key={index} 
                    className={`inline-flex items-center ${isSmall ? 'gap-1' : 'gap-1.5'} font-black ${isSmall ? 'text-[11px]' : 'text-[12px]'} mx-0.5 transition-opacity hover:opacity-80 cursor-default group ${
                        isMe ? 'text-indigo-700' : 'text-blue-600'
                    }`}
                >
                    <div 
                        className={`${isSmall ? 'w-4 h-4 text-[8px]' : 'w-5 h-5 text-[10px]'} rounded-full flex items-center justify-center font-black shrink-0`}
                        style={{ backgroundColor: avatarColor, color: '#fff' }}
                    >
                        {initial}
                    </div>
                    @{name}
                </span>
            );
        }

        const issueMention = part.match(/#\[([^\]]+)\]\(([^)]+)\)/);
        if (issueMention) {
            const issueKey = issueMention[1];
            const issueId = issueMention[2];
            const issue = issues.find(i => i.id.toString() === issueId || i.issueKey === issueKey);
            const theme = getIssueTheme(issue?.type || 'TASK');
            const isSmall = size === 'small'

            return (
                <span 
                    key={index} 
                    onClick={(e) => {
                        e.stopPropagation()
                        if (onIssueClick) {
                            onIssueClick(issueId)
                            return
                        }
                        if (navigate && (issue || issueId)) {
                            const pid = issue?.projectId || (window.location.pathname.match(/\/projects\/([^/]+)/)?.[1])
                            if (pid) {
                                navigate(`/projects/${pid}/board?selectedIssue=${issue?.id || issueId}`)
                            }
                        }
                    }}
                    className={`inline-flex items-center ${isSmall ? 'gap-0.5' : 'gap-1'} font-black ${isSmall ? 'text-[11px]' : 'text-[12px]'} mx-0.5 transition-opacity hover:opacity-80 cursor-pointer ${theme.color} align-bottom`}
                    title={issue?.title || 'View Issue'}
                >
                    <span className={`material-symbols-outlined ${isSmall ? 'text-[12px]' : 'text-[14px]'} ${theme.color} font-bold`}>{theme.icon}</span>
                    {issueKey}
                </span>
            );
        }

        return part;
    });
}
