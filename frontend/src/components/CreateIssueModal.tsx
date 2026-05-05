import React, { useState, useRef, useEffect } from 'react'
import { RichTextEditor } from './RichTextEditor'
import * as api from '../services/api'
// import type { IIssue } from '../types'
import { getAvatarColor } from '../utils'
import { Calendar } from './Calendar'
import { ParentIssueSelector } from './ParentIssueSelector'
import { LabelSelector } from './LabelSelector'

import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

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
                className="w-full h-[38px] flex items-center justify-between px-3 bg-white border border-slate-200 rounded-md text-[13px] text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors focus:ring-1 focus:ring-slate-300"
            >
                {selectedItem ? (
                    <div className="flex items-center gap-2">
                        {showAvatar && selectedItem.avatar ? (
                            <div 
                                className="flex items-center justify-center w-5 h-5 rounded-full text-white font-bold text-[10px] border border-white shadow-sm overflow-hidden"
                                style={{ backgroundColor: selectedItem.avatarColor || '#e2e8f0' }}
                            >
                                {selectedItem.avatar === '?' ? '?' : <span className="text-[10px]">{selectedItem.avatar}</span>}
                            </div>
                        ) : selectedItem.icon ? (
                            <span className={`material-symbols-outlined text-[18px] ${selectedItem.iconColor || 'text-slate-500'}`}>{selectedItem.icon}</span>
                        ) : null}
                        <span className={selectedItem.labelClass ? selectedItem.labelClass : "font-medium"}>{selectedItem.label}</span>
                    </div>
                ) : (
                    <span className="text-slate-400 font-medium">{placeholder}</span>
                )}
                <span className="material-symbols-outlined text-[18px] text-slate-400 pointer-events-none">expand_more</span>
            </div>
            
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto py-1">
                    {options.map((option) => (
                        <div 
                            key={option.value}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={`flex items-center gap-2 px-3 py-2 text-[13px] cursor-pointer hover:bg-slate-50 transition-colors ${value === option.value ? 'bg-slate-50' : ''}`}
                        >
                            {showAvatar && option.avatar ? (
                                <div 
                                    className="flex items-center justify-center w-5 h-5 rounded-full text-white font-bold text-[10px] border border-white shadow-sm overflow-hidden"
                                    style={{ backgroundColor: option.avatarColor || '#e2e8f0' }}
                                >
                                     {option.avatar === '?' ? '?' : <span className="text-[10px]">{option.avatar}</span>}
                                </div>
                            ) : option.icon ? (
                                <span className={`material-symbols-outlined text-[18px] ${option.iconColor || 'text-slate-500'}`}>{option.icon}</span>
                            ) : null}
                            <span className={option.labelClass ? option.labelClass : "font-medium text-slate-700"}>{option.label}</span>
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

/* --- Main Component --- */
interface CreateIssueModalProps {
    isOpen: boolean
    onClose: () => void
    projectId: string
}

export const CreateIssueModal = ({ isOpen, onClose, projectId }: CreateIssueModalProps): React.ReactElement | null => {
    const { user } = useAuth();
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
    
    const [projectMembers, setProjectMembers] = useState<Option[]>([]);
    const [parentId, setParentId] = useState<string | number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
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
        if (isOpen && projectId) {
            loadProjectData();
        }
    }, [isOpen, projectId]);

    const loadProjectData = async () => {
        try {
            const project = await api.fetchProjectById(projectId);
            const allMembers = [...project.leads, ...project.members];
            const memberOptions: Option[] = [
                { value: 'unassigned', label: 'Unassigned', avatar: '?', avatarColor: '#cbd5e1' },
                ...allMembers.map(m => ({
                    value: m.id.toString(),
                    label: `${m.firstName} ${m.lastName}`,
                    avatar: m.firstName.charAt(0).toUpperCase(),
                    avatarColor: getAvatarColor(m.email)
                }))
            ];
            setProjectMembers(memberOptions);

            await api.fetchProjectIssues(projectId);
            // setProjectIssues(issues); // Removed unused state

            const currentUserMember = allMembers.find(m => m.email === user?.email);
            if (currentUserMember) {
                setAssigneeId(currentUserMember.id.toString());
            }

        } catch (error) {
            console.error('Failed to load project data:', error);
        }
    };


    const handleCreate = async () => {
        if (!title.trim()) return;
        if (title.length > 50) {
            showToast("Title must be 50 characters or less", "error");
            return;
        }
        if (description.length > 500) {
            showToast("Description must be 500 characters or less", "error");
            return;
        }
        
        setIsLoading(true);
        try {
            const request = {
                projectId,
                title,
                description,
                type: issueType.toUpperCase(),
                status: status.toUpperCase(),
                priority: priority.toUpperCase(),
                assigneeId: assigneeId === 'unassigned' ? null : parseInt(assigneeId),
                epicId: epicId === 'none' ? null : epicId,
                parentId: parentId === 'none' || parentId === null ? null : parentId,
                startDate: startDate || null,
                endDate: endDate || null,
                labels
            };
            
            await api.createIssue(request);
            showToast("Issue created successfully!", "success")
            onClose();
            // Reset form
            setTitle('');
            setDescription('');
            setLabels([]);
            setAssigneeId('unassigned');
            setEpicId('none');
            setParentId(null);
            setStartDate('');
            setEndDate('');
        } catch (error) {
            console.error('Failed to create issue:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm font-inter">
            <div 
                className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
                    <h2 className="text-lg font-bold text-slate-800">Create Issue</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                    
                    <div className="flex gap-6">
                        <div className="w-1/2">
                            <label className="block text-[10px] font-bold text-slate-500 tracking-wider mb-2 uppercase">Issue Type</label>
                            <CustomDropdown options={ISSUE_TYPES} value={issueType} onChange={setIssueType} placeholder="Select type" />
                        </div>
                        <div className="w-1/2">
                            <label className="block text-[10px] font-bold text-slate-500 tracking-wider mb-2 uppercase">Status</label>
                            <CustomDropdown options={STATUSES} value={status} onChange={setStatus} placeholder="Select status" />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-[10px] font-bold text-slate-500 tracking-wider uppercase">Title</label>
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
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-300 font-medium"
                        />
                    </div>

                    <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-[10px] font-bold text-slate-500 tracking-wider uppercase">Description</label>
                            <span className={`text-[10px] font-bold ${description.length > 500 ? 'text-red-500' : 'text-slate-400'}`}>
                                {description.length}/500
                            </span>
                        </div>
                        <RichTextEditor
                            value={description}
                            onChange={setDescription}
                            placeholder="Describe the work item..."
                            minHeight={160}
                            maxLength={500}
                        />
                    </div>

                    <div className="flex gap-6">
                        <div className="w-1/2 relative" ref={startDateRef}>
                            <label className="block text-[10px] font-bold text-slate-500 tracking-wider mb-2 uppercase">Start Date</label>
                            <div 
                                onClick={() => setIsStartDateOpen(!isStartDateOpen)}
                                className="w-full h-[38px] flex items-center justify-between px-3 bg-white border border-slate-200 rounded-md text-[13px] text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors focus:ring-1 focus:ring-slate-300"
                            >
                                <span className={startDate ? "font-medium" : "text-slate-400 font-medium"}>
                                    {startDate ? new Date(startDate).toLocaleDateString() : 'Select start date'}
                                </span>
                                <span className="material-symbols-outlined text-[18px] text-slate-400">calendar_today</span>
                            </div>
                            {isStartDateOpen && (
                                <div className="absolute z-[110] top-full left-0 mt-1 shadow-2xl">
                                    <Calendar 
                                        value={startDate || null} 
                                        onChange={(d) => setStartDate(d)} 
                                        onSave={() => setIsStartDateOpen(false)} 
                                    />
                                </div>
                            )}
                        </div>
                        <div className="w-1/2 relative" ref={endDateRef}>
                            <label className="block text-[10px] font-bold text-slate-500 tracking-wider mb-2 uppercase">Target Completion</label>
                            <div 
                                onClick={() => setIsEndDateOpen(!isEndDateOpen)}
                                className="w-full h-[38px] flex items-center justify-between px-3 bg-white border border-slate-200 rounded-md text-[13px] text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors focus:ring-1 focus:ring-slate-300"
                            >
                                <span className={endDate ? "font-medium" : "text-slate-400 font-medium"}>
                                    {endDate ? new Date(endDate).toLocaleDateString() : 'Select target date'}
                                </span>
                                <span className="material-symbols-outlined text-[18px] text-slate-400">calendar_today</span>
                            </div>
                            {isEndDateOpen && (
                                <div className="absolute z-[110] top-full right-0 mt-1 shadow-2xl">
                                    <Calendar 
                                        value={endDate || null} 
                                        onChange={(d) => setEndDate(d)} 
                                        onSave={() => setIsEndDateOpen(false)} 
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-6">
                        <div className="w-1/2">
                            <label className="block text-[10px] font-bold text-slate-500 tracking-wider mb-2 uppercase">Assignee</label>
                            <CustomDropdown options={projectMembers} value={assigneeId} onChange={setAssigneeId} placeholder="Unassigned" showAvatar />
                        </div>
                        <div className="w-1/2">
                            <label className="block text-[10px] font-bold text-slate-500 tracking-wider mb-2 uppercase">Priority</label>
                            <CustomDropdown options={PRIORITIES} value={priority} onChange={setPriority} placeholder="Select priority" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 tracking-wider mb-2 uppercase">Parent Issue</label>
                        <ParentIssueSelector 
                            projectId={projectId} 
                            issueType={issueType}
                            value={epicId !== 'none' ? epicId : parentId} 
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
                            placeholder="Select parent issue" 
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 tracking-wider mb-2 uppercase">Labels</label>
                        <LabelSelector
                            projectId={projectId}
                            selectedLabels={labels}
                            onChange={setLabels}
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end items-center gap-4 bg-slate-50 shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-[13px] font-bold text-slate-600 hover:text-slate-800 transition-colors">Cancel</button>
                    <button 
                        onClick={handleCreate}
                        disabled={isLoading || !title.trim()}
                        className="px-6 py-2 bg-[#1A202C] text-white rounded-md text-[13px] font-bold shadow-sm hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? 'Creating...' : 'Create'}
                    </button>
                </div>
            </div>
        </div>
    )
}
