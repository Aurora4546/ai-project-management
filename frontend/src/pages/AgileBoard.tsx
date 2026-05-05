import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { CreateIssueModal } from '../components/CreateIssueModal'
import { UpdateIssueModal } from '../components/UpdateIssueModal'
import { DeleteConfirmModal } from '../components/DeleteConfirmModal'
import * as api from '../services/api'
import type { IIssue, ILabel, GroupBy, FilterState } from '../types'
import { getAvatarColor, getIssueTheme } from '../utils'
import { GenericDropdown } from '../components/GenericDropdown'
import { useToast } from '../context/ToastContext'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import type { DropResult } from '@hello-pangea/dnd'



export const AgileBoard = (): React.ReactElement => {
    const { id: projectId } = useParams<{ id: string }>()
    const { showToast } = useToast()
    const [searchParams, setSearchParams] = useSearchParams()
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
    const [selectedTask, setSelectedTask] = useState<IIssue | null>(null)
    const [issues, setIssues] = useState<IIssue[]>([])
    const [projectLabels, setProjectLabels] = useState<ILabel[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [projectName, setProjectName] = useState('Project')

    // Filtering & Grouping State
    const [searchQuery, setSearchQuery] = useState('')
    const [groupBy, setGroupBy] = useState<GroupBy>('NONE')
    const [isGroupOpen, setIsGroupOpen] = useState(false)
    const [filters, setFilters] = useState<FilterState>({
        types: [], assignees: [], epics: [], labels: [], priorities: [], statuses: []
    })

    const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null)
    const [issueToDelete, setIssueToDelete] = useState<IIssue | null>(null)

    const groupRef = useRef<HTMLDivElement>(null)
    const issueOptionsRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (groupRef.current && !groupRef.current.contains(event.target as Node)) setIsGroupOpen(false);
            if (issueOptionsRef.current && !issueOptionsRef.current.contains(event.target as Node)) setActiveDropdownId(null);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const executeDeleteIssue = async () => {
        if (!issueToDelete) return;
        try {
            await api.deleteIssue(issueToDelete.id.toString());
            showToast("Issue deleted successfully!", "success")
            setIssues(prev => prev.filter(i => i.id !== issueToDelete.id));
            setIssueToDelete(null);
        } catch (error) {
            console.error('Failed to delete issue:', error);
        }
    };

    const loadData = async () => {
        if (!projectId) return;
        setIsLoading(true);
        try {
            const [projectData, issuesData, labelsData] = await Promise.all([
                api.fetchProjectById(projectId),
                api.fetchProjectIssues(projectId),
                api.fetchProjectLabels(projectId)
            ]);
            setProjectName(projectData.name);
            setIssues(issuesData);
            setProjectLabels(labelsData);
        } catch (error) {
            console.error('Failed to load board data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [projectId]);

    const handleTaskClick = (task: IIssue) => {
        setSelectedTask(task);
        setIsUpdateModalOpen(true);
        // Sync URL for potential refresh/share
        setSearchParams({ selectedIssue: task.id.toString() }, { replace: true });
    };

    // Deep linking: Open issue if ID is in URL
    useEffect(() => {
        const selectedId = searchParams.get('selectedIssue');
        if (selectedId && issues.length > 0) {
            const task = issues.find(i => i.id.toString() === selectedId);
            if (task && (!selectedTask || selectedTask.id.toString() !== selectedId)) {
                setSelectedTask(task);
                setIsUpdateModalOpen(true);
            }
        }
    }, [searchParams, issues]);

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        // Remove existing guards and implement reordering
        const sameDroppable = destination.droppableId === source.droppableId;
        
        // Find target group and status
        const parts = destination.droppableId.split('||');
        let targetGroupValue: string | null = null;
        let targetStatus: string;
        if (parts.length > 1) {
            targetGroupValue = parts[0];
            targetStatus = parts[1];
        } else {
            targetStatus = parts[0];
        }

        const targetIssue = issues.find(i => i.id.toString() === draggableId);
        if (!targetIssue) return;

        // Calculate NEW POSITION (Lexorank style)
        // 1. Get issues in destination column
        const destIssues = issues
            .filter(i => i.status === targetStatus)
            .filter(i => {
                if (!targetGroupValue || groupBy === 'NONE') return true;
                if (groupBy === 'ASSIGNEE') return (i.assigneeName || 'Unassigned') === targetGroupValue;
                if (groupBy === 'EPIC') return (i.epicKey || 'No Epic') === targetGroupValue;
                return true;
            })
            // Important: EPICs are filtered out from board view, so they shouldn't affect index calculation
            .filter(i => i.type !== 'EPIC')
            .sort((a, b) => a.position - b.position);

        // If it's the same column, we need to remove the item from its current spot in destIssues to get accurate indices
        if (sameDroppable) {
            const idx = destIssues.findIndex(i => i.id.toString() === draggableId);
            if (idx > -1) destIssues.splice(idx, 1);
        }

        let newPosition: number;
        if (destIssues.length === 0) {
            newPosition = 1000.0;
        } else if (destination.index === 0) {
            newPosition = destIssues[0].position / 2.0;
        } else if (destination.index >= destIssues.length) {
            newPosition = destIssues[destIssues.length - 1].position + 1000.0;
        } else {
            const prev = destIssues[destination.index - 1].position;
            const next = destIssues[destination.index].position;
            newPosition = (prev + next) / 2.0;
        }

        // Optimistic update
        setIssues(prev => {
            const nextIssues = Array.from(prev);
            const issueIndex = nextIssues.findIndex(i => i.id.toString() === draggableId);
            if (issueIndex > -1) {
                const [issue] = nextIssues.splice(issueIndex, 1);
                const updatedIssue = { 
                    ...issue, 
                    status: targetStatus, 
                    position: newPosition 
                };
                
                if (targetGroupValue && groupBy === 'ASSIGNEE') {
                    updatedIssue.assigneeName = targetGroupValue === 'Unassigned' ? '' : targetGroupValue;
                    const someMatched = prev.find(i => i.assigneeName === targetGroupValue && i.assigneeId);
                    if (someMatched) updatedIssue.assigneeId = someMatched.assigneeId;
                } else if (targetGroupValue && groupBy === 'EPIC') {
                    updatedIssue.epicKey = targetGroupValue === 'No Epic' ? '' : targetGroupValue;
                }
                
                nextIssues.push(updatedIssue);
                // Sort the whole list by position to maintain internal consistency
                return nextIssues.sort((a, b) => a.position - b.position);
            }
            return nextIssues;
        });

        try {
            const updatePayload: any = {
                title: targetIssue.title,
                description: targetIssue.description || '',
                type: targetIssue.type,
                status: targetStatus,
                priority: targetIssue.priority,
                assigneeId: targetIssue.assigneeId || null,
                projectId: targetIssue.projectId,
                startDate: targetIssue.startDate || null,
                endDate: targetIssue.endDate || null,
                labels: targetIssue.labels || [],
                parentId: targetIssue.parentId || null,
                epicId: targetIssue.epicId || null,
                position: newPosition, // SEND POSITION
            };

            if (targetGroupValue && groupBy === 'ASSIGNEE') {
                if (targetGroupValue === 'Unassigned') {
                    updatePayload.assigneeId = null;
                } else {
                    const someIssueWithAssignee = issues.find(i => i.assigneeName === targetGroupValue && i.assigneeId);
                    if (someIssueWithAssignee) updatePayload.assigneeId = someIssueWithAssignee.assigneeId;
                }
            } else if (targetGroupValue && groupBy === 'EPIC') {
                if (targetGroupValue === 'No Epic') {
                    updatePayload.epicId = null;
                } else {
                    const someEpic = issues.find(i => i.type === 'EPIC' && i.issueKey === targetGroupValue);
                    if (someEpic) updatePayload.epicId = someEpic.id;
                }
            }

            await api.updateIssue(draggableId, updatePayload);
            // We don't necessarily need to reload data if optimistic update is perfect, 
            // but doing it ensures synchronization (e.g. key updates)
            await loadData();
        } catch (error) {
            console.error('Failed to update issue on drag & drop:', error);
            await loadData(); // Rollback
        }
    };


    const columns = [
        { id: 'todo', title: 'TO DO', status: 'TODO' },
        { id: 'inprogress', title: 'IN PROGRESS', status: 'IN_PROGRESS' },
        { id: 'inreview', title: 'IN REVIEW', status: 'IN_REVIEW' },
        { id: 'done', title: 'DONE', status: 'DONE' },
    ];

    const getIssueIcon = (type: string) => {
        const theme = getIssueTheme(type);
        return { icon: theme.icon, color: theme.color };
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority?.toUpperCase()) {
            case 'HIGH': return { icon: 'keyboard_arrow_up', color: 'text-red-500', title: 'High Priority' };
            case 'MEDIUM': return { icon: 'drag_handle', color: 'text-orange-500', title: 'Medium Priority' };
            case 'LOW': return { icon: 'keyboard_arrow_down', color: 'text-blue-500', title: 'Low Priority' };
            default: return { icon: 'density_medium', color: 'text-slate-400', title: 'Priority: ' + priority };
        }
    };

    const options = useMemo(() => ({
        types: Array.from(new Set(issues.map(i => i.type).filter((t): t is string => !!t))),
        assignees: Array.from(new Set(issues.map(i => i.assigneeName).filter((n): n is string => !!n))),
        epics: Array.from(new Set(issues.map(i => i.epicKey).filter((e): e is string => !!e))),
        labels: Array.from(new Set(issues.flatMap(i => i.labels || []).filter((l): l is string => !!l))),
        priorities: Array.from(new Set(issues.map(i => i.priority).filter((p): p is string => !!p))),
        statuses: columns.map(c => c.status),
    }), [issues, columns]);

    const toggleFilter = (category: keyof FilterState, val: string) => {
        setFilters(prev => {
            const current = prev[category];
            if (current.includes(val)) return { ...prev, [category]: current.filter(v => v !== val) };
            return { ...prev, [category]: [...current, val] };
        });
    };

    const clearFilters = () => {
        setFilters({ types: [], assignees: [], epics: [], labels: [], priorities: [], statuses: [] });
    };

    const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0);

    const filteredIssues = useMemo(() => {
        return issues
            .filter(issue => {
                // Hide EPICs from the board — they are shown as tags on child cards instead
                if (issue.type === 'EPIC') return false
                if (searchQuery && !issue.title.toLowerCase().includes(searchQuery.toLowerCase()) && !issue.issueKey.toLowerCase().includes(searchQuery.toLowerCase())) {
                    return false;
                }
                if (filters.types.length > 0 && !filters.types.includes(issue.type)) return false;
                if (filters.assignees.length > 0 && !(issue.assigneeName && filters.assignees.includes(issue.assigneeName))) return false;
                if (filters.epics.length > 0 && !(issue.epicKey && filters.epics.includes(issue.epicKey))) return false;
                if (filters.priorities.length > 0 && !filters.priorities.includes(issue.priority)) return false;
                if (filters.statuses.length > 0 && !filters.statuses.includes(issue.status)) return false;
                if (filters.labels.length > 0 && (!issue.labels || !issue.labels.some(l => filters.labels.includes(l)))) return false;
                return true;
            })
            .sort((a, b) => (a.position || 0) - (b.position || 0));
    }, [issues, searchQuery, filters]);


    const renderIssueCard = (issue: IIssue, index: number) => {
        const { icon, color } = getIssueIcon(issue.type);
        return (
            <Draggable draggableId={issue.id.toString()} index={index} key={issue.id.toString()}>
                {(provided: any, snapshot: any) => (
                    <div 
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        onClick={() => handleTaskClick(issue)}
                        className={`bg-white p-4 rounded-lg shadow-sm border transition-all cursor-pointer group ${snapshot.isDragging ? 'border-blue-400 shadow-md ring-1 ring-blue-400 opacity-[0.95]' : 'border-slate-200/80 hover:shadow-md hover:border-slate-300'}`}
                        style={{ ...provided.draggableProps.style }}
                    >
                {/* Row 1: Issue ID + Epic Tag + Actions */}
                <div className="flex items-center justify-between mb-1.5 relative">
                    <div className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-[16px] ${color}`}>{icon}</span>
                        <span className="text-[12px] font-bold text-slate-700 tracking-tight">{issue.issueKey}</span>
                        {issue.epicKey && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-wide inline-flex items-center gap-1 text-purple-600 bg-purple-50">
                                {issue.epicKey}
                            </span>
                        )}
                    </div>
                    
                    {/* Three Dot Menu */}
                    <div className="relative" ref={activeDropdownId === issue.id.toString() ? issueOptionsRef : null}>
                        <button 
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            onClick={(e) => { e.stopPropagation(); setActiveDropdownId(activeDropdownId === issue.id.toString() ? null : issue.id.toString()); }}
                        >
                            <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                        </button>
                        
                        {activeDropdownId === issue.id.toString() && (
                            <div className="absolute top-full right-0 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-xl py-1.5 z-50 animate-in fade-in zoom-in duration-150 origin-top-right">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setActiveDropdownId(null); handleTaskClick(issue); }}
                                    className="w-full text-left px-3 py-1.5 text-[13px] text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                    Edit Issue
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setActiveDropdownId(null); setIssueToDelete(issue); }}
                                    className="w-full text-left px-3 py-1.5 text-[13px] text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Row 2: Labels */}
                {issue.labels && issue.labels.length > 0 && (
                    <div className="flex gap-1 flex-wrap mb-2">
                        {issue.labels.map(label => {
                            const labelObj = projectLabels.find(l => l.name === label)
                            const color = labelObj?.color || '#3b82f6'
                            const r = parseInt(color.slice(1,3),16), g = parseInt(color.slice(3,5),16), b = parseInt(color.slice(5,7),16)
                            return (
                                <span
                                    key={label}
                                    className="text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-wide inline-flex items-center gap-1"
                                    style={{
                                        backgroundColor: `rgba(${r},${g},${b},0.1)`,
                                        color: color,
                                    }}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                                    {label}
                                </span>
                            )
                        })}
                    </div>
                )}
                
                {/* Row 3: Title */}
                <h4 className="text-[13px] font-semibold text-slate-800 leading-snug mb-5 group-hover:text-blue-600 transition-colors pr-4">
                    {issue.title}
                </h4>

                
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 text-slate-400">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium">
                            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                            {issue.endDate || 'No date'}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {issue.priority && (
                            <span 
                                className={`material-symbols-outlined text-[18px] ${getPriorityIcon(issue.priority).color}`}
                                title={getPriorityIcon(issue.priority).title}
                            >
                                {getPriorityIcon(issue.priority).icon}
                            </span>
                        )}
                        {issue.assigneeName ? (
                            <div 
                                className="w-6 h-6 rounded-full text-white flex items-center justify-center text-[10px] font-bold shadow-sm border border-black/5"
                                style={{ backgroundColor: issue.assigneeEmail ? getAvatarColor(issue.assigneeEmail) : '#f97316' }}
                                title={issue.assigneeName}
                            >
                                {issue.assigneeName.charAt(0).toUpperCase()}
                            </div>
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-[9px] font-bold shadow-sm border border-black/5" title="Unassigned">
                                ?
                            </div>
                        )}
                    </div>
                </div>
            </div>
            )}
        </Draggable>
        );
    };

    const renderBoardContent = () => {
        if (groupBy === 'NONE') {
            return (
            <div className="flex gap-6 overflow-x-auto pb-4 items-start flex-1 min-h-0">
                {columns.map(col => {
                    const colIssues = filteredIssues.filter(i => i.status === col.status.toUpperCase());
                    return (
                        <Droppable key={col.id} droppableId={col.status}>
                            {(provided: any, snapshot: any) => (
                                <div 
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`flex-none w-[310px] flex flex-col rounded-[10px] p-3 border transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50/50 border-blue-300 ring-2 ring-blue-300 ring-inset' : 'bg-[#f1f5f9] border-slate-100'}`}
                                >
                                    <div className="flex justify-between items-center mb-4 px-1 mt-1 pb-2 border-b border-slate-200/50">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-[11px] text-slate-500 tracking-widest uppercase">{col.title}</h3>
                                            <span className="bg-slate-200/80 text-slate-400 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">{colIssues.length}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-3 min-h-[50px]">
                                        {colIssues.map((issue, index) => renderIssueCard(issue, index))}
                                        {provided.placeholder}
                                    </div>
                                </div>
                            )}
                        </Droppable>
                    );
                })}
            </div>
            );
        }

        // Handle Grouping
        let groups: string[] = [];
        if (groupBy === 'ASSIGNEE') {
            const assignees = new Set(filteredIssues.map(i => i.assigneeName || 'Unassigned'));
            groups = Array.from(assignees).sort((a, b) => a === 'Unassigned' ? 1 : b === 'Unassigned' ? -1 : a.localeCompare(b));
        } else if (groupBy === 'EPIC') {
            const epics = new Set(filteredIssues.map(i => i.epicKey || 'No Epic'));
            groups = Array.from(epics).sort((a, b) => a === 'No Epic' ? 1 : b === 'No Epic' ? -1 : a.localeCompare(b));
        }

        return (
            <div className="flex flex-col gap-6 overflow-y-auto overflow-x-auto pb-8 flex-1 min-h-0 custom-scrollbar pr-4">
                {groups.map(groupName => {
                    const groupIssues = filteredIssues.filter(i => {
                        if (groupBy === 'ASSIGNEE') return (i.assigneeName || 'Unassigned') === groupName;
                        return (i.epicKey || 'No Epic') === groupName;
                    });
                    
                    if (groupIssues.length === 0) return null;

                    // Extract avatar color logic for assignee grouping visual
                    const sampleIssue = groupIssues[0];
                    const avatarColor = groupBy === 'ASSIGNEE' && groupName !== 'Unassigned' && sampleIssue.assigneeEmail 
                        ? getAvatarColor(sampleIssue.assigneeEmail) 
                        : '#94a3b8';

                    return (
                        <div key={groupName} className="flex flex-col bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex-none">
                            <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
                                {groupBy === 'ASSIGNEE' ? (
                                    <div className="flex items-center gap-3">
                                        <div 
                                            className="w-7 h-7 rounded-full text-white flex items-center justify-center text-[11px] font-bold shadow-sm"
                                            style={{ backgroundColor: avatarColor }}
                                        >
                                            {groupName === 'Unassigned' ? '?' : groupName.charAt(0).toUpperCase()}
                                        </div>
                                        <h3 className="font-bold text-[14px] text-slate-800">{groupName}</h3>
                                        <span className="text-[12px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">{groupIssues.length} issues</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-slate-700">
                                        <span className="material-symbols-outlined text-[20px] text-purple-600">electric_bolt</span>
                                        <h3 className="font-bold text-[14px] text-slate-800">{groupName}</h3>
                                        <span className="text-[12px] font-medium text-slate-500 ml-2 bg-white px-2 py-0.5 rounded-full border border-slate-200">{groupIssues.length} issues</span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex gap-4 p-4 overflow-x-auto min-w-min">
                                {columns.map(col => {
                                    const colIssues = groupIssues.filter(i => i.status === col.status.toUpperCase());
                                    const dragId = `${groupName}||${col.status}`;
                                    return (
                                        <Droppable key={dragId} droppableId={dragId}>
                                            {(provided: any, snapshot: any) => (
                                                <div 
                                                    ref={provided.innerRef}
                                                    {...provided.droppableProps}
                                                    className={`flex-none w-[310px] flex flex-col rounded-lg p-3 border transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-300 ring-inset' : 'bg-[#f8fafc] border-slate-200/50'}`}
                                                >
                                                    <div className="flex justify-between items-center mb-3 px-1 pb-2 border-b border-slate-200/50">
                                                        <h3 className="font-bold text-[10px] text-slate-500 tracking-widest uppercase">{col.title}</h3>
                                                        <span className="text-slate-400 text-[10px] font-bold">{colIssues.length}</span>
                                                    </div>
                                                    <div className="flex flex-col gap-3 min-h-[10px]">
                                                        {colIssues.map((issue, index) => renderIssueCard(issue, index))}
                                                        {provided.placeholder}
                                                    </div>
                                                </div>
                                            )}
                                        </Droppable>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <Layout projectContextName={projectName}>
            <div className="p-8 h-full flex flex-col pt-6 font-inter overflow-hidden">
                <div className="mb-6 flex-none">
                    <div className="text-[10px] font-bold text-slate-400 tracking-widest mb-1.5 uppercase">PROJECTS / {projectName}</div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{projectName}</h1>
                </div>

                <div className="flex justify-between items-start mb-6 flex-none">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 flex-wrap">
                            {/* Search Bar */}
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">search</span>
                                <input 
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search tasks..." 
                                    className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 shadow-sm rounded-md text-[13px] w-[260px] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400 font-medium transition-all"
                                />
                            </div>
                            
                            <div className="w-px h-6 bg-slate-200 mx-1"></div>

                            {/* Group By Dropdown */}
                            <div className="relative" ref={groupRef}>
                                <button
                                    onClick={() => setIsGroupOpen(!isGroupOpen)}
                                    className={`flex items-center gap-2 px-3 py-1 bg-white border rounded-md text-[13px] font-medium transition-colors shadow-sm ${
                                        groupBy !== 'NONE' 
                                        ? 'border-blue-400 text-blue-700' 
                                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[16px] text-slate-400">view_agenda</span>
                                    {groupBy === 'NONE' ? 'Group' : groupBy === 'ASSIGNEE' ? 'Group: Assignee' : 'Group: Epic'}
                                </button>
                                {isGroupOpen && (
                                    <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-20">
                                        {(['NONE', 'ASSIGNEE', 'EPIC'] as GroupBy[]).map(g => (
                                            <button
                                                key={g}
                                                onClick={() => { setGroupBy(g); setIsGroupOpen(false); }}
                                                className={`w-full text-left px-3 py-1.5 text-[13px] hover:bg-slate-50 ${groupBy === g ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700'}`}
                                            >
                                                {g === 'NONE' ? 'None' : g === 'ASSIGNEE' ? 'Assignee' : 'Epic'}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <GenericDropdown label="Parent" options={options.epics} selected={filters.epics} onToggle={(v) => toggleFilter('epics', v)} />
                            <GenericDropdown label="Assignee" options={options.assignees} selected={filters.assignees} onToggle={(v) => toggleFilter('assignees', v)} />
                            <GenericDropdown label="Issue Type" options={options.types} selected={filters.types} onToggle={(v) => toggleFilter('types', v)} />
                            <GenericDropdown label="Label" options={options.labels} selected={filters.labels} onToggle={(v) => toggleFilter('labels', v)} />
                            <GenericDropdown label="Status" options={options.statuses} selected={filters.statuses} onToggle={(v) => toggleFilter('statuses', v)} />
                            <GenericDropdown label="Priority" options={options.priorities} selected={filters.priorities} onToggle={(v) => toggleFilter('priorities', v)} />

                            {hasActiveFilters && (
                                <button onClick={clearFilters} className="text-[12px] text-slate-500 hover:text-blue-600 font-medium ml-2">Clear</button>
                            )}
                        </div>
                    </div>

                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-1.5 bg-[#1A202C] text-white rounded-md text-[13px] font-bold shadow-sm hover:bg-slate-800 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Create Issue
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center min-h-0">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <DragDropContext onDragEnd={onDragEnd}>
                        {renderBoardContent()}
                    </DragDropContext>
                )}
            </div>

            <CreateIssueModal 
                isOpen={isCreateModalOpen} 
                onClose={() => {
                    setIsCreateModalOpen(false);
                    loadData();
                }} 
                projectId={projectId || ''}
            />

            <UpdateIssueModal
                isOpen={isUpdateModalOpen}
                onClose={() => {
                    setIsUpdateModalOpen(false);
                    loadData();
                }}
                task={selectedTask}
                projectId={projectId || ''}
                onNavigate={(issueId) => {
                    const issue = (issues as IIssue[]).find(i => i.id.toString() === issueId.toString());
                    if (issue) setSelectedTask(issue);
                }}
            />

            <DeleteConfirmModal 
                isOpen={!!issueToDelete}
                onClose={() => setIssueToDelete(null)}
                onConfirm={executeDeleteIssue}
                itemName={issueToDelete?.issueKey}
                itemType="Issue"
            />
        </Layout>
    );
};
