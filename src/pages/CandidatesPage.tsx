import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Upload,
  AlertTriangle,
  ExternalLink,
  X,
  FileSpreadsheet,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import { API_BASE_URL } from '../api/client';

interface Candidate {
  _id: string;
  jobId: string;
  fullName: string;
  email?: string;
  emailStatus: 'valid' | 'missing';
  profileUrl?: string;
  sourceMode: 'serper' | 'fixture' | 'csv';
  currentTitle?: string;
  currentCompany?: string;
  skills: string[];
  score: number | null;
  scoreStatus: 'pending' | 'scored' | 'failed';
  scoreReason?: string;
  missingInfo: string[];
  scoreMissingInfo?: string[];
  status: string;
  createdAt: string;
}

interface Job {
  _id: string;
  title: string;
  status: string;
}

export const CandidatesPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [scoreTier, setScoreTier] = useState<string>('all');
  const [sourceMode, setSourceMode] = useState<string>('all');

  // CSV Upload status
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  // Fetch Jobs on mount
  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/jobs`);
        const data = await res.json();
        if (data.jobs && data.jobs.length > 0) {
          setJobs(data.jobs);
          setSelectedJobId(data.jobs[0]._id);
        }
      } catch (err) {
        console.error('Failed to load jobs:', err);
      }
    }
    fetchJobs();
  }, []);

  // Fetch candidates for selected job and filters
  const fetchCandidates = async () => {
    if (!selectedJobId) return;
    try {
      setIsLoading(true);
      let url = `${API_BASE_URL}/api/jobs/${selectedJobId}/candidates?`;
      if (scoreTier !== 'all') url += `scoreTier=${scoreTier}&`;
      if (sourceMode !== 'all') url += `sourceMode=${sourceMode}&`;
      if (searchTerm.trim()) url += `search=${encodeURIComponent(searchTerm.trim())}&`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setCandidates(data.candidates || []);
      }
    } catch (err) {
      console.error('Failed to load candidates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [selectedJobId, scoreTier, sourceMode, searchTerm]);

  // Handle CSV file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedJobId) return;

    const formData = new FormData();
    formData.append('file', file);
    const convId = localStorage.getItem('conversationId');
    if (convId) formData.append('conversationId', convId);

    try {
      setIsUploading(true);
      setUploadMessage(null);
      const res = await fetch(`${API_BASE_URL}/api/jobs/${selectedJobId}/candidates/upload-csv`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUploadMessage(data.data?.message || 'CSV imported successfully!');
        fetchCandidates();
      } else {
        setUploadMessage(`Error: ${data.error?.message || 'Failed to upload CSV'}`);
      }
    } catch (err: any) {
      setUploadMessage(`Error: ${err.message || 'Network error during upload'}`);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Match score badge color helper per B7
  const renderScoreBadge = (candidate: Candidate) => {
    if (candidate.scoreStatus === 'failed') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
          Failed
        </span>
      );
    }
    if (candidate.score === null || candidate.scoreStatus === 'pending') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          Pending
        </span>
      );
    }
    if (candidate.score >= 80) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          {candidate.score} / 100
        </span>
      );
    }
    if (candidate.score >= 60) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
          {candidate.score} / 100
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
        {candidate.score} / 100
      </span>
    );
  };

  // SourceMode badge helper per B2 & B7
  const renderSourceModeBadge = (mode: string) => {
    if (mode === 'fixture') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
          demo data
        </span>
      );
    }
    if (mode === 'serper') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
          serper
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-200">
        csv
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>Candidates Pipeline</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review, filter, and inspect scored candidate profiles across job openings.
            </p>
          </div>

          {/* Job Selection Dropdown */}
          <div className="flex items-center space-x-3">
            <span className="text-xs font-medium text-slate-600">Select Job:</span>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              {jobs.map((j) => (
                <option key={j._id} value={j._id}>
                  {j.title} ({j.status})
                </option>
              ))}
            </select>

            {/* CSV Upload Button */}
            <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-medium cursor-pointer transition shadow-sm">
              {isUploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              <span>{isUploading ? 'Uploading...' : 'Upload CSV'}</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isUploading || !selectedJobId}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {uploadMessage && (
          <div
            className={`p-3 rounded-lg text-xs font-medium border ${
              uploadMessage.startsWith('Error')
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {uploadMessage}
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-2 flex-1 max-w-sm">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search candidate, role, or skill..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-slate-600">Score Tier:</span>
              <select
                value={scoreTier}
                onChange={(e) => setScoreTier(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <option value="all">All Scores</option>
                <option value="strong">Strong (80 - 100)</option>
                <option value="moderate">Moderate (60 - 79)</option>
                <option value="weak">Weak (&lt; 60)</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-medium text-slate-600">Source:</span>
              <select
                value={sourceMode}
                onChange={(e) => setSourceMode(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <option value="all">All Sources</option>
                <option value="fixture">Demo Data (fixtures)</option>
                <option value="serper">Serper API</option>
                <option value="csv">CSV Upload</option>
              </select>
            </div>
          </div>
        </div>

        {/* Candidates Table per B7 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 flex items-center justify-center space-x-2 text-sm">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              <span>Loading candidate profiles...</span>
            </div>
          ) : candidates.length === 0 ? (
            <div className="p-12 text-center">
              <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No candidates found for this job</p>
              <p className="text-xs text-slate-400 mt-1">
                Ask the AI assistant to source candidates in chat, or upload a candidates CSV file.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Candidate</th>
                    <th className="px-5 py-3">Current Role & Company</th>
                    <th className="px-5 py-3">Match Score</th>
                    <th className="px-5 py-3">Source</th>
                    <th className="px-5 py-3">Contact</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {candidates.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 text-sm">{c.fullName}</div>
                        {c.profileUrl && (
                          <a
                            href={c.profileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 text-xs mt-0.5"
                          >
                            <span>Profile</span>
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-800">{c.currentTitle || 'N/A'}</div>
                        <div className="text-slate-400 text-xs">{c.currentCompany || 'Not provided'}</div>
                      </td>
                      <td className="px-5 py-3.5">{renderScoreBadge(c)}</td>
                      <td className="px-5 py-3.5">{renderSourceModeBadge(c.sourceMode)}</td>
                      <td className="px-5 py-3.5">
                        {c.email ? (
                          <span className="font-mono text-slate-700 text-xs">{c.email}</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            missing email
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedCandidate(c)}
                          className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-xs font-medium text-slate-700 transition"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Candidate Detail Modal Drawer per B7 */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-y-auto p-6 border-l border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedCandidate.fullName}</h3>
                <p className="text-xs text-slate-500">
                  {selectedCandidate.currentTitle} &bull; {selectedCandidate.currentCompany}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5 text-xs text-slate-700">
              {/* Score and Source Badges */}
              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <span className="block text-slate-400 uppercase text-xs font-medium">Score</span>
                  <div className="mt-1">{renderScoreBadge(selectedCandidate)}</div>
                </div>
                <div className="border-l border-slate-200 pl-3">
                  <span className="block text-slate-400 uppercase text-xs font-medium">Source Mode</span>
                  <div className="mt-1">{renderSourceModeBadge(selectedCandidate.sourceMode)}</div>
                </div>
                <div className="border-l border-slate-200 pl-3">
                  <span className="block text-slate-400 uppercase text-xs font-medium">Contact</span>
                  <div className="mt-1 font-mono font-medium">
                    {selectedCandidate.email || (
                      <span className="text-amber-700 font-semibold">No Email Provided</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Match Reason */}
              <div>
                <span className="font-semibold text-slate-900 uppercase tracking-wider block mb-1">
                  AI Match Evaluation & Reasoning
                </span>
                <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg text-slate-800 leading-relaxed text-xs">
                  {selectedCandidate.scoreReason || 'Evaluation in progress or not yet scored.'}
                </div>
              </div>

              {/* Missing Info List */}
              {selectedCandidate.missingInfo && selectedCandidate.missingInfo.length > 0 && (
                <div>
                  <span className="font-semibold text-slate-900 uppercase tracking-wider block mb-1 flex items-center text-amber-700">
                    <HelpCircle className="w-3.5 h-3.5 mr-1" />
                    Missing Profile Information
                  </span>
                  <ul className="list-disc list-inside bg-amber-50/50 border border-amber-200 rounded-lg p-3 text-amber-900 space-y-1">
                    {selectedCandidate.missingInfo.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Skills Breakdown */}
              <div>
                <span className="font-semibold text-slate-900 uppercase tracking-wider block mb-2">
                  Skills & Competencies
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCandidate.skills && selectedCandidate.skills.length > 0 ? (
                    selectedCandidate.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded font-medium text-xs"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400">None explicitly parsed</span>
                  )}
                </div>
              </div>

              {/* Profile Links */}
              {selectedCandidate.profileUrl && (
                <div className="pt-3 border-t border-slate-100">
                  <span className="font-semibold text-slate-900 uppercase tracking-wider block mb-1">
                    Public Profile URL
                  </span>
                  <a
                    href={selectedCandidate.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 underline break-all inline-flex items-center space-x-1"
                  >
                    <span>{selectedCandidate.profileUrl}</span>
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
