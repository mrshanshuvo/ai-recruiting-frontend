import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Bot, Briefcase } from 'lucide-react';

export const App: React.FC = () => {
  return (
    <Router>
      <div className="flex h-screen bg-slate-50 text-slate-900">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-800 leading-tight">AI Recruiting</h1>
              <p className="text-xs text-slate-500">Autonomous Co-Worker</p>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            <Link
              to="/"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition"
            >
              <Bot className="w-4 h-4" />
              <span>Recruiter Chat</span>
            </Link>
            <Link
              to="/jobs"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition"
            >
              <Briefcase className="w-4 h-4" />
              <span>Jobs</span>
            </Link>
          </nav>

          <div className="p-4 border-t border-slate-200 text-xs text-slate-400">
            Aironauts Technologies &bull; v1.0.0
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-slate-600">Active Mode:</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                Single Recruiter Workspace
              </span>
            </div>
            <div className="text-sm text-slate-500">
              Backend Status: <span className="text-emerald-600 font-medium">Ready</span>
            </div>
          </header>

          {/* Dynamic Content */}
          <main className="flex-1 overflow-auto p-6">
            <Routes>
              <Route
                path="/"
                element={
                  <div className="max-w-4xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
                    <div className="inline-flex p-4 bg-indigo-50 text-indigo-600 rounded-full mb-4">
                      <Bot className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome to AI Recruiting Co-Worker</h2>
                    <p className="text-slate-600 max-w-md mx-auto mb-6">
                      Your autonomous recruitment partner. Create jobs from job descriptions, discover qualified candidates, run outreach campaigns, and manage the complete hiring lifecycle.
                    </p>
                    <div className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-indigo-700 transition">
                      Chat Workspace Ready
                    </div>
                  </div>
                }
              />
              <Route
                path="/jobs"
                element={
                  <div className="max-w-4xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Jobs Overview</h2>
                    <p className="text-slate-500 text-sm">No jobs created yet. Start by pasting a job description in the chat.</p>
                  </div>
                }
              />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;
