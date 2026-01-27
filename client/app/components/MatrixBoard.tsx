"use client";
import React, { useState } from 'react';

const QUADRANTS = [
  { id: 'q1', label: '💎 Quick Wins (High Impact, Low Effort)', bg: 'bg-green-50', impact: 'High', effort: 'Low' },
  { id: 'q2', label: '🏆 Major Projects (High Impact, High Effort)', bg: 'bg-blue-50', impact: 'High', effort: 'High' },
  { id: 'q3', label: '🔧 Incremental (Low Impact, Low Effort)', bg: 'bg-yellow-50', impact: 'Low', effort: 'Low' },
  { id: 'q4', label: '🗑️ Thankless Tasks (Low Impact, High Effort)', bg: 'bg-red-50', impact: 'Low', effort: 'High' },
];

// Added 'isManager' prop
export default function MatrixBoard({ ideas, users, onUpdate, onPromote, isManager }: { ideas: any[], users: any[], onUpdate: any, onPromote: any, isManager: boolean }) {
  const inboxIdeas = ideas.filter(i => i.status === 'New');
  const matrixIdeas = ideas.filter(i => i.status === 'Triaged');
  const [selections, setSelections] = useState<{[key:number]: string}>({});

  const handleDragStart = (e: React.DragEvent, id: number) => {
    if (!isManager) return; // Prevent employees from dragging
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
    <div className="flex gap-8 mb-12 h-[600px]">
      {/* INBOX */}
      <div className="w-1/4 bg-gray-100 p-4 rounded-xl shadow-inner flex flex-col">
        <h2 className="font-bold text-gray-700 mb-4 flex items-center justify-between">
          📬 Inbox <span className="bg-gray-200 text-xs px-2 py-1 rounded-full">{inboxIdeas.length}</span>
        </h2>
        <div className="flex-1 overflow-y-auto space-y-3">
          {inboxIdeas.map(idea => (
            <div key={idea.id} 
              draggable={isManager} // Only draggable if manager
              onDragStart={(e) => handleDragStart(e, idea.id)}
              className={`bg-white p-4 rounded shadow border border-gray-200 transition ${isManager ? 'cursor-move hover:shadow-md active:cursor-grabbing' : 'cursor-default opacity-90'}`}>
              <p className="font-semibold text-gray-800">{idea.title}</p>
              {isManager && <p className="text-xs text-gray-400 mt-2">Drag to Matrix 👉</p>}
            </div>
          ))}
          {inboxIdeas.length === 0 && <p className="text-sm text-gray-400 italic">No new ideas.</p>}
        </div>
      </div>

      {/* MATRIX */}
      <div className="w-3/4 grid grid-cols-2 grid-rows-2 gap-4">
        {QUADRANTS.map((quad) => {
          const quadIdeas = matrixIdeas.filter(i => i.impact === quad.impact && i.effort === quad.effort);
          return (
            <div key={quad.id} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, quad.impact, quad.effort)}
              className={`${quad.bg} border-2 border-dashed border-gray-200 rounded-xl p-4 relative`}>
              <h3 className="font-bold text-gray-600 text-sm uppercase mb-3">{quad.label}</h3>
              <div className="space-y-2 max-h-[220px] overflow-y-auto">
                {quadIdeas.map((idea) => (
                  <div key={idea.id} className="bg-white/90 p-3 rounded shadow-sm border border-gray-100 group hover:shadow-md transition-all">
                    <p className="font-bold text-gray-800 text-sm">{idea.title}</p>
                    <p className="text-xs text-gray-500 mb-2">{idea.category}</p>
                    
                    {/* ASSIGNMENT UI - Only visible to Manager */}
                    {isManager && (
                      <div className="hidden group-hover:block animate-in fade-in duration-200">
                        <div className="border-t border-gray-100 pt-2 mt-2">
                          <select className="w-full text-xs p-2 mb-3 border-2 border-gray-300 rounded bg-white text-gray-900 font-bold"
                            value={selections[idea.id] || ""} onChange={(e) => setSelections({...selections, [idea.id]: e.target.value})}>
                            <option value="">-- Assign Owner --</option>
                            {users.map(u => (<option key={u.id} value={u.id}>👤 {u.full_name}</option>))}
                          </select>
                          <div className="flex flex-wrap gap-1 justify-between">
                            <button onClick={() => handlePromoteClick(idea.id, 'Quick_Win')} className="text-[10px] bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 flex-1">⚡ Win</button>
                            <button onClick={() => handlePromoteClick(idea.id, '30_Days')} className="text-[10px] bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 flex-1">📅 30d</button>
                            <button onClick={() => handlePromoteClick(idea.id, '90_Days')} className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-1 rounded hover:bg-indigo-200 flex-1">🗓️ 90d</button>
                            <button onClick={() => handlePromoteClick(idea.id, '360_Days')} className="text-[10px] bg-purple-100 text-purple-800 px-2 py-1 rounded hover:bg-purple-200 flex-1">🏗️ 1y</button>
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