import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { ChatMessage } from '../components/chat/ChatMessage'
import { ChatInput } from '../components/chat/ChatInput'
import { ChatMembersSidebar } from '../components/chat/ChatMembersSidebar'
import { ChatSearch } from '../components/chat/ChatSearch'
import { ChatNotificationToast } from '../components/chat/ChatNotificationToast'
import { UpdateIssueModal } from '../components/UpdateIssueModal'
import { useWebSocket } from '../hooks/useWebSocket'
import { useAuth } from '../context/AuthContext'
import { getAvatarColor } from '../utils/index'
import { 
    fetchChatMessages,
    fetchDirectMessages,
    fetchProjectById,
    fetchProjectIssues,
    fetchOnlineUsers,
    fetchProjectFiles,
    searchChatMessages,
    searchChatFiles,
    searchDirectMessages,
    searchDirectFiles,
    fetchDirectFiles,
    uploadChatFile,
    updateChatMessage,
    deleteChatMessage,
    markChatAsRead
} from '../services/api'
import type { IChatMessage, IProject, IIssue, IOnlineUser, IChatNotification, IChatTypingEvent, IProjectMember, IChatEvent, IUnreadCountsResponse } from '../types'

type ActiveChannel = { type: 'PROJECT' } | { type: 'DM', member: IProjectMember }

