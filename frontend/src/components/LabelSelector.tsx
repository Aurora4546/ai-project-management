import { useState, useEffect, useRef } from 'react'
import * as api from '../services/api'
import type { ILabel } from '../types'

const LABEL_COLORS = [
    { name: 'Blue',   hex: '#3b82f6' },
    { name: 'Green',  hex: '#22c55e' },
    { name: 'Red',    hex: '#ef4444' },
    { name: 'Purple', hex: '#a855f7' },
    { name: 'Orange', hex: '#f97316' },
    { name: 'Teal',   hex: '#14b8a6' },
    { name: 'Pink',   hex: '#ec4899' },
    { name: 'Slate',  hex: '#64748b' },
    { name: 'Amber',  hex: '#f59e0b' },
    { name: 'Indigo', hex: '#6366f1' },
]

interface LabelSelectorProps {
    projectId: string
    selectedLabels: string[]
    onChange: (labels: string[]) => void
}

export const LabelSelector = ({ projectId, selectedLabels, onChange }: LabelSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [projectLabels, setProjectLabels] = useState<ILabel[]>([])
    const [isCreating, setIsCreating] = useState(false)
    const [newLabelName, setNewLabelName] = useState('')
    const [selectedColor, setSelectedColor] = useState(LABEL_COLORS[0].hex)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const searchRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
                setIsCreating(false)
                setSearchQuery('')
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        if (projectId) {
            loadLabels()
        }
    }, [projectId])

    useEffect(() => {
        if (isOpen && searchRef.current) {
            searchRef.current.focus()
        }
    }, [isOpen])

    const loadLabels = async () => {
        try {
            const labels = await api.fetchProjectLabels(projectId)
            setProjectLabels(labels)
        } catch (error) {
            console.error('Failed to load labels:', error)
        }
    }

    const handleToggleLabel = (labelName: string) => {
        if (selectedLabels.includes(labelName)) {
            onChange(selectedLabels.filter(l => l !== labelName))
        } else {
            onChange([...selectedLabels, labelName])
        }
    }

    const handleRemoveLabel = (labelName: string) => {
        onChange(selectedLabels.filter(l => l !== labelName))
    }

    const handleCreateLabel = async () => {
        if (!newLabelName.trim() || isSubmitting) return
        setIsSubmitting(true)
        try {
            const created = await api.createProjectLabel(projectId, newLabelName.trim(), selectedColor)
            setProjectLabels(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
            onChange([...selectedLabels, created.name])
            setNewLabelName('')
            setSelectedColor(LABEL_COLORS[0].hex)
            setIsCreating(false)
        } catch (error) {
            console.error('Failed to create label:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const filteredLabels = projectLabels.filter(l =>
        l.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const hasExactMatch = projectLabels.some(l => l.name.toLowerCase() === searchQuery.toLowerCase())

    const getLabelColor = (labelName: string): string => {
        const found = projectLabels.find(l => l.name === labelName)
        return found?.color || '#3b82f6'
    }

    const hexToRgba = (hex: string, alpha: number): string => {
        const r = parseInt(hex.slice(1, 3), 16)
        const g = parseInt(hex.slice(3, 5), 16)
        const b = parseInt(hex.slice(5, 7), 16)
        return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }

    return (
        <div ref={wrapperRef} className="relative w-full">
            {/* Selected Labels Display */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full min-h-[42px] px-3 py-2 bg-white border border-slate-200 rounded-md flex flex-wrap items-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors focus-within:ring-1 focus-within:ring-slate-300 focus-within:border-slate-300"
            >
                {selectedLabels.length > 0 ? (
                    selectedLabels.map(label => {
                        const color = getLabelColor(label)
                        return (
                            <div
                                key={label}
                                className="flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-md text-[12px] font-bold border"
                                style={{
                                    backgroundColor: hexToRgba(color, 0.1),
                                    color: color,
                                    borderColor: hexToRgba(color, 0.25),
                                }}
                            >
                                <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: color }}
                                />
                                {label}
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleRemoveLabel(label) }}
                                    className="rounded-sm p-0.5 transition-colors hover:opacity-70"
                                    aria-label={`Remove label ${label}`}
                                    tabIndex={0}
                                >
                                    <span className="material-symbols-outlined text-[12px]">close</span>
                                </button>
                            </div>
                        )
                    })
                ) : (
                    <span className="text-slate-400 font-medium text-[13px]">Select labels...</span>
                )}
                <span className="material-symbols-outlined text-[18px] text-slate-400 ml-auto shrink-0 pointer-events-none">expand_more</span>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-[100] w-full bottom-full mb-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
                    {/* Search */}
                    <div className="p-2 border-b border-slate-100">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-slate-400">search</span>
                            <input
                                ref={searchRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search or create labels..."
                                className="w-full pl-8 pr-3 py-2 text-[13px] text-slate-700 bg-slate-50 border border-slate-100 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-300 placeholder:text-slate-400"
                                aria-label="Search labels"
                                tabIndex={0}
                            />
                        </div>
                    </div>

                    {/* Label List */}
                    <div className="max-h-[200px] overflow-y-auto py-1 custom-scrollbar">
                        {filteredLabels.length > 0 ? (
                            filteredLabels.map(label => {
                                const isSelected = selectedLabels.includes(label.name)
                                return (
                                    <button
                                        key={label.id}
                                        onClick={() => handleToggleLabel(label.name)}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors text-left ${
                                            isSelected ? 'bg-slate-50' : 'hover:bg-slate-50'
                                        }`}
                                        aria-label={`${isSelected ? 'Remove' : 'Add'} label ${label.name}`}
                                        tabIndex={0}
                                    >
                                        <span
                                            className="w-3 h-3 rounded-full shrink-0 border"
                                            style={{
                                                backgroundColor: label.color,
                                                borderColor: hexToRgba(label.color, 0.5),
                                            }}
                                        />
                                        <span className="font-semibold text-slate-700 flex-1 truncate">{label.name}</span>
                                        {isSelected && (
                                            <span className="material-symbols-outlined text-[16px] text-blue-600 shrink-0">check</span>
                                        )}
                                    </button>
                                )
                            })
                        ) : (
                            <div className="px-3 py-4 text-center text-[12px] text-slate-400 font-medium">
                                No labels found
                            </div>
                        )}
                    </div>

                    {/* Create New Label */}
                    <div className="border-t border-slate-100">
                        {!isCreating ? (
                            <button
                                onClick={() => {
                                    setIsCreating(true)
                                    if (searchQuery && !hasExactMatch) {
                                        setNewLabelName(searchQuery)
                                    }
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-[13px] font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                                aria-label="Create new label"
                                tabIndex={0}
                            >
                                <span className="material-symbols-outlined text-[16px]">add</span>
                                {searchQuery && !hasExactMatch
                                    ? `Create "${searchQuery}"`
                                    : 'Create new label'
                                }
                            </button>
                        ) : (
                            <div className="p-3 space-y-3">
                                <input
                                    type="text"
                                    value={newLabelName}
                                    onChange={(e) => setNewLabelName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateLabel()}
                                    placeholder="Label name"
                                    className="w-full px-3 py-2 text-[13px] text-slate-700 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-300 placeholder:text-slate-400"
                                    autoFocus
                                    aria-label="New label name"
                                    tabIndex={0}
                                />
                                <div>
                                    <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block mb-1.5">Color</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {LABEL_COLORS.map(c => (
                                            <button
                                                key={c.hex}
                                                onClick={() => setSelectedColor(c.hex)}
                                                className={`w-6 h-6 rounded-full transition-all border-2 ${
                                                    selectedColor === c.hex
                                                        ? 'border-slate-700 scale-110 shadow-md'
                                                        : 'border-transparent hover:scale-105'
                                                }`}
                                                style={{ backgroundColor: c.hex }}
                                                title={c.name}
                                                aria-label={`Select ${c.name} color`}
                                                tabIndex={0}
                                            />
                                        ))}
                                    </div>
                                </div>
                                {/* Preview */}
                                {newLabelName.trim() && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preview:</span>
                                        <span
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border"
                                            style={{
                                                backgroundColor: hexToRgba(selectedColor, 0.1),
                                                color: selectedColor,
                                                borderColor: hexToRgba(selectedColor, 0.25),
                                            }}
                                        >
                                            <span
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: selectedColor }}
                                            />
                                            {newLabelName.trim()}
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center justify-end gap-2 pt-1">
                                    <button
                                        onClick={() => { setIsCreating(false); setNewLabelName(''); setSelectedColor(LABEL_COLORS[0].hex) }}
                                        className="px-3 py-1.5 text-[12px] font-bold text-slate-500 hover:text-slate-700 transition-colors"
                                        tabIndex={0}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateLabel}
                                        disabled={!newLabelName.trim() || isSubmitting}
                                        className="px-4 py-1.5 bg-[#1A202C] text-white rounded-md text-[12px] font-bold shadow-sm hover:bg-slate-800 transition-colors disabled:opacity-50"
                                        tabIndex={0}
                                    >
                                        {isSubmitting ? 'Creating...' : 'Create'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
