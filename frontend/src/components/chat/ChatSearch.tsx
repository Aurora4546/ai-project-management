import type { IChatMessage, IChatAttachment } from '../../types'
import { formatRelativeTime } from '../../utils'
import { FilePreviewModal } from './FilePreviewModal'
import { useCallback, useEffect, useState } from 'react'

interface ChatSearchProps {
    onClose: () => void
    onResultClick: (messageId: string) => void
    messages: IChatMessage[]
    projectId: string
    onSearchMessages: (q: string) => Promise<IChatMessage[]>
    onSearchFiles: (q: string) => Promise<IChatAttachment[]>
    onLoadFiles: () => Promise<IChatAttachment[]>
    onLoadMessages: () => Promise<IChatMessage[]>
}

export const ChatSearch = ({ 
    onClose, 
    onResultClick,
    onSearchMessages,
    onSearchFiles,
    onLoadFiles,
    onLoadMessages
}: ChatSearchProps): React.ReactElement => {
    const [query, setQuery] = useState('')
    const [activeTab, setActiveTab] = useState<'messages' | 'files'>('messages')
    const [results, setResults] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isHistory, setIsHistory] = useState(true)
    const [activePreviewFile, setActivePreviewFile] = useState<IChatAttachment | null>(null)

    const loadHistory = useCallback(async () => {
        setIsLoading(true)
        setIsHistory(true)
        try {
            if (activeTab === 'messages') {
                const data = await onLoadMessages()
                setResults(data)
            } else {
                const data = await onLoadFiles()
                setResults(data)
            }
        } catch (error) {
            console.error("Failed to load history", error)
        } finally {
            setIsLoading(false)
        }
    }, [activeTab, onLoadFiles, onLoadMessages])

    useEffect(() => {
        if (query.trim().length === 0) {
            loadHistory()
        }
    }, [activeTab, query, loadHistory])

    const handleSearch = async (val: string) => {
        setQuery(val)
        if (val.trim().length === 0) {
            loadHistory()
            return
        }
        
        if (val.trim().length < 2) {
            return
        }

        setIsLoading(true)
        setIsHistory(false)
        try {
            if (activeTab === 'messages') {
                const data = await onSearchMessages(val)
                setResults(data)
            } else {
                const data = await onSearchFiles(val)
                setResults(data)
            }
        } catch (error) {
            console.error("Search failed", error)
        } finally {
            setIsLoading(false)
        }
    }
    
    const getFullUrl = (url: string) => {
        if (!url) return ''
        if (url.startsWith('http')) return url
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'
        return `${baseUrl.replace(/\/$/, '')}${url.startsWith('/') ? url : `/${url}`}`
    }

    return (
        <div className="w-80 h-full bg-white border-l border-slate-200 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
                <h3 className="font-bold text-[14px] text-slate-800">Search Chat</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
            </div>

            <div className="p-4 border-b border-slate-100 shrink-0">
                <div className="relative mb-4">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">search</span>
                    <input 
                        type="text"
                        value={query}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder={`Search ${activeTab}...`}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-100"
                    />
                </div>

                <div className="flex p-1 bg-slate-100 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('messages')}
                        className={`flex-1 py-1.5 text-[12px] font-semibold rounded-md transition-all ${
                            activeTab === 'messages' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                        }`}
                    >
                        Messages
                    </button>
                    <button 
                        onClick={() => setActiveTab('files')}
                        className={`flex-1 py-1.5 text-[12px] font-semibold rounded-md transition-all ${
                            activeTab === 'files' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                        }`}
                    >
                        Files
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3">
                        <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
                        <span className="text-[12px] text-slate-500 font-medium">Searching...</span>
                    </div>
                ) : results.length > 0 ? (
                    <div className="flex flex-col gap-1">
                        {isHistory && (
                            <div className="px-3 py-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent {activeTab}</span>
                            </div>
                        )}
                        {results.map((res: any) => (
                            <div 
                                key={res.id}
                                onClick={() => {
                                    const messageId = activeTab === 'messages' ? res.id : res.messageId;
                                    if (messageId) onResultClick(messageId);
                                }}
                                className="p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-all border border-transparent hover:border-slate-100 hover:shadow-sm active:scale-[0.98] group mb-1"
                            >
                                {activeTab === 'messages' ? (
                                    <>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[11px] font-black text-slate-800 tracking-tight">{res.senderFirstName} {res.senderLastName}</span>
                                            <span className="text-[9px] font-bold text-slate-400 tabular-nums uppercase">{formatRelativeTime(res.createdAt)}</span>
                                        </div>
                                        <p className="text-[12px] text-slate-600 leading-relaxed line-clamp-2 group-hover:text-slate-900 transition-colors">{res.content}</p>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                                            {res.fileType?.startsWith('image/') ? (
                                                <img 
                                                    src={getFullUrl(res.downloadUrl)} 
                                                    alt={res.fileName}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            ) : (
                                                <span className="material-symbols-outlined text-[20px] text-slate-400">
                                                    {res.fileType?.includes('pdf') ? 'picture_as_pdf' : 
                                                     res.fileType?.includes('zip') ? 'folder_zip' : 'description'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="text-[12px] font-black text-slate-700 truncate tracking-tight">{res.fileName}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">{(res.fileSize / 1024).toFixed(1)} KB</span>
                                                <span className="text-[8px] text-slate-300">•</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{formatRelativeTime(res.createdAt)}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActivePreviewFile(res);
                                                }}
                                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-100 shadow-sm transition-all"
                                                title="View"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">visibility</span>
                                            </button>
                                            <a 
                                                href={getFullUrl(res.downloadUrl)} 
                                                download={res.fileName}
                                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-emerald-600 hover:border-emerald-100 shadow-sm transition-all"
                                                title="Download"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <span className="material-symbols-outlined text-[16px]">download</span>
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : query.length >= 2 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                        <span className="material-symbols-outlined text-[32px] mb-2 opacity-20">search_off</span>
                        <span className="text-[12px] font-medium italic">No results found for "{query}"</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-300">
                        <span className="material-symbols-outlined text-[32px] mb-2 opacity-20">manage_search</span>
                        <span className="text-[12px] font-medium">Search project history</span>
                    </div>
                )}
            </div>

            <FilePreviewModal 
                file={activePreviewFile} 
                onClose={() => setActivePreviewFile(null)} 
            />
        </div>
    )
}
