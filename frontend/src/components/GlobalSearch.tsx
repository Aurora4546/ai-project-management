import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as api from '../services/api'
import type { IProject, IIssue } from '../types'
import { getIssueTheme } from '../utils'

export const GlobalSearch = (): React.ReactElement => {
    const [query, setQuery] = useState('')
    const [projects, setProjects] = useState<IProject[]>([])
    const [issues, setIssues] = useState<IIssue[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)
    
    const { id: projectId } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const dropdownRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Load projects on focus/mount
    const loadProjects = useCallback(async () => {
        try {
            const data = await api.fetchProjects()
            setProjects(data)
        } catch (error) {
            console.error("Failed to fetch projects", error)
        }
    }, [])

    useEffect(() => {
        loadProjects()
    }, [loadProjects])

    // Load issues for current project
    useEffect(() => {
        if (projectId) {
            const loadIssues = async () => {
                setIsLoading(true)
                try {
                    const data = await api.fetchProjectIssues(projectId)
                    setIssues(data)
                } catch (error) {
                    console.error("Failed to fetch issues", error)
                } finally {
                    setIsLoading(false)
                }
            }
            loadIssues()
        } else {
            setIssues([])
        }
    }, [projectId])

    // Filter results
    const filteredProjects = query.trim() === '' ? [] : projects.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.projectKey.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5)

    const filteredIssues = query.trim() === '' ? [] : issues.filter(i =>
        i.title.toLowerCase().includes(query.toLowerCase()) ||
        i.issueKey.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8)

    const combinedResults = [
        ...filteredProjects.map(p => ({ type: 'PROJECT' as const, data: p })),
        ...filteredIssues.map(i => ({ type: 'ISSUE' as const, data: i }))
    ]

    const hasResults = combinedResults.length > 0

    // Reset index when query changes
    useEffect(() => {
        setSelectedIndex(0)
    }, [query])

    // Handle clicks outside to close
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (item: { type: 'PROJECT' | 'ISSUE', data: any }) => {
        if (item.type === 'PROJECT') {
            navigate(`/projects/${item.data.id}/board`)
        } else {
            navigate(`/projects/${projectId}/board?selectedIssue=${item.data.id}`)
        }
        setIsOpen(false)
        setQuery('')
        inputRef.current?.blur()
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen || combinedResults.length === 0) return

        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex(prev => (prev + 1) % combinedResults.length)
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex(prev => (prev - 1 + combinedResults.length) % combinedResults.length)
        } else if (e.key === 'Enter') {
            e.preventDefault()
            handleSelect(combinedResults[selectedIndex])
        } else if (e.key === 'Escape') {
            setIsOpen(false)
        }
    }

    return (
        <div className="relative group" ref={dropdownRef}>
            <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400 group-focus-within:text-blue-500 transition-colors">search</span>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setIsOpen(true)
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search projects & issues..."
                    className="pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm w-72 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all placeholder:text-slate-400 font-medium"
                />
            </div>

            {isOpen && query.trim() !== '' && (
                <div className="absolute top-full left-0 mt-3 w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-[100] animate-in fade-in slide-in-from-top-2 origin-top-left">
                    {isLoading ? (
                        <div className="px-5 py-4 flex items-center gap-3 text-slate-500 text-sm">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            Searching...
                        </div>
                    ) : !hasResults ? (
                        <div className="px-5 py-6 text-center">
                            <div className="text-slate-300 mb-2">
                                <span className="material-symbols-outlined text-[40px]">search_off</span>
                            </div>
                            <p className="text-slate-500 text-sm font-medium">No results found for "{query}"</p>
                            <p className="text-slate-400 text-[11px] mt-1">Try a different keyword or project key</p>
                        </div>
                    ) : (
                        <div className="max-h-[480px] overflow-y-auto custom-scrollbar">
                            {filteredProjects.length > 0 && (
                                <div className="pb-2">
                                    <h4 className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Projects</h4>
                                    {filteredProjects.map((p, idx) => (
                                        <button
                                            key={p.id}
                                            onClick={() => handleSelect({ type: 'PROJECT', data: p })}
                                            onMouseEnter={() => setSelectedIndex(idx)}
                                            className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors group/item ${
                                                selectedIndex === idx ? 'bg-blue-50/80' : 'hover:bg-slate-50/50'
                                            }`}
                                        >
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-[10px] transition-all shadow-sm ${
                                                selectedIndex === idx ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {p.projectKey}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className={`text-[13px] font-bold truncate transition-colors ${
                                                    selectedIndex === idx ? 'text-blue-700' : 'text-slate-800'
                                                }`}>{p.name}</div>
                                                <div className="text-[11px] text-slate-500 font-medium">{p.leads?.[0]?.firstName} {p.leads?.[0]?.lastName} · Lead</div>
                                            </div>
                                            <span className={`material-symbols-outlined text-[18px] transition-all ${
                                                selectedIndex === idx ? 'text-blue-500 opacity-100 translate-x-0' : 'text-slate-300 opacity-0 -translate-x-2'
                                            }`}>chevron_right</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {filteredIssues.length > 0 && (
                                <div className="pt-2 border-t border-slate-50">
                                    <h4 className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Issues in current project</h4>
                                    {filteredIssues.map((i, idx) => {
                                        const actualIndex = idx + filteredProjects.length
                                        const theme = getIssueTheme(i.type)
                                        return (
                                            <button
                                                key={i.id}
                                                onClick={() => handleSelect({ type: 'ISSUE', data: i })}
                                                onMouseEnter={() => setSelectedIndex(actualIndex)}
                                                className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors group/item ${
                                                    selectedIndex === actualIndex ? 'bg-blue-50/80' : 'hover:bg-slate-50/50'
                                                }`}
                                            >
                                                <div className={`w-9 h-9 ${theme.bgColor} ${theme.color} rounded-xl flex items-center justify-center transition-all shadow-sm border ${theme.borderColor}`}>
                                                    <span className="material-symbols-outlined text-[18px]">{theme.icon}</span>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className={`text-[13px] font-bold truncate transition-colors ${
                                                        selectedIndex === actualIndex ? 'text-blue-700' : 'text-slate-800'
                                                    }`}>{i.title}</div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{i.issueKey}</span>
                                                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-md uppercase tracking-tighter">{i.status.replace('_', ' ')}</span>
                                                    </div>
                                                </div>
                                                <span className={`material-symbols-outlined text-[18px] transition-all ${
                                                    selectedIndex === actualIndex ? 'text-blue-500 opacity-100 translate-x-0' : 'text-slate-300 opacity-0 -translate-x-2'
                                                }`}>chevron_right</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                    <div className="px-4 py-2 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between mt-1">
                         <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-bold text-slate-500 shadow-sm">↑↓</kbd>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Navigate</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-bold text-slate-500 shadow-sm">↵</kbd>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Select</span>
                            </div>
                         </div>
                         <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Global Search</span>
                    </div>
                </div>
            )}
        </div>
    )
}
