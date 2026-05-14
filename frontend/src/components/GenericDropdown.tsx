import { useState, useEffect, useRef } from 'react';
import { formatEnum } from '../utils';

interface GenericDropdownProps {

    label: string;
    options: string[];
    selected: string[];
    onToggle: (val: string) => void;
}

export const GenericDropdown = ({ 
    label, 
    options, 
    selected, 
    onToggle 
}: GenericDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 bg-white border rounded-md text-[13px] font-medium transition-colors shadow-sm h-[38px] ${
                    selected.length > 0
                    ? 'border-blue-400 text-blue-700 bg-blue-50/30' 
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
            >
                {label}
                {selected.length > 0 && <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none">{selected.length}</span>}
                <span className="material-symbols-outlined text-[16px] text-slate-400">arrow_drop_down</span>
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-2 z-30">
                    {options.length === 0 ? (
                        <div className="px-4 py-2 text-[12px] text-slate-500 text-center">No options available</div>
                    ) : (
                        <div className="max-h-48 overflow-y-auto px-2 custom-scrollbar">
                            {options.map(item => {
                                const isSelected = selected.includes(item);
                                return (
                                    <label key={item} 
                                           onClick={(e) => { e.preventDefault(); onToggle(item); }}
                                           className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-slate-50 rounded group">
                                        <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-300 group-hover:border-blue-400'}`}>
                                            {isSelected && <span className="material-symbols-outlined text-white text-[12px] font-bold">check</span>}
                                        </div>
                                        <span className="text-[13px] text-slate-700 select-none truncate" title={item}>{formatEnum(item)}</span>
                                    </label>

                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
