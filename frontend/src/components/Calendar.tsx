import { useState } from 'react'

interface CalendarProps {
    value: string | null;
    onChange: (date: string) => void;
    onSave: () => void;
}

export const Calendar = ({ value, onChange, onSave }: CalendarProps) => {
    const [curr, setCurr] = useState(value ? new Date(value) : new Date());
    const daysInMonth = new Date(curr.getFullYear(), curr.getMonth() + 1, 0).getDate();
    const firstDay = new Date(curr.getFullYear(), curr.getMonth(), 1).getDay();
    const selected = value ? new Date(value) : null;

    const prevMonth = () => setCurr(new Date(curr.getFullYear(), curr.getMonth() - 1, 1));
    const nextMonth = () => setCurr(new Date(curr.getFullYear(), curr.getMonth() + 1, 1));

    return (
        <div className="bg-white rounded-lg p-3 w-[260px] select-none shadow-2xl border border-slate-200" onClick={e => e.stopPropagation()} data-active-editor="true">
            <div className="flex items-center justify-between mb-4 px-1">
                <span className="text-[13px] font-bold text-slate-700">
                    {curr.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <div className="flex gap-1">
                    <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded transition-colors" type="button">
                        <span className="material-symbols-outlined text-[18px] text-slate-400">chevron_left</span>
                    </button>
                    <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded transition-colors" type="button">
                        <span className="material-symbols-outlined text-[18px] text-slate-400">chevron_right</span>
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[10px] font-bold text-slate-400 uppercase">
                {['S','M','T','W','T','F','S'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${curr.getFullYear()}-${String(curr.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                    const isSelected = selected && selected.getFullYear() === curr.getFullYear() && selected.getMonth() === curr.getMonth() && selected.getDate() === day;
                    const isToday = new Date().toDateString() === new Date(curr.getFullYear(), curr.getMonth(), day).toDateString();
                    
                    return (
                        <div 
                            key={day}
                            onClick={() => onChange(dateStr)}
                            className={`h-8 w-8 flex items-center justify-center rounded-md cursor-pointer text-[12px] font-medium transition-all
                                ${isSelected ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-blue-50 text-slate-600'}
                                ${isToday && !isSelected ? 'border border-blue-200 text-blue-600 font-bold' : ''}`}
                        >
                            {day}
                        </div>
                    );
                })}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-2">
               <button 
                    type="button"
                    className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-[11px] font-bold shadow-sm hover:bg-blue-800 transition-colors"
                    onClick={onSave}
                >
                    Save Date
                </button>
            </div>
        </div>
    );
};
