import { useEffect, useState } from 'react'
import type { IChatAttachment } from '../../types'

interface FilePreviewModalProps {
    file: IChatAttachment | null
    onClose: () => void
}

export const FilePreviewModal = ({ file, onClose }: FilePreviewModalProps) => {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        if (file) {
            setIsVisible(true)
            const handleEsc = (e: KeyboardEvent) => {
                if (e.key === 'Escape') onClose()
            }
            window.addEventListener('keydown', handleEsc)
            return () => window.removeEventListener('keydown', handleEsc)
        } else {
            setIsVisible(false)
        }
    }, [file, onClose])

    if (!file) return null

    const getFullUrl = (url: string) => {
        if (!url) return ''
        if (url.startsWith('http')) return url
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'
        return `${baseUrl.replace(/\/$/, '')}${url.startsWith('/') ? url : `/${url}`}`
    }

    const isImage = file.fileType?.startsWith('image/')

    return (
        <div 
            className={`fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 transition-all duration-300 ${
                isVisible ? 'bg-slate-900/90 backdrop-blur-md opacity-100' : 'bg-slate-900/0 backdrop-blur-none opacity-0'
            }`}
            onClick={onClose}
        >
            <div 
                className={`relative max-w-5xl w-full h-full flex flex-col items-center justify-center transition-all duration-500 transform ${
                    isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Actions */}
                <div className="absolute top-0 right-0 p-4 z-10 flex items-center gap-3">
                    <a 
                        href={getFullUrl(file.downloadUrl)} 
                        download={file.fileName}
                        className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white transition-all group"
                        title="Download"
                    >
                        <span className="material-symbols-outlined text-[20px]">download</span>
                    </a>
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white transition-all"
                        title="Close"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="w-full flex-1 flex items-center justify-center overflow-hidden rounded-2xl">
                    {isImage ? (
                        <img 
                            src={getFullUrl(file.downloadUrl)} 
                            alt={file.fileName}
                            className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
                        />
                    ) : (
                        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-12 rounded-3xl flex flex-col items-center gap-6 shadow-2xl">
                            <div className="w-24 h-24 rounded-2xl bg-white/10 flex items-center justify-center text-white/50 border border-white/10">
                                <span className="material-symbols-outlined text-[48px]">
                                    {file.fileType?.includes('pdf') ? 'picture_as_pdf' : 
                                     file.fileType?.includes('zip') ? 'folder_zip' : 'description'}
                                </span>
                            </div>
                            <div className="text-center">
                                <h4 className="text-white font-black text-[20px] tracking-tight">{file.fileName}</h4>
                                <p className="text-white/40 text-[14px]">Preview not available for this file type</p>
                            </div>
                            <a 
                                href={getFullUrl(file.downloadUrl)} 
                                download={file.fileName}
                                className="px-8 py-3 bg-white text-slate-900 rounded-xl font-black text-[14px] hover:bg-slate-100 transition-all shadow-xl active:scale-95"
                            >
                                Download to View
                            </a>
                        </div>
                    )}
                </div>

                {/* Footer Meta */}
                <div className="mt-8 flex flex-col items-center text-center gap-1">
                    <span className="text-white font-black text-[16px] tracking-tight">{file.fileName}</span>
                    <div className="flex items-center gap-3 text-white/40 text-[12px] font-bold uppercase tracking-widest">
                        <span>{(file.fileSize / 1024).toFixed(1)} KB</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span>{file.fileType}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
