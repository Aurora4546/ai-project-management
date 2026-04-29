import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { getAvatarColor } from '../utils'
import { searchUsers, createProject, updateProject } from '../services/api'
import type { IUserSearchResult, IProject } from '../types'
import { RichTextEditor } from './RichTextEditor'

interface CreateProjectModalProps {
  onClose: () => void
  onCreate: (projectData: IProject) => void
  project?: IProject | null
}

interface SelectedUser {
  email: string
  firstName: string
  lastName: string
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ onClose, onCreate, project }) => {
  const { user } = useAuth()

  const [projectName, setProjectName] = useState(project?.name || '')
  const [projectKey, setProjectKey] = useState(project?.projectKey || '')
  const [description, setDescription] = useState(project?.description || '')
  const [isKeyManuallyEdited, setIsKeyManuallyEdited] = useState(!!project)

  // Lead state
  const initialLeads: SelectedUser[] = project?.leads
    ? project.leads.map((l: any) => ({ email: l.email || l, firstName: l.firstName || '', lastName: l.lastName || '' }))
    : []
  const [leads, setLeads] = useState<SelectedUser[]>(initialLeads)
  const [leadSearchQuery, setLeadSearchQuery] = useState('')
  const [leadSearchResults, setLeadSearchResults] = useState<IUserSearchResult[]>([])
  const [isSearchingLeads, setIsSearchingLeads] = useState(false)
  const [showLeadDropdown, setShowLeadDropdown] = useState(false)
  const [leadError, setLeadError] = useState('')
  const leadDropdownRef = useRef<HTMLDivElement>(null)
  const leadInputRef = useRef<HTMLInputElement>(null)

  // Member state
  const initialMembers: SelectedUser[] = project?.members
    ? project.members.map((m: any) => ({ email: m.email || m, firstName: m.firstName || '', lastName: m.lastName || '' }))
    : []
  const [members, setMembers] = useState<SelectedUser[]>(initialMembers)
  const [memberSearchQuery, setMemberSearchQuery] = useState('')
  const [memberSearchResults, setMemberSearchResults] = useState<IUserSearchResult[]>([])
  const [isSearchingMembers, setIsSearchingMembers] = useState(false)
  const [showMemberDropdown, setShowMemberDropdown] = useState(false)
  const [memberError, setMemberError] = useState('')
  const memberDropdownRef = useRef<HTMLDivElement>(null)
  const memberInputRef = useRef<HTMLInputElement>(null)

  const [apiError, setApiError] = useState<string | null>(null)
  const [apiSuccess, setApiSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Auto-add creator as lead for new projects
  useEffect(() => {
    if (!project && user && user.email && leads.length === 0) {
      setLeads([{ email: user.email, firstName: user.firstName || '', lastName: user.lastName || '' }])
    }
  }, [user, project])

  // Auto-generate project key
  useEffect(() => {
    if (!isKeyManuallyEdited && projectName) {
      const generatedKey = projectName
        .split(/[\s-]+/)
        .map((word: string) => word.charAt(0))
        .join('')
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .substring(0, 4)
      setProjectKey(generatedKey)
    } else if (!projectName && !isKeyManuallyEdited) {
      setProjectKey('')
    }
  }, [projectName, isKeyManuallyEdited])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (leadDropdownRef.current && !leadDropdownRef.current.contains(e.target as Node)) {
        setShowLeadDropdown(false)
      }
      if (memberDropdownRef.current && !memberDropdownRef.current.contains(e.target as Node)) {
        setShowMemberDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ── Debounced search ──────────────────────────
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearch = useCallback(async (
    query: string,
    setResults: React.Dispatch<React.SetStateAction<IUserSearchResult[]>>,
    setIsSearching: React.Dispatch<React.SetStateAction<boolean>>,
    setShowDropdown: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)

    if (query.trim().length < 2) {
      setResults([])
      setShowDropdown(false)
      return
    }

    searchTimerRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await searchUsers(query)
        setResults(results)
        setShowDropdown(results.length > 0)
      } catch {
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)
  }, [])

  const handleLeadSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setLeadSearchQuery(val)
    setLeadError('')
    handleSearch(val, setLeadSearchResults, setIsSearchingLeads, setShowLeadDropdown)
  }

  const handleMemberSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setMemberSearchQuery(val)
    setMemberError('')
    handleSearch(val, setMemberSearchResults, setIsSearchingMembers, setShowMemberDropdown)
  }

  // ── Select user from dropdown ─────────────────
  const isAlreadySelected = (email: string): boolean => {
    return leads.some(l => l.email === email) || members.some(m => m.email === email)
  }

  const handleSelectLead = (result: IUserSearchResult) => {
    if (leads.some(l => l.email === result.email)) {
      setLeadError('User already added as lead')
      return
    }
    if (members.some(m => m.email === result.email)) {
      setLeadError('User is already a team member. Remove them first.')
      return
    }
    setLeads([...leads, { email: result.email, firstName: result.firstName, lastName: result.lastName }])
    setLeadSearchQuery('')
    setLeadSearchResults([])
    setShowLeadDropdown(false)
    setLeadError('')
    leadInputRef.current?.focus()
  }

  const handleSelectMember = (result: IUserSearchResult) => {
    if (members.some(m => m.email === result.email)) {
      setMemberError('User already added as member')
      return
    }
    if (leads.some(l => l.email === result.email)) {
      setMemberError('User is already a project lead. Remove them first.')
      return
    }
    setMembers([...members, { email: result.email, firstName: result.firstName, lastName: result.lastName }])
    setMemberSearchQuery('')
    setMemberSearchResults([])
    setShowMemberDropdown(false)
    setMemberError('')
    memberInputRef.current?.focus()
  }

  const removeLead = (email: string) => {
    setLeads(leads.filter(l => l.email !== email))
  }

  const removeMember = (email: string) => {
    setMembers(members.filter(m => m.email !== email))
  }

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectKey(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 4))
    setIsKeyManuallyEdited(true)
  }

  const isProjectKeyInvalid = projectKey.length > 0 && projectKey.length < 4

  // ── Submit ────────────────────────────────────
  const handleSubmit = async () => {
    if (projectName.length === 0 || projectKey.length < 4) return

    setIsLoading(true)
    setApiError(null)
    setApiSuccess(null)
    try {
      const leadEmails = leads.map(l => l.email)
      const memberEmails = members.map(m => m.email)

      let response: IProject
      if (project) {
        response = await updateProject(project.id, {
          name: projectName,
          description,
          leads: leadEmails,
          members: memberEmails,
        })
        setApiSuccess('Project updated successfully!')
      } else {
        response = await createProject({
          name: projectName,
          projectKey,
          description,
          leads: leadEmails,
          members: memberEmails,
        })
        setApiSuccess('Project created successfully!')
      }

      setTimeout(() => {
        setIsLoading(false)
        onCreate(response)
      }, 1000)
    } catch (error: any) {
      setIsLoading(false)
      if (error.response?.data?.message) {
        setApiError(error.response.data.message)
      } else if (error.response?.data && typeof error.response.data === 'object') {
        const firstError = Object.values(error.response.data)[0]
        setApiError(typeof firstError === 'string' ? firstError : 'Validation failed')
      } else {
        setApiError('Failed to save project')
      }
    }
  }

  // ── Render the search dropdown ────────────────
  const renderSearchDropdown = (
    results: IUserSearchResult[],
    isSearching: boolean,
    onSelect: (r: IUserSearchResult) => void,
    query: string
  ) => {
    if (isSearching) {
      return (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-3">
          <span className="text-xs text-slate-400 animate-pulse">Searching users...</span>
        </div>
      )
    }

    if (results.length === 0 && query.trim().length >= 2) {
      return (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-3">
          <span className="text-xs text-slate-500">No users found for "{query}"</span>
        </div>
      )
    }

    if (results.length === 0) return null

    return (
      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
        {results.map(r => {
          const alreadyPicked = isAlreadySelected(r.email)
          return (
            <button
              key={r.email}
              type="button"
              onClick={() => !alreadyPicked && onSelect(r)}
              disabled={alreadyPicked}
              className={`w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors ${
                alreadyPicked
                  ? 'opacity-40 cursor-not-allowed bg-slate-50'
                  : 'hover:bg-primary/5 cursor-pointer'
              }`}
              aria-label={`Select ${r.firstName} ${r.lastName}`}
              tabIndex={0}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                style={{ backgroundColor: getAvatarColor(r.email) }}
              >
                {(r.firstName || r.email).charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-800 truncate">
                  {r.firstName} {r.lastName}
                </span>
                <span className="text-[10px] text-slate-500 truncate">{r.email}</span>
              </div>
              {alreadyPicked && (
                <span className="ml-auto text-[9px] text-slate-400 font-medium shrink-0">Already added</span>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  // ── Render a user chip ────────────────────────
  const renderUserChip = (u: SelectedUser, isCreator: boolean, onRemove: (email: string) => void) => (
    <span
      key={u.email}
      className={`${
        isCreator ? 'bg-amber-50 border-amber-200' : 'bg-slate-100 border-slate-200 shadow-sm'
      } text-slate-800 pr-2.5 pl-1.5 py-1 rounded-lg flex items-center gap-2 text-xs font-semibold border transition-all hover:border-slate-300`}
    >
      <div
        className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold uppercase shrink-0 shadow-inner"
        style={{ backgroundColor: getAvatarColor(u.email) }}
      >
        {(u.firstName || u.email).charAt(0).toUpperCase()}
      </div>
      <div className="flex flex-col min-w-0 pr-1">
        <span className="truncate max-w-[150px] leading-tight">
          {u.firstName ? `${u.firstName} ${u.lastName}` : u.email}
        </span>
        {u.firstName && (
          <span className="text-[9px] text-slate-500 font-normal truncate max-w-[150px] -mt-0.5">
            {u.email}
          </span>
        )}
      </div>
      {isCreator ? (
        <span className="text-amber-600 text-[10px] font-black shrink-0 px-0.5" title="Project Owner">★</span>
      ) : (
        <button
          type="button"
          onClick={() => onRemove(u.email)}
          className="hover:text-red-600 hover:bg-white/50 rounded p-0.5 flex items-center justify-center transition-colors shrink-0"
          aria-label={`Remove ${u.firstName || u.email}`}
          tabIndex={0}
        >
          <span className="material-symbols-outlined text-[14px]">close</span>
        </button>
      )}
    </span>
  )

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Mask */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal Card */}
      <div className="relative w-full max-w-[800px] max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-none border border-slate-200 flex flex-col font-body antialiased transition-all duration-300">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-outline-variant sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-on-surface">
            {project ? (
              <>Update <strong>{project.name}</strong></>
            ) : 'New Project'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 -m-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors focus:outline-none"
            aria-label="Close modal"
            tabIndex={0}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {apiSuccess && (
          <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            {apiSuccess}
          </div>
        )}
        {apiError && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {apiError}
          </div>
        )}

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          {/* Project Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center justify-between">
              <span>Project Name</span>
              {projectName.length >= 50 && <span className="text-red-500 normal-case tracking-normal">Max length reached</span>}
            </label>
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              maxLength={50}
              className={`w-full bg-surface-container-lowest border ${projectName.length >= 50 ? 'border-red-500 ring-1 ring-red-500' : 'border-outline-variant focus:border-primary'} rounded px-3 py-2 text-sm focus:outline-none transition-colors text-on-surface`}
              placeholder="Enter a descriptive name"
              type="text"
              aria-label="Project name"
            />
            <div className="flex justify-end">
              <span className={`text-[10px] ${projectName.length >= 50 ? 'text-red-500 font-bold' : 'text-on-surface-variant'}`}>{projectName.length}/50</span>
            </div>
          </div>

          {/* Project Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center justify-between">
              <span>Project Description</span>
              {description.replace(/<[^>]*>/g, '').length >= 500 && <span className="text-red-500 normal-case tracking-normal">Max length reached</span>}
            </label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Briefly describe what this project is about..."
              minHeight={200}
            />
            <div className="flex justify-end">
              <span className={`text-[10px] ${description.replace(/<[^>]*>/g, '').length >= 500 ? 'text-red-500 font-bold' : 'text-on-surface-variant'}`}>{description.replace(/<[^>]*>/g, '').length}/500</span>
            </div>
          </div>

          {/* Project Key */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
              <span>Project Key</span>
              {isProjectKeyInvalid && <span className="text-red-500 normal-case tracking-normal">Must be exactly 4 chars</span>}
            </label>
            <input
              value={projectKey}
              onChange={handleKeyChange}
              disabled={!!project}
              className={`w-24 bg-surface-container-lowest border ${isProjectKeyInvalid ? 'border-red-500 ring-1 ring-red-500' : 'border-outline-variant focus:border-primary'} rounded px-3 py-2 text-sm focus:outline-none transition-colors uppercase font-mono text-on-surface disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-surface-container-low`}
              maxLength={4}
              placeholder="PROJ"
              type="text"
              aria-label="Project key"
            />
            <p className="text-[10px] text-on-surface-variant italic">Short identifier used for issues (e.g., PROJ-101). Exactly 4 characters.</p>
          </div>

          {/* Project Leads — Searchable */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex justify-between">
              <span className="flex items-center gap-2">
                Project Leads
                <span className="text-[10px] font-medium text-slate-400 normal-case tracking-normal">({leads.length})</span>
              </span>
              {leadError && <span className="text-red-500 normal-case tracking-normal text-[10px]">{leadError}</span>}
            </label>
            <div ref={leadDropdownRef} className="relative">
              <div className={`w-full bg-surface-container-lowest border ${leadError ? 'border-red-500' : 'border-outline-variant focus-within:border-primary'} rounded p-1.5 text-sm flex flex-wrap gap-1.5 min-h-[42px] content-start text-on-surface transition-colors`}>
                {leads.map(u => {
                  const isCreator = (project && project.creatorEmail === u.email) || (!project && user && user.email === u.email)
                  return renderUserChip(u, !!isCreator, removeLead)
                })}
                <div className="flex-1 flex items-center gap-2 min-w-[150px] overflow-hidden">
                  <input
                    ref={leadInputRef}
                    value={leadSearchQuery}
                    onChange={handleLeadSearchChange}
                    onFocus={() => { if (leadSearchResults.length > 0) setShowLeadDropdown(true) }}
                    className="flex-1 min-w-0 bg-transparent border-none focus:ring-0 p-0.5 text-xs outline-none"
                    placeholder="Search by name or email..."
                    type="text"
                    aria-label="Search project leads"
                  />
                  {isSearchingLeads && <span className="text-[10px] text-slate-400 animate-pulse whitespace-nowrap">Searching...</span>}
                </div>
              </div>
              {showLeadDropdown && renderSearchDropdown(leadSearchResults, isSearchingLeads, handleSelectLead, leadSearchQuery)}
            </div>
            <p className="text-[10px] text-on-surface-variant italic">Project Leads have full admin permissions over the project.</p>
          </div>

          {/* Team Members — Searchable */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex justify-between">
              <span className="flex items-center gap-2">
                Team Members
                <span className="text-[10px] font-medium text-slate-400 normal-case tracking-normal">({members.length})</span>
              </span>
              {memberError && <span className="text-red-500 normal-case tracking-normal text-[10px]">{memberError}</span>}
            </label>
            <div ref={memberDropdownRef} className="relative">
              <div className={`w-full bg-surface-container-lowest border ${memberError ? 'border-red-500' : 'border-outline-variant focus-within:border-primary'} rounded p-1.5 text-sm flex flex-wrap gap-1.5 min-h-[42px] content-start text-on-surface transition-colors`}>
                {members.map(u => renderUserChip(u, false, removeMember))}
                <div className="flex-1 flex items-center gap-2 min-w-[150px] overflow-hidden">
                  <input
                    ref={memberInputRef}
                    value={memberSearchQuery}
                    onChange={handleMemberSearchChange}
                    onFocus={() => { if (memberSearchResults.length > 0) setShowMemberDropdown(true) }}
                    className="flex-1 min-w-0 bg-transparent border-none focus:ring-0 p-0.5 text-xs outline-none"
                    placeholder="Search by name or email..."
                    type="text"
                    aria-label="Search team members"
                  />
                  {isSearchingMembers && <span className="text-[10px] text-slate-400 animate-pulse whitespace-nowrap">Searching...</span>}
                </div>
              </div>
              {showMemberDropdown && renderSearchDropdown(memberSearchResults, isSearchingMembers, handleSelectMember, memberSearchQuery)}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 flex justify-end items-center gap-3 bg-slate-50/50 rounded-b-lg sticky bottom-0 border-t border-slate-100">
          <button
            onClick={onClose}
            className="text-sm font-semibold text-primary px-4 py-2 hover:bg-slate-100 transition-colors rounded"
            aria-label="Cancel"
            tabIndex={0}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={projectName.length === 0 || projectKey.length < 4 || isLoading}
            className="text-sm font-semibold text-white bg-[#1E293B] px-5 py-2 hover:bg-[#2e3d4e] transition-colors rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            aria-label={project ? 'Save changes' : 'Create project'}
            tabIndex={0}
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isLoading ? 'Saving...' : project ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  )
}
