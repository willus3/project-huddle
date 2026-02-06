"use client";
import React from 'react';

const COLUMNS = [
  { id: 'Quick_Win', label: '⚡ Quick Wins (< 1 Wk)', bg: 'bg-blue-50 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  { id: '30_Days', label: '📅 30 Days', bg: 'bg-indigo-50 dark:bg-indigo-950', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' },
  { id: '90_Days', label: '🗓️ 90 Days', bg: 'bg-violet-50 dark:bg-violet-950', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800' },
  { id: '360_Days', label: '🏗️ 1 Year', bg: 'bg-slate-50 dark:bg-slate-950', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-800' },
];

export default function KanbanBoard({ ideas, onUpdate, isManager, onIdeaClick }: { ideas: any[], onUpdate: any, isManager: boolean, onIdeaClick: (idea: any) => void }) {


  const handleDragStart = (e: React.DragEvent, id: number) => {
    if (!isManager) return;
    e.dataTransfer.setData("ideaId", id.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (isManager) e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (!isManager) return;
    const ideaId = e.dataTransfer.getData("ideaId");
    onUpdate(ideaId, { status: newStatus });
  };

  const handleMarkComplete = (id: string) => {
    onUpdate(id, { status: 'Completed' });
  };

  const handleDateChange = (id: string, newDate: string) => {
    onUpdate(id, { next_review_date: newDate });
  };

  const isOverdue = (dateString: string) => {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reviewDate = new Date(dateString);
    return reviewDate < today;
  };

  return (
    // Mobile: Snap scrolling container
    <div className="flex gap-4 overflow-x-auto pb-4 h-[500px] snap-x snap-mandatory">
      {COLUMNS.map(col => {
        const colIdeas = ideas.filter(i => i.status === col.id);

        return (
          <div key={col.id}
            onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, col.id)}
            // Mobile: 85vw width (so you see part of the next column). Desktop: 1/5 width.
            className={`min-w-[85vw] md:min-w-[250px] md:w-1/4 rounded-xl ${col.bg} ${col.border} border-2 p-4 flex flex-col snap-center`}>

            <h3 className={`font-bold ${col.text} mb-4 flex justify-between items-center`}>
              {col.label}
              <span className="bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded-full text-xs font-semibold shadow-sm">{colIdeas.length}</span>
            </h3>

            <div className="flex-1 overflow-y-auto space-y-3">
              {colIdeas.map(idea => {
                const overdue = isOverdue(idea.next_review_date);
                const cardBorder = overdue ? 'border-l-4 border-red-500' : 'border border-gray-100';
                const cardBg = overdue ? 'bg-red-50' : 'bg-white';

                return (
                  <div key={idea.id} draggable={isManager} onDragStart={(e) => handleDragStart(e, idea.id)} onClick={() => onIdeaClick(idea)}
                    className={`${cardBg} ${cardBorder} dark:bg-gray-800 dark:border-gray-700 p-4 rounded-lg shadow-sm transition-all cursor-pointer hover:shadow-lg ${isManager ? 'active:cursor-grabbing' : ''}`}>

                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold uppercase text-gray-400">{idea.category}</span>
                      {idea.full_name && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full" title={idea.full_name}>👤 {idea.full_name.split(' ')[0]}</span>
                      )}
                    </div>

                    <p className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-3">{idea.title}</p>

                    {col.id !== 'Completed' && (
                      <div className="mb-3">
                        <label className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
                          {overdue && <span className="text-red-600 animate-pulse">⚠️ Review Due:</span>}
                          {!overdue && <span>Next Review:</span>}
                        </label>
                        <input
                          type="date" disabled={!isManager}
                          className={`text-xs p-1 rounded border w-full mt-1 ${overdue ? 'border-red-300 text-red-700 bg-red-100 font-bold' : 'border-gray-200 text-gray-600'} ${!isManager && 'opacity-50 cursor-not-allowed'}`}
                          value={idea.next_review_date ? idea.next_review_date.split('T')[0] : ''}
                          onChange={(e) => handleDateChange(idea.id, e.target.value)}
                        />
                      </div>
                    )}

                    <div className="flex justify-between items-center border-t pt-2 border-gray-100">
                      {col.id !== 'Completed' ? (
                        isManager ? (
                          <button onClick={() => handleMarkComplete(idea.id)} className="text-xs text-green-600 font-bold hover:bg-green-50 px-2 py-1 rounded transition">Done? ✅</button>
                        ) : (
                          <span className="text-xs text-gray-300 italic">In Progress</span>
                        )
                      ) : (
                        <span className="text-xs text-gray-400 italic">Implemented</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}