export const TeamChat = (): React.ReactElement => {
    const { id: projectId } = useParams<{ id: string }>()
    const location = useLocation()
    const { user } = useAuth()
    
    const [project, setProject] = useState<IProject | null>(null)
    const [messages, setMessages] = useState<IChatMessage[]>([])
    const [issues, setIssues] = useState<IIssue[]>([])
    const [onlineUsers, setOnlineUsers] = useState<IOnlineUser[]>([])
    const [typingUsers, setTypingUsers] = useState<Record<string, string>>({})
    const [activeChannel, setActiveChannel] = useState<ActiveChannel>({ type: 'PROJECT' })
    const [showSearch, setShowSearch] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const [notification, setNotification] = useState<IChatNotification | null>(null)
    const [unreadCounts, setUnreadCounts] = useState<IUnreadCountsResponse>({ projects: {}, dms: {} })
    const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const chatContainerRef = useRef<HTMLDivElement>(null)

    // Derived: Combine leads and members for the sidebar
    const allMembers = useMemo(() => {
        const leadList = project?.leads?.map(l => ({ ...l, role: 'PROJECT_LEAD' })) || []
        const memberList = project?.members?.map(m => ({ ...m, role: 'MEMBER' })) || []
        
        // Remove duplicates if any
        const uniqueMap = new Map<string, IProjectMember & { role?: string }>()
        leadList.forEach(l => uniqueMap.set(l.email, l as any))
        memberList.forEach(m => {
            if (!uniqueMap.has(m.email)) {
                uniqueMap.set(m.email, m as any)
            }
        })
        
        return Array.from(uniqueMap.values())
    }, [project])

    // Members available for DM (excluding self)
    const dmMembers = useMemo(() => {
        return allMembers.filter((m: IProjectMember) => m.email !== user?.email)
    }, [allMembers, user?.email])

    // Handlers for WebSocket events
    const handleNewMessage = useCallback((msg: IChatMessage) => {
        // Filter message based on active channel
        const isProjectChannel = activeChannel.type === 'PROJECT'
        const isThisProjectMsg = msg.recipientEmail === null
        
        if (isProjectChannel && isThisProjectMsg) {
            setMessages(prev => [...prev, msg])
        } else if (activeChannel.type === 'DM') {
            const isFromMeToActiveMember = msg.senderEmail === user?.email && msg.recipientEmail === activeChannel.member.email
            const isFromActiveMemberToMe = msg.senderEmail === activeChannel.member.email && msg.recipientEmail === user?.email
            if (isFromMeToActiveMember || isFromActiveMemberToMe) {
                setMessages(prev => [...prev, msg])
            }
        }

        // Handle notifications for messages in other channels
        const isRelevantToMe = msg.recipientEmail === user?.email || (msg.recipientEmail === null && msg.senderEmail !== user?.email)
        const isInActiveChannel = (isProjectChannel && isThisProjectMsg) || 
                                 (activeChannel.type === 'DM' && (msg.senderEmail === activeChannel.member.email || msg.recipientEmail === activeChannel.member.email))
        
        if (isRelevantToMe && !isInActiveChannel && document.hasFocus()) {
            setNotification({
                projectId: projectId!,
                projectName: project?.name || 'New Message',
                senderName: `${msg.senderFirstName} ${msg.senderLastName}`,
                senderEmail: msg.senderEmail,
                messagePreview: msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : ''),
                timestamp: msg.createdAt
            })
        }
    }, [user?.email, projectId, activeChannel, project?.name])

    const handleChatEvent = useCallback((event: IChatEvent) => {
        if (event.type === 'MESSAGE_UPDATED' && event.message) {
            setMessages(prev => prev.map(m => m.id === event.messageId ? event.message! : m))
        } else if (event.type === 'MESSAGE_DELETED') {
            setMessages(prev => prev.filter(m => m.id !== event.messageId))
        }
    }, [])

    const handleTypingEvent = useCallback((event: IChatTypingEvent) => {
        if (event.userEmail === user?.email) return

        setTypingUsers(prev => {
            const newState = { ...prev }
            if (event.typing) {
                newState[event.userEmail] = event.firstName
            } else {
                delete newState[event.userEmail]
            }
            return newState
        })
    }, [user?.email])

    const handlePresenceUpdate = useCallback(() => {
        // Refresh online users list
        if (projectId) {
            fetchOnlineUsers(projectId).then(setOnlineUsers)
        }
    }, [projectId])

    const { sendChatMessage, sendTypingStatus, sendHeartbeat } = useWebSocket({
        projectId,
        onMessageReceived: handleNewMessage,
        onChatEvent: handleChatEvent,
        onTypingEvent: handleTypingEvent,
        onPresenceUpdate: handlePresenceUpdate
    })

    // Reactive message loader
    useEffect(() => {
        if (!projectId) return

        const loadMessages = async () => {
            setMessages([])
            setPage(0)
            setIsLoading(true)
            
            try {
                let msgData: IChatMessage[] = []
                if (activeChannel.type === 'PROJECT') {
                    msgData = await fetchChatMessages(projectId, 0, 50)
                } else {
                    msgData = await fetchDirectMessages(projectId, activeChannel.member.id, 0, 50)
                }
                setMessages(msgData.reverse())
                setHasMore(msgData.length === 50)
            } catch (error) {
                console.error("Failed to load messages", error)
            } finally {
                setIsLoading(false)
            }
        }

        loadMessages()
    }, [projectId, activeChannel])

    // Update active channel
    const handleChannelSwitch = (channel: ActiveChannel) => {
        setActiveChannel(channel)
        setIsSidebarOpen(false) // Close sidebar on mobile after selection
    }

    // Reactive deep-link handler - Only handles state transitions
    useEffect(() => {
        if (!projectId || allMembers.length === 0) return

        const params = new URLSearchParams(location.search)
        const deepLinkMessageId = params.get('messageId')
        const deepLinkSenderEmail = params.get('senderEmail')
        const isDirect = params.get('isDirect') === 'true'

        if (!deepLinkMessageId && !deepLinkSenderEmail) return

        const processDeepLink = async () => {
            // 1. Handle Channel Switch if needed
            if (isDirect && deepLinkSenderEmail && deepLinkSenderEmail !== user?.email) {
                if (activeChannel.type !== 'DM' || activeChannel.member.email !== deepLinkSenderEmail) {
                    const foundMember = allMembers.find(m => m.email === deepLinkSenderEmail)
                    if (foundMember) {
                        setActiveChannel({ type: 'DM', member: foundMember })
                    }
                }
            } else if (!isDirect && activeChannel.type !== 'PROJECT') {
                setActiveChannel({ type: 'PROJECT' })
            }

            // 2. Scroll to message
            if (deepLinkMessageId) {
                // Wait for render/messages load reactive effect
                setTimeout(() => {
                    scrollToMessage(deepLinkMessageId)
                    const el = document.getElementById(`msg-${deepLinkMessageId}`)
                    if (el) {
                        el.classList.add('bg-blue-50/50')
                        setTimeout(() => el.classList.remove('bg-blue-50/50'), 2000)
                    }
                }, 800)
            }

            // 3. "Consume" params
            const newParams = new URLSearchParams(location.search)
            newParams.delete('messageId')
            newParams.delete('senderEmail')
            newParams.delete('isDirect')
            const newSearch = newParams.toString()
            window.history.replaceState(null, '', `${location.pathname}${newSearch ? `?${newSearch}` : ''}`)
        }

        processDeepLink()
    }, [projectId, location.search, allMembers])

    // Initial project data load
    useEffect(() => {
        if (!projectId) return

        const loadContent = async () => {
            try {
                const [projData, issueData, onlineData] = await Promise.all([
                    fetchProjectById(projectId),
                    fetchProjectIssues(projectId),
                    fetchOnlineUsers(projectId)
                ])
                setProject(projData)
                setIssues(issueData)
                setOnlineUsers(onlineData)
            } catch (error) {
                console.error("Failed to load chat data", error)
            }
        }

        loadContent()
    }, [projectId])

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Heartbeat for presence
    useEffect(() => {
        const interval = setInterval(() => {
            sendHeartbeat()
        }, 30000) // Every 30 seconds
        return () => clearInterval(interval)
    }, [sendHeartbeat])

    // Mark as read when active channel changes
    useEffect(() => {
        if (!projectId) return

        const markAsRead = async () => {
            const recipientId = activeChannel.type === 'DM' ? activeChannel.member.id : undefined
            try {
                await markChatAsRead(projectId, recipientId)
                
                // Update local unread state optimistically
                setUnreadCounts(prev => {
                    const next = { ...prev }
                    if (activeChannel.type === 'PROJECT') {
                        next.projects = { ...next.projects, [projectId]: 0 }
                    } else if (activeChannel.type === 'DM') {
                        const projectDms = { ...(next.dms[projectId] || {}) }
                        projectDms[activeChannel.member.id] = 0
                        next.dms = { ...next.dms, [projectId]: projectDms }
                    }
                    return next
                })
            } catch (error) {
                console.error("Failed to mark chat as read", error)
            }
        }

        markAsRead()
    }, [projectId, activeChannel])

    const loadMoreMessages = async () => {
        if (!projectId || !hasMore || isLoading) return
        
        try {
            const nextPage = page + 1
            let moreMessages: IChatMessage[] = []
            if (activeChannel.type === 'PROJECT') {
                moreMessages = await fetchChatMessages(projectId, nextPage, 50)
            } else {
                moreMessages = await fetchDirectMessages(projectId, activeChannel.member.id, nextPage, 50)
            }

            if (moreMessages.length > 0) {
                setMessages(prev => [...moreMessages.reverse(), ...prev])
                setPage(nextPage)
            }
            setHasMore(moreMessages.length === 50)
        } catch (error) {
            console.error("Failed to load more messages", error)
        }
    }

    const handleSendMessage = (content: string) => {
        const recipientId = activeChannel.type === 'DM' ? activeChannel.member.id : undefined
        sendChatMessage(content, 'TEXT', recipientId)
    }

    const formatTypingText = () => {
        const names = Object.values(typingUsers)
        if (names.length === 0) return null
        if (names.length === 1) return `${names[0]} is typing...`
        if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`
        return 'Several people are typing...'
    }

    const handleFileUpload = async (file: File) => {
        if (!projectId) return
        try {
            const recipientId = activeChannel.type === 'DM' ? activeChannel.member.id : undefined
            await uploadChatFile(projectId, file, recipientId)
        } catch (error) {
            console.error("File upload failed", error)
            alert("Failed to upload file. Max size 50MB.")
        }
    }

    const handleUpdateMessage = async (messageId: string, content: string) => {
        try {
            await updateChatMessage(projectId!, messageId, content)
        } catch (error) {
            console.error("Failed to update message", error)
            alert("Failed to update message. Please try again.")
        }
    }

    const handleDeleteMessage = async (messageId: string) => {
        try {
            await deleteChatMessage(projectId!, messageId)
        } catch (error) {
            console.error("Failed to delete message", error)
            alert("Failed to delete message. Please try again.")
        }
    }

    const scrollToMessage = (messageId: string) => {
        const element = document.getElementById(`msg-${messageId}`)
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    return (
        <Layout 
            projectContextName={project?.name || 'Loading Chat...'}
            onUnreadCountsChange={setUnreadCounts}
        >
            <div className="flex h-[calc(100vh-64px)] overflow-hidden font-inter relative">
                {/* Left: Members Sidebar */}
                <div className={`
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                    absolute md:relative z-30 md:z-auto transition-transform duration-300 h-full shadow-2xl md:shadow-none
                `}>
                    <ChatMembersSidebar 
                        members={dmMembers} 
                        onlineUsers={onlineUsers} 
                        activeChannel={activeChannel}
                        onChannelSwitch={handleChannelSwitch}
                        unreadCounts={unreadCounts}
                    />
                </div>

                {/* Mobile Backdrop for Sidebar */}
                {isSidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-20 md:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Center: Chat Interface */}
                <div className="flex-1 flex flex-col min-w-0 bg-white relative">
                    {/* Header */}
                    <div className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-slate-200 shrink-0">
                        <div className="flex items-center gap-2 md:gap-4">
                            {/* Mobile Sidebar Toggle */}
                            <button 
                                onClick={() => setIsSidebarOpen(true)}
                                className="p-2 -ml-2 text-slate-400 hover:text-slate-600 md:hidden flex items-center justify-center"
                                aria-label="Open chat menu"
                            >
                                <span className="material-symbols-outlined">menu_open</span>
                            </button>
                            {activeChannel.type === 'PROJECT' ? (
                                <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">
                                    {project?.name}
                                </h2>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <div className="relative group/dm-avatar">
                                        <div 
                                            className="w-10 h-10 rounded-[14px] flex items-center justify-center text-white text-[13px] font-bold shadow-md border-2 border-white ring-1 ring-slate-100 transition-transform group-hover/dm-avatar:scale-105"
                                            style={{ backgroundColor: getAvatarColor(activeChannel.member.email) }}
                                        >
                                            {activeChannel.member.firstName.charAt(0).toUpperCase()}
                                        </div>
                                        {onlineUsers.some(ou => ou.email === activeChannel.member.email) && (
                                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
                                        )}
                                    </div>
                                    <div className="flex flex-col -gap-0.5">
                                        <h2 className="text-[15px] font-bold text-slate-800 tracking-tight leading-tight">
                                            {activeChannel.member.firstName} {activeChannel.member.lastName}
                                        </h2>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                Direct Message
                                            </span>
                                            <span className={`w-1 h-1 rounded-full ${onlineUsers.some(ou => ou.email === activeChannel.member.email) ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                                            <span className="text-[10px] font-bold text-slate-400">
                                                {onlineUsers.some(ou => ou.email === activeChannel.member.email) ? 'Online' : 'Offline'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Project Members Avatars */}
                            {activeChannel.type === 'PROJECT' && allMembers.length > 0 && (
                                <div className="flex items-center mr-3">
                                    {allMembers.slice(0, 2).map((member, i) => (
                                        <div 
                                            key={member.id} 
                                            className="w-[34px] h-[34px] rounded-[12px] border-[2px] border-white flex items-center justify-center -ml-2.5 first:ml-0 overflow-hidden relative shadow-sm"
                                            style={{ backgroundColor: getAvatarColor(member.email), zIndex: 10 - i }}
                                        >
                                            <span className="text-white text-[12px] font-bold">
                                                {member.firstName.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    ))}
                                    {allMembers.length > 2 && (
                                        <div className="w-[34px] h-[34px] rounded-[12px] bg-[#E8EDF1] border-[2px] border-white flex items-center justify-center -ml-2.5 text-[12px] font-bold text-slate-500 shadow-sm z-0">
                                            +{allMembers.length - 2}
                                        </div>
                                    )}
                                </div>
                            )}

                            <button 
                                onClick={() => setShowSearch(!showSearch)}
                                className={`p-2 rounded-lg transition-all ${
                                    showSearch ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'
                                }`}
                                title="Search Chat"
                            >
                                <span className="material-symbols-outlined">search</span>
                            </button>
                            <button className="p-2 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                                <span className="material-symbols-outlined">more_vert</span>
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div 
                        ref={chatContainerRef}
                        className="flex-1 overflow-y-auto pt-6 scroll-smooth scrollbar-thin scrollbar-thumb-slate-200"
                    >
                        {hasMore && (
                            <div className="flex justify-center mb-6">
                                <button 
                                    onClick={loadMoreMessages}
                                    className="text-[11px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest px-4 py-1.5 rounded-full border border-slate-100 hover:bg-slate-50 transition-all"
                                >
                                    Load Older Messages
                                </button>
                            </div>
                        )}

                        {messages.length === 0 && !isLoading && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 px-8 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <span className="material-symbols-outlined text-[32px] opacity-30">
                                        {activeChannel.type === 'PROJECT' ? 'forum' : 'person'}
                                    </span>
                                </div>
                                <h3 className="font-bold text-slate-700 mb-1">
                                    {activeChannel.type === 'PROJECT' ? 'No messages yet' : `Start chatting with ${activeChannel.member.firstName}`}
                                </h3>
                                <p className="text-[12px] max-w-xs">
                                    {activeChannel.type === 'PROJECT' 
                                        ? 'Start the conversation! Tag team members with @ or link issues with #.'
                                        : 'All direct messages are private and encrypted.'}
                                </p>
                            </div>
                        )}

                        {messages.map((msg, idx) => {
                            // Date separator logic
                            const showDateSeparator = idx === 0 || 
                                new Date(msg.createdAt).toDateString() !== new Date(messages[idx-1].createdAt).toDateString()
                            
                            return (
                                <React.Fragment key={msg.id}>
                                    {showDateSeparator && (
                                        <div className="flex items-center justify-center my-8">
                                            <div className="h-[1px] bg-slate-100 flex-1 ml-12" />
                                            <span className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white">
                                                {new Date(msg.createdAt).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                                            </span>
                                            <div className="h-[1px] bg-slate-100 flex-1 mr-12" />
                                        </div>
                                    )}
                                    <div id={`msg-${msg.id}`}>
                                        <ChatMessage 
                                            message={msg} 
                                            isMe={msg.senderEmail === user?.email} 
                                            issues={issues}
                                            members={allMembers}
                                            onUpdate={handleUpdateMessage}
                                            onDelete={handleDeleteMessage}
                                            onIssueClick={setSelectedIssueId}
                                        />
                                    </div>
                                </React.Fragment>
                            )
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Footer / Input */}
                    <div className="relative">
                        {Object.keys(typingUsers).length > 0 && (
                            <div className="absolute -top-8 left-8 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex gap-0.5">
                                    <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                                <span className="text-[11px] font-bold text-slate-400 italic">
                                    {formatTypingText()}
                                </span>
                            </div>
                        )}
                        <ChatInput 
                            onSendMessage={handleSendMessage}
                            onUploadFile={handleFileUpload}
                            onTyping={sendTypingStatus}
                            members={allMembers}
                            issues={issues}
                            isDirect={activeChannel.type === 'DM'}
                            recipientEmail={activeChannel.type === 'DM' ? activeChannel.member.email : undefined}
                        />
                    </div>
                </div>

                {/* Right: Search Overlay */}
                {showSearch && (
                    <ChatSearch 
                        onClose={() => setShowSearch(false)}
                        onResultClick={scrollToMessage}
                        messages={messages}
                        projectId={projectId || ''}
                        onSearchMessages={(q) => 
                            activeChannel.type === 'PROJECT' 
                                ? searchChatMessages(projectId!, q) 
                                : searchDirectMessages(projectId!, activeChannel.member.id, q)
                        }
                        onSearchFiles={(q) => 
                            activeChannel.type === 'PROJECT' 
                                ? searchChatFiles(projectId!, q) 
                                : searchDirectFiles(projectId!, activeChannel.member.id, q)
                        }
                        onLoadFiles={() => 
                            activeChannel.type === 'PROJECT' 
                                ? fetchProjectFiles(projectId!) 
                                : fetchDirectFiles(projectId!, activeChannel.member.id)
                        }
                        onLoadMessages={() => 
                            activeChannel.type === 'PROJECT' 
                                ? searchChatMessages(projectId!, '') 
                                : searchDirectMessages(projectId!, activeChannel.member.id, '')
                        }
                    />
                )}
            </div>
            <ChatNotificationToast 
                notification={notification} 
                onClose={() => setNotification(null)} 
            />

            <UpdateIssueModal 
                isOpen={!!selectedIssueId} 
                onClose={() => {
                    setSelectedIssueId(null)
                    // Refresh issues list if an update might have occurred
                    if (projectId) fetchProjectIssues(projectId).then(setIssues)
                }}
                task={issues.find(i => i.id.toString() === selectedIssueId) || null}
                projectId={projectId || ''}
            />
        </Layout>
    )
}
