import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Bot, Briefcase } from 'lucide-react';
import { ChatPage } from './pages/ChatPage';

export const App: React.FC = () => {
  return (
    <Router>
      <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
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
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-slate-600">Active Workspace:</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                Single Recruiter Mode
              </span>
            </div>
            <div className="text-xs text-slate-500">
              Backend Status: <span className="text-emerald-600 font-semibold">Ready</span>
            </div>
          </header>

          {/* Dynamic Content */}
          <main className="flex-1 overflow-hidden">
            <Routes>
              <Route path="/" element={<ChatPage />} />
              <Route path="/chat/:id" element={<ChatPage />} />
              <Route
                path="/jobs"
                element={
                  <div className="p-6 max-w-4xl mx-auto">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                      <h2 className="text-xl font-bold text-slate-800 mb-4">Jobs Overview</h2>
                      <p className="text-slate-500 text-sm">
                        No jobs created yet. Start by pasting a job description in the recruiter chat.
                      </p>
                    </div>
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
