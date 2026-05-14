import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { CreateIssueModal } from '../components/CreateIssueModal'
import { UpdateIssueModal } from '../components/UpdateIssueModal'
import { DeleteConfirmModal } from '../components/DeleteConfirmModal'
import * as api from '../services/api'
import type { IIssue, GroupBy, FilterState, IProject, IProjectMember, ILabel } from '../types'

import { getAvatarColor } from '../utils'
import { GenericDropdown } from '../components/GenericDropdown'
import { Calendar } from '../components/Calendar'

export const Backlog = (): React.ReactElement => {
    const { id: projectId } = useParams<{ id: string }>()
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
    const [selectedTask, setSelectedTask] = useState<IIssue | null>(null)
    const [issueToDelete, setIssueToDelete] = useState<IIssue | null>(null)
    const version = "2.1.0-RC"

    const [issues, setIssues] = useState<IIssue[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [projectName, setProjectName] = useState('Project')

    // Filtering & Grouping State
    const [searchQuery, setSearchQuery] = useState('')
    const [groupBy, setGroupBy] = useState<GroupBy>('NONE')

    const [isGroupOpen, setIsGroupOpen] = useState(false)
    const [filters, setFilters] = useState<FilterState>({
        types: [], assignees: [], epics: [], labels: [], priorities: [], statuses: []
    })
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
    const [expandedTrees, setExpandedTrees] = useState<Set<string>>(new Set())

    // Resizable Columns State
    const [colWidths, setColWidths] = useState({
        key: 210,
        title: 320,
        dueDate: 140,
        labels: 180,
        status: 140,
        priority: 75,
        assignee: 75
    })


    const [editingField, setEditingField] = useState<{ id: string, field: string } | null>(null)
    const [draftValue, setDraftValue] = useState<any>(null)
    const [project, setProject] = useState<IProject | null>(null)
    const [projectLabels, setProjectLabels] = useState<ILabel[]>([])

    // Drag-and-drop state
    const [draggedIssueId, setDraggedIssueId] = useState<string | null>(null)
    const [dropTargetId, setDropTargetId] = useState<string | null>(null)



    const isResizing = useRef<string | null>(null)
    const startX = useRef<number>(0)
    const startWidth = useRef<number>(0)



    const groupRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (groupRef.current && !groupRef.current.contains(event.target as Node)) setIsGroupOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadData = async () => {
        if (!projectId) return;
        setIsLoading(true);
        try {
            const [projectData, issuesData] = await Promise.all([
                api.fetchProjectById(projectId),
                api.fetchProjectIssues(projectId)
            ]);
            setProjectName(projectData.name);
            setProject(projectData);
            setIssues(issuesData);
            // Fetch project labels for colored rendering
            try {
                const labelsData = await api.fetchProjectLabels(projectId);
                setProjectLabels(labelsData);
            } catch (e) {
                // Labels fetch is non-critical
            }
        } catch (error) {
            console.error('Failed to load board data:', error);
        } finally {
            setIsLoading(false);
        }
    };


    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Prevent closing if we are clicking inside the active inline editor popup/container
            // Inline editors are marked with z-[100] or other specific classes
            if (
                target.closest('[data-active-editor="true"]') ||
                target.closest('.z-\\[100\\]') ||
                target.tagName === 'INPUT' ||
                target.tagName === 'SELECT' ||
                target.tagName === 'TEXTAREA'
            ) {
                return;
            }

            setEditingField(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    useEffect(() => {
        loadData();
    }, [projectId]);


    const toggleGroup = (groupName: string) => {
        setCollapsedGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupName)) next.delete(groupName);
            else next.add(groupName);
            return next;
        });
    };

    const toggleTree = (treeId: string) => {
        setExpandedTrees(prev => {
            const next = new Set(prev);
            if (next.has(treeId)) next.delete(treeId);
            else next.add(treeId);
            return next;
        });
    };

    // Resize Logic
    const handleResizeStart = (e: React.MouseEvent, col: string) => {
        e.preventDefault();
        isResizing.current = col;
        startX.current = e.clientX;
        startWidth.current = colWidths[col as keyof typeof colWidths];

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!isResizing.current) return;
            const deltaX = moveEvent.clientX - startX.current;
            const newWidth = Math.max(40, startWidth.current + deltaX);
            setColWidths(prev => ({ ...prev, [isResizing.current!]: newWidth }));
        };

        const handleMouseUp = () => {
            isResizing.current = null;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const gridTemplate = `32px 32px ${colWidths.key}px minmax(${colWidths.title}px, 1fr) ${colWidths.dueDate}px ${colWidths.labels}px ${colWidths.status}px ${colWidths.priority}px ${colWidths.assignee}px`;

    const statusOptions = [
        { value: 'TODO', label: 'TO DO', class: 'px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] uppercase tracking-wider font-bold' },
        { value: 'IN_PROGRESS', label: 'IN PROGRESS', class: 'px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] uppercase tracking-wider font-bold' },
        { value: 'IN_REVIEW', label: 'IN REVIEW', class: 'px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-[10px] uppercase tracking-wider font-bold' },
        { value: 'DONE', label: 'DONE', class: 'px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] uppercase tracking-wider font-bold' },
    ];



    const priorityOptions = [
        { value: 'HIGH', label: 'High', icon: 'keyboard_arrow_up', color: 'text-red-500' },
        { value: 'MEDIUM', label: 'Medium', icon: 'drag_handle', color: 'text-orange-500' },
        { value: 'LOW', label: 'Low', icon: 'keyboard_arrow_down', color: 'text-blue-500' },
    ];







    const startEditing = (issueId: string, field: string, initialValue: any) => {
        setEditingField({ id: issueId, field });
        setDraftValue(initialValue);
    };

    const handleTaskClick = (task: IIssue) => {
        setEditingField(null);
        setSelectedTask(task);
        setIsUpdateModalOpen(true);
    };

    const handleUpdateIssue = async (updatedIssue: IIssue) => {
        try {
            await api.updateIssue(updatedIssue.id, updatedIssue);
            setIssues(issues.map(i => i.id === updatedIssue.id ? updatedIssue : i));
        } catch (error) {
            console.error('Error updating issue:', error);
        }
    };

    const handleDeleteIssue = async () => {
        if (!issueToDelete) return;
        try {
            await api.deleteIssue(issueToDelete.id.toString());
            setIssues(issues.filter(i => i.id !== issueToDelete.id));
            setIssueToDelete(null);
            await loadData();
        } catch (error) {
            console.error('Failed to delete issue:', error);
        }
    };

    const handleFieldEdit = async (issueId: string, field: keyof IIssue, value: any) => {
        const issue = issues.find(i => i.id === issueId);
        if (!issue) return;

        try {
            const updatedIssue = { ...issue, [field]: value };

            if (field === 'assigneeId') {
                const allMembers = project ? [...(project.leads || []), ...(project.members || [])] : [];
                const member = allMembers.find(m => m.id.toString() === value?.toString());
                if (member) {
                    updatedIssue.assigneeName = `${member.firstName} ${member.lastName}`;
                    updatedIssue.assigneeEmail = member.email;
                    updatedIssue.assigneeId = member.id;
                } else if (!value || value === 'unassigned' || value === null) {
                    updatedIssue.assigneeName = undefined;
                    updatedIssue.assigneeEmail = undefined;
                    updatedIssue.assigneeId = undefined;
                }
            }


            await handleUpdateIssue(updatedIssue);
        } catch (error) {
            console.error('Failed to edit field:', error);
        } finally {
            setEditingField(null);
        }
    };


    const getPriorityIcon = (priority: string) => {

        switch (priority?.toUpperCase()) {
            case 'HIGH': return { icon: 'keyboard_arrow_up', color: 'text-red-500', title: 'High Priority' };
            case 'MEDIUM': return { icon: 'drag_handle', color: 'text-orange-500', title: 'Medium Priority' };
            case 'LOW': return { icon: 'keyboard_arrow_down', color: 'text-blue-500', title: 'Low Priority' };
            default: return { icon: 'density_medium', color: 'text-slate-400', title: 'Priority: ' + priority };
        }
    };

    const getIssueIcon = (type: string) => {
        switch (type) {
            case 'BUG': return { icon: 'bug_report', color: 'text-red-500' };
            case 'STORY': return { icon: 'bookmark', color: 'text-green-500' };
            case 'EPIC': return { icon: 'electric_bolt', color: 'text-purple-500' };
            default: return { icon: 'check_box', color: 'text-blue-500' };
        }
    };

    const options = useMemo(() => ({
        types: Array.from(new Set(issues.map(i => i.type).filter((t): t is string => !!t))),
        assignees: Array.from(new Set(issues.map(i => i.assigneeName).filter((n): n is string => !!n))),
        epics: Array.from(new Set(issues.map(i => i.epicKey).filter((e): e is string => !!e))),
        labels: Array.from(new Set(issues.flatMap(i => i.labels || []).filter((l): l is string => !!l))),
        priorities: Array.from(new Set(issues.map(i => i.priority).filter((p): p is string => !!p))),
        statuses: Array.from(new Set(issues.map(i => i.status).filter((s): s is string => !!s))),
    }), [issues]);

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
        return issues.filter(issue => {
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
        });
    }, [issues, searchQuery, filters]);

    // Drag-and-drop handlers
    const handleDragEnd = () => {
        setDraggedIssueId(null)
        setDropTargetId(null)
    }

    const handleDrop = async (e: React.DragEvent, targetIssue: IIssue) => {
        e.preventDefault()
        e.stopPropagation()
        const draggedId = e.dataTransfer.getData('text/plain')
        if (!draggedId || draggedId === targetIssue.id.toString()) {
            handleDragEnd()
            return
        }

        const draggedIssue = issues.find(i => i.id.toString() === draggedId)
        if (!draggedIssue) { handleDragEnd(); return }

        // --- VALIDATION RULES ---

        // 1. Epics are top-level and cannot be moved inside other issues.
        if (draggedIssue.type === 'EPIC') {
            alert("Epics cannot be nested inside other issues.");
            handleDragEnd();
            return;
        }

        // 2. Prevent cyclic nesting (dropping a parent onto its own descendant)
        const isDescendant = (childId: string, parentId: string): boolean => {
            let current = issues.find(i => i.id === childId)
            let depthCounter = 0;
            while (current && depthCounter < 20) {
                if (current.parentId === parentId || current.epicId === parentId) return true;
                const nextParentId = current.parentId || current.epicId;
                if (!nextParentId) break;
                current = issues.find(i => i.id === nextParentId);
                depthCounter++;
            }
            return false;
        }

        if (isDescendant(targetIssue.id, draggedIssue.id)) {
            alert("Cannot drop an issue into its own descendant.");
            handleDragEnd();
            return;
        }

        // 3. Restrict deep nesting per user validation rules
        const draggedHasChildren = issues.some(i => i.parentId === draggedIssue.id || i.epicId === draggedIssue.id);
        const targetIsChild = targetIssue.parentId != null || targetIssue.epicId != null;

        if (draggedHasChildren && targetIsChild) {
            alert("Cannot place an issue that has children inside a child issue.");
            handleDragEnd();
            return;
        }

        try {
            // Build proper IssueRequest DTO payload (only fields the backend accepts)
            const updatePayload: any = {
                title: draggedIssue.title,
                description: draggedIssue.description || '',
                type: draggedIssue.type,
                status: draggedIssue.status,
                priority: draggedIssue.priority,
                assigneeId: draggedIssue.assigneeId || null,
                projectId: draggedIssue.projectId,
                startDate: draggedIssue.startDate || null,
                endDate: draggedIssue.endDate || null,
                labels: draggedIssue.labels || [],
            }

            if (targetIssue.type === 'EPIC') {
                updatePayload.epicId = targetIssue.id
                updatePayload.parentId = null
            } else {
                updatePayload.parentId = targetIssue.id
                updatePayload.epicId = null
            }

            await api.updateIssue(draggedIssue.id.toString(), updatePayload)
            await loadData()
        } catch (error) {
            console.error('Failed to reassign issue hierarchy:', error)
        } finally {
            handleDragEnd()
        }
    }

    const renderIssueRow = (issue: IIssue, depth: number = 0, hasChildren: boolean = false) => {
        const { icon, color } = getIssueIcon(issue.type);
        const isDragging = draggedIssueId === issue.id.toString()
        const isDropTarget = dropTargetId === issue.id.toString()
        const isExpanded = expandedTrees.has(issue.id.toString())
        const isChild = depth > 0
        return (
            <div
                key={issue.id}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (draggedIssueId && draggedIssueId !== issue.id.toString()) { setDropTargetId(issue.id.toString()); e.dataTransfer.dropEffect = 'move' } }}
                onDragLeave={(e) => { e.preventDefault(); setDropTargetId(null) }}
                onDrop={(e) => handleDrop(e, issue)}
                onClick={() => handleTaskClick(issue)}
                className={`group grid items-center gap-0 px-0 py-0 border-b border-slate-100 last:border-b-0 last:rounded-b-xl hover:bg-slate-100 transition-all cursor-pointer w-full min-w-max relative ${isChild ? 'bg-slate-50' : 'bg-white'} ${editingField?.id === issue.id && !isUpdateModalOpen ? 'z-[100]' : 'z-0 hover:z-10'} ${isDragging ? 'opacity-40 scale-[0.98]' : ''} ${isDropTarget ? 'ring-2 ring-blue-400 ring-inset bg-blue-50/40' : ''}`}
                style={{ gridTemplateColumns: gridTemplate }}
            >
                {/* Combined Issue Key Column (Col-span-3) */}
                <div className="col-span-3 h-10 flex items-center pr-3 border-r border-slate-100 min-w-0">

                    {/* Drag Handle & Actions Menu */}
                    <div className="w-8 h-10 shrink-0 flex items-center justify-center relative">
                        <div
                            draggable
                            onDragStart={(e) => { e.stopPropagation(); setDraggedIssueId(issue.id.toString()); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', issue.id.toString()) }}
                            onDragEnd={() => { setDraggedIssueId(null); setDropTargetId(null) }}
                            className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-slate-200 transition-colors rounded"
                            onClick={(e) => { e.stopPropagation(); startEditing(issue.id.toString(), 'actions', null) }}
                        >
                            <span className="material-symbols-outlined text-[18px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">drag_indicator</span>
                        </div>
                        {editingField?.id === issue.id.toString() && editingField.field === 'actions' && (
                            <div
                                className="absolute left-6 top-6 bg-white border border-slate-200 rounded-lg shadow-xl z-[100] w-32 py-1 transform animate-in fade-in zoom-in duration-100"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={(e) => { e.stopPropagation(); setEditingField(null); handleTaskClick(issue); }}
                                    className="w-full text-left px-3 py-2 text-[12px] font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[16px]">edit</span> Update
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setEditingField(null); setIssueToDelete(issue); }}
                                    className="w-full text-left px-3 py-2 text-[12px] font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[16px]">delete</span> Delete
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-1 items-center min-w-0" style={{ paddingLeft: `${depth * 28}px` }}>

                        {/* Type Icon */}
                        <div className="w-8 h-10 shrink-0 flex items-center justify-center">
                            <span className={`material-symbols-outlined text-[18px] ${color}`}>{icon}</span>
                        </div>

                        {/* Issue Key */}
                        <div className="flex-1 flex items-center min-w-0 ml-1">
                            {hasChildren && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleTree(issue.id.toString()) }}
                                    className="mr-1 flex items-center justify-center w-5 h-5 rounded hover:bg-slate-200 transition-colors shrink-0"
                                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                                >
                                    <span className={`material-symbols-outlined text-[16px] text-slate-400 transition-transform duration-150 ${!isExpanded ? '-rotate-90' : ''}`}>expand_more</span>
                                </button>
                            )}
                            <span className="text-[12px] font-bold text-slate-500 truncate">{issue.issueKey}</span>
                        </div>
                    </div>
                </div>

                {/* Title */}
                <div
                    className="flex items-center gap-3 min-w-0 pl-6 pr-3 h-10 border-r border-slate-100 overflow-hidden relative cursor-text group/edit"
                    onClick={(e) => { e.stopPropagation(); startEditing(issue.id, 'title', issue.title); }}
                >
                    {editingField?.id === issue.id && editingField.field === 'title' ? (
                        <input
                            autoFocus
                            data-active-editor="true"
                            value={draftValue ?? ''}
                            onChange={(e) => setDraftValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleFieldEdit(issue.id, 'title', draftValue);
                                    setEditingField(null);
                                }
                                if (e.key === 'Escape') setEditingField(null);
                            }}
                            maxLength={50}
                            className="absolute inset-0 px-3 bg-white border-2 border-blue-500 z-20 outline-none text-[13px] font-semibold"
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span className="text-[13px] font-semibold text-slate-700 truncate group-hover/edit:text-blue-600 transition-colors">
                            {issue.title}
                        </span>
                    )}
                </div>

                {/* Due Date */}
                <div
                    className="flex items-center gap-1.5 text-slate-500 px-3 h-10 border-r border-slate-100 cursor-pointer relative hover:bg-slate-50/50 transition-colors group/edit"
                    onClick={(e) => { e.stopPropagation(); startEditing(issue.id, 'dueDate', issue.endDate); }}
                >
                    <>
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                        <span className="text-[11px] font-medium truncate">
                            {issue.endDate ? new Date(issue.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '-'}
                        </span>
                    </>
                    {editingField?.id === issue.id && editingField.field === 'dueDate' && (
                        <div
                            className="absolute left-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-[100] min-w-[260px] transform animate-in fade-in zoom-in duration-150 origin-top"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Calendar
                                value={draftValue}
                                onChange={(d) => setDraftValue(d)}
                                onSave={() => { handleFieldEdit(issue.id, 'endDate', draftValue); setEditingField(null); }}
                            />
                        </div>
                    )}

                </div>

                {/* Labels Column */}
                <div className="flex items-center gap-1 px-2 h-10 border-r border-slate-100 overflow-hidden">
                    {issue.labels?.slice(0, 2).map(label => {
                        const labelObj = projectLabels.find(l => l.name === label)
                        const labelColor = labelObj?.color || '#3b82f6'
                        const r = parseInt(labelColor.slice(1, 3), 16), g = parseInt(labelColor.slice(3, 5), 16), b = parseInt(labelColor.slice(5, 7), 16)
                        return (
                            <span
                                key={label}
                                className="text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-wide inline-flex items-center gap-1 shrink-0"
                                style={{
                                    backgroundColor: `rgba(${r},${g},${b},0.1)`,
                                    color: labelColor,
                                }}
                            >
                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: labelColor }} />
                                {label}
                            </span>
                        )
                    })}
                    {issue.labels && issue.labels.length > 2 && <span className="text-[9px] text-slate-400 shrink-0">+{issue.labels.length - 2}</span>}
                </div>

                <div
                    className="flex items-center px-3 h-10 border-r border-slate-100 cursor-pointer relative hover:bg-slate-50/50 transition-colors group/edit"
                    onClick={(e) => { e.stopPropagation(); startEditing(issue.id, 'status', issue.status); }}
                >

                    <span className={statusOptions.find(o => o.value === issue.status)?.class || statusOptions[0].class}>
                        {issue.status.replace('_', ' ')}
                    </span>
                    {editingField?.id === issue.id && editingField.field === 'status' && (
                        <div
                            className="absolute left-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-[100] py-1 min-w-[160px] transform animate-in fade-in zoom-in duration-100"
                            onClick={(e) => e.stopPropagation()}
                            data-active-editor="true"
                        >


                            {statusOptions.map(opt => (
                                <div
                                    key={opt.value}
                                    onClick={(e) => { e.stopPropagation(); handleFieldEdit(issue.id, 'status', opt.value); }}
                                    className={`flex items-center px-4 py-2.5 hover:bg-slate-50 transition-colors cursor-pointer group ${issue.status === opt.value ? 'bg-slate-50' : ''}`}
                                >
                                    <span className={opt.class}>
                                        {opt.label}
                                    </span>
                                    {issue.status === opt.value && <span className="material-symbols-outlined text-[16px] text-blue-600 ml-auto font-bold px-1">check</span>}
                                </div>
                            ))}

                        </div>
                    )}

                </div>

                <div
                    className="flex items-center justify-center h-10 border-r border-slate-100 cursor-pointer relative hover:bg-slate-50/50 transition-colors group/edit"
                    onClick={(e) => { e.stopPropagation(); startEditing(issue.id, 'priority', issue.priority); }}
                >

                    <span
                        className={`material-symbols-outlined text-[18px] ${getPriorityIcon(issue.priority).color}`}
                        title={getPriorityIcon(issue.priority).title}
                    >
                        {getPriorityIcon(issue.priority).icon}
                    </span>
                    {editingField?.id === issue.id && editingField.field === 'priority' && (
                        <div
                            className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-[100] py-1 min-w-[140px] transform animate-in fade-in zoom-in duration-100"
                            onClick={(e) => e.stopPropagation()}
                            data-active-editor="true"
                        >
                            {priorityOptions.map(opt => (
                                <div
                                    key={opt.value}
                                    onClick={(e) => { e.stopPropagation(); handleFieldEdit(issue.id, 'priority', opt.value); }}
                                    className={`flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 transition-colors cursor-pointer ${issue.priority === opt.value ? 'bg-slate-50' : ''}`}
                                >
                                    <span className={`material-symbols-outlined text-[18px] ${opt.color}`}>
                                        {opt.icon}
                                    </span>
                                    <span className={`text-[11px] font-bold text-slate-700`}>
                                        {opt.label}
                                    </span>
                                    {issue.priority === opt.value && <span className="material-symbols-outlined text-[16px] text-blue-600 ml-auto font-bold">check</span>}
                                </div>
                            ))}
                        </div>
                    )}

                </div>


                <div
                    className="flex items-center justify-center h-10 cursor-pointer relative hover:bg-slate-50/50 transition-colors group/edit"
                    onClick={(e) => { e.stopPropagation(); startEditing(issue.id, 'assignee', issue.assigneeId); }}
                >

                    {issue.assigneeName ? (
                        <div
                            className="w-6 h-6 rounded-full text-white flex items-center justify-center text-[10px] font-bold shadow-sm border border-black/5"
                            style={{ backgroundColor: issue.assigneeEmail ? getAvatarColor(issue.assigneeEmail) : '#f97316' }}
                            title={issue.assigneeName}
                        >
                            {issue.assigneeName.charAt(0).toUpperCase()}
                        </div>
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-bold shadow-sm border border-black/5" title="Unassigned">
                            ?
                        </div>
                    )}
                    {editingField?.id === issue.id && editingField.field === 'assignee' && (
                        <div
                            className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-[100] w-[220px] transform animate-in fade-in zoom-in duration-100 flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >

                            <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500">Assign To</div>
                            <div className="max-h-56 overflow-y-auto px-1 py-1 custom-scrollbar" data-active-editor="true">
                                <div
                                    onClick={() => handleFieldEdit(issue.id, 'assigneeId', null)}
                                    className="px-2 py-2 text-[12px] hover:bg-slate-50 cursor-pointer flex items-center gap-2 border-b border-slate-50 text-slate-600 font-medium"
                                >
                                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
                                        <span className="material-symbols-outlined text-[14px]">person_off</span>
                                    </div>
                                    Unassigned
                                </div>
                                {(!project || (!project.members?.length && !project.leads?.length)) && (
                                    <div className="px-3 py-4 text-center text-slate-400 text-[11px]">No members found</div>
                                )}
                                {[...(project?.leads || []), ...(project?.members || [])].map((member: IProjectMember) => (


                                    <div
                                        key={member.id}
                                        onClick={() => handleFieldEdit(issue.id, 'assigneeId', member.id)}
                                        className="px-2 py-2 text-[12px] hover:bg-white hover:shadow-sm hover:ring-1 hover:ring-slate-200/60 rounded cursor-pointer flex items-center gap-2 transition-all mt-0.5"
                                    >
                                        <div
                                            className="w-5 h-5 rounded-full text-white flex items-center justify-center text-[9px] font-bold shadow-sm"
                                            style={{ backgroundColor: getAvatarColor(member.email) }}
                                        >
                                            {member.firstName.charAt(0)}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-slate-700 font-semibold truncate leading-tight">{member.firstName} {member.lastName}</span>
                                            <span className="text-slate-400 text-[10px] truncate leading-tight">{member.email}</span>
                                        </div>
                                        {issue.assigneeId?.toString() === member.id.toString() && (
                                            <span className="material-symbols-outlined text-[16px] text-blue-600 ml-auto font-bold">check</span>
                                        )}

                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderTableHeader = () => (
        <div className="bg-slate-50/50 h-10 border-b border-slate-200 grid gap-0 items-center text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none w-full min-w-max rounded-t-xl" style={{ gridTemplateColumns: gridTemplate }}>
            <div className="col-span-3 h-full flex items-center px-3 border-r border-slate-200/60 relative">
                <span className="ml-8">Issue</span>
                <div onMouseDown={(e) => handleResizeStart(e, 'key')} className="absolute -right-2 top-0 bottom-0 w-4 cursor-col-resize hover:border-r-2 hover:border-blue-400 z-10 transition-colors" title="Resize Issue Column" />
            </div>
            <div className="relative group/resize h-full flex items-center px-3 border-r border-slate-200/60">
                <span>Title</span>
                <div onMouseDown={(e) => handleResizeStart(e, 'title')} className="absolute -right-2 top-0 bottom-0 w-4 cursor-col-resize hover:border-r-2 hover:border-blue-400 z-10 transition-colors" title="Resize Title Column" />
            </div>
            <div className="relative group/resize h-full flex items-center px-3 border-r border-slate-200/60 leading-none">
                <span>Due Date</span>
                <div onMouseDown={(e) => handleResizeStart(e, 'dueDate')} className="absolute -right-2 top-0 bottom-0 w-4 cursor-col-resize hover:border-r-2 hover:border-blue-400 z-10 transition-colors" title="Resize Due Date Column" />
            </div>
            <div className="relative group/resize h-full flex items-center px-3 border-r border-slate-200/60">
                <span>Labels</span>
                <div onMouseDown={(e) => handleResizeStart(e, 'labels')} className="absolute -right-2 top-0 bottom-0 w-4 cursor-col-resize hover:border-r-2 hover:border-blue-400 z-10 transition-colors" title="Resize Labels Column" />
            </div>
            <div className="relative group/resize h-full flex items-center px-3 border-r border-slate-200/60">
                <span>Status</span>
                <div onMouseDown={(e) => handleResizeStart(e, 'status')} className="absolute -right-2 top-0 bottom-0 w-4 cursor-col-resize hover:border-r-2 hover:border-blue-400 z-10 transition-colors" title="Resize Status Column" />
            </div>
            <div className="relative group/resize h-full flex items-center justify-center border-r border-slate-200/60">
                <span>Pri</span>
                <div onMouseDown={(e) => handleResizeStart(e, 'priority')} className="absolute -right-2 top-0 bottom-0 w-4 cursor-col-resize hover:border-r-2 hover:border-blue-400 z-10 transition-colors" title="Resize Priority Column" />
            </div>
            <div className="relative group/resize h-full flex items-center justify-center">
                <span>User</span>
                <div onMouseDown={(e) => handleResizeStart(e, 'assignee')} className="absolute -right-2 top-0 bottom-0 w-4 cursor-col-resize hover:border-r-2 hover:border-blue-400 z-10 transition-colors" title="Resize Assignee Column" />
            </div>
        </div>
    )

    // Build hierarchy: creates flat list with depth for tree rendering
    const buildHierarchy = (issueList: IIssue[]): { issue: IIssue, depth: number, hasChildren: boolean }[] => {
        const issueMap = new Map<string, IIssue>()
        issueList.forEach(i => issueMap.set(i.id.toString(), i))

        // Build children map
        const childrenMap = new Map<string, IIssue[]>()
        const roots: IIssue[] = []

        issueList.forEach(issue => {
            const parentRef = issue.parentId || issue.epicId
            if (parentRef && issueMap.has(parentRef.toString())) {
                const key = parentRef.toString()
                if (!childrenMap.has(key)) childrenMap.set(key, [])
                childrenMap.get(key)!.push(issue)
            } else {
                roots.push(issue)
            }
        })

        const result: { issue: IIssue, depth: number, hasChildren: boolean }[] = []
        const addWithChildren = (issue: IIssue, depth: number) => {
            const kids = childrenMap.get(issue.id.toString()) || []
            const hasKids = kids.length > 0
            result.push({ issue, depth, hasChildren: hasKids })
            // Only add children if expanded
            if (hasKids && expandedTrees.has(issue.id.toString())) {
                kids.forEach(child => addWithChildren(child, depth + 1))
            }
        }
        roots.forEach(root => addWithChildren(root, 0))
        return result
    }

    const renderBacklogContent = () => {
        if (groupBy === 'NONE') {
            const hierarchyRows = buildHierarchy(filteredIssues)
            return (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-8 overflow-x-auto">
                    {renderTableHeader()}
                    <div className="flex flex-col">
                        {hierarchyRows.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 text-[13px]">No issues found matching your filters</div>
                        ) : (
                            hierarchyRows.map(({ issue, depth, hasChildren }) => renderIssueRow(issue, depth, hasChildren))
                        )}
                    </div>
                </div>
            )
        }

        // Handle Grouping
        let groups: string[] = [];
        if (groupBy === 'ASSIGNEE') {
            const assignees = new Set(filteredIssues.map(i => i.assigneeName || 'Unassigned'));
            groups = Array.from(assignees).sort((a, b) => a === 'Unassigned' ? 1 : b === 'Unassigned' ? -1 : a.localeCompare(b));
        } else if (groupBy === 'EPIC') {
            const epics = new Set(filteredIssues.map(i => i.epicKey || 'No Epic'));
            groups = Array.from(epics).sort((a, b) => a === 'No Epic' ? 1 : b === 'No Epic' ? -1 : a.localeCompare(b));
        } else if (groupBy === 'STATUS') {
            const statuses = new Set(filteredIssues.map(i => i.status));
            const statusOrder = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
            groups = Array.from(statuses).sort((a, b) => statusOrder.indexOf(a) - statusOrder.indexOf(b));
        }

        return (
            <div className="space-y-6 pb-12">
                {groups.map(groupName => {
                    const groupIssues = filteredIssues.filter(i => {
                        if (groupBy === 'ASSIGNEE') return (i.assigneeName || 'Unassigned') === groupName;
                        if (groupBy === 'EPIC') return (i.epicKey || 'No Epic') === groupName;
                        return i.status === groupName;
                    });

                    if (groupIssues.length === 0) return null;

                    const sampleIssue = groupIssues[0];
                    const avatarColor = groupBy === 'ASSIGNEE' && groupName !== 'Unassigned' && sampleIssue.assigneeEmail
                        ? getAvatarColor(sampleIssue.assigneeEmail)
                        : '#94a3b8';

                    const isCollapsed = collapsedGroups.has(groupName);

                    return (
                        <div key={groupName} className="bg-white rounded-xl border border-slate-200 shadow-sm mb-4">

                            <div
                                onClick={() => toggleGroup(groupName)}
                                className={`px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors ${isCollapsed ? 'rounded-xl border-b-0' : 'rounded-t-xl'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`material-symbols-outlined text-[20px] text-slate-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}>expand_more</span>
                                    {groupBy === 'ASSIGNEE' ? (
                                        <>
                                            <div
                                                className="w-7 h-7 rounded-full text-white flex items-center justify-center text-[11px] font-bold shadow-sm"
                                                style={{ backgroundColor: avatarColor }}
                                            >
                                                {groupName === 'Unassigned' ? '?' : groupName.charAt(0).toUpperCase()}
                                            </div>
                                            <h3 className="font-bold text-[14px] text-slate-800">{groupName}</h3>
                                        </>
                                    ) : groupBy === 'EPIC' ? (
                                        <>
                                            <span className="material-symbols-outlined text-[20px] text-purple-600">electric_bolt</span>
                                            <h3 className="font-bold text-[14px] text-slate-800">{groupName}</h3>
                                        </>
                                    ) : (
                                        <>
                                            <span className={`w-2.5 h-2.5 rounded-full ${groupName === 'DONE' ? 'bg-green-500' :
                                                groupName === 'IN_PROGRESS' ? 'bg-blue-500' :
                                                    groupName === 'IN_REVIEW' ? 'bg-yellow-500' :
                                                        'bg-slate-400'
                                                }`}></span>
                                            <h3 className="font-bold text-[14px] text-slate-800">{groupName.replace('_', ' ')}</h3>
                                        </>
                                    )}
                                    <span className="text-[12px] font-medium text-slate-400 ml-2">{groupIssues.length} issues</span>
                                </div>
                            </div>
                            {!isCollapsed && (
                                <>
                                    {renderTableHeader()}
                                    <div className="flex flex-col">
                                        {groupIssues.map(issue => renderIssueRow(issue))}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <Layout projectContextName={projectName}>
            <div className="p-3 md:p-8 h-full flex flex-col pt-4 md:pt-6 font-inter overflow-y-auto custom-scrollbar">
                <div className="mb-6 flex-none">
                    <div className="text-[10px] font-bold text-slate-400 tracking-widest mb-1.5 uppercase">PROJECTS / {projectName}</div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        Backlog
                        <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-mono font-normal">v{version}</span>
                    </h1>

                </div>

                <div className="flex flex-col gap-4 mb-6 flex-none">
                    {/* Search and Create Row - Compact on mobile */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="relative flex-1 md:max-w-md">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">search</span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search tasks..."
                                className="pl-9 pr-4 py-2 bg-white border border-slate-200 shadow-sm rounded-md text-[13px] w-full focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400 font-medium transition-all h-[40px]"
                            />
                        </div>

                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-slate-900 text-white rounded-md text-[13px] font-bold shadow-sm hover:bg-slate-800 transition-colors h-[40px] shrink-0"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            <span>Create<span className="hidden sm:inline"> Issue</span></span>
                        </button>
                    </div>

                    {/* Grouping and Filters Row - Centered Wrap for mobile */}
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                        <div className="relative shrink-0" ref={groupRef}>
                            <button
                                onClick={() => setIsGroupOpen(!isGroupOpen)}
                                className={`flex items-center gap-2 px-3 py-2 bg-white border rounded-md text-[13px] font-medium transition-colors shadow-sm h-[38px] ${groupBy !== 'NONE'
                                    ? 'border-blue-400 text-blue-700 bg-blue-50/30'
                                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-[16px] text-slate-400">view_agenda</span>
                                {groupBy === 'NONE' ? 'Group' : `Group: ${groupBy.charAt(0) + groupBy.slice(1).toLowerCase()}`}
                            </button>
                            {isGroupOpen && (
                                <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-slate-200 rounded-md shadow-xl py-1 z-50">
                                    {(['NONE', 'ASSIGNEE', 'EPIC', 'STATUS'] as GroupBy[]).map(g => (
                                        <button
                                            key={g}
                                            onClick={() => { setGroupBy(g); setIsGroupOpen(false); }}
                                            className={`w-full text-left px-3 py-2.5 text-[13px] hover:bg-slate-50 ${groupBy === g ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700'}`}
                                        >
                                            {g === 'NONE' ? 'None' : g === 'ASSIGNEE' ? 'Assignee' : g === 'EPIC' ? 'Epic' : 'Status'}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="hidden md:block w-px h-6 bg-slate-200 mx-1"></div>

                        <GenericDropdown label="Parent" options={options.epics} selected={filters.epics} onToggle={(v) => toggleFilter('epics', v)} />
                        <GenericDropdown label="Assignee" options={options.assignees} selected={filters.assignees} onToggle={(v) => toggleFilter('assignees', v)} />
                        <GenericDropdown label="Issue Type" options={options.types} selected={filters.types} onToggle={(v) => toggleFilter('types', v)} />
                        <GenericDropdown label="Label" options={options.labels} selected={filters.labels} onToggle={(v) => toggleFilter('labels', v)} />
                        <GenericDropdown label="Status" options={options.statuses} selected={filters.statuses} onToggle={(v) => toggleFilter('statuses', v)} />
                        <GenericDropdown label="Priority" options={options.priorities} selected={filters.priorities} onToggle={(v) => toggleFilter('priorities', v)} />

                        {hasActiveFilters && (
                            <button 
                                onClick={clearFilters} 
                                className="text-[12px] text-slate-500 hover:text-blue-600 font-semibold px-2 py-1.5 hover:bg-slate-50 rounded transition-colors"
                            >
                                Clear all
                            </button>
                        )}
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center min-h-0">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    renderBacklogContent()
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
                    const issue = issues.find(i => i.id.toString() === issueId.toString());
                    if (issue) setSelectedTask(issue);
                }}
            />

            {issueToDelete && (
                <DeleteConfirmModal
                    isOpen={!!issueToDelete}
                    onClose={() => setIssueToDelete(null)}
                    onConfirm={handleDeleteIssue}
                    itemName={issueToDelete.issueKey || 'this issue'}
                    itemType="Issue"
                />
            )}
        </Layout>
    );
};
