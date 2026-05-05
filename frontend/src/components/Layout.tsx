import React, { useState, useEffect, useCallback } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api, { markChatAsRead, fetchProjectById } from '../services/api'
import { useWebSocket } from '../hooks/useWebSocket'
import { ChatNotificationToast } from './chat/ChatNotificationToast'
import type { IChatNotification, IAppNotification, IUnreadCountsResponse, IProject } from '../types'
import { getAvatarColor } from '../utils'
import { renderFormattedContent } from '../utils/mentionUtils'
import { GlobalSearch } from './GlobalSearch'

interface LayoutProps {
    children: React.ReactNode
    projectContextName?: string
    onUnreadCountsChange?: (counts: IUnreadCountsResponse) => void
}

export const Layout = ({ children, projectContextName = 'Project Name', onUnreadCountsChange }: LayoutProps): React.ReactElement => {
    const { user, logout } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const { id: projectId } = useParams<{ id: string }>()
    const [notification, setNotification] = React.useState<IChatNotification | null>(null)
    const [unreadChatCounts, setUnreadChatCounts] = useState<IUnreadCountsResponse>({ projects: {}, dms: {} })
    const [appNotifications, setAppNotifications] = useState<IAppNotification[]>([])
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [role, setRole] = useState<string | null>(null)
    const [projectData, setProjectData] = useState<IProject | null>(null)

    useEffect(() => {
        if (user) {
            api.get<IAppNotification[]>('/api/notifications')
                .then((res: { data: IAppNotification[] }) => setAppNotifications(res.data))
                .catch((err: any) => console.error("Could not fetch notifications", err))

            api.get<IUnreadCountsResponse>('/api/chat/unread')
                .then((res: { data: IUnreadCountsResponse }) => {
                    const data = res.data
                    const path = `/projects/${projectId}/chat`
                    if (projectId && location.pathname === path && data.projects[projectId] > 0) {
                        data.projects[projectId] = 0
                        markChatAsRead(projectId).catch(console.error)
                    }
                    setUnreadChatCounts(data)
                })
                .catch((err: any) => console.error("Could not fetch unread chat counts", err))
        }
    }, [user, projectId, location.pathname])

    useEffect(() => {
        if (projectId) {
            fetchProjectById(projectId)
                .then((data: IProject) => {
                    setRole(data.currentUserRole)
                    setProjectData(data)
                })
                .catch((err: any) => console.error('Failed to fetch project for layout:', err))
        } else {
            // Reset state when no project ID is present (e.g. on Dashboard)
            setRole(null)
            setProjectData(null)
        }
    }, [projectId])

    useEffect(() => {
        if (onUnreadCountsChange) {
            onUnreadCountsChange(unreadChatCounts)
        }
    }, [unreadChatCounts, onUnreadCountsChange])

    const markAsRead = (notificationId: string, relatedProjectId: string, messageId?: string, senderEmail?: string, isDirect?: boolean) => {
        api.put(`/api/notifications/${notificationId}/read`).then(() => {
            setAppNotifications(prev => prev.filter(n => n.id !== notificationId))
            setIsDropdownOpen(false)

            const params = new URLSearchParams()
            if (messageId) params.set('messageId', messageId)
            if (senderEmail) params.set('senderEmail', senderEmail)
            if (isDirect) params.set('isDirect', 'true')

            const url = `/projects/${relatedProjectId}/chat${params.toString() ? `?${params.toString()}` : ''}`
            navigate(url)
        })
    }

    const clearAllNotifications = () => {
        api.delete('/api/notifications/all').then(() => {
            setAppNotifications([])
            setIsDropdownOpen(false)
        }).catch((err: any) => console.error("Could not clear notifications", err))
    }

    const playNotificationSound = useCallback(() => {
        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
            const oscillator = audioCtx.createOscillator()
            const gainNode = audioCtx.createGain()

            oscillator.type = 'sine'
            oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime) // D5
            oscillator.frequency.exponentialRampToValueAtTime(880.00, audioCtx.currentTime + 0.1) // A5

            gainNode.gain.setValueAtTime(0, audioCtx.currentTime)
            gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05)
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3)

            oscillator.connect(gainNode)
            gainNode.connect(audioCtx.destination)

            oscillator.start(audioCtx.currentTime)
            oscillator.stop(audioCtx.currentTime + 0.3)
        } catch (e) {
            console.warn('Audio not supported', e)
        }
    }, [])

    const handleNotification = useCallback((notif: IChatNotification) => {
        if (location.pathname === `/projects/${notif.projectId}/chat`) {
            return
        }

        if (notif.isDirect) {
            setUnreadChatCounts(prev => ({
                ...prev,
                dms: {
                    ...prev.dms,
                    [notif.projectId]: {
                        ...(prev.dms[notif.projectId] || {}),
                        [notif.senderEmail]: ((prev.dms[notif.projectId] || {})[notif.senderEmail] || 0) + 1
                    }
                }
            }))
        } else {
            setUnreadChatCounts(prev => ({
                ...prev,
                projects: {
                    ...prev.projects,
                    [notif.projectId]: (prev.projects[notif.projectId] || 0) + 1
                }
            }))
        }

        setNotification(notif)
        playNotificationSound()
    }, [location.pathname, playNotificationSound])

    const handleAppNotification = useCallback((appNotif: IAppNotification) => {
        setAppNotifications(prev => [appNotif, ...prev])

        if (appNotif.senderName && appNotif.senderEmail) {
            setNotification({
                projectId: appNotif.relatedProjectId,
                projectName: 'Mention',
                senderName: appNotif.senderName,
                senderEmail: appNotif.senderEmail,
                messagePreview: appNotif.message,
                messageId: appNotif.messageId,
                isDirect: appNotif.isDirect,
                timestamp: appNotif.createdAt
            })
        }

        playNotificationSound()
    }, [playNotificationSound])

    useWebSocket({
        onNotification: handleNotification,
        onAppNotification: handleAppNotification
    })

    const navItems = [
        {
            icon: 'grid_view',
            label: 'Agile Board',
            path: `/projects/${projectId}/board`,
            isActive: location.pathname === `/projects/${projectId}/board`
        },
        {
            icon: 'list_alt',
            label: 'Backlog',
            path: `/projects/${projectId}/backlog`,
            isActive: location.pathname === `/projects/${projectId}/backlog`
        },
        {
            icon: 'chat_bubble',
            label: 'Team Chat',
            path: `/projects/${projectId}/chat`,
            isActive: location.pathname.startsWith(`/projects/${projectId}/chat`),
            isChat: true
        },
        {
            icon: 'auto_awesome',
            label: 'AI Reports',
            path: `/projects/${projectId}/reports`,
            isActive: location.pathname === `/projects/${projectId}/reports`,
            roleRequired: 'PROJECT_MANAGER'
        },
    ]

    const filteredNavItems = navItems.filter(item => {
        // Only show project-specific items if we have a project context
        if (!projectId) return false

        if (item.roleRequired === 'PROJECT_MANAGER') {
            return role === 'PROJECT_MANAGER'
        }
        return true
    })

    return (
        <div className="flex h-screen w-full bg-[#f8fafc] font-inter overflow-hidden">
            {/* Sidebar */}
            <aside className="w-[240px] flex-none bg-[#24334a] flex flex-col transition-all shadow-xl z-50">
                {/* Logo / Project Context Area */}
                <div className="p-4 flex items-center gap-3 border-b border-white/10">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center flex-none shadow-lg shadow-blue-900/20">
                        <span className="material-symbols-outlined text-white text-[22px]">rocket_launch</span>
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-white text-[14px] font-bold truncate tracking-tight">{projectData?.name || projectContextName}</h3>
                        <p className="text-slate-500 text-[10px] font-bold tracking-widest uppercase mt-0.5">{projectData?.projectKey || 'ACTIVE PROJECT'}</p>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {filteredNavItems.map((item) => (
                        <Link
                            key={item.label}
                            to={item.path}
                            onClick={() => {
                                if (item.isChat && projectId) {
                                    setUnreadChatCounts(prev => ({
                                        ...prev,
                                        projects: { ...prev.projects, [projectId]: 0 }
                                    }))
                                    markChatAsRead(projectId).catch(console.error)
                                }
                            }}
                            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative ${item.isActive
                                ? 'bg-blue-600/10 text-blue-400'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <span className={`material-symbols-outlined text-[20px] transition-colors ${item.isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                                {item.icon}
                            </span>
                            <span className="text-[13px] font-semibold tracking-tight">{item.label}</span>

                            {item.isChat && (
                                (() => {
                                    const projectCount = unreadChatCounts.projects[projectId || ''] || 0
                                    const dmTotal = Object.values(unreadChatCounts.dms[projectId || ''] || {}).reduce((a, b) => a + b, 0)
                                    const total = projectCount + dmTotal
                                    return total > 0 && (
                                        <div className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-red-900/20 animate-in zoom-in duration-300">
                                            {total}
                                        </div>
                                    )
                                })()
                            )}

                            {item.isActive && (
                                <div className="absolute left-0 w-1 h-5 bg-blue-500 rounded-r-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                            )}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white transition-colors text-[13px] font-medium group">
                        <span className="material-symbols-outlined text-[18px] group-hover:rotate-12 transition-transform">dashboard</span>
                        Back to Dashboard
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
                {/* Top Navbar */}
                <header className="h-16 bg-white flex items-center justify-between px-8 border-b border-slate-200/80 shadow-sm z-40">
                    <div className="flex items-center gap-3">
                        <h2 className="text-[16px] font-bold text-slate-800 tracking-tight">{projectData?.name || projectContextName}</h2>
                        <div className="w-px h-4 bg-slate-200 mx-2"></div>
                        <GlobalSearch />
                    </div>

                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors relative p-2 rounded-lg hover:bg-slate-100"
                            >
                                <span className="material-symbols-outlined text-[22px]">notifications</span>
                                {appNotifications.length > 0 && (
                                    <div className="absolute top-1 right-1 bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold shadow-sm border-2 border-white">
                                        {appNotifications.length}
                                    </div>
                                )}
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 origin-top-right">
                                    <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                                        <span className="font-bold text-sm text-slate-800">Notifications</span>
                                        <div className="flex items-center gap-3">
                                            {appNotifications.length > 0 && (
                                                <button onClick={clearAllNotifications} className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors">
                                                    Clear All
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                        {appNotifications.length === 0 ? (
                                            <div className="px-4 py-12 text-center text-sm text-slate-400 flex flex-col items-center gap-2">
                                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-1">
                                                    <span className="material-symbols-outlined text-2xl opacity-20">notifications_off</span>
                                                </div>
                                                <p className="font-bold text-slate-800">All caught up!</p>
                                                <p className="text-xs">No new notifications at the moment.</p>
                                            </div>
                                        ) : (
                                            appNotifications.map(n => (
                                                <button
                                                    key={n.id}
                                                    onClick={() => markAsRead(n.id, n.relatedProjectId, n.messageId, n.senderEmail, n.isDirect)}
                                                    className="w-full text-left px-4 py-4 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors group"
                                                >
                                                    <div className="flex gap-3">
                                                        {n.senderEmail && n.senderName ? (
                                                            <div
                                                                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-black shrink-0 shadow-sm border border-black/5"
                                                                style={{ backgroundColor: getAvatarColor(n.senderEmail) }}
                                                            >
                                                                {n.senderName.charAt(0).toUpperCase()}
                                                            </div>
                                                        ) : (
                                                            <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                                <span className="material-symbols-outlined text-[18px]">notifications</span>
                                                            </div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-start mb-0.5">
                                                                <p className="text-[13px] text-slate-800 font-bold truncate">{n.title}</p>
                                                                <span className="text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                            <p className="text-[12px] text-slate-500 leading-snug line-clamp-2">
                                                                {renderFormattedContent(n.message, { size: 'small', navigate })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button className="flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors p-2 rounded-lg hover:bg-slate-100">
                            <span className="material-symbols-outlined text-[22px]">settings</span>
                        </button>

                        <div className="w-px h-6 bg-slate-200"></div>

                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end">
                                <span className="text-[13px] font-bold text-slate-800 leading-none">{user?.firstName} {user?.lastName}</span>
                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mt-1">{role?.replace('_', ' ') || 'USER'}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center justify-center rounded-xl w-10 h-10 text-white font-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all hover:scale-105 shadow-lg active:scale-95"
                                style={{ backgroundColor: user?.email ? getAvatarColor(user.email) : '#3b82f6' }}
                                title="Click to logout"
                            >
                                {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto relative bg-[#f8fafc]">
                    {children}
                </main>
            </div>

            {/* Global Notification Toast */}
            <ChatNotificationToast
                notification={notification}
                onClose={() => setNotification(null)}
            />
        </div>
    )
}
