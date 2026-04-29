import React, { useState, useEffect } from 'react'
import * as api from '../services/api'
import type { IIssue, IChatMessage, IProjectMember, ILabel } from '../types'
import { getIssueTheme, getAvatarColor } from '../utils'
import { ChatMessage } from './chat/ChatMessage'

interface ReportDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    projectId: string
    reportType: 'total' | 'completed' | 'open' | 'overdue' | 'unassigned' | 'messages' | null
}

export const ReportDetailsModal = ({ isOpen, onClose, projectId, reportType }: ReportDetailsModalProps): React.ReactElement | null => {
    const [issues, setIssues] = useState<IIssue[]>([])
    const [messages, setMessages] = useState<IChatMessage[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (!isOpen || !projectId || !reportType) return

        const fetchData = async () => {
            setIsLoading(true)
            try {
                if (reportType === 'messages') {
                    // Fetch recent messages
                    const msgs = await api.fetchChatMessages(projectId, 0, 100)
                    setMessages(msgs)
                } else {
                    // Fetch all issues and filter
                    const allIssues = await api.fetchProjectIssues(projectId)
                    let filtered = allIssues
                    if (reportType === 'completed') {
                        filtered = allIssues.filter(i => i.status === 'DONE')
                    } else if (reportType === 'open') {
                        filtered = allIssues.filter(i => i.status !== 'DONE')
                    } else if (reportType === 'overdue') {
                        const now = new Date()
                        now.setHours(0,0,0,0)
                        filtered = allIssues.filter(i => {
                            if (!i.endDate) return false
                            const endDate = new Date(i.endDate)
                            return endDate < now && i.status !== 'DONE'
                        })
                    } else if (reportType === 'unassigned') {
                        filtered = allIssues.filter(i => !i.assigneeId || i.assigneeId === 'unassigned')
                    }
                    setIssues(filtered)
                }
            } catch (err) {
                console.error('Failed to fetch details:', err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [isOpen, projectId, reportType])

    if (!isOpen) return null

    const getTitle = () => {
        switch (reportType) {
            case 'total': return 'Total Issues'
            case 'completed': return 'Completed Issues'
            case 'open': return 'Open Issues'
            case 'overdue': return 'Overdue Issues'
            case 'unassigned': return 'Unassigned Issues'
            case 'messages': return 'Recent Chat Messages'
            default: return 'Details'
        }
    }

    const getHeaderTheme = () => {
        switch (reportType) {
            case 'total': return { icon: 'assignment', colorText: 'text-indigo-500', colorBg: 'bg-indigo-50' }
            case 'completed': return { icon: 'task_alt', colorText: 'text-emerald-500', colorBg: 'bg-emerald-50' }
            case 'open': return { icon: 'pending', colorText: 'text-amber-500', colorBg: 'bg-amber-50' }
            case 'overdue': return { icon: 'schedule', colorText: 'text-red-500', colorBg: 'bg-red-50' }
            case 'unassigned': return { icon: 'person_off', colorText: 'text-slate-500', colorBg: 'bg-slate-100' }
            case 'messages': return { icon: 'forum', colorText: 'text-blue-500', colorBg: 'bg-blue-50' }
            default: return { icon: 'list_alt', colorText: 'text-indigo-500', colorBg: 'bg-indigo-50' }
        }
    }

    const headerTheme = getHeaderTheme()

    const renderIssueRow = (issue: IIssue) => {
        const theme = getIssueTheme(issue.type)
        return (
            <div key={issue.id} className="group flex items-center justify-between p-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-all bg-white min-w-0">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-xl ${theme.bgColor} border border-slate-100`}>
                        <span className={`material-symbols-outlined text-[20px] ${theme.color}`}>{theme.icon}</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-black text-slate-400 tracking-wider hover:text-indigo-600 transition-colors cursor-pointer">{issue.issueKey}</span>
                            <span className="text-[14px] font-bold text-slate-800 truncate">{issue.title}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600">
                                {issue.status.replace('_', ' ')}
                            </span>
                            {issue.endDate && (
                                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                    {new Date(issue.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                    {issue.assigneeName ? (
                        <div className="flex items-center gap-2">
                            <div className="text-[11px] font-bold text-slate-600 truncate max-w-[100px] text-right">
                                {issue.assigneeName}
                            </div>
                            <div 
                                className="w-8 h-8 rounded-full text-white flex items-center justify-center text-[11px] font-black shadow-sm ring-2 ring-white"
                                style={{ backgroundColor: issue.assigneeEmail ? getAvatarColor(issue.assigneeEmail) : '#cbd5e1' }}
                            >
                                {issue.assigneeName.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className="text-[11px] font-bold text-slate-400 italic text-right">Unassigned</div>
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-[11px] font-black shadow-sm ring-2 ring-white">
                                ?
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm font-inter">
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200"
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${headerTheme.colorBg} flex items-center justify-center`}>
                            <span className={`material-symbols-outlined text-[24px] ${headerTheme.colorText}`}>
                                {headerTheme.icon}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">{getTitle()}</h2>
                            <p className="text-[12px] text-slate-500 font-medium">
                                {reportType === 'messages' 
                                 ? `${messages.length} recent messages` 
                                 : `${issues.length} matching issues`}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto bg-slate-50/30 custom-scrollbar p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <span className="material-symbols-outlined text-[32px] text-indigo-400 animate-spin">progress_activity</span>
                            <span className="text-[13px] font-bold text-slate-500">Loading details...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                            {reportType === 'messages' ? (
                                messages.length > 0 ? (
                                    <div className="p-6">
                                        {messages.map(msg => (
                                            <ChatMessage 
                                                key={msg.id} 
                                                message={msg} 
                                                isMe={false} // We don't have current user context here, but true/false is just styling
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-16 text-center text-[13px] font-bold text-slate-400">No recent messages found.</div>
                                )
                            ) : (
                                issues.length > 0 ? (
                                    issues.map(issue => renderIssueRow(issue))
                                ) : (
                                    <div className="py-16 text-center text-[13px] font-bold text-slate-400">No matching issues found.</div>
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
