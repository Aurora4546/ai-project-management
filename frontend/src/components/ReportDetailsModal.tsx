import React, { useState, useEffect } from 'react'
import * as api from '../services/api'
import type { IIssue, IChatMessage, IReport } from '../types'
import { getIssueTheme, getAvatarColor } from '../utils'
import { ChatMessage } from './chat/ChatMessage'

interface ReportDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    projectId: string
    report: IReport | null
    reportType: 'total' | 'completed' | 'open' | 'overdue' | 'unassigned' | 'messages' | null
}

export const ReportDetailsModal = ({ isOpen, onClose, projectId, report, reportType }: ReportDetailsModalProps): React.ReactElement | null => {
    const [issues, setIssues] = useState<IIssue[]>([])
    const [messages, setMessages] = useState<IChatMessage[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isHistorical, setIsHistorical] = useState(false)

    useEffect(() => {
        if (!isOpen || !report || !reportType) return

        const fetchData = async () => {
            setIsLoading(true)
            try {
                if (reportType === 'messages') {
                    // Use snapshot if available, otherwise fetch (for legacy/current reports)
                    if (report.messageSnapshots && Array.isArray(report.messageSnapshots)) {
                        setMessages(report.messageSnapshots)
                        setIsHistorical(true)
                    } else if (projectId) {
                        const msgs = await api.fetchChatMessages(projectId, 0, 100)
                        setMessages(msgs)
                        setIsHistorical(false)
                    }
                } else {
                    let sourceIssues: IIssue[] = []
                    let snapshotsUsed = false
                    if (report.issueSnapshots && Array.isArray(report.issueSnapshots)) {
                        sourceIssues = report.issueSnapshots
                        snapshotsUsed = true
                    } else if (projectId) {
                        // Fallback to live data only if no snapshots exist (legacy reports)
                        sourceIssues = await api.fetchProjectIssues(projectId)
                    }

                    setIsHistorical(snapshotsUsed)

                    let filtered = sourceIssues
                    if (reportType === 'completed') {
                        filtered = sourceIssues.filter(i => i.status === 'DONE')
                    } else if (reportType === 'open') {
                        filtered = sourceIssues.filter(i => i.status !== 'DONE')
                    } else if (reportType === 'overdue') {
                        // For overdue, we use the date relative to when the report was generated
                        const generatedDate = new Date(report.generatedAt)
                        generatedDate.setHours(0,0,0,0)
                        filtered = sourceIssues.filter(i => {
                            if (!i.endDate) return false
                            const endDate = new Date(i.endDate)
                            // If we have snapshots, we use the status from the snapshot
                            // If we are using live data, this will be inaccurate for past reports (as user noted)
                            return endDate < generatedDate && i.status !== 'DONE'
                        })
                    } else if (reportType === 'unassigned') {
                        filtered = sourceIssues.filter(i => !i.assigneeId || i.assigneeId === 'unassigned' || i.assigneeId === 0)
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
    }, [isOpen, projectId, report, reportType])

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
            <div key={issue.id} className="group flex items-center justify-between p-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-all bg-white min-w-0 gap-4">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-xl ${theme.bgColor} border border-slate-100 overflow-visible`}>
                        <span className={`material-symbols-outlined text-[20px] ${theme.color} flex items-center justify-center leading-none`}>{theme.icon}</span>
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 min-w-0">
                            <span className="text-[10px] md:text-[11px] font-black text-slate-400 tracking-wider shrink-0 uppercase">{issue.issueKey}</span>
                            <span className="text-[13px] md:text-[14px] font-bold text-slate-800 truncate" title={issue.title}>{issue.title}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 shrink-0">
                                {issue.status.replace('_', ' ')}
                            </span>
                            {issue.endDate && (
                                <span className="text-[10px] md:text-[11px] text-slate-400 font-medium flex items-center gap-1 truncate">
                                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                    {new Date(issue.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    {issue.assigneeName ? (
                        <div className="flex items-center gap-2">
                            <div className="hidden sm:block text-[11px] font-bold text-slate-500 truncate max-w-[80px] text-right" title={issue.assigneeName}>
                                {issue.assigneeName}
                            </div>
                            <div 
                                className="w-8 h-8 rounded-full text-white flex items-center justify-center text-[11px] font-black shadow-sm ring-2 ring-white shrink-0"
                                style={{ backgroundColor: issue.assigneeEmail ? getAvatarColor(issue.assigneeEmail) : '#cbd5e1' }}
                                title={issue.assigneeName}
                            >
                                {issue.assigneeName.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className="hidden sm:block text-[11px] font-bold text-slate-400 italic text-right">Unassigned</div>
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-[11px] font-black shadow-sm ring-2 ring-white shrink-0">
                                ?
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm font-inter animate-in fade-in duration-300">
            <div 
                className="bg-white rounded-[24px] sm:rounded-[32px] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20"
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="p-4 md:p-6 flex items-center justify-between border-b border-slate-200 bg-white shrink-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-10 h-10 rounded-xl ${headerTheme.colorBg} flex items-center justify-center shrink-0`}>
                            <span className={`material-symbols-outlined text-[24px] ${headerTheme.colorText} leading-none`}>
                                {headerTheme.icon}
                            </span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-black text-slate-800 tracking-tight truncate">{getTitle()}</h2>
                            </div>
                            <p className="text-[12px] text-slate-500 font-medium">
                                {reportType === 'messages' 
                                 ? `${messages.length} recent messages` 
                                 : `${issues.length} matching issues`}
                                {!isHistorical && <span className="text-amber-500 ml-1">(Live Data)</span>}
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
                                    <div className="p-4 md:p-6 space-y-2">
                                        {messages.map(msg => (
                                            <ChatMessage 
                                                key={msg.id} 
                                                message={msg} 
                                                isMe={false}
                                                compact={true}
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
