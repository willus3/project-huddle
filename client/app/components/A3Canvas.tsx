"use client";
import React, { useState, useEffect } from 'react';

interface A3CanvasProps {
    idea: any;
    onClose: () => void;
    isOpen: boolean;
}

interface TaskItem {
    id: number;
    task: string;
    owner: string;
    dueDate: string;
    status: 'Pending' | 'In Progress' | 'Done';
}

export default function A3Canvas({ idea, onClose, isOpen }: A3CanvasProps) {
    const [a3Data, setA3Data] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Form States
    const [formData, setFormData] = useState({
        background: "",
        current_condition: "",
        target_condition: "",
        root_cause_analysis: { five_whys: ["", "", "", "", ""], fishbone: {} },
        countermeasures: "", // Fixed: Initialize as string
        implementation_plan: [] as TaskItem[], // Fixed: Typed array
        effect_confirmation: "",
        standardization: "",
        status: "Draft"
    });

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    useEffect(() => {
        if (isOpen && idea) {
            fetchA3Data();
        }
    }, [isOpen, idea]);

    const fetchA3Data = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/a3/${idea.id}`, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setA3Data(data);
                // Helper to parse implementation plan
                let parsedPlan: TaskItem[] = [];
                try {
                    if (Array.isArray(data.implementation_plan)) {
                        parsedPlan = data.implementation_plan;
                    } else if (typeof data.implementation_plan === 'string') {
                        const parsed = JSON.parse(data.implementation_plan);
                        if (Array.isArray(parsed)) parsedPlan = parsed;
                    }
                } catch (e) {
                    parsedPlan = [];
                }

                // Ensure it is definitely an array
                if (!Array.isArray(parsedPlan)) parsedPlan = [];

                // Helper to clean text
                const cleanText = (val: any) => {
                    if (!val) return "";
                    if (typeof val === 'string') {
                        if (val === '{}' || val === '[]') return "";
                        return val;
                    }
                    return "";
                };

                setFormData({
                    background: data.background || idea.problem_statement || "",
                    current_condition: data.current_condition || "",
                    target_condition: data.target_condition || "",
                    root_cause_analysis: data.root_cause_analysis || { five_whys: ["", "", "", "", ""], fishbone: {} },
                    countermeasures: cleanText(data.countermeasures),
                    implementation_plan: parsedPlan,
                    effect_confirmation: data.effect_confirmation || "",
                    standardization: data.standardization || "",
                    status: data.status || "Draft"
                });
            } else {
                // Initialize New
                setFormData(prev => ({ ...prev, background: idea.problem_statement }));
            }
        } catch (err) {
            console.error("Failed to fetch A3", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const method = a3Data ? "PUT" : "POST";
            const url = a3Data ? `${API_BASE_URL}/a3/${a3Data.id}` : `${API_BASE_URL}/a3`;

            // Ensure implementation_plan is stringified for TEXT column
            const payload = {
                ...(a3Data ? formData : { idea_id: idea.id, ...formData }),
                implementation_plan: JSON.stringify(formData.implementation_plan)
            };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const saved = await res.json();
                setA3Data(saved);
                alert("A3 Saved Successfully!");
            }
        } catch (err) {
            console.error("Save failed", err);
            alert("Error saving A3");
        }
    };

    // Task List Helpers
    const addTask = () => {
        const newTask: TaskItem = { id: Date.now(), task: "", owner: "", dueDate: "", status: 'Pending' };
        setFormData({ ...formData, implementation_plan: [...formData.implementation_plan, newTask] });
    };

    const updateTask = (id: number, field: keyof TaskItem, value: any) => {
        const updated = formData.implementation_plan.map(t => t.id === id ? { ...t, [field]: value } : t);
        setFormData({ ...formData, implementation_plan: updated });
    };

    const removeTask = (id: number) => {
        setFormData({ ...formData, implementation_plan: formData.implementation_plan.filter(t => t.id !== id) });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-gray-100 dark:bg-gray-900 overflow-y-auto animate-in slide-in-from-bottom duration-300">
            {/* HEADER TOOLBAR */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 sticky top-0 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                        ← Back
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            📄 A3 Problem Solving Worksheet
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded border border-purple-200 uppercase">Pro Tier</span>
                        </h1>
                        <p className="text-xs text-gray-500">Ref: #{idea?.id} - {idea?.title}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-bold border border-gray-200 dark:border-gray-600">
                        Status: {formData.status}
                    </span>
                    <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow transition-colors">
                        💾 Save Workspace
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex h-full items-center justify-center">
                    <p className="text-gray-500 animate-pulse">Loading Workspace...</p>
                </div>
            ) : (
                <div className="max-w-[1800px] mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">

                    {/* --- LEFT SIDE: THE PLAN --- */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-t-4 border-blue-500">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b pb-2">1. Background & Context</h2>
                            <textarea
                                className="w-full h-32 p-3 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                placeholder="Why are we talking about this? What is the business context?"
                                value={formData.background}
                                onChange={e => setFormData({ ...formData, background: e.target.value })}
                            />
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-t-4 border-blue-500">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b pb-2">2. Current Condition</h2>
                            <textarea
                                className="w-full h-32 p-3 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                placeholder="What is happening right now? Insert data points or image URLs..."
                                value={formData.current_condition}
                                onChange={e => setFormData({ ...formData, current_condition: e.target.value })}
                            />
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-t-4 border-blue-500">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b pb-2">3. Goal / Target Condition</h2>
                            <textarea
                                className="w-full h-24 p-3 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                placeholder="SMART Goal: Specific, Measurable, Achievable, Relevant, Time-bound"
                                value={formData.target_condition}
                                onChange={e => setFormData({ ...formData, target_condition: e.target.value })}
                            />
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-t-4 border-red-500">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b pb-2">4. Root Cause Analysis (5 Whys)</h2>
                            <div className="space-y-3 bg-red-50 dark:bg-red-900/10 p-4 rounded-lg">
                                {formData.root_cause_analysis.five_whys?.map((why: string, idx: number) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <span className="font-bold text-red-500 w-16 text-right">Why {idx + 1}?</span>
                                        <input
                                            type="text"
                                            className="flex-1 p-2 border dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-sm focus:border-red-500 outline-none"
                                            value={why}
                                            onChange={(e) => {
                                                const newWhys = [...formData.root_cause_analysis.five_whys];
                                                newWhys[idx] = e.target.value;
                                                setFormData({
                                                    ...formData,
                                                    root_cause_analysis: { ...formData.root_cause_analysis, five_whys: newWhys }
                                                });
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* --- RIGHT SIDE: DO / CHECK / ACT --- */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-t-4 border-green-500">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b pb-2">5. Countermeasures & Experiments</h2>
                            <textarea
                                className="w-full h-40 p-3 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none"
                                placeholder="What specific actions will we take to address the root causes?"
                                value={formData.countermeasures}
                                onChange={e => setFormData({ ...formData, countermeasures: e.target.value })}
                            />
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-t-4 border-green-500">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b pb-2 flex justify-between items-center">
                                <span>6. Implementation Plan</span>
                                <button onClick={addTask} className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 px-2 py-1 rounded hover:bg-green-200 transition-colors">+ Add Task</button>
                            </h2>
                            <div className="space-y-2">
                                {formData.implementation_plan.length === 0 && <p className="text-gray-400 text-sm italic py-4 text-center">No tasks defined yet.</p>}
                                {formData.implementation_plan.map((task, idx) => (
                                    <div key={task.id} className="grid grid-cols-12 gap-2 bg-gray-50 dark:bg-gray-900 p-2 rounded-lg items-center text-sm">
                                        <div className="col-span-1 text-gray-400 font-mono text-xs">{idx + 1}.</div>
                                        <input
                                            placeholder="What?"
                                            className="col-span-5 bg-transparent border-b border-gray-300 dark:border-gray-700 focus:border-green-500 outline-none"
                                            value={task.task} onChange={e => updateTask(task.id, 'task', e.target.value)}
                                        />
                                        <input
                                            placeholder="Who?"
                                            className="col-span-2 bg-transparent border-b border-gray-300 dark:border-gray-700 focus:border-green-500 outline-none"
                                            value={task.owner} onChange={e => updateTask(task.id, 'owner', e.target.value)}
                                        />
                                        <input
                                            type="date"
                                            className="col-span-3 bg-transparent border-b border-gray-300 dark:border-gray-700 focus:border-green-500 outline-none text-xs"
                                            value={task.dueDate} onChange={e => updateTask(task.id, 'dueDate', e.target.value)}
                                        />
                                        <button onClick={() => removeTask(task.id)} className="col-span-1 text-red-400 hover:text-red-600 font-bold">×</button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-t-4 border-purple-500">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b pb-2">7. Effect Confirmation</h2>
                            <textarea
                                className="w-full h-24 p-3 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                                placeholder="How will we measure success?"
                                value={formData.effect_confirmation}
                                onChange={e => setFormData({ ...formData, effect_confirmation: e.target.value })}
                            />
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-t-4 border-gray-500">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b pb-2">8. Standardization / Follow-up</h2>
                            <textarea
                                className="w-full h-24 p-3 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-gray-500 outline-none resize-none"
                                placeholder="How do we sustain the gains? (SOPs, Training)"
                                value={formData.standardization}
                                onChange={e => setFormData({ ...formData, standardization: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
