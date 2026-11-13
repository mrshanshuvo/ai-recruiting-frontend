import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Users,
  Activity,
  ArrowLeft,
  MessageSquare,
  Search,
  Clock,
  Loader2,
  Send,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { API_BASE_URL, updateCandidateStatus, simulateReply } from '../api/client';

export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
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

const PIPELINE_STAGES = [
  'Sourced',
  'Accepted',
  'Contacted',
  'Replied',
  'Interested',
  'Meeting booked',
  'Interviewed',
  'Shortlisted',
  'Hired',
];

const PRESET_REPLIES = [
  {
    label: 'Interested',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100',
    text: "Hi, thanks for reaching out! The role at Aironauts sounds very interesting. I'd love to learn more about what your team is building.",
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

interface Job {
  _id: string;
  title: string;
  department?: string;
  location?: string;
  remotePolicy?: string;
  seniority?: string;
  mustHaveSkills?: string[];
  niceToHaveSkills?: string[];
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  status: string;
  conversationId?: string;
  createdAt?: string;
}

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
  status: string;
  createdAt: string;
}

interface ActivityItem {
  _id: string;
  jobId: string;
  candidateId?: {
    _id: string;
    fullName: string;
    email?: string;
    status: string;
  } | string;
  actor: 'recruiter' | 'agent' | 'system';
  action: string;
  previousStatus?: string | null;
  newStatus?: string | null;
  details?: Record<string, any>;
  timestamp: string;
}

export const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'candidates' | 'activity'>('candidates');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Search & filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  // Candidate detail drawer
  const [drawerCandidate, setDrawerCandidate] = useState<Candidate | null>(null);
  const [candidateActivities, setCandidateActivities] = useState<ActivityItem[]>([]);
  const [isLoadingDrawerActivity, setIsLoadingDrawerActivity] = useState(false);
  const [drawerTargetStatus, setDrawerTargetStatus] = useState<string>('');
  const [drawerReason, setDrawerReason] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Reply Simulation Modal (DEC-15)
  const [simulatingCandidate, setSimulatingCandidate] = useState<Candidate | null>(null);
  const [simulateText, setSimulateText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Load Job and Candidates
  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        setIsLoading(true);
        const [jobRes, candRes, actRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/jobs/${id}`).then((r) => r.json()),
          fetch(`${API_BASE_URL}/api/jobs/${id}/candidates`).then((r) => r.json()),
          fetch(`${API_BASE_URL}/api/jobs/${id}/activity?limit=20`).then((r) => r.json()),
        ]);

        if (jobRes.success) setJob(jobRes.job);
        if (candRes.success) setCandidates(candRes.candidates || []);
        if (actRes.success) {
          setActivities(actRes.activities || []);
          setNextCursor(actRes.nextCursor);
        }
      } catch (err) {
        console.error('Failed to load job details:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  // Load more activities (cursor pagination)
  const handleLoadMoreActivities = async () => {
    if (!id || !nextCursor || isLoadingMore) return;
    try {
      setIsLoadingMore(true);
      const res = await fetch(`${API_BASE_URL}/api/jobs/${id}/activity?cursor=${nextCursor}&limit=20`);
      const data = await res.json();
      if (data.success) {
        setActivities((prev) => [...prev, ...(data.activities || [])]);
        setNextCursor(data.nextCursor);
      }
    } catch (err) {
      console.error('Failed to paginate activities:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Open drawer and fetch candidate timeline
  const handleOpenDrawer = async (cand: Candidate) => {
    setDrawerCandidate(cand);
    setDrawerTargetStatus('');
    setDrawerReason('');
    try {
      setIsLoadingDrawerActivity(true);
      const res = await fetch(`${API_BASE_URL}/api/jobs/${id}/activity?candidateId=${cand._id}&limit=50`);
      const data = await res.json();
      if (data.success) {
        setCandidateActivities(data.activities || []);
      }
    } catch (err) {
      console.error('Failed to load candidate timeline:', err);
    } finally {
      setIsLoadingDrawerActivity(false);
    }
  };

  // Update status directly from table or drawer
  const handleStatusChange = async (candidateId: string, newStatus: string, reason?: string) => {
    try {
      setIsUpdatingStatus(true);
      const res = await updateCandidateStatus(candidateId, newStatus, reason || 'Recruiter status update via Job Dashboard');
      if (res.success) {
        setCandidates((prev) =>
          prev.map((c) => (c._id === candidateId ? { ...c, status: res.newStatus } : c))
        );
        if (drawerCandidate && drawerCandidate._id === candidateId) {
          setDrawerCandidate((prev) => (prev ? { ...prev, status: res.newStatus } : null));
          // Refresh drawer timeline
          const actRes = await fetch(`${API_BASE_URL}/api/jobs/${id}/activity?candidateId=${candidateId}&limit=50`);
          const actData = await actRes.json();
          if (actData.success) setCandidateActivities(actData.activities || []);
        }
        // Refresh job activity
        const jobActRes = await fetch(`${API_BASE_URL}/api/jobs/${id}/activity?limit=20`);
        const jobActData = await jobActRes.json();
        if (jobActData.success) {
          setActivities(jobActData.activities || []);
          setNextCursor(jobActData.nextCursor);
        }
      }
    } catch (err: any) {
      alert(`Status transition error: ${err.message || 'Operation failed'}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle simulation
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
      // Refresh after worker processes
      setTimeout(async () => {
        try {
          const candRes = await fetch(`${API_BASE_URL}/api/candidates?jobId=${id}`);
          const candData = await candRes.json();
          if (candData.success && candData.candidates) {
            setCandidates(candData.candidates);
          }
          const actRes = await fetch(`${API_BASE_URL}/api/jobs/${id}/activity?limit=20`);
          const actData = await actRes.json();
          if (actData.success) {
            setActivities(actData.activities || []);
            setNextCursor(actData.nextCursor);
          }
        } catch {}
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to simulate candidate reply');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Funnel counts
  const statusCounts = candidates.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filteredCandidates = candidates.filter((c) => {
    if (selectedStatusFilter !== 'all' && c.status !== selectedStatusFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = c.fullName?.toLowerCase().includes(term);
      const matchEmail = c.email?.toLowerCase().includes(term);
      const matchRole = c.currentTitle?.toLowerCase().includes(term);
      const matchSkills = c.skills?.some((s) => s.toLowerCase().includes(term));
      if (!matchName && !matchEmail && !matchRole && !matchSkills) return false;
    }
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/jobs')}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              {job?.title || 'Job Pipeline Dashboard'}
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
              <span>{job?.department || 'Engineering'}</span>
              <span>&bull;</span>
              <span>{job?.location || 'Remote'} ({job?.remotePolicy || 'Remote'})</span>
              {job?.salaryRange?.min && (
                <>
                  <span>&bull;</span>
                  <span>
                    ${job.salaryRange.min.toLocaleString()} - ${job.salaryRange.max?.toLocaleString()}{' '}
                    {job.salaryRange.currency || 'USD'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {job?.conversationId && (
          <Link
            to={`/chat/${job.conversationId}`}
            className="inline-flex items-center px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
            Recruiter Chat Feed
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="p-16 text-center text-slate-500 flex items-center justify-center space-x-2 text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          <span>Loading job pipeline...</span>
        </div>
      ) : (
        <>
          {/* Recruitment Funnel Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-indigo-600" />
                Pipeline Stage Funnel
              </h3>
              <span className="text-xs text-slate-500">
                Total Sourced: <strong>{candidates.length}</strong>
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
              {PIPELINE_STAGES.map((stage) => {
                const count = statusCounts[stage] || 0;
                const isSelected = selectedStatusFilter === stage;
                return (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => setSelectedStatusFilter(isSelected ? 'all' : stage)}
                    className={`p-2.5 rounded-lg border text-center transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200'
                        : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-[11px] font-medium text-slate-600 truncate block w-full" title={stage}>
                      {stage}
                    </span>
                    <span className={`text-base font-extrabold mt-1 ${count > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-slate-200 flex items-center justify-between">
            <div className="flex space-x-6 text-sm font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('candidates')}
                className={`pb-3 flex items-center gap-2 border-b-2 transition ${
                  activeTab === 'candidates'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Candidate Pipeline ({candidates.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('activity')}
                className={`pb-3 flex items-center gap-2 border-b-2 transition ${
                  activeTab === 'activity'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Activity Timeline (DEC-18)</span>
              </button>
            </div>

            {activeTab === 'candidates' && (
              <div className="flex items-center gap-2 pb-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search candidate..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* TAB 1: Candidates Table */}
          {activeTab === 'candidates' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {filteredCandidates.length === 0 ? (
                <div className="p-12 text-center">
                  <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No candidates match current filters</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try clearing the stage filter or search term.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3">Candidate</th>
                        <th className="px-5 py-3">Current Role & Company</th>
                        <th className="px-5 py-3">Score</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">Next Action / Stage</th>
                        <th className="px-5 py-3 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCandidates.map((c) => {
                        const allowedNext = ALLOWED_TRANSITIONS[c.status] || [];
                        return (
                          <tr key={c._id} className="hover:bg-slate-50/80 transition">
                            <td className="px-5 py-3.5">
                              <div className="font-bold text-slate-900 text-sm">{c.fullName}</div>
                              <div className="text-slate-400 text-xs font-mono">{c.email || 'No email'}</div>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="font-medium text-slate-800">{c.currentTitle || 'N/A'}</div>
                              <div className="text-slate-400 text-xs">{c.currentCompany || 'Not provided'}</div>
                            </td>
                            <td className="px-5 py-3.5">
                              {c.score !== null ? (
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                    c.score >= 80
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : c.score >= 60
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                                  }`}
                                >
                                  {c.score} / 100
                                </span>
                              ) : (
                                <span className="text-slate-400">Not scored</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {c.status}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                {allowedNext.length > 0 ? (
                                  <select
                                    defaultValue=""
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        handleStatusChange(c._id, e.target.value);
                                        e.target.value = '';
                                      }
                                    }}
                                    disabled={isUpdatingStatus}
                                    className="px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-500"
                                  >
                                    <option value="" disabled>
                                      Move to...
                                    </option>
                                    {allowedNext.map((target) => (
                                      <option key={target} value={target}>
                                        {target}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <span className="text-[11px] text-slate-400 italic">Terminal stage</span>
                                )}

                                {c.status === 'Contacted' && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenSimulate(c)}
                                    className="inline-flex items-center px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-xs font-semibold transition"
                                  >
                                    <MessageSquare className="w-3 h-3 mr-1" />
                                    Simulate reply
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleOpenDrawer(c)}
                                className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-xs font-medium text-slate-700 transition"
                              >
                                View Timeline
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Activity Log Timeline Panel (DEC-18) */}
          {activeTab === 'activity' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  Chronological Job Activity Audit Trail (DEC-18)
                </h3>
                <span className="text-xs text-slate-400">Cursor-paginated immutable activity log</span>
              </div>

              {activities.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No activity events recorded yet for this job.
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.map((act) => {
                    const candidateName =
                      typeof act.candidateId === 'object' && act.candidateId !== null
                        ? act.candidateId.fullName
                        : null;

                    return (
                      <div
                        key={act._id}
                        className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-start justify-between gap-4 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                act.actor === 'recruiter'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : act.actor === 'agent'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {act.actor}
                            </span>
                            <span className="font-bold text-slate-800">{act.action}</span>
                            {candidateName && (
                              <span className="text-slate-500">
                                for <strong>{candidateName}</strong>
                              </span>
                            )}
                          </div>

                          {act.previousStatus && act.newStatus && (
                            <div className="text-slate-600 font-medium">
                              Transition: <span className="text-slate-800">{act.previousStatus}</span> &rarr;{' '}
                              <span className="text-indigo-600 font-bold">{act.newStatus}</span>
                            </div>
                          )}

                          {act.details?.reason && (
                            <div className="text-slate-500 italic">
                              Reason: {act.details.reason}
                            </div>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-400 shrink-0">
                          {new Date(act.timestamp).toLocaleString()}
                        </div>
                      </div>
                    );
                  })}

                  {nextCursor && (
                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={handleLoadMoreActivities}
                        disabled={isLoadingMore}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition disabled:opacity-50"
                      >
                        {isLoadingMore ? 'Loading older events...' : 'Load Older Activity Events'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Candidate Detail Drawer with Timeline (DEC-18) */}
      {drawerCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden border-l border-slate-200 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-base text-slate-900">{drawerCandidate.fullName}</h3>
                <p className="text-xs text-slate-500">{drawerCandidate.email || 'No email provided'}</p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerCandidate(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-700">
              {/* Profile Card */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Current Status:</span>
                  <span className="px-2.5 py-0.5 rounded font-bold text-xs bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {drawerCandidate.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Match Score:</span>
                  <span className="font-bold text-slate-900">{drawerCandidate.score ?? 'N/A'} / 100</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Current Role:</span>
                  <span className="font-semibold text-slate-800">
                    {drawerCandidate.currentTitle} at {drawerCandidate.currentCompany || 'Not provided'}
                  </span>
                </div>
              </div>

              {/* Status Update Control (DEC-16 / DEC-18) */}
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Update Candidate Pipeline Stage
                </h4>
                <div className="space-y-2">
                  <label className="block text-slate-600 text-[11px] font-medium">
                    Allowed Next Status:
                  </label>
                  <select
                    value={drawerTargetStatus}
                    onChange={(e) => setDrawerTargetStatus(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Choose next status --</option>
                    {(ALLOWED_TRANSITIONS[drawerCandidate.status] || []).map((st) => (
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
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />

                  <button
                    type="button"
                    disabled={!drawerTargetStatus || isUpdatingStatus}
                    onClick={() => {
                      if (drawerTargetStatus) {
                        handleStatusChange(drawerCandidate._id, drawerTargetStatus, drawerReason);
                      }
                    }}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold transition"
                  >
                    {isUpdatingStatus ? 'Applying Transition...' : 'Confirm Stage Transition'}
                  </button>
                </div>
              </div>

              {/* Candidate Timeline Audit Trail */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  Candidate Audit Timeline (DEC-18)
                </h4>
                {isLoadingDrawerActivity ? (
                  <div className="p-6 text-center text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                    <span>Loading timeline...</span>
                  </div>
                ) : candidateActivities.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-lg">
                    No activity recorded for this candidate.
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

      {/* Simulate Reply Modal (DEC-15 / F4) */}
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
                    Candidate: <strong>{simulatingCandidate.fullName}</strong>
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
