import React, { useEffect, useState } from 'react'
import type { IChatNotification } from '../../types'
import { useNavigate } from 'react-router-dom'
import { getAvatarColor } from '../../utils'

import { renderFormattedContent } from '../../utils/mentionUtils'

interface ChatNotificationToastProps {
    notification: IChatNotification | null
    onClose: () => void
}

export const ChatNotificationToast = ({ notification, onClose }: ChatNotificationToastProps): React.ReactElement | null => {
    const navigate = useNavigate()
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (notification) {
            setVisible(true)
            const timer = setTimeout(() => {
                setVisible(false)
                setTimeout(onClose, 300) // Delay onClose to allow exit animation
            }, 5000)
            return () => clearTimeout(timer)
        }
    }, [notification, onClose])

    if (!notification) return null

    return (
        <div 
            className={`fixed top-20 right-6 z-[1000] w-[340px] bg-white text-slate-800 rounded-2xl shadow-xl p-4 cursor-pointer transition-all duration-500 border border-slate-200 ring-1 ring-black/5 hover:shadow-2xl hover:-translate-y-1 overflow-hidden ${
                visible ? 'translate-x-0 opacity-100' : 'translate-x-[calc(100%+24px)] opacity-0'
            }`}
            onClick={() => {
                const params = new URLSearchParams()
                if (notification.messageId) params.set('messageId', notification.messageId)
                if (notification.isDirect) params.set('isDirect', 'true')
                if (notification.senderEmail) params.set('senderEmail', notification.senderEmail)
                
                const url = `/projects/${notification.projectId}/chat${params.toString() ? `?${params.toString()}` : ''}`
                navigate(url)
                onClose()
            }}
        >
            <div className="flex items-start gap-4">
                <div 
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-[14px] font-black shadow-sm border border-black/5 shrink-0 relative z-10"
                    style={{ backgroundColor: getAvatarColor(notification.senderEmail || notification.senderName) }}
                >
                    {notification.senderName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 mt-0.5 relative z-10">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">{notification.projectName}</span>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setVisible(false); setTimeout(onClose, 300); }}
                            className="text-slate-300 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 rounded-full p-1 -mr-2 -mt-2"
                        >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                    </div>
                    <div className="text-[13.5px] text-slate-600 leading-tight">
                        <span className="font-bold text-slate-800 mr-1">{notification.senderName}:</span>
                        <span className="line-clamp-2 mt-0.5 opacity-90">
                            {renderFormattedContent(notification.messagePreview, { size: 'small' })}
                        </span>
                    </div>
                </div>
            </div>
            {/* Background timer bar anchored exactly into the container clipping */}
            <div className="absolute bottom-0 left-0 h-1 w-full z-0">
                <div className="h-full bg-blue-500/80 animate-progress-shrink rounded-bl-2xl rounded-br-2xl" style={{ width: '100%' }} />
            </div>
        </div>
    )
}
