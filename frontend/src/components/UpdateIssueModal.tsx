import React, { useState, useRef, useEffect } from 'react'
import { MentionTextarea } from './MentionTextarea'
import { RichTextEditor } from './RichTextEditor'
import * as api from '../services/api'
import type { IIssue, IComment, IHistory, IProjectMember } from '../types'
import { ParentIssueSelector } from './ParentIssueSelector'
import { LabelSelector } from './LabelSelector'
import { Calendar } from './Calendar'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getAvatarColor, formatRelativeTime, getIssueTheme } from '../utils'
import { DeleteConfirmModal } from './DeleteConfirmModal'


/* --- Custom Dropdown Component --- */
interface Option {
    value: string;
    label: string;
    icon?: string;
    iconColor?: string;
    avatar?: string;
    avatarColor?: string;
    labelClass?: string;
}

interface CustomDropdownProps {
    options: Option[];
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    showAvatar?: boolean;
}

const CustomDropdown = ({ options, value, onChange, placeholder, showAvatar }: CustomDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const selectedItem = options.find(o => o.value === value);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-[42px] flex items-center justify-between px-4 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-blue-50 focus:border-blue-400"
            >
                {selectedItem ? (
                    <div className="flex items-center gap-2">
                        {showAvatar && selectedItem.avatar ? (
                            <div 
                                className="flex items-center justify-center w-6 h-6 rounded-full text-white font-bold text-[10px] border border-white shadow-sm overflow-hidden"
                                style={{ backgroundColor: selectedItem.avatarColor || '#e2e8f0' }}
                            >
                                {selectedItem.avatar === '?' ? '?' : <span className="text-[10px]">{selectedItem.avatar}</span>}
                            </div>
                        ) : selectedItem.icon ? (
                            <span className={`material-symbols-outlined text-[18px] ${selectedItem.iconColor || 'text-slate-500'}`}>{selectedItem.icon}</span>
                        ) : null}
                        <span className={selectedItem.labelClass ? selectedItem.labelClass : "font-semibold text-slate-700"}>{selectedItem.label}</span>
                    </div>
                ) : (
                    <span className="text-slate-400 font-medium">{placeholder}</span>
                )}
                <span className="material-symbols-outlined text-[20px] text-slate-400 pointer-events-none">expand_more</span>
            </div>
            
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto py-1 ring-1 ring-slate-100">
                    {options.map((option) => (
                        <div 
                            key={option.value}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] cursor-pointer hover:bg-slate-50 transition-colors ${value === option.value ? 'bg-slate-50' : ''}`}
                        >
                            {showAvatar && option.avatar ? (
                                <div 
                                    className="flex items-center justify-center w-6 h-6 rounded-full text-white font-bold text-[10px] border border-white shadow-sm overflow-hidden text-center"
                                    style={{ backgroundColor: option.avatarColor || '#e2e8f0' }}
                                >
                                     {option.avatar === '?' ? '?' : <span className="text-[10px]">{option.avatar}</span>}
                                </div>
                            ) : option.icon ? (
                                <span className={`material-symbols-outlined text-[18px] ${option.iconColor || 'text-slate-500'}`}>{option.icon}</span>
                            ) : null}
                            <span className={option.labelClass ? option.labelClass : "font-semibold text-slate-700"}>{option.label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

/* --- Data Definitions --- */
const ISSUE_TYPES: Option[] = [
    { value: 'task', label: 'Task', icon: 'check_box', iconColor: 'text-blue-500' },
    { value: 'story', label: 'Story', icon: 'bookmark', iconColor: 'text-green-500' },
    { value: 'bug', label: 'Bug', icon: 'bug_report', iconColor: 'text-red-500' },
    { value: 'epic', label: 'Epic', icon: 'electric_bolt', iconColor: 'text-purple-500' },
];

const STATUSES: Option[] = [
    { value: 'todo', label: 'TO DO', labelClass: 'px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] uppercase tracking-wider font-bold' },
    { value: 'in_progress', label: 'IN PROGRESS', labelClass: 'px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] uppercase tracking-wider font-bold' },
    { value: 'in_review', label: 'IN REVIEW', labelClass: 'px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-[10px] uppercase tracking-wider font-bold' },
    { value: 'done', label: 'DONE', labelClass: 'px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] uppercase tracking-wider font-bold' },
];

const PRIORITIES: Option[] = [
    { value: 'high', label: 'High', icon: 'keyboard_arrow_up', iconColor: 'text-red-500' },
    { value: 'medium', label: 'Medium', icon: 'drag_handle', iconColor: 'text-orange-500' },
    { value: 'low', label: 'Low', icon: 'keyboard_arrow_down', iconColor: 'text-blue-500' },
];

/* --- Interfaces --- */
interface UpdateIssueModalProps {
    isOpen: boolean
    onClose: () => void
    task: any | null // Using any for now to handle minor diffs, will cast to IIssue
    projectId: string
    onNavigate?: (issueId: string | number) => void
}

export const UpdateIssueModal = ({ isOpen, onClose, task: initialTask, projectId, onNavigate }: UpdateIssueModalProps): React.ReactElement | null => {
    const { showToast } = useToast();
    const [issueType, setIssueType] = useState('task');
    const [status, setStatus] = useState('todo');
    const [priority, setPriority] = useState('medium');
    const [assigneeId, setAssigneeId] = useState('unassigned');
    const [epicId, setEpicId] = useState('none');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [labels, setLabels] = useState<string[]>([]);
    const [isAiAssigning, setIsAiAssigning] = useState(false);
    const [aiReasoning, setAiReasoning] = useState<string | null>(null);
    const [showAiReasoning, setShowAiReasoning] = useState(true);


    const { user: currentUser } = useAuth();
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(() => {
        const saved = localStorage.getItem('issue-modal-sidepanel');
        return saved !== null ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        localStorage.setItem('issue-modal-sidepanel', JSON.stringify(isSidePanelOpen));
    }, [isSidePanelOpen]);

    const [activeTab, setActiveTab] = useState<'comments' | 'history'>('comments');
    const [comments, setComments] = useState<IComment[]>([]);
    const [history, setHistory] = useState<IHistory[]>([]);
    const [newComment, setNewComment] = useState('');
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingContent, setEditingContent] = useState('');
    const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
    const [projectMembers, setProjectMembers] = useState<Option[]>([]);
    const [rawMembers, setRawMembers] = useState<IProjectMember[]>([]);
    const [projectIssues, setProjectIssues] = useState<IIssue[]>([]);

    const [parentId, setParentId] = useState<string | number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Date Popover States
    const [isStartDateOpen, setIsStartDateOpen] = useState(false);
    const [isEndDateOpen, setIsEndDateOpen] = useState(false);
    
    const startDateRef = useRef<HTMLDivElement>(null);
    const endDateRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (startDateRef.current && !startDateRef.current.contains(event.target as Node)) setIsStartDateOpen(false);
            if (endDateRef.current && !endDateRef.current.contains(event.target as Node)) setIsEndDateOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && initialTask) {
            syncTaskState(initialTask as IIssue);
            loadProjectData();
            loadActivities(initialTask.id);
        }
    }, [isOpen, initialTask, projectId]);

    const syncTaskState = (task: IIssue) => {
        setTitle(task.title);
        setDescription(task.description || '');
        setIssueType(task.type.toLowerCase());
        setStatus(task.status.toLowerCase());
        setPriority(task.priority.toLowerCase());
        setAssigneeId(task.assigneeId ? task.assigneeId.toString() : 'unassigned');
        // Route epic/parent correctly: if issue has an epic assigned, use epicId
        setEpicId(task.epicId || 'none');
        setParentId(task.parentId || null);
        setStartDate(task.startDate || '');
        setEndDate(task.endDate || '');
        setLabels(task.labels || []);
        setAiReasoning(task.aiAssignmentReason || null);
        setShowAiReasoning(!!task.aiAssignmentReason);
    };

    const loadProjectData = async () => {
        try {
            const project = await api.fetchProjectById(projectId);
            const allMembers = [...(project.leads || []), ...(project.members || [])];
            setRawMembers(allMembers);
            setProjectMembers([
                { value: 'unassigned', label: 'Unassigned', avatar: '?', avatarColor: '#cbd5e1' },
                ...allMembers.map(m => ({
                    value: m.id.toString(),
                    label: `${m.firstName} ${m.lastName}`,
                    avatar: m.firstName.charAt(0).toUpperCase(),
                    avatarColor: getAvatarColor(m.email)
                }))
            ]);

            const issues = await api.fetchProjectIssues(projectId);
            setProjectIssues(issues);

        } catch (error) {
            console.error('Failed to load project data:', error);
        }
    };

    const getUserAvatarInfo = (name: string) => {
        // If it's the current user, use our auth state for perfect match
        if (currentUser && `${currentUser.firstName} ${currentUser.lastName}` === name) {
            return {
                color: getAvatarColor(currentUser.email),
                initial: currentUser.firstName.charAt(0).toUpperCase()
            };
        }

        // Search project members
        const member = rawMembers.find(m => `${m.firstName} ${m.lastName}` === name);
        if (member) {
            return {
                color: getAvatarColor(member.email),
                initial: member.firstName.charAt(0).toUpperCase()
            };
        }

        // Fallback
        return {
            color: getAvatarColor(name),
            initial: name.charAt(0).toUpperCase()
        };
    };

    const loadActivities = async (issueId: string) => {
        try {
            const [commentsData, historyData] = await Promise.all([
                api.fetchIssueComments(issueId),
                api.fetchIssueHistory(issueId)
            ]);
            setComments(commentsData);
            setHistory(historyData);
        } catch (error) {
            console.error('Failed to load activities:', error);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !initialTask) return;
        try {
            const comment = await api.addIssueComment(initialTask.id, newComment);
            setComments([...comments, comment]);
            setNewComment('');
        } catch (error) {
            console.error('Failed to add comment:', error);
        }
    };

    const handleUpdateComment = async (commentId: string) => {
        if (!editingContent.trim() || !initialTask) return;
        try {
            const updated = await api.updateIssueComment(commentId, editingContent, initialTask.id);
            setComments(prev => prev.map(c => c.id === commentId ? updated : c));
            setEditingCommentId(null);
            setEditingContent('');
        } catch (error) {
            console.error('Failed to update comment:', error);
        }
    };

    const handleDeleteComment = async () => {
        if (!commentToDelete) return;
        try {
            await api.deleteIssueComment(commentToDelete);
            setComments(prev => prev.filter(c => c.id !== commentToDelete));
            setCommentToDelete(null);
        } catch (error) {
            console.error('Failed to delete comment:', error);
        }
    };

    /**
     * Parses mention strings like @[Name](id) or #[Key](id) 
     * and renders them as styled spans.
     */
    const renderCommentContent = (content: string) => {
        if (!content) return null;
        
        // Check if there is HTML (potential legacy comments)
        if (content.includes('<') && content.includes('>')) {
            return <div dangerouslySetInnerHTML={{ __html: content }} />;
        }

        const parts = content.split(/(@\[[^\]]+\]\([^\)]+\)|#\[[^\]]+\]\([^\)]+\))/g);
        
        return parts.map((part, index) => {
            const userMatch = part.match(/@\[([^\]]+)\]\(([^\)]+)\)/);
            if (userMatch) {
                const name = userMatch[1];
                const userId = userMatch[2];
                const member = rawMembers.find(m => m.id.toString() === userId || m.email === userId);
                const avatarColor = member ? getAvatarColor(member.email) : getAvatarColor(name);
                const initial = name.charAt(0).toUpperCase();

                return (
                    <span 
                        key={index} 
                        className="inline-flex items-center gap-1.5 font-black text-[12px] mx-0.5 transition-opacity hover:opacity-80 cursor-default text-blue-600"
                    >
                        <div 
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
                            style={{ backgroundColor: avatarColor, color: '#fff' }}
                        >
                            {initial}
                        </div>
                        @{name}
                    </span>
                );
            }
            
            const issueMatch = part.match(/#\[([^\]]+)\]\([^\)]+\)/);
            if (issueMatch) {
                const issueId = issueMatch[2];
                const ref = projectIssues?.find(i => i.id.toString() === issueId);
                const theme = getIssueTheme(ref?.type || 'TASK');
                
                return (
                    <span 
                        key={index} 
                        className={`inline-flex items-center gap-1 font-black text-[12px] mx-0.5 transition-opacity hover:opacity-80 cursor-pointer ${theme.color} align-bottom`}
                        onClick={() => onNavigate?.(issueId)}
                        title={ref?.title}
                    >
                        <span className={`material-symbols-outlined text-[14px] ${theme.color} font-bold`}>{theme.icon}</span>
                        {issueMatch[1]}
                    </span>
                );
            }
            
            return <span key={index}>{part}</span>;
        });
    };

    // Mention data for the custom MentionTextarea
    const mentionMemberData = (projectMembers || [])
        .filter(m => m.value !== 'unassigned') // Remove unassigned option for mentions
        .map(m => ({ 
            id: m.value as string | number, 
            display: m.label,
            avatar: m.avatar,
            avatarColor: m.avatarColor
        }))
    const mentionIssueData = (projectIssues || []).map(i => {
        const theme = getIssueTheme(i.type);
        return { 
            id: i.id, 
            display: i.issueKey,
            title: i.title,
            icon: theme.icon,
            iconColor: theme.hex
        };
    })

    const handleAiAssign = async () => {
        if (!title.trim()) {
            showToast("Please enter a title before using AI assign", "error");
            return;
        }

        setIsAiAssigning(true);
        try {
            const request = {
                projectId,
                title: title,
                description: description,
                type: issueType.toUpperCase(),
                priority: priority.toUpperCase()
            };
            
            const response = await api.aiAssignIssue(request);
            if (response.assigneeId) {
                setAssigneeId(response.assigneeId.toString());
                setAiReasoning(response.reason);
                setShowAiReasoning(true);
                showToast("AI Assignment successful", "success");
            } else {
                showToast("AI couldn't find a suitable assignee.", "error");
            }
        } catch (error) {
            console.error('Failed to auto-assign:', error);
            showToast("Failed to use AI assign", "error");
        } finally {
            setIsAiAssigning(false);
        }
    };

    const handleSave = async () => {
        if (!title.trim() || !initialTask) return;
        if (title.length > 50) {
            showToast("Title must be 50 characters or less", "error");
            return;
        }
        if (description.length > 500) {
            showToast("Description must be 500 characters or less", "error");
            return;
        }
        setIsSubmitting(true);
        try {
            const request = {
                title,
                description,
                type: issueType.toUpperCase(),
                status: status.toUpperCase(),
                priority: priority.toUpperCase(),
                projectId,
                assigneeId: assigneeId === 'unassigned' ? null : parseInt(assigneeId),
                epicId: epicId === 'none' ? null : epicId,
                parentId: parentId === 'none' || parentId === null ? null : parentId,
                startDate: startDate || null,
                endDate: endDate || null,
                labels,
                aiAssignmentReason: aiReasoning
            };
            await api.updateIssue(initialTask.id, request);
            showToast("Issue updated successfully!", "success")
            onClose();
        } catch (error) {
            console.error('Failed to update issue:', error);
        } finally {
            setIsSubmitting(false);
        }
    };


    if (!isOpen || !initialTask) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-6 bg-slate-900/40 backdrop-blur-sm font-inter">
            <div 
                className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[85vh] flex flex-col overflow-hidden font-inter border border-slate-200/60"
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[20px] text-blue-500">check_box</span>
                            <span className="text-[14px] text-slate-500 font-bold tracking-tight uppercase">Issue Key: {initialTask.issueKey}</span>
                        </div>
                        <div className="w-px h-4 bg-slate-200"></div>
                        <h2 className="text-lg font-bold text-slate-800">Update Issue</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
                            className={`p-2 rounded-lg transition-all flex items-center justify-center ${isSidePanelOpen ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                            title={isSidePanelOpen ? "Hide Side Panel" : "Show Side Panel"}
                            aria-label={isSidePanelOpen ? "Hide Side Panel" : "Show Side Panel"}
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                {isSidePanelOpen ? 'dock_to_right' : 'side_navigation'}
                            </span>
                        </button>
                        <div className="w-px h-6 bg-slate-100 mx-1"></div>
                        <button 
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                        >
                            <span className="material-symbols-outlined text-[22px]">close</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-y-auto custom-scrollbar flex-1 bg-white">
                    <div className="flex flex-col md:flex-row items-stretch">
                        {/* LEFT COLUMN */}
                        <div className={`transition-all duration-300 ease-in-out flex flex-col gap-4 md:gap-5 bg-white ${isSidePanelOpen ? 'flex-[5.5] w-full md:w-auto p-5 md:px-10 md:pt-6 md:pb-2 border-b md:border-b-0 md:border-r border-slate-100' : 'w-full p-6 md:px-12 md:pt-6 md:pb-2'}`}>
                        <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                            <div className="w-full md:w-1/2">
                                <label className="block text-[11px] font-bold text-slate-400 tracking-wider mb-2.5 uppercase">Issue Type</label>
                                <CustomDropdown options={ISSUE_TYPES} value={issueType} onChange={setIssueType} placeholder="Select type" />
                            </div>
                            <div className="w-full md:w-1/2">
                                <label className="block text-[11px] font-bold text-slate-400 tracking-wider mb-2.5 uppercase">Status</label>
                                <CustomDropdown options={STATUSES} value={status} onChange={setStatus} placeholder="Select status" />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2.5">
                                <label className="block text-[11px] font-bold text-slate-400 tracking-wider uppercase">Title</label>
                                <span className={`text-[10px] font-bold ${title.length > 50 ? 'text-red-500' : 'text-slate-400'}`}>
                                    {title.length}/50
                                </span>
                            </div>
                            <input 
                                type="text" 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                maxLength={50}
                                placeholder="Summarize the work item" 
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-[15px] text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 font-bold transition-all shadow-sm"
                            />
                        </div>

                        <div className="flex flex-col">
                            <div className="flex items-center justify-between mb-2.5">
                                <label className="block text-[11px] font-bold text-slate-400 tracking-wider uppercase">Description</label>
                                <span className={`text-[10px] font-bold ${description.length > 500 ? 'text-red-500' : 'text-slate-400'}`}>
                                    {description.length}/500
                                </span>
                            </div>
                            <RichTextEditor
                                value={description}
                                onChange={setDescription}
                                placeholder="Add a detailed description..."
                                minHeight={120}
                                maxLength={500}
                            />
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                            <div className="w-full md:w-1/2 relative" ref={startDateRef}>
                                <label className="block text-[11px] font-bold text-slate-400 tracking-wider mb-2.5 uppercase">Start Date</label>
                                <div 
                                    onClick={() => setIsStartDateOpen(!isStartDateOpen)}
                                    className="w-full h-[42px] flex items-center justify-between px-4 bg-white border border-slate-200 rounded-lg text-[14px] text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-blue-50 focus:border-blue-400 shadow-sm"
                                >
                                    <span className={startDate ? "font-semibold" : "text-slate-400 font-medium"}>
                                        {startDate ? new Date(startDate).toLocaleDateString() : 'Select start date'}
                                    </span>
                                    <span className="material-symbols-outlined text-[20px] text-slate-400">calendar_today</span>
                                </div>
                                {isStartDateOpen && (
                                    <div className="absolute z-[110] top-full left-0 mt-1 shadow-2xl">
                                        <Calendar 
                                            value={startDate || null} 
                                            onChange={(d: string) => setStartDate(d)} 
                                            onSave={() => setIsStartDateOpen(false)} 
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="w-full md:w-1/2 relative" ref={endDateRef}>
                                <label className="block text-[11px] font-bold text-slate-400 tracking-wider mb-2.5 uppercase">Target Completion</label>
                                <div 
                                    onClick={() => setIsEndDateOpen(!isEndDateOpen)}
                                    className="w-full h-[42px] flex items-center justify-between px-4 bg-white border border-slate-200 rounded-lg text-[14px] text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-blue-50 focus:border-blue-400 shadow-sm"
                                >
                                    <span className={endDate ? "font-semibold" : "text-slate-400 font-medium"}>
                                        {endDate ? new Date(endDate).toLocaleDateString() : 'Select target date'}
                                    </span>
                                    <span className="material-symbols-outlined text-[20px] text-slate-400">calendar_today</span>
                                </div>
                                {isEndDateOpen && (
                                    <div className="absolute z-[110] top-full right-0 mt-1 shadow-2xl">
                                        <Calendar 
                                            value={endDate || null} 
                                            onChange={(d: string) => setEndDate(d)} 
                                            onSave={() => setIsEndDateOpen(false)} 
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                            <div className="w-full md:w-1/2">
                                <div className="flex items-center justify-between mb-2.5 h-[20px]">
                                    <label className="block text-[11px] font-bold text-slate-400 tracking-wider uppercase">Assignee</label>
                                    <div className="flex items-center gap-2">
                                        {aiReasoning && (
                                            <button
                                                onClick={() => setShowAiReasoning(!showAiReasoning)}
                                                className={`flex items-center justify-center p-1 rounded transition-colors ${
                                                    showAiReasoning ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:bg-slate-50'
                                                }`}
                                                title={showAiReasoning ? "Hide AI Insight" : "Show AI Insight"}
                                            >
                                                <span className="material-symbols-outlined text-[16px]">
                                                    {showAiReasoning ? 'visibility' : 'visibility_off'}
                                                </span>
                                            </button>
                                        )}
                                        <button
                                            onClick={handleAiAssign}
                                            disabled={isAiAssigning || !title.trim()}
                                            title="AI Auto-Assign"
                                            className={`flex items-center justify-center p-1 rounded transition-colors ${
                                                isAiAssigning 
                                                    ? 'text-blue-300 cursor-not-allowed animate-pulse' 
                                                    : title.trim() 
                                                        ? 'text-blue-600 hover:bg-blue-50' 
                                                        : 'text-slate-300 cursor-not-allowed'
                                            }`}
                                        >
                                            <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                                        </button>
                                    </div>
                                </div>
                                <CustomDropdown options={projectMembers} value={assigneeId} onChange={(val) => {
                                    setAssigneeId(val);
                                    setAiReasoning(null);
                                }} placeholder="Unassigned" showAvatar />
                            </div>
                            <div className="w-full md:w-1/2">
                                <div className="flex items-center justify-between mb-2.5 h-[20px]">
                                    <label className="block text-[11px] font-bold text-slate-400 tracking-wider uppercase">Priority</label>
                                </div>
                                <CustomDropdown options={PRIORITIES} value={priority} onChange={setPriority} placeholder="Select priority" />
                            </div>
                        </div>

                        {aiReasoning && showAiReasoning && (
                            <div className="p-4 bg-purple-50/80 border border-purple-100 rounded-xl text-[13px] text-purple-700 flex gap-4 relative animate-in fade-in slide-in-from-top-1 duration-300 shadow-sm max-w-2xl mx-auto w-full group">
                                <span className="material-symbols-outlined text-[18px] shrink-0 text-purple-500">auto_awesome</span>
                                <div className="pr-8 leading-relaxed text-left min-w-0 whitespace-pre-wrap break-words">
                                    <span className="font-bold">AI Insight:</span> {aiReasoning}
                                </div>
                                <button 
                                    onClick={() => setShowAiReasoning(false)}
                                    className="absolute top-3 right-3 text-purple-400 hover:text-purple-600 transition-colors opacity-0 group-hover:opacity-100"
                                    aria-label="Hide insight"
                                >
                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                            </div>
                        )}

                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 tracking-wider mb-2.5 uppercase">Parent Issue</label>
                            <ParentIssueSelector 
                                projectId={projectId} 
                                currentIssueId={initialTask.id}
                                issueType={issueType}
                                value={epicId !== 'none' ? epicId : parentId} 
                                initialKey={initialTask.epicKey || initialTask.parentKey}
                                onChange={(id, _key, selectedType) => {
                                    if (!id) {
                                        setEpicId('none')
                                        setParentId(null)
                                    } else if (selectedType?.toUpperCase() === 'EPIC') {
                                        setEpicId(id as string)
                                        setParentId(null)
                                    } else {
                                        setParentId(id)
                                        setEpicId('none')
                                    }
                                }} 
                                onNavigate={onNavigate}
                                placeholder="Select parent issue" 
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 tracking-wider mb-2.5 uppercase">Labels</label>
                            <LabelSelector
                                projectId={projectId}
                                selectedLabels={labels}
                                onChange={setLabels}
                            />
                        </div>
                    </div>

                        {/* RIGHT COLUMN */}
                        <div className={`transition-all duration-300 ease-in-out flex flex-col bg-slate-50/10 ${isSidePanelOpen ? 'flex-auto md:flex-[4.5] w-full md:w-auto opacity-100' : 'flex-0 h-0 md:h-0 md:w-0 opacity-0 overflow-hidden'}`}>
                            {isSidePanelOpen && (
                                <>
                                    <div className="px-8 pt-5 border-b border-slate-100 flex items-center gap-6 bg-white/50 backdrop-blur-sm sticky top-0 z-20 shrink-0">
                            <button 
                                onClick={() => setActiveTab('comments')}
                                className={`pb-3 text-[11px] font-bold tracking-[0.1em] uppercase transition-all border-b-2 flex items-center gap-1.5 ${activeTab === 'comments' ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                            >
                                <span className="material-symbols-outlined text-[15px]">chat_bubble_outline</span>
                                Comments
                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${activeTab === 'comments' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>{comments.length}</span>
                            </button>
                            <button 
                                onClick={() => setActiveTab('history')}
                                className={`pb-3 text-[11px] font-bold tracking-[0.1em] uppercase transition-all border-b-2 flex items-center gap-1.5 ${activeTab === 'history' ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                            >
                                <span className="material-symbols-outlined text-[15px]">history</span>
                                History
                            </button>
                        </div>

                        <div className="flex-1 p-6 bg-slate-50/10 flex flex-col relative">
                            {activeTab === 'comments' ? (
                                <div className="space-y-6">
                                    {comments.map((comment) => {
                                        const avatarInfo = getUserAvatarInfo(comment.authorName);
                                        const isAuthor = currentUser?.email && comment.authorName.includes(currentUser.firstName); // Basic check for now
                                        // More robust permission: check project leads
                                        const isLead = initialTask.projectLeads?.some((l: any) => l.firstName + " " + l.lastName === currentUser?.firstName + " " + currentUser?.lastName);
                                        const canDelete = isAuthor || isLead;
                                        const canEdit = isAuthor;
                                        const isEditing = editingCommentId === comment.id;
                                        const isEdited = comment.updatedAt && comment.updatedAt !== comment.createdAt;

                                        return (
                                            <div key={comment.id} className={`flex w-full group ${isAuthor ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`flex gap-3 max-w-[85%] ${isAuthor ? 'flex-row-reverse' : 'flex-row'}`}>
                                                    <div 
                                                        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold border-2 border-white shadow-sm shrink-0 ring-1 ring-slate-100 mt-0.5"
                                                        style={{ backgroundColor: avatarInfo.color, color: '#fff' }}
                                                    >
                                                        {avatarInfo.initial}
                                                    </div>
                                                    <div className={`flex flex-col gap-1.5 min-w-0 ${isAuthor ? 'items-end' : 'items-start'}`}>
                                                        <div className={`flex items-center gap-2 px-1 ${isAuthor ? 'flex-row-reverse' : 'flex-row'}`}>
                                                            <span className="text-[12px] font-bold text-slate-800 tracking-tight">{isAuthor ? 'You' : comment.authorName}</span>
                                                            <span className="text-[10px] text-slate-400 font-medium">{formatRelativeTime(comment.createdAt)}</span>
                                                            {isEdited && <span className="text-[10px] text-slate-400 italic bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">edited</span>}
                                                        </div>
                                                        
                                                        {isEditing ? (
                                                            <div className={`mt-1 space-y-2 w-[400px] max-w-full ${isAuthor ? 'mr-1' : 'ml-1'}`}>
                                                                <div className="rounded-lg border border-slate-200 overflow-hidden bg-white shadow-sm text-[13px]">
                                                                    <MentionTextarea
                                                                        value={editingContent}
                                                                        onChange={setEditingContent}
                                                                        className="p-3 text-[13px] text-slate-700 placeholder:text-slate-400"
                                                                        minHeight={60}
                                                                        memberData={mentionMemberData}
                                                                        issueData={mentionIssueData}
                                                                    />
                                                                </div>
                                                                <div className="flex justify-end gap-2">
                                                                    <button 
                                                                        onClick={() => setEditingCommentId(null)}
                                                                        className="px-3 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-800"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleUpdateComment(comment.id)}
                                                                        className="px-3 py-1.5 bg-blue-600 text-white rounded text-[11px] font-bold shadow-sm hover:bg-blue-700"
                                                                    >
                                                                        Save
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className={`flex items-start gap-2 w-full max-w-full group/comment ${isAuthor ? 'flex-row-reverse' : 'flex-row'}`}>
                                                                <div className={`text-[13px] p-3 rounded-2xl shadow-sm leading-relaxed whitespace-pre-wrap break-words min-w-0 border ${
                                                                    isAuthor 
                                                                    ? 'bg-blue-50 text-blue-900 border-blue-100/50 rounded-tr-none selection:bg-blue-200' 
                                                                    : 'bg-white text-slate-700 border-slate-200/60 rounded-tl-none selection:bg-blue-100'
                                                                }`}>
                                                                    {renderCommentContent(comment.content)}
                                                                </div>
                                                                <div className="flex flex-col gap-1 opacity-0 group-hover/comment:opacity-100 transition-all duration-200 translate-y-1 group-hover/comment:translate-y-0 mt-1">
                                                                    {canEdit && (
                                                                        <button 
                                                                            onClick={() => { setEditingCommentId(comment.id); setEditingContent(comment.content); }}
                                                                            className="w-7 h-7 rounded-lg flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-200 shadow-md transition-all active:scale-90"
                                                                            title="Edit"
                                                                        >
                                                                            <span className="material-symbols-outlined text-[16px]">edit</span>
                                                                        </button>
                                                                    )}
                                                                    {canDelete && (
                                                                        <button 
                                                                            onClick={() => setCommentToDelete(comment.id)}
                                                                            className="w-7 h-7 rounded-lg flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-rose-600 hover:border-rose-200 shadow-md transition-all active:scale-90"
                                                                            title="Delete"
                                                                        >
                                                                            <span className="material-symbols-outlined text-[16px]">delete</span>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="space-y-6 pl-1">
                                    {history.map((item) => {
                                        const avatarInfo = getUserAvatarInfo(item.userName);
                                        return (
                                            <div key={item.id} className="flex gap-4 relative">
                                                <div 
                                                    className="z-10 w-[32px] h-[32px] rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm shrink-0 ring-1 ring-slate-100"
                                                    style={{ backgroundColor: avatarInfo.color, color: '#fff' }}
                                                >
                                                    {avatarInfo.initial}
                                                </div>
                                            <div className="flex-1 pt-1.5 min-w-0">
                                                <p className="text-[13px] text-slate-600 leading-relaxed font-medium">
                                                    <span className="font-bold text-slate-900">{item.userName}</span> {item.action} 
                                                    {item.field && <span className="font-bold"> {item.field}</span>}
                                                    {item.oldValue && <span className="mx-2 px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-bold text-[10px] uppercase">{item.oldValue}</span>}
                                                    {item.newValue && <><span className="text-slate-400 mx-1">→</span><span className="mx-2 px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-bold text-[10px] uppercase">{item.newValue}</span></>}
                                                </p>
                                                <span className="text-[11px] text-slate-400 mt-1 block font-medium">
                                                    {new Date(item.timestamp).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                        {/* Add Comment Input - Fixed at bottom outside scroll area */}
                        {activeTab === 'comments' && (
                            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0 z-20 sticky bottom-0">
                                <div className="flex-1 flex flex-col gap-3">
                                    <div className="bg-white border border-slate-200 rounded-xl focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50/50 transition-all shadow-sm flex flex-col min-h-[90px]">
                                        <div className="flex-1 relative text-[13px]">
                                            <MentionTextarea
                                                value={newComment}
                                                onChange={setNewComment}
                                                placeholder="Add a comment..."
                                                className="p-3 text-[13px] text-slate-700 placeholder:text-slate-400"
                                                minHeight={50}
                                                memberData={mentionMemberData}
                                                issueData={mentionIssueData}
                                            />
                                        </div>
                                        <div className="flex items-center justify-end px-3 py-2 bg-slate-50/50 border-t border-slate-100 rounded-b-xl shrink-0">
                                            <button 
                                                onClick={handleAddComment}
                                                disabled={!newComment.trim()}
                                                className="px-4 py-1.5 bg-[#1A202C] text-white rounded-lg text-[11px] font-black shadow-sm hover:bg-slate-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-wider"
                                            >
                                                Post Comment
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                            </>
                        )}
                    </div>
                    </div>
                </div>

                <div className="px-8 py-4 border-t border-slate-100 flex justify-end items-center gap-5 bg-white shrink-0">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2.5 text-[14px] font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-all"
                    >
                        Discard Changes
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isSubmitting || !title.trim()}
                        className="px-10 py-2.5 bg-[#1A202C] text-white rounded-lg text-[14px] font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 hover:translate-y-[-1px] active:translate-y-[0px] active:scale-95 transition-all disabled:opacity-50"
                    >
                        {isSubmitting ? 'Saving...' : 'Save Issue'}
                    </button>
                </div>
            </div>

            <DeleteConfirmModal 
                isOpen={commentToDelete !== null}
                onClose={() => setCommentToDelete(null)}
                onConfirm={handleDeleteComment}
                itemName="this comment"
            />
        </div>
    )
}
