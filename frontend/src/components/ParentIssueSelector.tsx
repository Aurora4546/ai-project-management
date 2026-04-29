import { useState, useEffect, useRef } from 'react'
import * as api from '../services/api'
import type { IIssue } from '../types'
import { getAvatarColor } from '../utils'

interface ParentIssueSelectorProps {
    projectId: string;
    currentIssueId?: string;
    issueType?: string;
    value: string | number | null;
    initialKey?: string;
    onChange: (id: string | number | null, key?: string, type?: string) => void;
    onNavigate?: (id: string | number) => void;
    placeholder?: string;
}

export const ParentIssueSelector = ({ projectId, currentIssueId, issueType, value, initialKey, onChange, onNavigate, placeholder = "Select parent issue" }: ParentIssueSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [issues, setIssues] = useState<IIssue[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const selectedIssue = issues.find(i => i.id.toString() === value?.toString());

    useEffect(() => {
        // Load issues if dropdown is open OR if we have a pre-selected value but no issues loaded yet
        if (projectId && (isOpen || (value && value !== 'none' && issues.length === 0))) {
            loadIssues();
        }
    }, [isOpen, projectId, value, issues.length]);

    const loadIssues = async () => {
        setIsLoading(true);
        try {
            const data = await api.fetchProjectIssues(projectId);
            // Filter out current issue to avoid circular dependency
            let filtered = data.filter(i => i.id.toString() !== currentIssueId?.toString());
            
            // If current issue is EPIC, only show other EPICs as parent options
            if (issueType?.toUpperCase() === 'EPIC') {
                filtered = filtered.filter(i => i.type.toUpperCase() === 'EPIC');
            }
            
            setIssues(filtered);
        } catch (error) {
            console.error('Failed to fetch issues for parent selection:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Reload issues when issueType changes
    useEffect(() => {
        if (projectId && issues.length > 0) {
            loadIssues();
        }
    }, [issueType]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredIssues = issues.filter(i => 
        i.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        i.issueKey.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getIssueIcon = (type: string) => {
        switch (type?.toUpperCase()) {
            case 'BUG': return { icon: 'bug_report', color: 'text-red-500' };
            case 'STORY': return { icon: 'bookmark', color: 'text-green-500' };
            case 'EPIC': return { icon: 'electric_bolt', color: 'text-purple-500' };
            default: return { icon: 'check_box', color: 'text-blue-500' };
        }
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full min-h-[38px] flex items-center justify-between px-3 bg-white border border-slate-200 rounded-md text-[13px] text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors focus:ring-1 focus:ring-slate-300 py-1"
            >
                {value && value !== 'none' ? (
                    <div className="flex items-center gap-2 overflow-hidden flex-1 group/selected">
                        {selectedIssue ? (
                            <>
                                <span className={`material-symbols-outlined text-[16px] ${getIssueIcon(selectedIssue.type).color} shrink-0`}>
                                    {getIssueIcon(selectedIssue.type).icon}
                                </span>
                                <span className="text-slate-500 font-bold shrink-0 text-[11px] uppercase tracking-tight">{selectedIssue.issueKey}</span>
                                <span 
                                    className={`font-semibold truncate text-[13px] ${onNavigate ? 'hover:underline cursor-pointer text-slate-700 hover:text-slate-900 transition-colors' : 'text-slate-700'}`}
                                    onClick={(e) => {
                                        if (onNavigate) {
                                            e.stopPropagation();
                                            onNavigate(selectedIssue.id);
                                        }
                                    }}
                                    title={onNavigate ? "Click to navigate to parent issue" : selectedIssue.title}
                                >
                                    {selectedIssue.title}
                                </span>
                                <div className="ml-auto flex items-center gap-2 shrink-0">
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider
                                        ${selectedIssue.status === 'DONE' ? 'bg-green-100 text-green-700' : 
                                          selectedIssue.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 
                                          'bg-slate-100 text-slate-600'}`}
                                    >
                                        {selectedIssue.status.replace('_', ' ')}
                                    </span>
                                    {selectedIssue.assigneeEmail ? (
                                        <div 
                                            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white border border-white shadow-sm shrink-0"
                                            style={{ backgroundColor: getAvatarColor(selectedIssue.assigneeEmail) }}
                                            title={selectedIssue.assigneeName}
                                        >
                                            {selectedIssue.assigneeName?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                    ) : (
                                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-white shadow-sm shrink-0">
                                            <span className="material-symbols-outlined text-[11px]">person</span>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-2 animate-pulse">
                                <div className="w-4 h-4 bg-slate-100 rounded shrink-0"></div>
                                <span className="text-slate-400 font-bold text-[11px] uppercase tracking-tight">
                                    {initialKey || 'Loading...'}
                                </span>
                                <div className="w-24 h-3 bg-slate-50 rounded"></div>
                            </div>
                        )}
                    </div>
                ) : (
                    <span className="text-slate-400 font-medium">{placeholder}</span>
                )}
                <span className="material-symbols-outlined text-[18px] text-slate-400 shrink-0 ml-1">expand_more</span>
            </div>

            {isOpen && (
                <div className="absolute z-[100] w-full bottom-full mb-1 bg-white border border-slate-200 rounded-lg shadow-2xl overflow-hidden flex flex-col min-w-[320px]">
                    <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[16px] text-slate-400">search</span>
                            <input 
                                autoFocus
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by key or summary..."
                                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-md text-[12px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>
                    
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        <div 
                            onClick={() => { onChange(null); setIsOpen(false); }}
                            className="px-3 py-2 text-[12px] hover:bg-slate-50 cursor-pointer flex items-center gap-2 text-slate-500 italic border-b border-slate-50"
                        >
                            None
                        </div>
                        {isLoading ? (
                            <div className="p-4 text-center text-slate-400 text-[12px]">Loading issues...</div>
                        ) : filteredIssues.length === 0 ? (
                            <div className="p-4 text-center text-slate-400 text-[12px]">No issues found</div>
                        ) : (
                            filteredIssues.map((issue) => (
                                <div 
                                    key={issue.id}
                                    onClick={() => {
                                        onChange(issue.id, issue.issueKey, issue.type);
                                        setIsOpen(false);
                                    }}
                                    className={`px-4 py-3 hover:bg-blue-50/50 cursor-pointer border-b border-slate-50/50 transition-all ${value?.toString() === issue.id.toString() ? 'bg-blue-50/80' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`material-symbols-outlined text-[18px] ${getIssueIcon(issue.type).color} shrink-0`}>
                                            {getIssueIcon(issue.type).icon}
                                        </span>
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight shrink-0">{issue.issueKey}</span>
                                        <span className="text-[13px] font-semibold text-slate-700 truncate flex-1">{issue.title}</span>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider
                                                ${issue.status === 'DONE' ? 'bg-green-100 text-green-700' : 
                                                  issue.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 
                                                  'bg-slate-100 text-slate-600'}`}
                                            >
                                                {issue.status.replace('_', ' ')}
                                            </span>
                                            
                                            {issue.assigneeEmail ? (
                                                <div 
                                                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white shadow-sm shrink-0"
                                                    style={{ backgroundColor: getAvatarColor(issue.assigneeEmail) }}
                                                    title={issue.assigneeName}
                                                >
                                                    {issue.assigneeName?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border-2 border-white shadow-sm shrink-0">
                                                    <span className="material-symbols-outlined text-[14px]">person</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
