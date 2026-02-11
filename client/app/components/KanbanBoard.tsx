"use client";
import React from 'react';

const COLUMNS = [
  { id: 'Quick_Win', label: '⚡ Quick Wins (< 1 Wk)', bg: 'bg-blue-50 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  { id: '30_Days', label: '📅 30 Days', bg: 'bg-indigo-50 dark:bg-indigo-950', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' },
  { id: '90_Days', label: '🗓️ 90 Days', bg: 'bg-violet-50 dark:bg-violet-950', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800' },
  { id: '360_Days', label: '🏗️ 1 Year', bg: 'bg-slate-50 dark:bg-slate-950', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-800' },
];

export default function KanbanBoard({ ideas, onUpdate, isManager, onIdeaClick, isPro, onA3Click }: { ideas: any[], onUpdate: any, isManager: boolean, onIdeaClick: (idea: any) => void, isPro?: boolean, onA3Click: (idea: any) => void }) {


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
                const isMajor = (idea.impact === 'High' && idea.effort === 'High') || idea.category === 'Major Project';
                const overdue = isOverdue(idea.next_review_date);

                // Visual Theme based on Pro state
                const cardBorder = isPro && isMajor
                  ? 'border-2 border-purple-400 dark:border-purple-600 ring-2 ring-purple-100 dark:ring-purple-900/40'
                  : overdue
                    ? 'border-l-4 border-red-500'
                    : 'border border-gray-100';

                const cardBg = overdue ? 'bg-red-50' : 'bg-white';

                return (
                  <div key={idea.id} draggable={isManager} onDragStart={(e) => handleDragStart(e, idea.id)} onClick={() => onIdeaClick(idea)}
                    className={`${cardBg} ${cardBorder} dark:bg-gray-800 dark:border-gray-700 p-4 rounded-xl shadow-sm transition-all cursor-pointer hover:shadow-lg ${isManager ? 'active:cursor-grabbing' : ''} relative group`}>

                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col gap-1 w-full">
                        <div className="flex justify-between items-center w-full">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase text-gray-400">{idea.category}</span>
                            {isPro && isMajor && (
                              <span className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ring-1 ring-purple-200 dark:ring-purple-800">
                                Pro Major
                              </span>
                            )}
                          </div>
                          {idea.full_name && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full" title={idea.full_name}>👤 {idea.full_name.split(' ')[0]}</span>
                          )}
                        </div>

                        {/* A3 PROGRESS BAR */}
                        {isPro && isMajor && idea.a3_progress !== null && (
                          <div className="mt-2 w-full">
                            <div className="flex justify-between text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase mb-1">
                              <span>A3 Progress</span>
                              <span>{Math.round(idea.a3_progress)}%</span>
                            </div>
                            <div className="w-full bg-purple-100 dark:bg-purple-900/50 rounded-full h-1.5 overflow-hidden ring-1 ring-purple-200 dark:ring-purple-800">
                              <div
                                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                                style={{ width: `${idea.a3_progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-3 group-hover:text-blue-600 transition-colors">{idea.title}</p>

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

                    <div className="flex justify-between items-center border-t pt-2 border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        {col.id !== 'Completed' ? (
                          isManager ? (
                            <button onClick={(e) => { e.stopPropagation(); handleMarkComplete(idea.id); }} className="text-xs text-green-600 font-bold hover:bg-green-50 px-2 py-1 rounded transition">Done? ✅</button>
                          ) : (
                            <span className="text-xs text-gray-300 italic">In Progress</span>
                          )
                        ) : (
                          <span className="text-xs text-gray-400 italic">Implemented</span>
                        )}
                      </div>

                      {/* PRO DIRECT A3 LINK */}
                      {isPro && isMajor && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onA3Click(idea);
                          }}
                          className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                        >
                          A3 Workspace ↗
                        </button>
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