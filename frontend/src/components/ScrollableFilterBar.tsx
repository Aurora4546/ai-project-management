import React, { useState, useEffect, useRef } from 'react';

interface ScrollableFilterBarProps {
    children: React.ReactNode;
}

export const ScrollableFilterBar: React.FC<ScrollableFilterBarProps> = ({ children }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = () => {
        if (containerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
            setCanScrollLeft(scrollLeft > 0);
            // Allow a tiny margin of error (1px) for floating point rendering
            setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        
        // Also check scroll after children might have rendered/changed
        const timeout = setTimeout(checkScroll, 100);
        return () => {
            window.removeEventListener('resize', checkScroll);
            clearTimeout(timeout);
        };
    }, [children]);

    const scrollBy = (amount: number) => {
        if (containerRef.current) {
            containerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
            // The scroll event listener on the container will update the arrows
        }
    };

    return (
        <div className="relative flex items-center w-full min-w-0 max-w-full">
            {canScrollLeft && (
                <div className="absolute left-0 z-10 h-full flex items-center bg-gradient-to-r from-[#f8fafc] via-[#f8fafc] to-transparent pr-4 -ml-2">
                    <button
                        onClick={() => scrollBy(-200)}
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all ml-2"
                        aria-label="Scroll left"
                    >
                        <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>
                </div>
            )}
            
            <div 
                ref={containerRef}
                onScroll={checkScroll}
                className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth flex-1 min-w-0 py-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {children}
            </div>

            {canScrollRight && (
                <div className="absolute right-0 z-10 h-full flex items-center bg-gradient-to-l from-[#f8fafc] via-[#f8fafc] to-transparent pl-4 -mr-2">
                    <button
                        onClick={() => scrollBy(200)}
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all mr-2"
                        aria-label="Scroll right"
                    >
                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                </div>
            )}
        </div>
    );
};
