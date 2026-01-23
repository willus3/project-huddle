"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [ideas, setIdeas] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    category: "Safety",
    impact: "Low",
    effort: "Low"
  });

  // Load ideas when page opens
  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = () => {
    fetch("http://localhost:5000/ideas")
      .then((res) => res.json())
      .then((data) => setIdeas(data));
  };

  // Submit the form
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        setFormData({ ...formData, title: "" }); // Clear input
        fetchIdeas(); // Reload list
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Project Huddle 🚀</h1>

        {/* INPUT FORM */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">New Idea</label>
              <input
                type="text"
                placeholder="e.g. Fix the loading dock light"
                className="w-full border p-2 rounded mt-1 text-black"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <select 
                className="border p-2 rounded text-black"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option>Safety</option>
                <option>Quality</option>
                <option>Efficiency</option>
              </select>

              <select 
                className="border p-2 rounded text-black"
                value={formData.impact}
                onChange={(e) => setFormData({...formData, impact: e.target.value})}
              >
                <option>High Impact</option>
                <option>Medium Impact</option>
                <option>Low Impact</option>
              </select>
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
              Submit Idea
            </button>
          </form>
        </div>

        {/* IDEA LIST */}
        <div className="space-y-3">
          {ideas.map((idea: any) => (
            <div key={idea.id} className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
              <h3 className="font-bold text-lg text-black">{idea.title}</h3>
              <div className="text-sm text-gray-500 flex gap-3 mt-1">
                <span className="bg-gray-200 px-2 rounded">{idea.category}</span>
                <span className="bg-blue-100 text-blue-800 px-2 rounded">{idea.impact} Impact</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}