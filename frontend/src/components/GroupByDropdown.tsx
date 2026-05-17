import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export type GroupByOption = 'NONE' | 'ASSIGNEE' | 'EPIC' | 'STATUS';

interface GroupByDropdownProps {
    groupBy: GroupByOption;
    setGroupBy: (val: GroupByOption) => void;
    options: GroupByOption[];
}

export const GroupByDropdown = ({ groupBy, setGroupBy, options }: GroupByDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                const isPortalClick = (e.target as Element).closest('[data-group-portal="true"]');
                if (!isPortalClick) {
                    setIsOpen(false);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOpen = () => {
        if (!isOpen && dropdownRef.current) {
            setTriggerRect(dropdownRef.current.getBoundingClientRect());
        }
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        if (!isOpen) return;
        const updateRect = () => {
            if (dropdownRef.current) setTriggerRect(dropdownRef.current.getBoundingClientRect());
        };
        window.addEventListener('scroll', updateRect, true);
        window.addEventListener('resize', updateRect);
        return () => {
            window.removeEventListener('scroll', updateRect, true);
            window.removeEventListener('resize', updateRect);
        };
    }, [isOpen]);

    return (
        <div className="relative shrink-0" ref={dropdownRef}>
            <button
                onClick={toggleOpen}
                className={`flex items-center gap-2 px-3 py-2 bg-white border rounded-md text-[13px] font-medium transition-colors shadow-sm h-[38px] whitespace-nowrap ${
                    groupBy !== 'NONE'
                        ? 'border-blue-400 text-blue-700 bg-blue-50/30'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
            >
                <span className="material-symbols-outlined text-[16px] text-slate-400">view_agenda</span>
                {groupBy === 'NONE' ? 'Group' : `Group: ${groupBy.charAt(0) + groupBy.slice(1).toLowerCase().replace('_', ' ')}`}
            </button>
            {isOpen && triggerRect && createPortal(
                <div 
                    data-group-portal="true"
                    className="fixed mt-1 w-44 bg-white border border-slate-200 rounded-md shadow-xl py-1 z-[9999]"
                    style={{
                        top: triggerRect.bottom,
                        left: triggerRect.left
                    }}
                >
                    {options.map(g => (
                        <button
                            key={g}
                            onClick={() => { setGroupBy(g); setIsOpen(false); }}
                            className={`w-full text-left px-3 py-2.5 text-[13px] hover:bg-slate-50 ${
                                groupBy === g ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700'
                            }`}
                        >
                            {g === 'NONE' ? 'None' : g === 'ASSIGNEE' ? 'Assignee' : g === 'EPIC' ? 'Epic' : 'Status'}
                        </button>
                    ))}
                </div>,
                document.body
            )}
        </div>
    );
};
