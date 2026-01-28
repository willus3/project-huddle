"use client";
import React, { useState } from 'react';

const QUADRANTS = [
  { id: 'q1', label: '💎 Quick Wins (High Impact, Low Effort)', bg: 'bg-teal-50 dark:bg-teal-950', border: 'border-teal-200 dark:border-teal-800', text: 'text-teal-700 dark:text-teal-300' },
  { id: 'q2', label: '🏆 Major Projects (High Impact, High Effort)', bg: 'bg-cyan-50 dark:bg-cyan-950', border: 'border-cyan-200 dark:border-cyan-800', text: 'text-cyan-700 dark:text-cyan-300' },
  { id: 'q3', label: '🔧 Incremental (Low Impact, Low Effort)', bg: 'bg-amber-50 dark:bg-amber-950', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300' },
  { id: 'q4', label: '🗑️ Thankless Tasks (Low Impact, High Effort)', bg: 'bg-rose-50 dark:bg-rose-950', border: 'border-rose-200 dark:border-rose-800', text: 'text-rose-700 dark:text-rose-300' },
];

export default function MatrixBoard({ ideas, users, onUpdate, onPromote, isManager }: { ideas: any[], users: any[], onUpdate: any, onPromote: any, isManager: boolean }) {
  const inboxIdeas = ideas.filter(i => i.status === 'New');
  const matrixIdeas = ideas.filter(i => i.status === 'Triaged');
  const [selections, setSelections] = useState<{[key:number]: string}>({});

  const handleDragStart = (e: React.DragEvent, id: number) => {
    if (!isManager) return; 
    e.dataTransfer.setData("ideaId", id.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (isManager) e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, impact: string, effort: string) => {
    e.preventDefault();
    if (!isManager) return;
    const ideaId = e.dataTransfer.getData("ideaId");
    onUpdate(ideaId, { status: 'Triaged', impact, effort });
  };

  const handlePromoteClick = (ideaId: number, timeline: string) => {
    const userId = selections[ideaId];
    if (!userId) { alert("⚠️ Please assign a user first!"); return; }
    onPromote(ideaId, timeline, userId);
  };

  return (
    // Stack Vertical on Mobile, Row on Desktop
    <div className="flex flex-col lg:flex-row gap-8 mb-12 h-auto lg:h-[600px]">
      {/* INBOX */}
      <div className="w-full lg:w-1/4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 p-4 rounded-xl flex flex-col max-h-[400px] lg:max-h-full">
        <h2 className="font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center justify-between">
          📬 Inbox <span className="bg-slate-200 dark:bg-slate-700 text-xs px-2 py-1 rounded-full font-semibold shadow-sm">{inboxIdeas.length}</span>
        </h2>
        <div className="flex-1 overflow-y-auto space-y-3 min-h-[100px]">
          {inboxIdeas.map(idea => (
            <div key={idea.id} 
              draggable={isManager} 
              onDragStart={(e) => handleDragStart(e, idea.id)}
              className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition ${isManager ? 'cursor-move hover:shadow-lg active:cursor-grabbing' : 'cursor-default opacity-90'}`}>
              <p className="font-semibold text-gray-800 dark:text-gray-100">{idea.title}</p>
              {isManager && <p className="text-xs text-gray-400 mt-2">Drag to Matrix 👉</p>}
            </div>
          ))}
          {inboxIdeas.length === 0 && <p className="text-sm text-gray-400 italic">No new ideas.</p>}
        </div>
      </div>

      {/* MATRIX - 1 Column Mobile, 2 Columns Desktop */}
      <div className="w-full lg:w-3/4 grid grid-cols-1 md:grid-cols-2 grid-rows-4 md:grid-rows-2 gap-4">
        {QUADRANTS.map((quad) => {
          const quadIdeas = matrixIdeas.filter(i => i.impact === quad.impact && i.effort === quad.effort);
          return (
            <div key={quad.id} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, quad.impact, quad.effort)}
              className={`${quad.bg} border-2 border-dashed ${quad.border} rounded-xl p-4 relative min-h-[200px]`}>
              <h3 className={`font-bold ${quad.text} text-sm uppercase mb-3`}>{quad.label}</h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {quadIdeas.map((idea) => (
                  <div key={idea.id} className="bg-white/95 dark:bg-gray-800/95 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 group hover:shadow-lg transition-all">
                    <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{idea.title}</p>
                    <p className="text-xs text-gray-500 mb-2">{idea.category}</p>
                    
                    {/* ASSIGNMENT UI - VISIBLE ON MOBILE, HOVER ON DESKTOP */}
                    {isManager && (
                      <div className="block md:hidden group-hover:block animate-in fade-in duration-200 mt-2 border-t pt-2 md:mt-0 md:border-0 md:pt-0">
                        <div className="md:border-t md:border-gray-100 md:pt-2 md:mt-2">
                          <select className="w-full text-xs p-2 mb-3 border-2 border-gray-300 rounded bg-white text-gray-900 font-bold"
                            value={selections[idea.id] || ""} onChange={(e) => setSelections({...selections, [idea.id]: e.target.value})}>
                            <option value="">-- Assign Owner --</option>
                            {users.map(u => (<option key={u.id} value={u.id}>👤 {u.full_name}</option>))}
                          </select>
                          <div className="flex flex-wrap gap-1 justify-between">
                            <button onClick={() => handlePromoteClick(idea.id, 'Quick_Win')} className="text-[10px] bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 px-2 py-1 rounded hover:bg-teal-200 dark:hover:bg-teal-800 flex-1 font-medium shadow-sm">⚡ Win</button>
                            <button onClick={() => handlePromoteClick(idea.id, '30_Days')} className="text-[10px] bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 px-2 py-1 rounded hover:bg-cyan-200 dark:hover:bg-cyan-800 flex-1 font-medium shadow-sm">📅 30d</button>
                            <button onClick={() => handlePromoteClick(idea.id, '90_Days')} className="text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded hover:bg-indigo-200 dark:hover:bg-indigo-800 flex-1 font-medium shadow-sm">🗓️ 90d</button>
                            <button onClick={() => handlePromoteClick(idea.id, '360_Days')} className="text-[10px] bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded hover:bg-purple-200 dark:hover:bg-purple-800 flex-1 font-medium shadow-sm">🏗️ 1y</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}