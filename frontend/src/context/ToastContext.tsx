import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'

/**
 * Toast types supported by the system
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
    id: string
    message: string
    type: ToastType
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

/**
 * Global Toast Provider to manage notifications
 */
export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([])

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).substring(2, 9)
        setToasts(prev => [...prev, { id, message, type }])
    }, [])

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            
            {/* Toast Container */}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                {toasts.map(toast => (
                    <ToastItem 
                        key={toast.id} 
                        toast={toast} 
                        onClose={() => removeToast(toast.id)} 
                    />
                ))}
            </div>
        </ToastContext.Provider>
    )
}

/**
 * Individual Toast Component
 */
const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
    const getStyles = () => {
        switch (toast.type) {
            case 'success':
                return {
                    bg: 'bg-emerald-50',
                    border: 'border-emerald-200',
                    text: 'text-emerald-800',
                    icon: 'check_circle',
                    iconColor: 'text-emerald-500'
                }
            case 'error':
                return {
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                    text: 'text-red-800',
                    icon: 'error',
                    iconColor: 'text-red-500'
                }
            case 'warning':
                return {
                    bg: 'bg-amber-50',
                    border: 'border-amber-200',
                    text: 'text-amber-800',
                    icon: 'warning',
                    iconColor: 'text-amber-500'
                }
            default:
                return {
                    bg: 'bg-blue-50',
                    border: 'border-blue-200',
                    text: 'text-blue-800',
                    icon: 'info',
                    iconColor: 'text-blue-500'
                }
        }
    }

    const [isVisible, setIsVisible] = useState(true)

    const handleClose = useCallback(() => {
        setIsVisible(false)
        setTimeout(onClose, 300)
    }, [onClose])

    // Local auto-dismiss to allow animation
    useEffect(() => {
        const timer = setTimeout(handleClose, 3000)
        return () => clearTimeout(timer)
    }, [handleClose])

    const styles = getStyles()

    return (
        <div 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${styles.bg} ${styles.border} shadow-lg ${isVisible ? 'animate-toast-in' : 'animate-toast-out'} pointer-events-auto min-w-[300px] max-w-md transition-all duration-300`}
            role="alert"
        >
            <span className={`material-symbols-outlined ${styles.iconColor} text-[20px]`}>
                {styles.icon}
            </span>
            <p className={`text-[13px] font-bold ${styles.text} flex-1`}>
                {toast.message}
            </p>
            <button 
                onClick={handleClose}
                className={`${styles.text} opacity-50 hover:opacity-100 transition-opacity`}
            >
                <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
        </div>
    )
}

/**
 * Hook to use the toast system
 */
export const useToast = () => {
    const context = useContext(ToastContext)
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider')
    }
    return context
}
