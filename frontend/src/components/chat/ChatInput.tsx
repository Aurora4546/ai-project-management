import React, { useState, useRef } from 'react'
import { MentionTextarea } from '../MentionTextarea'
import { getAvatarColor, getIssueTheme } from '../../utils'
import { useAuth } from '../../context/AuthContext'
import type { IProjectMember, IIssue } from '../../types'

interface ChatInputProps {
    onSendMessage: (content: string) => void
    onUploadFile: (file: File) => void
    onTyping: (isTyping: boolean) => void
    members: IProjectMember[]
    issues: IIssue[]
    isDirect?: boolean
    recipientEmail?: string
}

export const ChatInput = ({ 
    onSendMessage, 
    onUploadFile, 
    onTyping,
    members,
    issues,
    isDirect = false,
    recipientEmail
}: ChatInputProps): React.ReactElement => {
    const { user } = useAuth()
    const [message, setMessage] = useState('')
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false)
    const typingTimeoutRef = useRef<any>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)

    // Handle clicking outside to close menu
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowAttachmentMenu(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleMessageChange = (val: string) => {
        setMessage(val)
        
        // Notify typing
        onTyping(true)
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => {
            onTyping(false)
        }, 2000)
    }

    const handleSend = () => {
        if (!message.trim()) return
        onSendMessage(message)
        setMessage('')
        onTyping(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleFileSelect = (accept: string) => {
        if (fileInputRef.current) {
            fileInputRef.current.accept = accept
            fileInputRef.current.click()
        }
        setShowAttachmentMenu(false)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            onUploadFile(file)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    // Filter members in DM to only allow mentioning participants (self and recipient)
    const effectiveMembers = isDirect 
        ? members.filter(m => m.email === user?.email || m.email === recipientEmail)
        : members

    // Prepare mention data
    const memberSuggestions = effectiveMembers.map(m => ({
        id: m.id,
        display: `${m.firstName} ${m.lastName}`,
        avatar: m.firstName.charAt(0).toUpperCase(),
        avatarColor: getAvatarColor(m.email)
    }))

    const issueSuggestions = issues.map(i => {
        const theme = getIssueTheme(i.type || 'TASK');

        return {
            id: i.id,
            display: i.issueKey,
            title: i.title,
            icon: theme.icon,
            iconColor: theme.hex
        };
    })

    return (
        <div className="p-4 bg-white border-t border-slate-200">
            <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-slate-100 focus-within:border-slate-300 transition-all relative">
                <div className="relative" ref={menuRef}>
                    <button 
                        onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                        className={`p-1.5 rounded-lg transition-all shrink-0 mb-0.5 ${
                            showAttachmentMenu ? 'bg-slate-200 text-slate-800 rotate-45' : 'text-slate-500 hover:bg-slate-200/70 hover:text-slate-800'
                        }`}
                        title="Upload attachment"
                    >
                        <span className="material-symbols-outlined text-[24px]">add</span>
                    </button>

                    {showAttachmentMenu && (
                        <div className="absolute bottom-12 left-0 w-56 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 slide-in-from-bottom-4">
                            <div className="p-2 space-y-1">
                                <button 
                                    onClick={() => handleFileSelect('image/*')}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-[20px]">image</span>
                                    </div>
                                    <div className="flex flex-col items-start overflow-hidden">
                                        <span className="text-[12px] font-bold">Image</span>
                                        <span className="text-[10px] text-slate-400">PNG, JPG, GIF</span>
                                    </div>
                                </button>
                                <button 
                                    onClick={() => handleFileSelect('.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt')}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-[20px]">description</span>
                                    </div>
                                    <div className="flex flex-col items-start overflow-hidden">
                                        <span className="text-[12px] font-bold">Document</span>
                                        <span className="text-[10px] text-slate-400">PDF, Word, Excel</span>
                                    </div>
                                </button>
                                <button 
                                    onClick={() => handleFileSelect('*/*')}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-[20px]">attach_file</span>
                                    </div>
                                    <div className="flex flex-col items-start overflow-hidden">
                                        <span className="text-[12px] font-bold">General File</span>
                                        <span className="text-[10px] text-slate-400">Any file up to 50MB</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange}
                />
                
                <div className="flex-1 min-h-[44px] py-2">
                    <MentionTextarea
                        value={message}
                        onChange={handleMessageChange}
                        placeholder="Type a message... (@member, #issue)"
                        minHeight={24}
                        className="bg-transparent border-none text-[14px] leading-relaxed placeholder:text-slate-400"
                        memberData={memberSuggestions}
                        issueData={issueSuggestions}
                        onKeyDown={handleKeyDown}
                    />
                </div>

                <button 
                    onClick={handleSend}
                    disabled={!message.trim()}
                    className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all shrink-0 mb-0.5 ${
                        message.trim() 
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200 transform hover:scale-105 active:scale-95' 
                        : 'text-slate-300'
                    }`}
                >
                    <span className="material-symbols-outlined text-[20px]">send</span>
                </button>
            </div>
            <div className="mt-2 flex justify-between items-center px-1">
                <span className="text-[10px] text-slate-400 font-medium tracking-wide flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">info</span>
                    Press Enter to send, Shift+Enter for new line
                </span>
            </div>
        </div>
    )
}
