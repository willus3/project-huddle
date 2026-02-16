
import React, { useState } from 'react';
import A3Canvas from './A3Canvas';

interface IdeaDetailsModalProps {
    idea: any;
    isOpen: boolean;
    onClose: () => void;
    users: any[];
    onUpdate: (id: string, data: any) => void;
    onPromote: (id: number, timeline: string, userId: string) => void;
    isManager: boolean;
    isPro?: boolean;
    currentUser: any;
}

export default function IdeaDetailsModal({ idea, isOpen, onClose, users, onUpdate, onPromote, isManager, isPro, currentUser }: IdeaDetailsModalProps) {
    const [assignedUserId, setAssignedUserId] = useState(idea?.assignee_id || "");
    const [showA3, setShowA3] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        title: "",
        category: "",
        problem_statement: "",
        proposed_solution: "",
        expected_benefit: ""
    });

    React.useEffect(() => {
        if (idea) {
            setAssignedUserId(idea.assignee_id || "");
            setEditForm({
                title: idea.title || "",
                category: idea.category || "",
                problem_statement: idea.problem_statement || "",
                proposed_solution: idea.proposed_solution || "",
                expected_benefit: idea.expected_benefit || ""
            });
            setIsEditing(false);
        }
    }, [idea]);

    if (!isOpen || !idea) return null;

    const isCreator = currentUser?.id === idea.submitter_id;
    const canEdit = isManager || isCreator;

    const handleSaveEdit = () => {
        onUpdate(idea.id, editForm);
        setIsEditing(false);
    };

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

    // PRO TIER LOGIC
    const isMajorProject = (idea.impact === 'High' && idea.effort === 'High') || idea.category === 'Major Project';

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={handleBackdropClick}>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700 flex flex-col animate-in fade-in zoom-in-95 duration-200">

                    {/* HEADER */}
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start sticky top-0 bg-white dark:bg-gray-800 z-10">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                {isEditing ? (
                                    <select
                                        className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide outline-none border border-blue-200 dark:border-blue-700"
                                        value={editForm.category}
                                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                    >
                                        <option>Safety</option>
                                        <option>Quality</option>
                                        <option>Delivery</option>
                                        <option>Cost</option>
                                        <option>Morale</option>
                                        <option>Major Project</option>
                                    </select>
                                ) : (
                                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
                                        {idea.category}
                                    </span>
                                )}
                                <span className="text-gray-400 dark:text-gray-500 text-xs font-mono">#{idea.id}</span>
                            </div>
                            {isEditing ? (
                                <input
                                    className="text-2xl font-bold text-gray-900 dark:text-white leading-tight w-full bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                />
                            ) : (
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{idea.title}</h2>
                            )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                            {canEdit && !isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                >
                                    Edit ✏️
                                </button>
                            )}
                            {isEditing && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSaveEdit}
                                        className="text-xs font-bold bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition shadow-sm"
                                    >
                                        Save ✅
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="text-xs font-bold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* CONTENT */}
                    <div className="p-6 space-y-8 flex-1">

                        {/* A3 CALL TO ACTION */}
                        {isMajorProject && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-xl p-4 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-purple-800 dark:text-purple-200 flex items-center gap-2">
                                        ⚡ Major Project Deep-Dive
                                        {!isPro && <span className="text-[10px] bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full uppercase">Pro Feature</span>}
                                        {isPro && <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded-full uppercase">Pro</span>}
                                    </h3>
                                    <p className="text-xs text-purple-600 dark:text-purple-300">
                                        {isPro
                                            ? "Access full A3 Root Cause Analysis workspace."
                                            : "Upgrade to Project Huddle Pro for A3 root-cause analysis."}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        if (isPro) setShowA3(true);
                                        else alert("🚀 This is a Pro Feature! Upgrade to access the A3 Root Cause Analysis Workspace.");
                                    }}
                                    className={`${isPro ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-400 cursor-not-allowed'} text-white font-bold py-2 px-4 rounded-lg text-sm shadow-md transition-all flex items-center gap-2`}
                                >
                                    {isPro ? "Open A3 Workspace ↗" : "Locked (Pro) 🔒"}
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl">
                                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Problem Statement</h3>
                                {isEditing ? (
                                    <textarea
                                        className="w-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 leading-relaxed border border-gray-200 dark:border-gray-700 p-2 rounded-lg h-32 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={editForm.problem_statement}
                                        onChange={(e) => setEditForm({ ...editForm, problem_statement: e.target.value })}
                                    />
                                ) : (
                                    <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{idea.problem_statement}</p>
                                )}
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl">
                                <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-2">Proposed Solution</h3>
                                {isEditing ? (
                                    <textarea
                                        className="w-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 leading-relaxed border border-blue-100 dark:border-blue-900 p-2 rounded-lg h-32 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={editForm.proposed_solution}
                                        onChange={(e) => setEditForm({ ...editForm, proposed_solution: e.target.value })}
                                    />
                                ) : (
                                    <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{idea.proposed_solution}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Expected Benefit</h3>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🚀</span>
                                {isEditing ? (
                                    <input
                                        className="flex-1 bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-200 font-medium text-lg border border-gray-200 dark:border-gray-700 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={editForm.expected_benefit}
                                        onChange={(e) => setEditForm({ ...editForm, expected_benefit: e.target.value })}
                                    />
                                ) : (
                                    <p className="text-gray-800 dark:text-gray-200 font-medium text-lg">{idea.expected_benefit}</p>
                                )}
                            </div>
                        </div>

                        <hr className="border-gray-100 dark:border-gray-700" />

                        {/* METADATA */}
                        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                            <div>
                                <p>Submitted by <span className="font-bold text-gray-900 dark:text-white">{idea.full_name || "Unknown"}</span></p>
                                {idea.assignee_name && <p className="mt-1">Assigned to <span className="font-bold text-blue-600 dark:text-blue-400">{idea.assignee_name}</span></p>}
                            </div>
                            <p className="text-right">Status: <span className="font-bold">{idea.status}</span></p>
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
                                            // Optional: Auto-update user immediately
                                            onUpdate(idea.id, { assignee_id: e.target.value });
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
            {/* A3 WORKSPACE OVERLAY */}
            <A3Canvas idea={idea} isOpen={showA3} onClose={() => setShowA3(false)} />
        </>
    );
}

