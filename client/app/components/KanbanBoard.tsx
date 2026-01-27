// client/app/components/KanbanBoard.tsx
"use client";
import React from 'react';

const COLUMNS = [
  { id: 'Quick_Win', label: '⚡ Quick Wins (< 1 Wk)', bg: 'bg-green-100', text: 'text-green-800' },
  { id: '30_Days',   label: '📅 30 Days',             bg: 'bg-blue-100',  text: 'text-blue-800' },
  { id: '90_Days',   label: '🗓️ 90 Days',             bg: 'bg-indigo-100',text: 'text-indigo-800' },
  { id: '360_Days',  label: '🏗️ 1 Year',              bg: 'bg-purple-100',text: 'text-purple-800' },
  { id: 'Completed', label: '✅ Completed',           bg: 'bg-gray-200',  text: 'text-gray-800' },
];

export default function KanbanBoard({ ideas, onUpdate }: { ideas: any[], onUpdate: any }) {

  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData("ideaId", id.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const ideaId = e.dataTransfer.getData("ideaId");
    onUpdate(ideaId, { status: newStatus });
  };

  const handleMarkComplete = (id: string) => {
      // Moves item to the 'Completed' column
      onUpdate(id, { status: 'Completed' });
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-[500px]">
      {COLUMNS.map(col => {
        // Filter ideas that match this column's ID
        const colIdeas = ideas.filter(i => i.status === col.id);

        return (
          <div 
            key={col.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`min-w-[280px] w-1/5 rounded-xl ${col.bg} p-4 flex flex-col`}
          >
            <h3 className={`font-bold ${col.text} mb-4 flex justify-between items-center`}>
              {col.label}
              <span className="bg-white/50 px-2 py-1 rounded-full text-xs text-black">
                {colIdeas.length}
              </span>
            </h3>

            <div className="flex-1 overflow-y-auto space-y-3">
              {colIdeas.map(idea => (
                <div 
                  key={idea.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idea.id)}
                  className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md cursor-grab active:cursor-grabbing"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold uppercase text-gray-400">{idea.category}</span>
                    {/* User Avatar / Initials */}
                    {idea.full_name && (
                         <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full" title={idea.full_name}>
                             👤 {idea.full_name.split(' ')[0]}
                         </span>
                    )}
                  </div>
                  
                  <p className="font-bold text-gray-800 text-sm mb-3">{idea.title}</p>
                  
                  {/* Action Buttons */}
                  <div className="flex justify-between items-center border-t pt-2 border-gray-100">
                      {col.id !== 'Completed' ? (
                          <button 
                            onClick={() => handleMarkComplete(idea.id)}
                            className="text-xs text-green-600 font-bold hover:bg-green-50 px-2 py-1 rounded transition"
                          >
                              Done? ✅
                          </button>
                      ) : (
                          <span className="text-xs text-gray-400 italic">Implemented</span>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}