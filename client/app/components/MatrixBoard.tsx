// client/app/components/MatrixBoard.tsx
"use client";
import React, { useState } from 'react';

// client/app/components/MatrixBoard.tsx

// Updated Quadrant Names & Descriptions
const QUADRANTS = [
  { 
    id: 'q1', 
    label: '💎 Quick Wins (High Impact, Low Effort)', 
    bg: 'bg-green-50', 
    impact: 'High', 
    effort: 'Low' 
  },
  { 
    id: 'q2', 
    label: '🏆 Major Projects (High Impact, High Effort)', 
    bg: 'bg-blue-50', 
    impact: 'High', 
    effort: 'High' 
  },
  { 
    id: 'q3', 
    label: '🔧 Incremental (Low Impact, Low Effort)', // Changed from "Fillers"
    bg: 'bg-yellow-50', 
    impact: 'Low', 
    effort: 'Low' 
  },
  { 
    id: 'q4', 
    label: '🗑️ Thankless Tasks (Low Impact, High Effort)', 
    bg: 'bg-red-50', 
    impact: 'Low', 
    effort: 'High' 
  },
];

// Added 'users' to the props
export default function MatrixBoard({ ideas, users, onUpdate, onPromote }: { ideas: any[], users: any[], onUpdate: any, onPromote: any }) {
  const inboxIdeas = ideas.filter(i => i.status === 'New');
  const matrixIdeas = ideas.filter(i => i.status === 'Triaged');

  // Local state to track who is selected for which card (before saving)
  const [selections, setSelections] = useState<{[key:number]: string}>({});

  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData("ideaId", id.toString());
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };

  const handleDrop = (e: React.DragEvent, impact: string, effort: string) => {
    e.preventDefault();
    const ideaId = e.dataTransfer.getData("ideaId");
    onUpdate(ideaId, { status: 'Triaged', impact, effort });
  };

  // Helper to handle the "Promote" click
  const handlePromoteClick = (ideaId: number, timeline: string) => {
    const userId = selections[ideaId]; // Get the selected user for this specific card
    
    if (!userId) {
      alert("⚠️ Please assign a user first!");
      return;
    }
    
    // Send both the timeline AND the user_id to the parent
    onPromote(ideaId, timeline, userId);
  };

  return (
    <div className="flex gap-8 mb-12 h-[600px]">
      {/* INBOX (Same as before) */}
      <div className="w-1/4 bg-gray-100 p-4 rounded-xl shadow-inner flex flex-col">
        <h2 className="font-bold text-gray-700 mb-4 flex items-center justify-between">
          📬 Inbox <span className="bg-gray-200 text-xs px-2 py-1 rounded-full">{inboxIdeas.length}</span>
        </h2>
        <div className="flex-1 overflow-y-auto space-y-3">
          {inboxIdeas.map(idea => (
            <div key={idea.id} draggable onDragStart={(e) => handleDragStart(e, idea.id)}
              className="bg-white p-4 rounded shadow border border-gray-200 cursor-move hover:shadow-md transition active:cursor-grabbing">
              <p className="font-semibold text-gray-800">{idea.title}</p>
              <p className="text-xs text-gray-400 mt-2">Drag to Matrix 👉</p>
            </div>
          ))}
        </div>
      </div>

      {/* MATRIX (Updated with User Select) */}
      <div className="w-3/4 grid grid-cols-2 grid-rows-2 gap-4">
        {QUADRANTS.map((quad) => {
          const quadIdeas = matrixIdeas.filter(i => i.impact === quad.impact && i.effort === quad.effort);

          return (
            <div key={quad.id} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, quad.impact, quad.effort)}
              className={`${quad.bg} border-2 border-dashed border-gray-200 rounded-xl p-4 relative`}>
              <h3 className="font-bold text-gray-600 text-sm uppercase mb-3 flex justify-between">{quad.label}</h3>
              
              <div className="space-y-2 max-h-[220px] overflow-y-auto">
                {quadIdeas.map((idea) => (
                  <div key={idea.id} className="bg-white/90 p-3 rounded shadow-sm border border-gray-100 group hover:shadow-md transition-all">
                    <p className="font-bold text-gray-800 text-sm">{idea.title}</p>
                    <p className="text-xs text-gray-500 mb-2">{idea.category}</p>
                    
                    {/* ASSIGNMENT UI (Appears on Hover) */}
                    <div className="hidden group-hover:block animate-in fade-in duration-200">
                      <div className="border-t border-gray-100 pt-2 mt-2">
                        
                        
                        {/* 1. Select User (High Visibility Version) */}
                        <select 
                          className="w-full text-xs p-2 mb-3 border-2 border-gray-300 rounded bg-white text-gray-900 font-bold focus:border-blue-500 focus:ring-blue-500"
                          value={selections[idea.id] || ""}
                          onChange={(e) => setSelections({...selections, [idea.id]: e.target.value})}
                        >
                          <option value="" className="text-gray-500">-- Assign Owner --</option>
                          {users.map(u => (
                            <option key={u.id} value={u.id} className="text-gray-900 font-medium">
                              👤 {u.full_name}
                            </option>
                          ))}
                        </select>

                        {/* 2. Pick Timeline (Only works if user selected) */}
                        <div className="flex flex-wrap gap-1 justify-between">
                          <button 
                            onClick={() => handlePromoteClick(idea.id, 'Quick_Win')} 
                            className="text-[10px] bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 flex-1"
                            title="Less than 1 week"
                          >
                            ⚡ Win
                          </button>
                          
                          <button 
                            onClick={() => handlePromoteClick(idea.id, '30_Days')} 
                            className="text-[10px] bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 flex-1"
                          >
                            📅 30d
                          </button>
                          
                          <button 
                            onClick={() => handlePromoteClick(idea.id, '90_Days')} 
                            className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-1 rounded hover:bg-indigo-200 flex-1"
                          >
                            🗓️ 90d
                          </button>

                          {/* NEW BUTTON ADDED HERE */}
                          <button 
                            onClick={() => handlePromoteClick(idea.id, '360_Days')} 
                            className="text-[10px] bg-purple-100 text-purple-800 px-2 py-1 rounded hover:bg-purple-200 flex-1"
                          >
                            🏗️ 1y
                          </button>
                        </div>

                      </div>
                    </div>

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