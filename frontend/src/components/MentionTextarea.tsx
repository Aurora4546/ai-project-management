import React, { useState, useRef, useEffect, useCallback } from 'react'

interface SuggestionItem {
    id: string | number
    display: string
    avatar?: string
    avatarColor?: string
    title?: string
    icon?: string
    iconColor?: string
}

interface MentionTextareaProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
    minHeight?: number
    memberData?: SuggestionItem[]
    issueData?: SuggestionItem[]
    onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
    onPaste?: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void
}

export const MentionTextarea = ({
    value,
    onChange,
    placeholder,
    className = '',
    minHeight = 120,
    memberData = [],
    issueData = [],
    onKeyDown,
    onPaste
}: MentionTextareaProps) => {
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [suggestionType, setSuggestionType] = useState<'@' | '#' | null>(null)
    const [query, setQuery] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [cursorPosition, setCursorPosition] = useState(0)
    const [triggerStart, setTriggerStart] = useState(-1)

    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const suggestionsRef = useRef<HTMLDivElement>(null)

    const getSuggestions = useCallback((): SuggestionItem[] => {
        const data = suggestionType === '@' ? memberData : issueData
        if (!query) return data.slice(0, 8)
        return data
            .filter(item => item.display.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 8)
    }, [suggestionType, query, memberData, issueData])

    const suggestions = getSuggestions()

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value
        const cursor = e.target.selectionStart || 0
        onChange(newValue)
        setCursorPosition(cursor)

        // Check for trigger character
        const textBeforeCursor = newValue.slice(0, cursor)
        const atMatch = textBeforeCursor.match(/@([^\s@#]*)$/)
        const hashMatch = textBeforeCursor.match(/#([^\s@#]*)$/)

        if (atMatch) {
            setSuggestionType('@')
            setQuery(atMatch[1])
            setTriggerStart(cursor - atMatch[0].length)
            setShowSuggestions(true)
            setSelectedIndex(0)
        } else if (hashMatch) {
            setSuggestionType('#')
            setQuery(hashMatch[1])
            setTriggerStart(cursor - hashMatch[0].length)
            setShowSuggestions(true)
            setSelectedIndex(0)
        } else {
            setShowSuggestions(false)
            setSuggestionType(null)
        }
    }

    const insertMention = useCallback((item: SuggestionItem) => {
        if (triggerStart < 0 || !textareaRef.current) return

        const trigger = suggestionType || '@'
        const mentionText = `${trigger}[${item.display}](${item.id}) `
        const before = value.slice(0, triggerStart)
        const after = value.slice(cursorPosition)
        const newValue = before + mentionText + after

        onChange(newValue)
        setShowSuggestions(false)
        setSuggestionType(null)
        setQuery('')

        // Restore focus and cursor
        requestAnimationFrame(() => {
            if (textareaRef.current) {
                const newCursor = triggerStart + mentionText.length
                textareaRef.current.focus()
                textareaRef.current.setSelectionRange(newCursor, newCursor)
            }
        })
    }, [triggerStart, cursorPosition, value, suggestionType, onChange])

    const handleInternalKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (!showSuggestions || suggestions.length === 0) {
            if (onKeyDown) onKeyDown(e)
            return
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex(prev => (prev + 1) % suggestions.length)
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length)
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault()
            insertMention(suggestions[selectedIndex])
        } else if (e.key === 'Escape') {
            e.preventDefault()
            setShowSuggestions(false)
        }
    }

    // Close suggestions on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target as Node) &&
                textareaRef.current &&
                !textareaRef.current.contains(event.target as Node)
            ) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className="relative">
            <textarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                onKeyDown={handleInternalKeyDown}
                onPaste={onPaste}
                placeholder={placeholder}
                className={`w-full resize-y focus:outline-none ${className}`}
                style={{ minHeight }}
                aria-label="Text input with mention support"
                tabIndex={0}
            />

            {showSuggestions && suggestions.length > 0 && (
                <div
                    ref={suggestionsRef}
                    className="absolute z-[9999] left-[-42px] md:left-4 bottom-full mb-3 w-[calc(100vw-32px)] md:w-80 max-w-[320px] bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200"
                    style={{ maxHeight: 350, overflowY: 'auto' }}
                >
                    <div className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[14px]">
                                {suggestionType === '@' ? 'group' : 'list_alt'}
                            </span>
                            <span>{suggestionType === '@' ? 'Team Members' : 'Project Issues'}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-60">
                            <span className="font-bold">Keys</span>
                            <span className="material-symbols-outlined text-[12px]">keyboard_arrow_up</span>
                            <span className="material-symbols-outlined text-[12px]">keyboard_arrow_down</span>
                        </div>
                    </div>

                    <div className="p-1.5">
                        {suggestions.map((item, index) => (
                            <div
                                key={`${item.id}-${index}`}
                                onClick={() => insertMention(item)}
                                onMouseEnter={() => setSelectedIndex(index)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                                    index === selectedIndex
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 -translate-y-0.5'
                                        : 'text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                {suggestionType === '@' ? (
                                    <div 
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-black shrink-0 transition-all border-2 ${
                                            index === selectedIndex 
                                            ? 'border-white/50 scale-110 shadow-[0_0_15px_rgba(255,255,255,0.4)] z-10' 
                                            : 'border-white shadow-sm ring-1 ring-slate-100'
                                        }`} 
                                        style={{ backgroundColor: item.avatarColor || '#6366f1', color: '#fff' }}
                                    >
                                        {item.display.charAt(0).toUpperCase()}
                                    </div>
                                ) : (
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                                        index === selectedIndex 
                                        ? 'bg-white/20 border-white/40 scale-110 shadow-inner z-10' 
                                        : 'bg-white border-slate-100 shadow-sm'
                                    }`}>
                                        <span 
                                            className={`material-symbols-outlined text-[22px] transition-all ${
                                                index === selectedIndex ? 'text-white' : ''
                                            }`}
                                            style={index === selectedIndex ? {} : { color: item.iconColor || '#475569' }}
                                        >
                                            {item.icon || 'tag'}
                                        </span>
                                    </div>
                                )}
                                <div className="flex flex-col min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={`font-black tracking-tight truncate ${index === selectedIndex ? 'text-white text-[15px]' : 'text-slate-900 text-[14px]'}`}>
                                            {item.display}
                                        </span>
                                        {suggestionType === '#' && (
                                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                                                index === selectedIndex ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                                            }`}>
                                                Issue
                                            </span>
                                        )}
                                    </div>
                                    {suggestionType === '#' && item.title && (
                                        <span className={`text-[11px] font-bold truncate leading-tight mt-0.5 ${index === selectedIndex ? 'text-indigo-100' : 'text-slate-400'}`}>
                                            {item.title}
                                        </span>
                                    )}
                                    {suggestionType === '@' && (
                                        <span className={`text-[11px] font-bold truncate leading-tight mt-0.5 ${index === selectedIndex ? 'text-indigo-100' : 'text-slate-400'}`}>
                                            Team Member
                                        </span>
                                    )}
                                </div>
                                {index === selectedIndex && (
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] font-black text-white/50 uppercase tracking-tighter">Enter</span>
                                        <span className="material-symbols-outlined text-[16px] text-white/80">keyboard_return</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    {suggestions.length === 0 && (
                        <div className="px-4 py-6 text-center text-slate-400 italic text-[12px]">
                            No matches found
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
