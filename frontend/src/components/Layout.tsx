import React, { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAvatarColor } from '../utils'
import { useWebSocket } from '../hooks/useWebSocket'
import { ChatNotificationToast } from './chat/ChatNotificationToast'
import { renderFormattedContent } from '../utils/mentionUtils'
import type { IChatNotification, IAppNotification, IUnreadCountsResponse } from '../types'
import api, { markChatAsRead } from '../services/api'

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

    useEffect(() => {
        if (user) {
            api.get<IAppNotification[]>('/api/notifications')
                .then(res => setAppNotifications(res.data))
                .catch(err => console.error("Could not fetch notifications", err))
                
            api.get<IUnreadCountsResponse>('/api/chat/unread')
                .then(res => {
                    const data = res.data
                    const path = `/projects/${projectId}/chat`
                    if (projectId && location.pathname === path && data.projects[projectId] > 0) {
                        data.projects[projectId] = 0
                        markChatAsRead(projectId).catch(console.error)
                    }
                    setUnreadChatCounts(data)
                })
                .catch(err => console.error("Could not fetch unread chat counts", err))
        }
    }, [user, projectId, location.pathname])

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
        }).catch(err => console.error("Could not clear notifications", err))
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
        // Do not show notification for the current project if the user is already on its chat page
        if (location.pathname === `/projects/${notif.projectId}/chat`) {
            return
        }
        // Ignore notifications triggered by the user themselves (Now handled robustly via backend but frontend check kept as a fallback for testing edge cases if needed, but not strictly necessary context-wise)

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
    }, [location.pathname, user, playNotificationSound])

    const handleAppNotification = useCallback((appNotif: IAppNotification) => {
        setAppNotifications(prev => [appNotif, ...prev])
        
        // Also show a toast for app notifications (mentions)
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

    const navItems = projectId ? [
        { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
        { name: 'Agile Board', path: `/projects/${projectId}/board`, icon: 'view_kanban' },
        { name: 'Backlog', path: `/projects/${projectId}/backlog`, icon: 'list_alt' },
        { name: 'Team Chat', path: `/projects/${projectId}/chat`, icon: 'chat_bubble' },
        { name: 'AI Reports', path: `/projects/${projectId}/reports`, icon: 'analytics' }
    ] : [
        { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' }
    ]

    return (
        <div className="flex h-screen bg-[#f8fafc] font-inter text-slate-900 antialiased overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 flex-none bg-[#f1f5f9] flex flex-col border-r border-slate-200">
                {/* Logo Area */}
                <div className="h-16 flex items-center px-6 mt-4 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#1e293b] rounded-full flex items-center justify-center text-white">
                            <span className="font-bold text-sm">A</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-sm tracking-tight text-slate-800 leading-tight">Project Alpha</span>
                            <span className="text-[11px] text-slate-500">Active Project</span>
                        </div>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-4 py-2 space-y-1">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path || (item.name === 'Agile Board' && location.pathname.includes('/projects/'))
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                onClick={() => {
                                    if (item.name === 'Team Chat' && projectId) {
                                        setUnreadChatCounts(prev => ({ ...prev, [projectId]: 0 }))
                                        api.put(`/api/chat/projects/${projectId}/chat/read`).catch(console.error)
                                    }
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg shadow-sm transition-all duration-200 ${
                                    isActive 
                                    ? 'bg-white text-slate-900 border border-slate-200/60 font-semibold' 
                                    : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-800 font-medium'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                                    <span className="text-[13px]">{item.name}</span>
                                </div>
                                {item.name === 'Team Chat' && (
                                    (() => {
                                        const projectCount = unreadChatCounts.projects[projectId || ''] || 0
                                        const dmTotal = Object.values(unreadChatCounts.dms[projectId || ''] || {}).reduce((a, b) => a + b, 0)
                                        const total = projectCount + dmTotal
                                        return total > 0 && (
                                            <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                                                {total}
                                            </div>
                                        )
                                    })()
                                )}
                            </Link>
                        )
                    })}
                </nav>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
                {/* Top Navbar */}
                <header className="h-16 bg-white flex items-center justify-between px-8 border-b border-slate-200 shadow-sm z-40">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-[#2b3d50] rounded-full"></div>
                        <h2 className="text-[15px] font-bold text-slate-800">{projectContextName}</h2>
                        
                        <div className="ml-6 relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">search</span>
                            <input 
                                type="text"
                                placeholder="Search"
                                className="pl-10 pr-4 py-1.5 bg-white border border-slate-200 rounded-md text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#2b3d50]/20 focus:border-[#2b3d50]"
                            />
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <button 
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors relative"
                            >
                                <span className="material-symbols-outlined text-[20px]">notifications</span>
                                {appNotifications.length > 0 && (
                                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold shadow-sm">
                                        {appNotifications.length}
                                    </div>
                                )}
                            </button>
                            
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 origin-top-right">
                                    <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                                        <span className="font-bold text-sm text-slate-800">Notifications</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{appNotifications.length} new</span>
                                            {appNotifications.length > 0 && (
                                                <button onClick={clearAllNotifications} className="text-[11px] font-bold text-slate-400 hover:text-slate-700 transition-colors">
                                                    Clear All
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto">
                                        {appNotifications.length === 0 ? (
                                            <div className="px-4 py-8 text-center text-sm text-slate-400 flex flex-col items-center gap-2">
                                                <span className="material-symbols-outlined text-3xl opacity-20">notifications_off</span>
                                                All caught up!
                                            </div>
                                        ) : (
                                            appNotifications.map(n => (
                                                <button 
                                                    key={n.id}
                                                    onClick={() => markAsRead(n.id, n.relatedProjectId, n.messageId, n.senderEmail, n.isDirect)}
                                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors group"
                                                >
                                                    <div className="flex gap-3">
                                                        {n.senderEmail && n.senderName ? (
                                                            <div 
                                                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0 mt-0.5 shadow-sm border border-black/5"
                                                                style={{ backgroundColor: getAvatarColor(n.senderEmail) }}
                                                            >
                                                                {n.senderName.charAt(0).toUpperCase()}
                                                            </div>
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                                <span className="material-symbols-outlined text-[16px]"> alternate_email</span>
                                                            </div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[13px] text-slate-800 font-bold mb-0.5 truncate">{n.title}</p>
                                                            <p className="text-[12px] text-slate-500 leading-tight line-clamp-2">
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
                        <button className="flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors whitespace-nowrap ml-2">
                            <span className="material-symbols-outlined text-[20px]">settings</span>
                        </button>
                        <div className="relative">
                            <button
                                onClick={handleLogout}
                                className="flex items-center justify-center rounded-full w-8 h-8 text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-[#2b3d50] focus:ring-offset-2 transition-transform hover:scale-105 shadow-md ml-2"
                                style={{ backgroundColor: user?.email ? getAvatarColor(user.email) : '#f97316' }}
                                title="Click to logout"
                            >
                                {user?.firstName ? user.firstName.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'U')}
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto relative">
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
