"use client";

import { useState, useEffect } from "react";
import KanbanBoard from "./components/KanbanBoard";
import MatrixBoard from "./components/MatrixBoard";

// --- SMART API URL CONFIGURATION ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function Home() {
  // --- STATE ---
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showSettings, setShowSettings] = useState(false);
  
  const [users, setUsers] = useState<any[]>([]);
  const [ideas, setIdeas] = useState<any[]>([]);
  
  // BRANDING STATE
  const [branding, setBranding] = useState({ 
      name: "Project Huddle", 
      logo_url: "", 
      primary_color: "#2563EB" 
  });

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

  // ADMIN STATE
  const [editingTeamId, setEditingTeamId] = useState<number | null>(null);
  const [adminTeamForm, setAdminTeamForm] = useState({ name: "", monthly_goal: 10 });
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [adminUserForm, setAdminUserForm] = useState({ full_name: "", email: "", password: "", role: "employee", team_id: "", monthly_goal: 5 });

  // --- HELPER FUNCTIONS ---
  const fetchUsers = () => fetch(`${API_BASE_URL}/users`).then(res => res.json()).then(setUsers);
  
  const fetchBranding = () => {
      fetch(`${API_BASE_URL}/settings/branding`)
        .then(res => res.json())
        .then(data => {
            if(data) setBranding({
                name: data.name || "Project Huddle",
                logo_url: data.logo_url || "",
                primary_color: data.primary_color || "#2563EB"
            });
        });
  };

  const fetchIdeas = (teamId: string = "all") => {
    let url = `${API_BASE_URL}/ideas`;
    if (teamId !== "all") {
        url += `?teamId=${teamId}`;
    }
    fetch(url).then(res => res.json()).then(setIdeas);
  };

  const fetchTeamStats = () => {
    const teamId = currentUser?.team_id || 1;
    fetch(`${API_BASE_URL}/stats/${teamId}`) 
      .then(res => res.json())
      .then(data => {
        setTeamStats(data);
        setNewGoal(data.team.monthly_goal);
      });
  };

  const fetchCompanyStats = () => {
    fetch(`${API_BASE_URL}/stats/company`).then(res => res.json()).then(setCompanyStats);
  };

  // --- EFFECTS ---
  useEffect(() => { fetchBranding(); }, []);

  useEffect(() => {
    if (currentUser) {
      fetchUsers();
      fetchCompanyStats();
      const initialFilter = currentUser.role === 'manager' ? "all" : (String(currentUser.team_id) || "1");
      setSelectedTeamFilter(initialFilter);
      fetchIdeas(initialFilter);
      fetchTeamStats();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchIdeas(selectedTeamFilter);
      if (selectedTeamFilter === "all") {
        if (companyStats.length > 0) {
          const totalActual = companyStats.reduce((acc, curr) => acc + parseInt(curr.submissions || 0), 0);
          const totalGoal = companyStats.reduce((acc, curr) => acc + curr.monthly_goal, 0);
          setTeamStats({ team: { name: "All Teams Overview", monthly_goal: totalGoal }, teamActual: totalActual, users: [] });
          setNewGoal(0); 
        }
      } else {
        fetch(`${API_BASE_URL}/stats/${selectedTeamFilter}`).then(res => res.json()).then(data => { setTeamStats(data); setNewGoal(data.team.monthly_goal); });
      }
    }
  }, [selectedTeamFilter, companyStats]); 

  // --- ACTIONS ---
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(loginForm),
      });
      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
        setErrorMsg("");
        setActiveTab("dashboard");
      } else { setErrorMsg("Invalid credentials"); }
    } catch (err) { setErrorMsg("Login failed"); }
  };

  const handleLogout = () => { setCurrentUser(null); setLoginForm({ email: "", password: "" }); setActiveTab("dashboard"); };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const payload = { ...formData, timeline: 'New', submitter_id: currentUser.id, impact: null, effort: null };
      const response = await fetch(`${API_BASE_URL}/ideas`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (response.ok) {
        setFormData({ title: "", problem_statement: "", proposed_solution: "", expected_benefit: "", category: "Safety" });
        alert("Idea Submitted!");
        fetchIdeas(selectedTeamFilter);
        fetchTeamStats();
        fetchCompanyStats();
      }
    } catch (error) { console.error("Error:", error); }
  };

  const updateIdea = async (id: string, updates: any) => {
    await fetch(`${API_BASE_URL}/ideas/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates),
    });
    fetchIdeas(selectedTeamFilter);
    fetchTeamStats();
    fetchCompanyStats();
  };

  const promoteIdea = async (id: number, newTimeline: string, assigneeId: string) => updateIdea(id.toString(), { status: newTimeline, user_id: assigneeId });

  const handleUpdateGoal = async () => {
    await fetch(`${API_BASE_URL}/teams/${selectedTeamFilter}/goal`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ goal: newGoal }),
    });
    setShowSettings(false);
    const res = await fetch(`${API_BASE_URL}/stats/${selectedTeamFilter}`);
    const data = await res.json();
    setTeamStats(data);
    fetchCompanyStats();
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
      e.preventDefault();
      await fetch(`${API_BASE_URL}/settings/branding`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(branding),
      });
      alert("Branding Updated!");
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingTeamId ? `${API_BASE_URL}/teams/${editingTeamId}` : `${API_BASE_URL}/teams`;
    const method = editingTeamId ? "PUT" : "POST";
    await fetch(url, { method: method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(adminTeamForm) });
    alert(editingTeamId ? "Team Updated!" : "Team Created!");
    setAdminTeamForm({ name: "", monthly_goal: 10 });
    setEditingTeamId(null);
    fetchCompanyStats();
  };

  const handleEditTeam = (team: any) => { setEditingTeamId(team.id); setAdminTeamForm({ name: team.name, monthly_goal: team.monthly_goal }); };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingUserId ? `${API_BASE_URL}/users/${editingUserId}` : `${API_BASE_URL}/users`;
    const method = editingUserId ? "PUT" : "POST";
    await fetch(url, { method: method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(adminUserForm) });
    alert(editingUserId ? "User Updated!" : "User Created!");
    setAdminUserForm({ full_name: "", email: "", password: "", role: "employee", team_id: "", monthly_goal: 5 });
    setEditingUserId(null);
    fetchUsers();
  };

  const handleEditUser = (user: any) => { setEditingUserId(user.id); setAdminUserForm({ full_name: user.full_name, email: user.email, password: "", role: user.role, team_id: user.team_id, monthly_goal: user.monthly_goal }); };

  const myIdeas = ideas.filter(i => i.submitter_id === currentUser?.id);

  if (!currentUser) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          <div className="flex justify-center mb-4">
              {branding.logo_url ? <img src={branding.logo_url} alt={branding.name} className="h-16 object-contain" /> : <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">{branding.name} 🚀</h1>}
          </div>
          <p className="text-center text-gray-600 mb-8 font-medium">Secure Login</p>
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            {errorMsg && <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded font-bold">{errorMsg}</div>}
            <div><label className="block text-sm font-bold text-gray-900 mb-1">Email Address</label><input type="email" required className="w-full border-2 border-gray-300 p-3 rounded text-black font-medium outline-none focus:border-blue-600" value={loginForm.email} onChange={(e) => setLoginForm({...loginForm, email: e.target.value})} /></div>
            <div><label className="block text-sm font-bold text-gray-900 mb-1">Password</label><input type="password" required className="w-full border-2 border-gray-300 p-3 rounded text-black font-medium outline-none focus:border-blue-600" value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} /></div>
            <button type="submit" style={{ backgroundColor: branding.primary_color }} className="w-full text-white font-bold py-4 rounded hover:opacity-90 transition shadow-md text-lg">Sign In</button>
          </form>
          {/* Demo accounts removed for production */}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* MOBILE RESPONSIVE NAV */}
      <nav 
        style={{ borderBottomColor: branding.primary_color }}
        className="bg-white border-b-4 px-4 py-4 flex flex-col md:flex-row justify-between items-center sticky top-0 z-50 gap-4 shadow-sm"
      >
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 w-full md:w-auto">
            {branding.logo_url ? (
                <img src={branding.logo_url} alt={branding.name} className="h-10 object-contain" />
            ) : (
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 text-center">{branding.name} 🚀</h1>
            )}
            
            {/* Scrollable Nav on Small Screens */}
            <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
             <div className="flex flex-nowrap min-w-max">
                <button onClick={() => setActiveTab("dashboard")} className={`px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>My Dashboard</button>
                <button onClick={() => setActiveTab("huddle")} className={`px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-all ${activeTab === 'huddle' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Team Huddle</button>
                <button onClick={() => setActiveTab("company")} className={`px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-all ${activeTab === 'company' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Overview</button>
                {currentUser.role === 'manager' && (<button onClick={() => setActiveTab("admin")} className={`px-3 py-2 rounded-md text-xs md:text-sm font-bold transition-all ${activeTab === 'admin' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:text-purple-600'}`}>⚙️ Admin</button>)}
             </div>
            </div>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 mt-2 md:mt-0 border-gray-100">
          <div className="text-left md:text-right"><p className="text-sm font-bold text-gray-900">{currentUser.full_name}</p><p className="text-xs text-gray-500">{currentUser.role === 'manager' ? '⭐ Manager' : 'Team Member'}</p></div>
          <button onClick={handleLogout} className="text-xs text-red-500 hover:underline border border-red-100 px-3 py-1 rounded bg-red-50">Log Out</button>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto p-4 md:p-8">
        {activeTab === "dashboard" && (
          // MOBILE RESPONSIVE GRID
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-6">💡 Submit Improvement Idea</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label><input type="text" className="w-full border p-3 rounded bg-gray-50 focus:bg-white text-black font-medium" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required /></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label><select className="w-full border p-3 rounded bg-gray-50 text-black" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}><option>Safety</option><option>Quality</option><option>Delivery</option><option>Cost</option><option>Morale</option></select></div></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Problem Statement</label><textarea className="w-full border p-3 rounded bg-gray-50 focus:bg-white text-black h-24" value={formData.problem_statement} onChange={(e) => setFormData({...formData, problem_statement: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Proposed Solution</label><textarea className="w-full border p-3 rounded bg-gray-50 focus:bg-white text-black h-24" value={formData.proposed_solution} onChange={(e) => setFormData({...formData, proposed_solution: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Expected Benefit</label><input type="text" className="w-full border p-3 rounded bg-gray-50 focus:bg-white text-black" value={formData.expected_benefit} onChange={(e) => setFormData({...formData, expected_benefit: e.target.value})} /></div>
                <button type="submit" style={{ backgroundColor: branding.primary_color }} className="w-full text-white py-4 rounded-lg font-bold text-lg hover:opacity-90 transition shadow-md">Submit Idea</button>
              </form>
            </div>
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4">My Monthly Goal</h3>
                {teamStats && currentUser ? (<div><div className="flex justify-between text-sm text-gray-600 mb-1"><span>Submitted: <strong>{teamStats.users?.find((u:any) => u.full_name === currentUser.full_name)?.actual || 0}</strong></span><span>Goal: <strong>{currentUser.monthly_goal}</strong></span></div><div className="w-full bg-gray-200 rounded-full h-4"><div className="h-4 rounded-full" style={{ backgroundColor: branding.primary_color, width: `${Math.min(100, ((teamStats.users?.find((u:any) => u.full_name === currentUser.full_name)?.actual || 0) / currentUser.monthly_goal) * 100)}%`}}></div></div></div>) : <p className="text-sm text-gray-500">Loading stats...</p>}
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"><div className="bg-gray-50 px-6 py-4 border-b border-gray-200"><h3 className="font-bold text-gray-800">My Recent Submissions</h3></div><div className="divide-y divide-gray-100">{myIdeas.map(idea => (<div key={idea.id} className="p-4 flex justify-between items-center"><div><div className="font-bold text-gray-800">{idea.title}</div><div className="text-xs text-gray-500 mt-1">{idea.status}</div></div></div>))}{myIdeas.length === 0 && <p className="p-4 text-sm text-gray-500">No ideas yet. Submit one!</p>}</div></div>
            </div>
          </div>
        )}
        {activeTab === "huddle" && (<div><div className="bg-gray-900 text-white p-6 rounded-xl shadow-md mb-8"><div className="flex justify-between items-start mb-4"><div><h2 className="text-2xl font-bold">Team Performance</h2><p className="text-gray-400 text-sm">Target vs. Actual Submissions</p></div>{currentUser.role === 'manager' && (<div className="flex gap-4"><select value={selectedTeamFilter} onChange={(e) => setSelectedTeamFilter(e.target.value)} className="bg-gray-700 text-white border border-gray-600 px-3 py-1 rounded text-xs font-bold outline-none"><option value="all">👁️ View All Teams</option>{companyStats.map(team => (<option key={team.id} value={team.id}>{team.name}</option>))}</select>{selectedTeamFilter !== 'all' && (<button onClick={() => setShowSettings(!showSettings)} className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-xs font-bold border border-gray-600">⚙️ Set Goals</button>)}</div>)}</div>{showSettings && (<div className="bg-gray-800 p-4 rounded mb-4 border border-gray-700 animate-in fade-in slide-in-from-top-2"><label className="block text-xs font-bold text-gray-400 uppercase mb-2">Update Team Monthly Goal</label><div className="flex gap-2"><input type="number" style={{ color: '#ffffff', colorScheme: 'dark' }} className="bg-gray-700 border border-gray-500 px-3 py-1 rounded w-24 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg" value={newGoal} onChange={e => setNewGoal(parseInt(e.target.value))} /><button onClick={handleUpdateGoal} className="bg-blue-600 text-white px-4 py-1 rounded text-sm font-bold hover:bg-blue-500">Save</button></div></div>)}{teamStats ? (<div className="flex gap-8 items-center mt-6"><div className="flex-1"><div className="flex justify-between text-sm font-bold mb-2"><span>{teamStats.team?.name || "Loading..."}</span><span className="text-gray-400">Goal: {teamStats.team?.monthly_goal || 0}</span></div><div className="w-full bg-gray-700 rounded-full h-6 relative overflow-hidden"><div className={`h-6 rounded-full transition-all duration-1000 ${teamStats.teamActual >= teamStats.team?.monthly_goal ? 'bg-green-500' : 'bg-blue-500'}`} style={{width: `${Math.min(100, (teamStats.teamActual / (teamStats.team?.monthly_goal || 1)) * 100)}%`}}></div></div></div>{selectedTeamFilter !== 'all' && (<div className="w-1/3 border-l border-gray-700 pl-8"><h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Top Contributors</h3><div className="space-y-2">{teamStats.users?.map((u:any, idx:number) => (<div key={idx} className="flex justify-between text-sm"><span>{u.full_name}</span><span className={u.actual >= u.monthly_goal ? "text-green-400 font-bold" : "text-gray-400"}>{u.actual} / {u.monthly_goal}</span></div>))}</div></div>)}</div>) : <p className="text-gray-500 italic">Select a team to view detailed stats...</p>}</div><MatrixBoard ideas={ideas} users={users} onUpdate={updateIdea} onPromote={promoteIdea} isManager={currentUser.role === 'manager'} /><hr className="my-12 border-gray-200" /><h2 className="text-xl font-bold text-gray-800 mb-4">Execution Tracking</h2><KanbanBoard ideas={ideas} onUpdate={updateIdea} isManager={currentUser.role === 'manager'} /></div>)}
        {activeTab === "company" && (<div><div className="mb-8 text-center"><h2 className="text-3xl font-bold text-gray-900">Company Leaderboard 🏆</h2><p className="text-gray-500">Monthly Performance by Team</p></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{companyStats.map((team, index) => (<div key={team.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow"><div className={`p-4 border-b border-gray-100 flex justify-between items-center ${index === 0 ? 'bg-yellow-50' : 'bg-white'}`}><h3 className="font-bold text-lg text-gray-800">{index === 0 && '🥇 '} {index === 1 && '🥈 '} {index === 2 && '🥉 '}{team.name}</h3>{parseInt(team.submissions) >= team.monthly_goal && <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">On Target</span>}</div><div className="p-6 space-y-6"><div><div className="flex justify-between text-sm mb-1"><span className="text-gray-500 font-bold">New Ideas</span><span className="font-bold text-gray-900">{team.submissions} <span className="text-gray-400 text-xs">/ {team.monthly_goal}</span></span></div><div className="w-full bg-gray-100 rounded-full h-3"><div className={`h-3 rounded-full ${parseInt(team.submissions) >= team.monthly_goal ? 'bg-green-500' : 'bg-blue-600'}`} style={{width: `${Math.min(100, (team.submissions / team.monthly_goal) * 100)}%`}}></div></div></div><div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center"><div><p className="text-xs text-gray-500 uppercase font-bold">Completed</p><p className="text-2xl font-black text-gray-800">{team.completions}</p></div><div className="text-3xl">✅</div></div></div></div>))}</div></div>)}
        {activeTab === "admin" && currentUser.role === 'manager' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 lg:col-span-2">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">🎨 Company Branding</h2>
                    <form onSubmit={handleSaveBranding} className="grid grid-cols-1 md:grid-cols-3 gap-6"><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Company Name</label><input type="text" className="w-full border p-3 rounded bg-gray-50 text-black font-medium" value={branding.name} onChange={e => setBranding({...branding, name: e.target.value})} required /></div><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Logo URL (Image Link)</label><input type="text" className="w-full border p-3 rounded bg-gray-50 text-black font-medium" placeholder="https://example.com/logo.png" value={branding.logo_url} onChange={e => setBranding({...branding, logo_url: e.target.value})} /></div><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Primary Color</label><div className="flex gap-2"><input type="color" className="h-12 w-12 border rounded cursor-pointer" value={branding.primary_color} onChange={e => setBranding({...branding, primary_color: e.target.value})} /><input type="text" className="w-full border p-3 rounded bg-gray-50 text-black font-medium uppercase" value={branding.primary_color} onChange={e => setBranding({...branding, primary_color: e.target.value})} /></div></div><div className="md:col-span-3 text-right"><button type="submit" className="bg-gray-900 text-white font-bold py-3 px-8 rounded hover:bg-gray-800">Save Branding</button></div></form>
                </div>
                <div className="space-y-6"><div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200"><h2 className="text-xl font-bold text-gray-900 mb-2">{editingTeamId ? '✏️ Edit Department' : '🏢 Add New Department'}</h2><form onSubmit={handleSaveTeam} className="space-y-4"><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Team Name</label><input type="text" className="w-full border p-3 rounded bg-gray-50 text-black font-medium" value={adminTeamForm.name} onChange={e => setAdminTeamForm({...adminTeamForm, name: e.target.value})} required /></div><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Monthly Idea Goal</label><input type="number" className="w-full border p-3 rounded bg-gray-50 text-black font-medium" value={adminTeamForm.monthly_goal} onChange={e => setAdminTeamForm({...adminTeamForm, monthly_goal: parseInt(e.target.value)})} required /></div><div className="flex gap-2"><button type="submit" className="flex-1 bg-gray-900 text-white font-bold py-3 rounded hover:bg-gray-800">{editingTeamId ? 'Update Team' : 'Create Team'}</button>{editingTeamId && <button type="button" onClick={() => { setEditingTeamId(null); setAdminTeamForm({ name: "", monthly_goal: 10 }); }} className="px-4 py-3 bg-gray-200 text-gray-700 font-bold rounded">Cancel</button>}</div></form></div><div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden"><div className="bg-gray-50 px-6 py-4 border-b border-gray-200"><h3 className="font-bold text-gray-800">Existing Departments</h3></div><div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">{companyStats.map(team => (<div key={team.id} className="p-4 flex justify-between items-center hover:bg-gray-50"><div><div className="font-bold text-gray-800">{team.name}</div><div className="text-xs text-gray-500">Goal: {team.monthly_goal}</div></div><button onClick={() => handleEditTeam(team)} className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded font-bold hover:bg-blue-100">Edit</button></div>))}</div></div></div>
                <div className="space-y-6"><div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200"><h2 className="text-xl font-bold text-gray-900 mb-2">{editingUserId ? '✏️ Edit Employee' : '👤 Onboard Employee'}</h2><form onSubmit={handleSaveUser} className="space-y-4"><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label><input type="text" className="w-full border p-3 rounded bg-gray-50 text-black font-medium" value={adminUserForm.full_name} onChange={e => setAdminUserForm({...adminUserForm, full_name: e.target.value})} required /></div><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email (Login ID)</label><input type="email" className="w-full border p-3 rounded bg-gray-50 text-black font-medium" value={adminUserForm.email} onChange={e => setAdminUserForm({...adminUserForm, email: e.target.value})} required /></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Role</label><select className="w-full border p-3 rounded bg-gray-50 text-black" value={adminUserForm.role} onChange={e => setAdminUserForm({...adminUserForm, role: e.target.value})}><option value="employee">Employee</option><option value="manager">Manager</option></select></div>{!editingUserId && (<div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label><input type="text" className="w-full border p-3 rounded bg-gray-50 text-black font-medium" value={adminUserForm.password} onChange={e => setAdminUserForm({...adminUserForm, password: e.target.value})} required={!editingUserId} /></div>)}</div><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Assign to Team</label><select className="w-full border p-3 rounded bg-gray-50 text-black font-bold" value={adminUserForm.team_id} onChange={e => setAdminUserForm({...adminUserForm, team_id: e.target.value})} required><option value="">-- Select Department --</option>{companyStats.map(team => (<option key={team.id} value={team.id}>{team.name}</option>))}</select></div><div className="flex gap-2"><button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700">{editingUserId ? 'Update User' : 'Create User'}</button>{editingUserId && <button type="button" onClick={() => { setEditingUserId(null); setAdminUserForm({ full_name: "", email: "", password: "", role: "employee", team_id: "", monthly_goal: 5 }); }} className="px-4 py-3 bg-gray-200 text-gray-700 font-bold rounded">Cancel</button>}</div></form></div><div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden"><div className="bg-gray-50 px-6 py-4 border-b border-gray-200"><h3 className="font-bold text-gray-800">Employee Directory</h3></div><div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">{users.map(u => (<div key={u.id} className="p-4 flex justify-between items-center hover:bg-gray-50"><div><div className="font-bold text-gray-800">{u.full_name} <span className="text-xs text-gray-400 font-normal">({u.role})</span></div><div className="text-xs text-gray-500">{u.email} • {u.team_name || "No Team"}</div></div><button onClick={() => handleEditUser(u)} className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded font-bold hover:bg-blue-100">Edit</button></div>))}</div></div></div>
            </div>
        )}
      </div>
    </main>
  );
}