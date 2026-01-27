"use client";

import { useState, useEffect } from "react";
import KanbanBoard from "./components/KanbanBoard";
import MatrixBoard from "./components/MatrixBoard";

export default function Home() {
  // --- STATE ---
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showSettings, setShowSettings] = useState(false);
  
  const [users, setUsers] = useState([]);
  const [ideas, setIdeas] = useState<any[]>([]);
  
  // Stats & Filters
  const [teamStats, setTeamStats] = useState<any>(null);
  const [companyStats, setCompanyStats] = useState<any[]>([]); 
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>("all");

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [errorMsg, setErrorMsg] = useState("");
  const [formData, setFormData] = useState({
    title: "", problem_statement: "", proposed_solution: "", expected_benefit: "", category: "Safety", 
  });
  const [newGoal, setNewGoal] = useState(10);

  // --- HELPER FUNCTIONS (Defined before useEffects) ---
  const fetchUsers = () => fetch("http://localhost:5000/users").then(res => res.json()).then(setUsers);
  
  // UPDATED: Now accepts a filter argument
  const fetchIdeas = (teamId: string = "all") => {
    let url = "http://localhost:5000/ideas";
    if (teamId !== "all") {
        url += `?teamId=${teamId}`;
    }
    fetch(url).then(res => res.json()).then(setIdeas);
  };

  const fetchTeamStats = () => {
    // For the User Dashboard (Tab 1), always fetch the User's own team stats
    const teamId = currentUser?.team_id || 1;
    fetch(`http://localhost:5000/stats/${teamId}`) 
      .then(res => res.json())
      .then(data => {
        setTeamStats(data);
        setNewGoal(data.team.monthly_goal);
      });
  };

  const fetchCompanyStats = () => {
    fetch(`http://localhost:5000/stats/company`).then(res => res.json()).then(setCompanyStats);
  };

  // --- EFFECTS ---

  // 1. INITIAL LOAD (User & Company Data)
  useEffect(() => {
    if (currentUser) {
      fetchUsers();
      fetchCompanyStats();
      
      // Load initial ideas based on role
      const initialFilter = currentUser.role === 'manager' ? "all" : (String(currentUser.team_id) || "1");
      setSelectedTeamFilter(initialFilter);
      fetchIdeas(initialFilter);
      fetchTeamStats();
    }
  }, [currentUser]);

  // 2. LISTEN FOR FILTER CHANGES (The Critical Fix)
  useEffect(() => {
    if (currentUser) {
      // A. Re-fetch the Idea List for the selected team
      fetchIdeas(selectedTeamFilter);

      // B. Update the Stats Cards
      if (selectedTeamFilter === "all") {
        // AGGREGATE MODE: Sum up stats from companyStats
        if (companyStats.length > 0) {
          const totalActual = companyStats.reduce((acc, curr) => acc + parseInt(curr.submissions || 0), 0);
          const totalGoal = companyStats.reduce((acc, curr) => acc + curr.monthly_goal, 0);
          
          setTeamStats({
            team: { name: "All Teams Overview", monthly_goal: totalGoal },
            teamActual: totalActual,
            users: [] // Hide individual users in Aggregate view
          });
          setNewGoal(0); 
        }
      } else {
        // SPECIFIC TEAM MODE: Fetch deep stats from DB
        fetch(`http://localhost:5000/stats/${selectedTeamFilter}`)
          .then(res => res.json())
          .then(data => {
            setTeamStats(data);
            setNewGoal(data.team.monthly_goal);
          });
      }
    }
  }, [selectedTeamFilter, companyStats]); // Re-run when filter or company data changes

  // --- ACTIONS ---
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(loginForm),
      });
      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
        setErrorMsg("");
      } else { setErrorMsg("Invalid credentials"); }
    } catch (err) { setErrorMsg("Login failed"); }
  };

  const handleLogout = () => { setCurrentUser(null); setLoginForm({ email: "", password: "" }); };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const payload = { ...formData, timeline: 'New', submitter_id: currentUser.id, impact: null, effort: null };
      const response = await fetch("http://localhost:5000/ideas", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (response.ok) {
        setFormData({ title: "", problem_statement: "", proposed_solution: "", expected_benefit: "", category: "Safety" });
        alert("Idea Submitted!");
        // Refresh data
        fetchIdeas(selectedTeamFilter);
        fetchTeamStats();
        fetchCompanyStats();
      }
    } catch (error) { console.error("Error:", error); }
  };

  const updateIdea = async (id: string, updates: any) => {
    await fetch(`http://localhost:5000/ideas/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates),
    });
    // Refresh data
    fetchIdeas(selectedTeamFilter);
    fetchTeamStats();
    fetchCompanyStats();
  };

  const promoteIdea = async (id: number, newTimeline: string, assigneeId: string) => updateIdea(id.toString(), { status: newTimeline, user_id: assigneeId });

  const handleUpdateGoal = async () => {
    await fetch(`http://localhost:5000/teams/${selectedTeamFilter}/goal`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ goal: newGoal }),
    });
    setShowSettings(false);
    // Refresh stats
    const res = await fetch(`http://localhost:5000/stats/${selectedTeamFilter}`);
    const data = await res.json();
    setTeamStats(data);
    fetchCompanyStats();
  };

  const myIdeas = ideas.filter(i => i.submitter_id === currentUser?.id);

  // --- VIEW 1: LOGIN ---
  if (!currentUser) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">Project Huddle 🚀</h1>
          <p className="text-center text-gray-600 mb-8 font-medium">Secure Login</p>
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            {errorMsg && <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded font-bold">{errorMsg}</div>}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1">Email Address</label>
              <input type="email" required className="w-full border-2 border-gray-300 p-3 rounded text-black font-medium outline-none focus:border-blue-600"
                value={loginForm.email} onChange={(e) => setLoginForm({...loginForm, email: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1">Password</label>
              <input type="password" required className="w-full border-2 border-gray-300 p-3 rounded text-black font-medium outline-none focus:border-blue-600"
                value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} />
            </div>
            <button type="submit" className="w-full bg-blue-700 text-white font-bold py-4 rounded hover:bg-blue-800 transition shadow-md text-lg">Sign In</button>
          </form>
          <div className="mt-8 text-center text-sm text-gray-500">
            <p className="font-semibold mb-2">Demo Accounts:</p>
            <div className="bg-gray-100 p-3 rounded text-left inline-block">
              <p>👤 <span className="font-mono text-gray-800">demo@example.com</span> (Manager)</p>
              <p>👤 <span className="font-mono text-gray-800">worker@acme.com</span> (Employee)</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // --- VIEW 2: APP ---
  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* NAV */}
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-bold text-gray-900">Project Huddle 🚀</h1>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button onClick={() => setActiveTab("dashboard")} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>My Dashboard</button>
            <button onClick={() => setActiveTab("huddle")} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'huddle' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Team Huddle</button>
            <button onClick={() => setActiveTab("company")} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'company' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Company Overview</button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900">{currentUser.full_name}</p>
            <p className="text-xs text-gray-500">{currentUser.role === 'manager' ? '⭐ Manager' : 'Team Member'}</p>
          </div>
          <button onClick={handleLogout} className="text-xs text-red-500 hover:underline">Log Out</button>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto p-8">
        
        {/* --- TAB 1: DASHBOARD --- */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-6">💡 Submit Improvement Idea</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                  <input type="text" className="w-full border p-3 rounded bg-gray-50 focus:bg-white text-black font-medium" 
                    value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                     <select className="w-full border p-3 rounded bg-gray-50 text-black" 
                       value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                       <option>Safety</option><option>Quality</option><option>Delivery</option><option>Cost</option><option>Morale</option>
                     </select>
                   </div>
                </div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Problem Statement</label><textarea className="w-full border p-3 rounded bg-gray-50 focus:bg-white text-black h-24" value={formData.problem_statement} onChange={(e) => setFormData({...formData, problem_statement: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Proposed Solution</label><textarea className="w-full border p-3 rounded bg-gray-50 focus:bg-white text-black h-24" value={formData.proposed_solution} onChange={(e) => setFormData({...formData, proposed_solution: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Expected Benefit</label><input type="text" className="w-full border p-3 rounded bg-gray-50 focus:bg-white text-black" value={formData.expected_benefit} onChange={(e) => setFormData({...formData, expected_benefit: e.target.value})} /></div>
                <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition shadow-md">Submit Idea</button>
              </form>
            </div>
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4">My Monthly Goal</h3>
                {teamStats && currentUser ? (
                   <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1"><span>Submitted: <strong>{teamStats.users?.find((u:any) => u.full_name === currentUser.full_name)?.actual || 0}</strong></span><span>Goal: <strong>{currentUser.monthly_goal}</strong></span></div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div className="bg-green-500 h-4 rounded-full" style={{width: `${Math.min(100, ((teamStats.users?.find((u:any) => u.full_name === currentUser.full_name)?.actual || 0) / currentUser.monthly_goal) * 100)}%`}}></div>
                      </div>
                   </div>
                ) : <p className="text-sm text-gray-500">Loading stats...</p>}
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200"><h3 className="font-bold text-gray-800">My Recent Submissions</h3></div>
                <div className="divide-y divide-gray-100">
                  {myIdeas.map(idea => (
                    <div key={idea.id} className="p-4 flex justify-between items-center">
                      <div><div className="font-bold text-gray-800">{idea.title}</div><div className="text-xs text-gray-500 mt-1">{idea.status}</div></div>
                    </div>
                  ))}
                  {myIdeas.length === 0 && <p className="p-4 text-sm text-gray-500">No ideas yet. Submit one!</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 2: HUDDLE (WITH FILTERS) --- */}
        {activeTab === "huddle" && (
          <div>
            <div className="bg-gray-900 text-white p-6 rounded-xl shadow-md mb-8">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold">Team Performance</h2>
                  <p className="text-gray-400 text-sm">Target vs. Actual Submissions</p>
                </div>
                
                {/* SETTINGS (Managers Only) */}
                {currentUser.role === 'manager' && (
                  <div className="flex gap-4">
                    {/* FILTER DROPDOWN */}
                    <select 
                      value={selectedTeamFilter}
                      onChange={(e) => setSelectedTeamFilter(e.target.value)}
                      className="bg-gray-700 text-white border border-gray-600 px-3 py-1 rounded text-xs font-bold outline-none"
                    >
                      <option value="all">👁️ View All Teams</option>
                      {companyStats.map(team => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>

                    {/* SET GOALS BUTTON (Only show if a Specific Team is selected) */}
                    {selectedTeamFilter !== 'all' && (
                      <button onClick={() => setShowSettings(!showSettings)} className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-xs font-bold border border-gray-600">
                          ⚙️ Set Goals
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {showSettings && (
                 <div className="bg-gray-800 p-4 rounded mb-4 border border-gray-700 animate-in fade-in slide-in-from-top-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Update Team Monthly Goal</label>
                    <div className="flex gap-2">
                       <input type="number" style={{ color: '#ffffff', colorScheme: 'dark' }} className="bg-gray-700 border border-gray-500 px-3 py-1 rounded w-24 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg" 
                         value={newGoal} onChange={e => setNewGoal(parseInt(e.target.value))} />
                       <button onClick={handleUpdateGoal} className="bg-blue-600 text-white px-4 py-1 rounded text-sm font-bold hover:bg-blue-500">Save</button>
                    </div>
                 </div>
              )}
              
              {/* Scoreboard */}
              {teamStats ? (
                <div className="flex gap-8 items-center mt-6">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm font-bold mb-2"><span>{teamStats.team?.name || "Loading..."}</span><span className="text-gray-400">Goal: {teamStats.team?.monthly_goal || 0}</span></div>
                    <div className="w-full bg-gray-700 rounded-full h-6 relative overflow-hidden">
                       <div className={`h-6 rounded-full transition-all duration-1000 ${teamStats.teamActual >= teamStats.team?.monthly_goal ? 'bg-green-500' : 'bg-blue-500'}`} style={{width: `${Math.min(100, (teamStats.teamActual / (teamStats.team?.monthly_goal || 1)) * 100)}%`}}></div>
                    </div>
                  </div>
                  {/* Hide User list in "All" mode to avoid clutter */}
                  {selectedTeamFilter !== 'all' && (
                    <div className="w-1/3 border-l border-gray-700 pl-8">
                        <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Top Contributors</h3>
                        <div className="space-y-2">
                            {teamStats.users?.map((u:any, idx:number) => (
                                <div key={idx} className="flex justify-between text-sm">
                                    <span>{u.full_name}</span>
                                    <span className={u.actual >= u.monthly_goal ? "text-green-400 font-bold" : "text-gray-400"}>{u.actual} / {u.monthly_goal}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                  )}
                </div>
              ) : <p className="text-gray-500 italic">Select a team to view detailed stats...</p>}
            </div>

            {/* Note about Filter */}
            {selectedTeamFilter === 'all' ? (
              <p className="mb-4 text-xs font-bold text-gray-400 uppercase">Showing Ideas from: <span className="text-blue-600">All Teams</span></p>
            ) : (
              <p className="mb-4 text-xs font-bold text-gray-400 uppercase">Showing Ideas from: <span className="text-blue-600">{teamStats?.team?.name}</span></p>
            )}

            {/* --- EXECUTION BOARDS (Now uses fetched ideas directly) --- */}
            <MatrixBoard ideas={ideas} users={users} onUpdate={updateIdea} onPromote={promoteIdea} />
            <hr className="my-12 border-gray-200" />
            <h2 className="text-xl font-bold text-gray-800 mb-4">Execution Tracking</h2>
            <KanbanBoard ideas={ideas} onUpdate={updateIdea} />
          </div>
        )}

        {/* --- TAB 3: COMPANY --- */}
        {activeTab === "company" && (
          <div>
            <div className="mb-8 text-center"><h2 className="text-3xl font-bold text-gray-900">Company Leaderboard 🏆</h2><p className="text-gray-500">Monthly Performance by Team</p></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companyStats.map((team, index) => (
                <div key={team.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
                  <div className={`p-4 border-b border-gray-100 flex justify-between items-center ${index === 0 ? 'bg-yellow-50' : 'bg-white'}`}>
                    <h3 className="font-bold text-lg text-gray-800">{index === 0 && '🥇 '} {index === 1 && '🥈 '} {index === 2 && '🥉 '}{team.name}</h3>
                    {parseInt(team.submissions) >= team.monthly_goal && <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">On Target</span>}
                  </div>
                  <div className="p-6 space-y-6">
                    <div><div className="flex justify-between text-sm mb-1"><span className="text-gray-500 font-bold">New Ideas</span><span className="font-bold text-gray-900">{team.submissions} <span className="text-gray-400 text-xs">/ {team.monthly_goal}</span></span></div><div className="w-full bg-gray-100 rounded-full h-3"><div className={`h-3 rounded-full ${parseInt(team.submissions) >= team.monthly_goal ? 'bg-green-500' : 'bg-blue-600'}`} style={{width: `${Math.min(100, (team.submissions / team.monthly_goal) * 100)}%`}}></div></div></div>
                    <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center"><div><p className="text-xs text-gray-500 uppercase font-bold">Completed</p><p className="text-2xl font-black text-gray-800">{team.completions}</p></div><div className="text-3xl">✅</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}