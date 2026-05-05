import type { IProjectMember, IOnlineUser, IUnreadCountsResponse } from '../../types'
import { getAvatarColor } from '../../utils'
import { useParams } from 'react-router-dom'

interface ChatMembersSidebarProps {
    members: IProjectMember[]
    onlineUsers: IOnlineUser[]
    activeChannel: { type: 'PROJECT' | 'DM', member?: IProjectMember }
    onChannelSwitch: (channel: any) => void
    unreadCounts?: IUnreadCountsResponse
}


export const ChatMembersSidebar = ({
    members,
    onlineUsers,
    activeChannel,
    onChannelSwitch,
    unreadCounts = { projects: {}, dms: {} }
}: ChatMembersSidebarProps): React.ReactElement => {
    const { id: projectId } = useParams<{ id: string }>()
    const isOnline = (email: string) => onlineUsers.some(u => u.email === email)

    const projectUnread = projectId ? unreadCounts.projects[projectId] || 0 : 0
    const dmUnreads = projectId ? unreadCounts.dms[projectId] || {} : {}

    return (
        <div className="w-72 h-full bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-6 mt-4">
                {/* Channels Section */}
                <div className="space-y-2">
                    <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                        Channels
                    </div>
                    <button
                        onClick={() => onChannelSwitch({ type: 'PROJECT' })}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 border ${activeChannel.type === 'PROJECT'
                            ? 'bg-white shadow-lg border-slate-100 text-slate-900'
                            : 'border-transparent text-slate-500 hover:bg-white/40 hover:text-slate-800'
                            }`}
                    >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm ${activeChannel.type === 'PROJECT' ? 'bg-blue-600 text-white rotate-12' : 'bg-slate-200 text-slate-500'
                            }`}>
                            <span className="material-symbols-outlined text-[20px]">hub</span>
                        </div>
                        <div className="flex flex-col items-start overflow-hidden flex-1">
                            <span className={`text-[13px] truncate font-bold tracking-tight ${activeChannel.type === 'PROJECT' ? 'text-blue-600' : ''}`}>
                                General Channel
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Project Wide</span>
                        </div>
                        {projectUnread > 0 && activeChannel.type !== 'PROJECT' && (
                            <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse shrink-0">
                                {projectUnread}
                            </div>
                        )}
                    </button>
                </div>

                {/* Direct Messages Section */}
                <div className="space-y-2">
                    <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                        Direct Messages
                    </div>
                    <div className="space-y-1">
                        {members.map(member => {
                            const online = isOnline(member.email)
                            const isActive = activeChannel.type === 'DM' && activeChannel.member?.id === member.id

                            return (
                                <button
                                    key={member.id}
                                    onClick={() => onChannelSwitch({ type: 'DM', member })}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-300 border group ${isActive
                                        ? 'bg-white shadow-lg border-slate-100'
                                        : 'border-transparent text-slate-500 hover:bg-white/40'
                                        }`}
                                >
                                    <div className="relative shrink-0">
                                        <div
                                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[12px] font-bold shadow-md border-2 border-white ring-1 ring-slate-100 transition-transform group-hover:scale-105"
                                            style={{ backgroundColor: getAvatarColor(member.email) }}
                                        >
                                            {member.firstName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-50 group-hover:border-white transition-all ${online ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'
                                            }`} />
                                    </div>
                                    <div className="flex flex-col min-w-0 items-start overflow-hidden flex-1">
                                        <span className={`text-[13px] truncate w-full text-left tracking-tight ${isActive ? 'font-bold text-blue-600' : 'font-bold text-slate-700'
                                            }`}>
                                            {member.firstName} {member.lastName}
                                        </span>
                                        <div className="flex items-center gap-1.5 overflow-hidden w-full">
                                            {member.role === 'PROJECT_LEAD' && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter shrink-0 bg-orange-50 text-orange-400">
                                                    Manager
                                                </span>
                                            )}
                                            {online && (
                                                <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-tighter animate-pulse">Online</span>
                                            )}
                                        </div>
                                    </div>
                                    {dmUnreads[member.id] > 0 && !(activeChannel.type === 'DM' && activeChannel.member?.id === member.id) && (
                                        <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse shrink-0">
                                            {dmUnreads[member.id]}
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            <div className="p-5 border-t border-slate-200 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.02)] shrink-0">
                <div className="bg-slate-50 rounded-2xl p-3 flex items-center justify-between border border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-none">
                            {onlineUsers.length} Active
                        </span>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-100">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>
        </div>
    )
}
