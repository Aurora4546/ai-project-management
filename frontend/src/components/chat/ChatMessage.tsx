import React from 'react'
import { useNavigate } from 'react-router-dom'
import { renderFormattedContent } from '../../utils/mentionUtils'
import type { IChatMessage, IIssue, IProjectMember, IChatAttachment } from '../../types'
import { DeleteConfirmModal } from '../DeleteConfirmModal'
import { FilePreviewModal } from './FilePreviewModal'
import { getAvatarColor } from '../../utils'

interface ChatMessageProps {
    message: IChatMessage
    isMe: boolean
    issues?: IIssue[]
    members?: IProjectMember[]
    onUpdate?: (messageId: string, content: string) => void
    onDelete?: (messageId: string) => void
    onIssueClick?: (issueId: string) => void
}

export const ChatMessage = ({ 
    message, 
    isMe, 
    issues = [], 
    members = [],
    onUpdate, 
    onDelete,
    onIssueClick
}: ChatMessageProps): React.ReactElement => {
    const navigate = useNavigate()
    const [isEditing, setIsEditing] = React.useState(false)
    const [editContent, setEditContent] = React.useState(message.content)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false)
    const [imgRetries, setImgRetries] = React.useState<Record<string, number>>({})
    const [activePreviewFile, setActivePreviewFile] = React.useState<IChatAttachment | null>(null)
    
    const handleUpdate = () => {
        if (editContent.trim() && editContent !== message.content) {
            onUpdate?.(message.id, editContent)
        }
        setIsEditing(false)
    }

    const isEdited = React.useMemo(() => {
        if (!message.updatedAt || !message.createdAt) return false
        const created = new Date(message.createdAt).getTime()
        const updated = new Date(message.updatedAt).getTime()
        // Use a 1-second threshold to account for any minor differences during creation
        return updated > created + 1000
    }, [message.updatedAt, message.createdAt])

    const handleDelete = () => {
        setIsDeleteModalOpen(true)
    }

    const handleConfirmDelete = () => {
        onDelete?.(message.id)
        setIsDeleteModalOpen(false)
    }

    const getFullUrl = (url: string) => {
        if (!url) return ''
        if (url.startsWith('http')) return url
        
        let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'
        // Remove trailing slash from baseUrl
        baseUrl = baseUrl.replace(/\/$/, '')
        
        // Ensure url starts with a single slash
        const normalizedUrl = url.startsWith('/') ? url : `/${url}`
        
        // If baseUrl already includes /api and normalizedUrl also does, avoid double /api
        if (baseUrl.endsWith('/api') && normalizedUrl.startsWith('/api/')) {
            return `${baseUrl}${normalizedUrl.substring(4)}`
        }
        
        return `${baseUrl}${normalizedUrl}`
    }

    const atts = message.attachments || []
    const hasActualText = message.content && message.content.trim().length > 0 && !message.content.includes('Shared a file:')
    const isUploading = message.messageType === 'FILE' && atts.length === 0
    
    // A bubble is rendered if it has meaningful content or is in a transient state
    const needsBubble = isEditing || 
        (message.messageType === 'TEXT' && hasActualText) || 
        (message.messageType === 'FILE' && isUploading) ||
        (message.messageType === 'FILE' && hasActualText)

    return (
        <div className={`flex w-full mb-8 px-6 group animate-in fade-in slide-in-from-bottom-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'} items-start`}>
                {/* Avatar with Shadow and Border */}
                <div className="shrink-0 mt-0.5">
                    <div 
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[12px] font-black shadow-md border-2 border-white ring-1 ring-slate-100 transition-transform group-hover:scale-110 active:scale-95 cursor-default"
                        style={{ backgroundColor: getAvatarColor(message.senderEmail) }}
                    >
                        {message.senderFirstName.charAt(0).toUpperCase()}
                    </div>
                </div>
                
                <div className={`flex flex-col min-w-0 ${isMe ? 'items-end' : 'items-start'} ${needsBubble ? 'gap-1.5' : 'gap-1'}`}>
                    {/* Header: Identity and Status */}
                    <div className={`flex items-center gap-2 px-1 ${isMe ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
                        <span className={`text-[12px] font-black tracking-tight ${isMe ? 'text-blue-600' : 'text-slate-700'}`}>
                            {isMe ? 'You' : `${message.senderFirstName} ${message.senderLastName}`}
                        </span>
                        <span className="text-[10px] font-bold text-slate-300 tabular-nums">
                            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isEdited && (
                            <span className="text-[9px] font-black text-slate-300 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-tighter italic scale-90">Edited</span>
                        )}
                    </div>
                    
                    {/* Content Group (Bubble + Attachments) */}
                    <div className={`flex items-end gap-2 relative group/message w-full ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`flex flex-col w-full max-w-full ${isMe ? 'items-end' : 'items-start'} ${needsBubble ? 'gap-1.5' : 'gap-1'}`}>
                            {needsBubble && (
                                <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-[13.5px] leading-relaxed relative border transition-all duration-300 ${
                                    isMe 
                                    ? 'bg-indigo-50/80 text-indigo-900 border-indigo-100/50 backdrop-blur-sm rounded-tr-none selection:bg-indigo-200' 
                                    : 'bg-white text-slate-800 border-slate-200 rounded-tl-none selection:bg-blue-100'
                                }`}>
                                    {isEditing ? (
                                        <div className="flex flex-col gap-3 min-w-[320px] py-1">
                                            <textarea
                                                autoFocus
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault()
                                                        handleUpdate()
                                                    }
                                                    if (e.key === 'Escape') setIsEditing(false)
                                                }}
                                                className={`bg-white/50 text-inherit border rounded-xl p-3 focus:ring-2 outline-none resize-none text-[13px] leading-relaxed shadow-inner min-h-[90px] ${
                                                    isMe ? 'border-indigo-200 focus:ring-indigo-200 focus:border-indigo-300' : 'border-slate-200 focus:ring-blue-100 focus:border-blue-200'
                                                }`}
                                                rows={Math.max(2, editContent.split('\n').length)}
                                            />
                                            <div className="flex items-center justify-end gap-3 px-1">
                                                <button 
                                                    onClick={() => setIsEditing(false)}
                                                    className={`text-[11px] font-black uppercase tracking-wider transition-colors ${isMe ? 'text-indigo-400 hover:text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    onClick={handleUpdate}
                                                    className={`text-[11px] font-black px-4 py-2 rounded-lg shadow-lg hover:shadow-xl active:scale-95 transition-all uppercase tracking-wider ${
                                                        isMe ? 'bg-indigo-600 text-white' : 'bg-blue-600 text-white'
                                                    }`}
                                                >
                                                    Save Changes
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="whitespace-pre-wrap break-words">
                                            {message.messageType === 'FILE' 
                                                ? (message.attachments && message.attachments.length > 0)
                                                    ? message.attachments.some(a => a.fileType?.toLowerCase().startsWith('image/'))
                                                        ? null 
                                                        : <div className={`flex items-center gap-2 ${isMe ? 'text-indigo-400' : 'text-slate-400'}`}>
                                                            <span className="material-symbols-outlined text-[18px]">attach_file</span>
                                                            <span className="italic text-[12px] font-bold">Shared a file</span>
                                                          </div>
                                                    : <div className="flex items-center gap-2 text-slate-400 animate-pulse">
                                                        <span className="material-symbols-outlined text-[18px]">sync</span>
                                                        <span className="italic text-[12px] font-bold">Uploading file...</span>
                                                      </div>
                                                : renderFormattedContent(message.content, { members, issues, isMe, navigate, onIssueClick })
                                            }
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Enhanced Attachments Container */}
                            {message.attachments && message.attachments.length > 0 && (
                                <div className={`grid grid-cols-1 gap-3 w-full max-w-[360px] ${needsBubble ? 'mt-0' : 'mt-0'}`}>
                                    {message.attachments.map(att => {
                                        const isImage = att.fileType.startsWith('image/')
                                        const downloadUrl = getFullUrl(att.downloadUrl)
                                        
                                        if (isImage) {
                                            return (
                                                <div key={att.id} className="relative group/img overflow-hidden rounded-2xl border-2 border-white shadow-lg bg-slate-100 aspect-video ring-1 ring-slate-200">
                                                    <img 
                                                        src={`${downloadUrl}${imgRetries[att.id] ? `?retry=${imgRetries[att.id]}` : ''}`} 
                                                        alt={att.fileName} 
                                                        className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-1000 cursor-zoom-in"
                                                        onClick={() => setActivePreviewFile(att)}
                                                        onError={() => {
                                                            const retries = imgRetries[att.id] || 0;
                                                            if (retries < 3) {
                                                                setTimeout(() => {
                                                                    setImgRetries(prev => ({ ...prev, [att.id]: retries + 1 }));
                                                                }, 500);
                                                            }
                                                        }}
                                                    />
                                                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 transition-all duration-300 flex items-center justify-center gap-4 backdrop-blur-[1px]">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActivePreviewFile(att);
                                                            }}
                                                            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-all border border-white/30"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                        </button>
                                                        <a 
                                                            href={downloadUrl} 
                                                            download={att.fileName}
                                                            className="w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center hover:bg-slate-100 transition-all shadow-xl"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">download</span>
                                                        </a>
                                                    </div>
                                                </div>
                                            )
                                        }

                                        return (
                                            <div key={att.id} className="p-3 rounded-2xl flex items-center gap-4 border-2 border-white transition-all bg-slate-50 shadow-sm hover:shadow-md hover:border-blue-100 group/file ring-1 ring-slate-100">
                                                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-blue-600 text-white group-hover/file:scale-110 transition-transform border-4 border-white">
                                                    <span className="material-symbols-outlined text-[24px]">
                                                        {att.fileType.includes('pdf') ? 'picture_as_pdf' : 
                                                         att.fileType.includes('zip') ? 'folder_zip' : 'description'}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <span className="text-[13px] font-black text-slate-800 truncate pr-1">{att.fileName}</span>
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{(att.fileSize / 1024).toFixed(1)} KB</span>
                                                </div>
                                                <a 
                                                    href={downloadUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-white text-slate-400 hover:text-blue-600 border border-transparent hover:border-blue-100 shadow-none hover:shadow-sm"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">download</span>
                                                </a>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Actions that appear on hover */}
                        {isMe && !isEditing && (
                            <div className="flex flex-col gap-1 opacity-0 group-hover/message:opacity-100 transition-all duration-200 translate-y-1 group-hover/message:translate-y-0">
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-200 shadow-md transition-all active:scale-90"
                                    title="Edit"
                                >
                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                </button>
                                <button 
                                    onClick={handleDelete}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-rose-600 hover:border-rose-200 shadow-md transition-all active:scale-90"
                                    title="Delete"
                                >
                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            <DeleteConfirmModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                itemName="this message"
            />

            <FilePreviewModal 
                file={activePreviewFile}
                onClose={() => setActivePreviewFile(null)}
            />
        </div>
    )
}
