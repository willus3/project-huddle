import React, { useState } from 'react';

interface IdeaDetailsModalProps {
    idea: any;
    isOpen: boolean;
    onClose: () => void;
    users: any[];
    onUpdate: (id: string, data: any) => void;
    onPromote: (id: number, timeline: string, userId: string) => void;
    isManager: boolean;
}

export default function IdeaDetailsModal({ idea, isOpen, onClose, users, onUpdate, onPromote, isManager }: IdeaDetailsModalProps) {
    const [assignedUserId, setAssignedUserId] = useState(idea?.user_id || "");

    if (!isOpen || !idea) return null;

    const handlePromoteClick = (timeline: string) => {
        if (!assignedUserId) {
            alert("⚠️ Please assign an owner first!");
            return;
        }
        onPromote(idea.id, timeline, assignedUserId);
        onClose();
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={handleBackdropClick}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700 flex flex-col animate-in fade-in zoom-in-95 duration-200">

                {/* HEADER */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start sticky top-0 bg-white dark:bg-gray-800 z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
                                {idea.category}
                            </span>
                            <span className="text-gray-400 dark:text-gray-500 text-xs font-mono">#{idea.id}</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{idea.title}</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* CONTENT */}
                <div className="p-6 space-y-8 flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl">
                            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Problem Statement</h3>
                            <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{idea.problem_statement}</p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl">
                            <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-2">Proposed Solution</h3>
                            <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{idea.proposed_solution}</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Expected Benefit</h3>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🚀</span>
                            <p className="text-gray-800 dark:text-gray-200 font-medium text-lg">{idea.expected_benefit}</p>
                        </div>
                    </div>

                    <hr className="border-gray-100 dark:border-gray-700" />

                    {/* METADATA */}
                    <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                        <p>Submitted by <span className="font-bold text-gray-900 dark:text-white">{idea.full_name || "Unknown"}</span></p>
                        <p>Status: <span className="font-bold">{idea.status}</span></p>
                    </div>
                </div>

                {/* FOOTER ACTIONS (Manager Only) */}
                {isManager && (
                    <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Manager Actions</h3>
                        <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
                            <div className="w-full md:w-1/3">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Assign Owner</label>
                                <select
                                    className="w-full border-2 border-gray-200 dark:border-gray-600 p-2.5 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium outline-none focus:border-blue-500 transition-colors"
                                    value={assignedUserId}
                                    onChange={(e) => {
                                        setAssignedUserId(e.target.value);
                                        // Optional: Auto-update user immediately or wait for Promote? Let's just set local state for the Promote action interactions.
                                    }}
                                >
                                    <option value="">-- Select Owner --</option>
                                    {users.map(u => (<option key={u.id} value={u.id}>👤 {u.full_name}</option>))}
                                </select>
                            </div>

                            <div className="w-full md:w-2/3 grid grid-cols-2 md:grid-cols-4 gap-2">
                                <button onClick={() => handlePromoteClick('Quick_Win')} className="bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-200 py-3 rounded-lg font-bold text-sm transition-colors shadow-sm">⚡ Quick Win</button>
                                <button onClick={() => handlePromoteClick('30_Days')} className="bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 dark:hover:bg-indigo-800 text-indigo-700 dark:text-indigo-200 py-3 rounded-lg font-bold text-sm transition-colors shadow-sm">📅 30 Days</button>
                                <button onClick={() => handlePromoteClick('90_Days')} className="bg-violet-100 hover:bg-violet-200 dark:bg-violet-900 dark:hover:bg-violet-800 text-violet-700 dark:text-violet-200 py-3 rounded-lg font-bold text-sm transition-colors shadow-sm">🗓️ 90 Days</button>
                                <button onClick={() => handlePromoteClick('360_Days')} className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-3 rounded-lg font-bold text-sm transition-colors shadow-sm">🏗️ 1 Year</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
