import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { CreateProjectModal } from '../components/CreateProjectModal'
import { getAvatarColor, stripHtml } from '../utils'
import { fetchProjects as apiFetchProjects, deleteProject as apiDeleteProject } from '../services/api'
import { Layout } from '../components/Layout'
import type { IProject } from '../types'

/**
 * Main dashboard component showing user's managed projects
 */
export const Dashboard = (): React.ReactElement => {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
    const [editingProject, setEditingProject] = useState<IProject | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
    const [isDeletingProject, setIsDeletingProject] = useState(false)
    const [projects, setProjects] = useState<IProject[]>([])
    const [isLoadingProjects, setIsLoadingProjects] = useState(true)
    const [deleteError, setDeleteError] = useState<string | null>(null)
    const [hoveredAvatar, setHoveredAvatar] = useState<string | null>(null)

    const { user } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()

    const fetchProjects = async () => {
        try {
            setIsLoadingProjects(true)
            const data = await apiFetchProjects()
            setProjects(data)
        } catch (error) {
            console.error("Failed to fetch projects or unread counts", error)
        } finally {
            setIsLoadingProjects(false)
        }
    }

    useEffect(() => {
        fetchProjects()
    }, [])

    const handleCreateProject = (_projectData: IProject) => {
        fetchProjects()
        setIsModalOpen(false)
        setEditingProject(null)
    }

    const handleEditProject = (project: IProject) => {
        setActiveDropdown(null)
        setEditingProject(project)
        setIsModalOpen(true)
    }

    const handleDeleteProject = (project: IProject) => {
        setActiveDropdown(null)
        setDeleteError(null)
        setDeleteTarget({ id: project.id, name: project.name })
    }

    const confirmDelete = async () => {
        if (!deleteTarget) return
        setIsDeletingProject(true)
        try {
            await apiDeleteProject(deleteTarget.id)
            showToast("Project deleted successfully!", "success")
            setDeleteTarget(null)
            fetchProjects()
        } catch (error: any) {
            setDeleteError(error.response?.data?.message || "Error deleting project. You may not have permission.")
        } finally {
            setIsDeletingProject(false)
        }
    }

    const renderProjectCard = (project: IProject, isManager: boolean, isCreator = false) => (
        <div 
            key={project.id} 
            className={`flex flex-col rounded-2xl transition-all duration-300 cursor-pointer group hover:-translate-y-1 ${isCreator
                ? 'bg-white border-2 border-primary/40 shadow-md hover:shadow-xl hover:border-primary/70'
                : 'bg-surface-container-lowest border border-outline-variant hover:shadow-lg'
            }`}
            onClick={() => navigate(`/projects/${project.id}/board`)}
            onKeyDown={(e) => e.key === 'Enter' && navigate(`/projects/${project.id}/board`)}
            aria-label={`Project: ${project.name}, click to view Agile Board`}
            tabIndex={0}
        >
            <div className="p-6 pb-4 flex flex-col gap-4 flex-1 overflow-hidden rounded-t-2xl">
                {/* Header: Key & Options */}
                <div className="flex justify-between items-start w-full">
                    <div className="flex items-center gap-2">
                        <div className={`px-3 py-1 rounded-md text-xs font-bold tracking-widest shrink-0 ${isCreator ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                            }`}>
                            {project.projectKey}
                        </div>
                        {isCreator && (
                            <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Owner</span>
                        )}
                        {!isManager && (
                            <span className="text-[10px] font-semibold text-on-surface-variant bg-surface-variant px-2 py-0.5 rounded-full">Member</span>
                        )}
                    </div>
                    {isManager && (
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setActiveDropdown(activeDropdown === project.id ? null : project.id)
                                }}
                                className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-variant transition-colors -mr-2 -mt-2"
                                aria-haspopup="menu"
                                aria-expanded={activeDropdown === project.id}
                                aria-label="Project actions"
                            >
                                <span className="material-symbols-outlined text-[20px]">more_vert</span>
                            </button>
                            {activeDropdown === project.id && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setActiveDropdown(null) }}></div>
                                    <div 
                                        className="absolute right-0 top-8 w-40 bg-white rounded-md shadow-lg border border-outline-variant z-20 py-1 overflow-hidden"
                                        role="menu"
                                        aria-label="Project actions menu"
                                    >
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEditProject(project) }}
                                            className="w-full text-left px-4 py-2.5 text-sm text-on-surface hover:bg-surface-variant/50 transition-colors flex items-center gap-2"
                                            tabIndex={0}
                                            role="menuitem"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">edit</span> Edit Project
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteProject(project) }}
                                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                            tabIndex={0}
                                            role="menuitem"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">delete</span> Delete Project
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Title */}
                <div className="relative">
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-on-surface text-xl leading-tight group-hover:text-primary transition-colors">{project.name}</h3>
                    </div>
                    {project.description && (
                        <p className="text-sm text-on-surface-variant line-clamp-2 mb-2">
                            {stripHtml(project.description)}
                        </p>
                    )}
                    <p className="text-xs font-medium text-primary/80">
                        {project.members ? project.members.length : 0} active members
                    </p>
                </div>
            </div>

            {/* Footer: Avatars & Metadata */}
            <div className="mt-auto px-6 py-4 bg-surface-container-low border-t border-outline-variant/30 flex justify-between items-center rounded-b-2xl overflow-visible relative">
                <div className="flex -space-x-2 items-center">
                    {[...(project.leads || []), ...(project.members || [])].slice(0, 2).map((member, i: number) => {
                        const avatarKey = `${project.id}-all-${i}`
                        return (
                            <div
                                key={i}
                                className="relative z-10 cursor-pointer transition-transform hover:scale-110 hover:z-50"
                                onMouseEnter={() => setHoveredAvatar(avatarKey)}
                                onMouseLeave={() => setHoveredAvatar(null)}
                            >
                                <div className="w-8 h-8 rounded-full border-2 border-surface-container-low text-white flex items-center justify-center text-[10px] font-bold shadow-sm" style={{ backgroundColor: getAvatarColor(member.email) }}>
                                    {(member.firstName || member.email).charAt(0).toUpperCase()}
                                </div>

                                {hoveredAvatar === avatarKey && (
                                    <div className="absolute top-full left-0 mt-2 flex flex-col items-start pointer-events-none w-max z-[100]">
                                        <div className="w-2 h-2 bg-white rotate-45 ml-3 -mb-1 border-l border-t border-slate-200"></div>
                                        <div className="bg-white text-slate-800 rounded-lg py-2 px-3 flex flex-col shadow-lg border border-slate-200">
                                            {member.firstName ? (
                                                <>
                                                    <span className="text-[11px] font-bold">{member.firstName} {member.lastName}</span>
                                                    <span className="text-[9px] text-slate-500 font-medium">{member.email}</span>
                                                </>
                                            ) : (
                                                <span className="text-[11px] font-bold">{member.email}</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                    {([...(project.leads || []), ...(project.members || [])].length > 2) && (
                        <div className="w-8 h-8 rounded-full border-2 border-surface-container-low bg-surface-variant text-on-surface-variant flex items-center justify-center text-[10px] font-bold shadow-sm z-0 relative">
                            +{([...(project.leads || []), ...(project.members || [])].length - 2)}
                        </div>
                    )}
                </div>

                <div className="text-[11px] font-medium text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                    Created {new Date(project.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
            </div>
        </div>
    )

    return (
        <>
            <Layout projectContextName="My Workspace">
                <div className="min-h-full bg-surface p-4 md:p-8 lg:p-12 xl:p-20">
                    <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tighter text-slate-900 leading-tight">My Workspace</h1>
                            <p className="mt-2 md:mt-4 text-on-surface-variant max-w-md text-xs md:text-sm">Manage your active sprint cycles and team collaborations from a single point of truth.</p>
                        </div>
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="bg-primary text-white px-6 md:px-8 py-3 rounded font-semibold flex items-center gap-2 hover:opacity-90 transition-all active:scale-95 duration-150 self-start shadow-md hover:shadow-lg min-h-[44px]"
                        >
                            <span className="material-symbols-outlined">add_circle</span>
                            <span>Create Project</span>
                        </button>
                    </div>

                    {/* ── Managed Projects ─────────────── */}
                    <div className="mb-14">
                        <div className="flex items-center gap-3 mb-6">
                            <h2 className="text-lg font-bold text-on-surface">Managed Projects</h2>
                        </div>

                        {isLoadingProjects ? (
                            <div className="py-8 flex justify-center text-on-surface-variant">
                                <span className="animate-pulse flex items-center gap-2">
                                    <span className="material-symbols-outlined animate-spin">refresh</span>
                                    Loading your projects...
                                </span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-8">
                                {[...projects]
                                    .filter((p) => p.currentUserRole === 'PROJECT_MANAGER')
                                    .sort((a, b) => {
                                        const aIsOwner = a.creatorEmail === user?.email
                                        const bIsOwner = b.creatorEmail === user?.email
                                        if (aIsOwner && !bIsOwner) return -1
                                        if (!aIsOwner && bIsOwner) return 1
                                        return 0
                                    })
                                    .map((project) => renderProjectCard(project, true, project.creatorEmail === user?.email))}
                                
                                <button 
                                    onClick={() => setIsModalOpen(true)} 
                                    className="bg-surface-container-low/50 border-2 border-dashed border-outline-variant/60 flex flex-col items-center justify-center p-8 rounded-2xl min-h-[220px] group cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-300"
                                    aria-label="Create new project"
                                >
                                    <div className="w-14 h-14 rounded-full bg-surface-container-lowest border border-outline-variant flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white group-hover:border-primary shadow-sm transition-all duration-300">
                                        <span className="material-symbols-outlined text-3xl">add</span>
                                    </div>
                                    <span className="font-bold text-on-surface text-lg group-hover:text-primary transition-colors">New Project</span>
                                    <span className="text-[10px] text-on-surface-variant mt-1">Start a fresh workspace</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ── Member Projects ───────────────── */}
                    {!isLoadingProjects && projects.some((p) => p.currentUserRole === 'PROJECT_MEMBER') && (
                        <div className="mb-14">
                            <div className="flex items-center gap-3 mb-6">
                                <h2 className="text-lg font-bold text-on-surface">Member Projects</h2>
                                <span className="text-xs font-medium text-on-surface-variant bg-surface-variant px-2.5 py-1 rounded-full">
                                    Projects you've been added to
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-8">
                                {projects
                                    .filter((p) => p.currentUserRole === 'PROJECT_MEMBER')
                                    .map((project) => renderProjectCard(project, false, false))}
                            </div>
                        </div>
                    )}
                </div>
            </Layout>

            {isModalOpen && (
                <CreateProjectModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false)
                        setEditingProject(null)
                    }}
                    onCreate={handleCreateProject}
                    project={editingProject}
                />
            )}

            {deleteTarget && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4" onClick={() => { setDeleteTarget(null); setDeleteError(null) }}>
                    <div 
                        className="bg-white rounded-xl shadow-2xl border border-outline-variant w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200" 
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-dialog-title"
                        aria-describedby="delete-dialog-description"
                    >
                        <div className="p-8">
                            <div className="flex items-center gap-4 text-red-600 mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-2xl">warning</span>
                                </div>
                                <h2 id="delete-dialog-title" className="font-bold text-slate-900 text-xl tracking-tight">Delete Project</h2>
                            </div>
                            <p id="delete-dialog-description" className="text-sm text-slate-600 mt-2 leading-relaxed">
                                Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This will permanently remove all associated tasks, members, and history. This action <strong>cannot be undone</strong>.
                            </p>
                            {deleteError && (
                                <div className="mt-6 p-4 bg-red-50 border border-red-100 text-red-700 text-xs rounded-lg flex items-center gap-3">
                                    <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                                    <span className="font-medium">{deleteError}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 px-8 py-5 bg-slate-50 border-t border-slate-100">
                            <button 
                                onClick={() => { setDeleteTarget(null); setDeleteError(null) }} 
                                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg transition-all"
                                aria-label="Cancel deletion"
                                tabIndex={0}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDelete} 
                                className="px-6 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 active:scale-[0.98] rounded-lg transition-all shadow-md shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                disabled={isDeletingProject}
                                aria-label="Confirm project deletion"
                                tabIndex={0}
                            >
                                {isDeletingProject ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Deleting...
                                    </>
                                ) : 'Delete Project'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
