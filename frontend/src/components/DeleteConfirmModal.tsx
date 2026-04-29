

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemName?: string;
    itemType?: string;
}

export const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, itemName = 'this item' }: DeleteConfirmModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm font-inter">
            <div 
                className="bg-white rounded-2xl shadow-xl w-full max-w-[320px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                role="dialog"
                aria-modal="true"
            >
                {/* Body */}
                <div className="p-6 pb-2">
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0 mb-1">
                            <span className="material-symbols-outlined text-[24px]">delete</span>
                        </div>
                        <p className="text-[14px] text-slate-700 leading-relaxed">
                            Are you sure you want to delete <span className="font-bold text-slate-900">{itemName}</span>?<br/>
                            <span className="text-slate-500 text-[13px] mt-1 inline-block">This action cannot be undone.</span>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 pt-4 bg-white shrink-0 w-full">
                    <button 
                        onClick={onClose}
                        className="flex-1 px-4 py-2 text-[13px] font-bold text-slate-600 hover:bg-slate-100 bg-white border border-slate-200 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="flex-1 px-4 py-2 text-[13px] font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};
