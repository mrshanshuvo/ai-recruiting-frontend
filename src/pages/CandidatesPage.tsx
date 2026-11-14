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
  MessageSquare,
  Send,
  Clock,
} from 'lucide-react';
import { API_BASE_URL, retryCandidateClassification, simulateReply, updateCandidateStatus } from '../api/client';

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  Sourced: ['Accepted', 'Rejected'],
  Accepted: ['Contacted', 'Rejected'],
  Contacted: ['Replied', 'Unsubscribed'],
  Replied: ['Interested', 'Not interested', 'Unsubscribed'],
  Interested: ['Meeting booked', 'Rejected', 'Unsubscribed'],
  'Not interested': ['Rejected', 'Unsubscribed'],
  'Meeting booked': ['Interviewed', 'Rejected', 'Unsubscribed'],
  Interviewed: ['Shortlisted', 'Rejected', 'Unsubscribed'],
  Shortlisted: ['Hired', 'Rejected', 'Unsubscribed'],
  Hired: ['Unsubscribed'],
  Rejected: ['Unsubscribed'],
  Unsubscribed: [],
};

const PRESET_REPLIES = [
  {
    label: 'Interested',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100',
    text: "Hi, thanks for reaching out! The role at Aironauts sounds very interesting. I'd love to learn more about what your team is building.",
  },
  {
    label: 'Not interested',
    badge: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200',
    text: 'Thanks for reaching out, but I am currently very happy at my current role and not looking to make a switch right now.',
  },
  {
    label: 'Question',
    badge: 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100',
    text: 'Could you share more details about the salary range, tech stack, and remote work policy for this role?',
  },
  {
    label: 'Wants a meeting',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-300 hover:bg-indigo-100',
    text: 'I would be glad to speak with you. Could you send over a link to schedule a 15-minute chat on my calendar?',
  },
  {
    label: 'Unsubscribe',
    badge: 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100',
    text: 'Please unsubscribe me and remove my email from your recruitment outreach list.',
  },
];

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
  needsReview?: boolean;
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

  // Simulation modal state (DEC-15 / F4)
  const [simulatingCandidate, setSimulatingCandidate] = useState<Candidate | null>(null);
  const [simulateText, setSimulateText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Candidate drawer activity & status
  const [candidateActivities, setCandidateActivities] = useState<any[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [drawerTargetStatus, setDrawerTargetStatus] = useState('');
  const [drawerReason, setDrawerReason] = useState('');
  const [isRetryingClassification, setIsRetryingClassification] = useState(false);

  const handleRetryClassification = async (candidateId: string) => {
    try {
      setIsRetryingClassification(true);
      const res = await retryCandidateClassification(candidateId);
      if (res.success) {
        alert('Reply classification successfully re-enqueued for candidate.');
      }
    } catch (err: any) {
      alert(`Retry failed: ${err.message || 'Operation failed'}`);
    } finally {
      setIsRetryingClassification(false);
    }
  };

  const handleSelectCandidate = async (cand: Candidate) => {
    setSelectedCandidate(cand);
    setDrawerTargetStatus('');
    setDrawerReason('');
    try {
      setIsLoadingActivity(true);
      const res = await fetch(`${API_BASE_URL}/api/jobs/${cand.jobId}/activity?candidateId=${cand._id}&limit=50`);
      const data = await res.json();
      if (data.success) {
        setCandidateActivities(data.activities || []);
      }
    } catch (err) {
      console.error('Failed to load candidate activity:', err);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  const handleDirectStatusChange = async (candidateId: string, newStatus: string, reason?: string) => {
    try {
      setIsUpdatingStatus(true);
      const res = await updateCandidateStatus(candidateId, newStatus, reason || 'Recruiter status update via candidate list');
      if (res.success) {
        setCandidates((prev) =>
          prev.map((c) => (c._id === candidateId ? { ...c, status: res.newStatus } : c))
        );
        if (selectedCandidate && selectedCandidate._id === candidateId) {
          setSelectedCandidate((prev) => (prev ? { ...prev, status: res.newStatus } : null));
          const actRes = await fetch(
            `${API_BASE_URL}/api/jobs/${selectedCandidate.jobId}/activity?candidateId=${candidateId}&limit=50`
          );
          const actData = await actRes.json();
          if (actData.success) setCandidateActivities(actData.activities || []);
        }
      }
    } catch (err: any) {
      alert(`Status transition error: ${err.message || 'Operation failed'}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleOpenSimulate = (cand: Candidate) => {
    setSimulatingCandidate(cand);
    setSimulateText(PRESET_REPLIES[0].text);
  };

  const handleSubmitSimulateReply = async () => {
    if (!simulatingCandidate || !simulateText.trim()) return;
    setIsSubmittingReply(true);
    try {
      await simulateReply({
        candidateId: simulatingCandidate._id,
        message: simulateText.trim(),
      });
      setSimulatingCandidate(null);
      setTimeout(async () => {
        try {
          const candRes = await fetch(`${API_BASE_URL}/api/candidates`);
          const candData = await candRes.json();
          if (candData.success && candData.candidates) {
            setCandidates(candData.candidates);
          }
        } catch {}
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to simulate candidate reply');
    } finally {
      setIsSubmittingReply(false);
    }
  };

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
                        <div className="flex flex-col items-start gap-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                            {c.status}
                          </span>
                          {c.needsReview && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                              <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
                              Needs review
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          {(ALLOWED_TRANSITIONS[c.status] || []).length > 0 && (
                            <select
                              defaultValue=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleDirectStatusChange(c._id, e.target.value);
                                  e.target.value = '';
                                }
                              }}
                              disabled={isUpdatingStatus}
                              className="px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-500"
                            >
                              <option value="" disabled>
                                Move to...
                              </option>
                              {(ALLOWED_TRANSITIONS[c.status] || []).map((target) => (
                                <option key={target} value={target}>
                                  {target}
                                </option>
                              ))}
                            </select>
                          )}

                          {c.status === 'Contacted' && (
                            <button
                              type="button"
                              onClick={() => handleOpenSimulate(c)}
                              className="inline-flex items-center px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-xs font-semibold transition"
                              title="Simulate Inbound Candidate Reply"
                            >
                              <MessageSquare className="w-3.5 h-3.5 mr-1" />
                              Simulate reply
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleSelectCandidate(c)}
                            className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-xs font-medium text-slate-700 transition"
                          >
                            View Details
                          </button>
                        </div>
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
              {/* Needs Review Alert Banner (A7) */}
              {selectedCandidate.needsReview && (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-lg flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-amber-800">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div>
                      <span className="font-semibold block text-xs">Needs Recruiter Review</span>
                      <span className="text-[11px] text-amber-700">
                        Inbound reply could not be classified with certainty or triggered security review.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRetryClassification(selectedCandidate._id)}
                    disabled={isRetryingClassification}
                    className="ml-3 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium text-xs flex items-center shadow-sm disabled:opacity-50 whitespace-nowrap"
                  >
                    {isRetryingClassification ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      'Retry classification'
                    )}
                  </button>
                </div>
              )}

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

              {/* Status Update Control (DEC-16 / DEC-18) */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="font-semibold text-slate-900 uppercase tracking-wider block">
                  Update Candidate Pipeline Stage
                </span>
                <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-2">
                  <div className="text-[11px] text-slate-600">
                    Current stage: <strong className="text-indigo-700">{selectedCandidate.status}</strong>
                  </div>
                  <select
                    value={drawerTargetStatus}
                    onChange={(e) => setDrawerTargetStatus(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Choose next status --</option>
                    {(ALLOWED_TRANSITIONS[selectedCandidate.status] || []).map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Rationale for transition (optional)..."
                    value={drawerReason}
                    onChange={(e) => setDrawerReason(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    disabled={!drawerTargetStatus || isUpdatingStatus}
                    onClick={() => {
                      if (drawerTargetStatus) {
                        handleDirectStatusChange(selectedCandidate._id, drawerTargetStatus, drawerReason);
                      }
                    }}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded text-xs font-semibold transition"
                  >
                    {isUpdatingStatus ? 'Applying Transition...' : 'Confirm Stage Transition'}
                  </button>
                </div>
              </div>

              {/* Candidate Audit Timeline (DEC-18) */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="font-semibold text-slate-900 uppercase tracking-wider block flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  Candidate Audit Timeline (DEC-18)
                </span>
                {isLoadingActivity ? (
                  <div className="p-4 text-center text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1 text-indigo-600" />
                    <span>Loading timeline...</span>
                  </div>
                ) : candidateActivities.length === 0 ? (
                  <div className="p-3 text-center text-slate-400 bg-slate-50 rounded">
                    No activity recorded yet for this candidate.
                  </div>
                ) : (
                  <div className="space-y-2 border-l-2 border-indigo-200 pl-3">
                    {candidateActivities.map((act) => (
                      <div key={act._id} className="relative py-1">
                        <div className="text-[11px] font-bold text-slate-800">
                          {act.action} &bull; <span className="font-mono text-slate-500">{act.actor}</span>
                        </div>
                        {act.previousStatus && act.newStatus && (
                          <div className="text-[11px] text-slate-600">
                            {act.previousStatus} &rarr; <strong>{act.newStatus}</strong>
                          </div>
                        )}
                        {act.details?.reason && (
                          <div className="text-[10px] text-slate-500 italic">{act.details.reason}</div>
                        )}
                        <div className="text-[10px] text-slate-400">
                          {new Date(act.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simulate Reply Modal (F4 / DEC-15) */}
      {simulatingCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Simulate Inbound Reply</h4>
                  <p className="text-xs text-slate-500">
                    Candidate: <strong>{simulatingCandidate.fullName}</strong> ({simulatingCandidate.email || 'no email'})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSimulatingCandidate(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Preset Chips */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Select Preset Reply:
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_REPLIES.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setSimulateText(p.text)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition ${p.badge}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Editable Body */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Candidate Email Text:
              </label>
              <textarea
                rows={4}
                value={simulateText}
                onChange={(e) => setSimulateText(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-3 text-slate-800 font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter candidate email text..."
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSimulatingCandidate(null)}
                disabled={isSubmittingReply}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitSimulateReply}
                disabled={isSubmittingReply || !simulateText.trim()}
                className="inline-flex items-center px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded-lg shadow-sm transition"
              >
                {isSubmittingReply ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Submit Simulated Reply
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
