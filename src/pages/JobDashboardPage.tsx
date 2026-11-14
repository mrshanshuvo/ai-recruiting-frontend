import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Mail,
  Calendar,
  CheckCircle2,
  DollarSign,
  Activity,
  Cpu,
  Layers,
  Clock,
  Loader2,
  MessageSquare,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { API_BASE_URL } from '../api/client';

interface JobStats {
  jobId: string;
  jobTitle: string;
  everReached: {
    totalCandidates: number;
    contacted: number;
    replied: number;
    interested: number;
    meetings: number;
    hires: number;
  };
  rates: {
    replyRate: number | string;
    replyRateFormatted: string;
    interestedRate: number | string;
    interestedRateFormatted: string;
  };
  currentStatusCounts: Record<string, number>;
  sourceBreakdown: {
    fixture: number;
    csv: number;
    serper: number;
  };
  campaignSummary: {
    campaignsCount: number;
    sentMessages: number;
    queuedMessages: number;
    cancelledMessages?: number;
    isPaused: boolean;
  };
  tokenUsage: {
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalTokens: number;
    totalEstimatedCostUsd: number;
    byCaller: Record<
      string,
      {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
        estimatedCostUsd: number;
      }
    >;
  };
}

interface ActivityItem {
  _id: string;
  actor: string;
  action: string;
  previousStatus?: string;
  newStatus?: string;
  timestamp: string;
  details?: Record<string, any>;
  candidateId?: {
    _id: string;
    fullName?: string;
    name?: string;
  };
}

const FUNNEL_DISPLAY_STAGES = [
  { key: 'Sourced', label: 'Sourced', color: 'bg-slate-400' },
  { key: 'Accepted', label: 'Accepted', color: 'bg-blue-500' },
  { key: 'Contacted', label: 'Contacted', color: 'bg-indigo-500' },
  { key: 'Replied', label: 'Replied', color: 'bg-purple-500' },
  { key: 'Interested', label: 'Interested', color: 'bg-emerald-500' },
  { key: 'Not interested', label: 'Not Interested', color: 'bg-slate-400' },
  { key: 'Meeting booked', label: 'Meeting Booked', color: 'bg-teal-500' },
  { key: 'Interviewed', label: 'Interviewed', color: 'bg-amber-500' },
  { key: 'Shortlisted', label: 'Shortlisted', color: 'bg-orange-500' },
  { key: 'Hired', label: 'Hired', color: 'bg-emerald-600' },
  { key: 'Rejected', label: 'Rejected', color: 'bg-rose-400' },
  { key: 'Unsubscribed', label: 'Unsubscribed', color: 'bg-zinc-500' },
];

export const JobDashboardPage: React.FC = () => {
  const { id: jobId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [stats, setStats] = useState<JobStats | null>(null);
  const [job, setJob] = useState<any>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    if (!jobId) return;
    try {
      setError(null);
      const [statsRes, jobRes, actRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/jobs/${jobId}/stats`),
        fetch(`${API_BASE_URL}/api/jobs/${jobId}`),
        fetch(`${API_BASE_URL}/api/jobs/${jobId}/activity?limit=25`),
      ]);

      if (!statsRes.ok) throw new Error('Failed to load job statistics');
      const statsData = await statsRes.json();
      setStats(statsData.stats);

      if (jobRes.ok) {
        const jobData = await jobRes.json();
        setJob(jobData.job);
      }

      if (actRes.ok) {
        const actData = await actRes.json();
        setActivities(actData.activities || []);
      }
    } catch (err: any) {
      console.error('[JobDashboardPage] Error loading data:', err);
      setError(err.message || 'Error loading dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [jobId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full text-slate-500 space-x-2 text-sm">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
        <span>Loading recruitment dashboard...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <Activity className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Dashboard Unavailable</h3>
        <p className="text-xs text-slate-500">{error || 'Job not found'}</p>
        <Link
          to="/jobs"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Jobs
        </Link>
      </div>
    );
  }

  const everReached = stats.everReached || (stats as any).totals || {
    totalCandidates: 0,
    contacted: 0,
    replied: 0,
    interested: 0,
    meetings: 0,
    hires: 0,
  };
  const currentStatusCounts = stats.currentStatusCounts || (stats as any).funnel || {};
  const totals = everReached;
  const funnel = currentStatusCounts;
  const { rates, sourceBreakdown, campaignSummary, tokenUsage } = stats;
  const maxFunnelVal = Math.max(...Object.values(currentStatusCounts), everReached.totalCandidates, 1);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => navigate('/jobs')}
            className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition"
            title="Back to Jobs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                Job Metrics Dashboard
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                {job?.status || 'OPEN'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">{stats.jobTitle}</h2>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin text-indigo-600' : 'text-slate-400'}`} />
            Refresh
          </button>

          <Link
            to={`/jobs/${jobId}`}
            className="inline-flex items-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition"
          >
            <Users className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
            Candidate Pipeline Table
          </Link>

          {job?.conversationId && (
            <Link
              to={`/chat/${job.conversationId}`}
              className="inline-flex items-center px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
              Recruiter Chat
            </Link>
          )}
        </div>
      </div>

      {/* KPI Tiles (6 Tiles) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Candidates */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Candidates</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{totals.totalCandidates}</div>
          <div className="text-[11px] text-slate-400 mt-1">Sourced & ingested</div>
        </div>

        {/* Contacted */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Contacted</span>
            <Mail className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{totals.contacted}</div>
          <div className="text-[11px] text-slate-400 mt-1">Enrolled in outreach</div>
        </div>

        {/* Reply Rate */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Reply Rate</span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-extrabold text-purple-700 mt-2">
            {rates.replyRateFormatted}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totals.replied} of {totals.contacted} contacted
          </div>
        </div>

        {/* Interested Rate */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Interested Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-2">
            {rates.interestedRateFormatted}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totals.interested} of {totals.contacted} contacted
          </div>
        </div>

        {/* Meetings Booked */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Meetings</span>
            <Calendar className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{totals.meetings}</div>
          <div className="text-[11px] text-slate-400 mt-1">Scheduled calls</div>
        </div>

        {/* Hired */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Hired</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-2">{totals.hires}</div>
          <div className="text-[11px] text-slate-400 mt-1">Successful hires</div>
        </div>
      </div>

      {/* Main Grid: Funnel & AI Token Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pure Tailwind Funnel Visualization (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Pipeline Funnel (Current Status Distribution)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Current candidate count across all 12 pipeline stages
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
              Current Status Counts
            </span>
          </div>

          <div className="space-y-2.5 pt-2">
            {FUNNEL_DISPLAY_STAGES.map((st) => {
              const count = funnel[st.key] || 0;
              const percent = Math.round((count / maxFunnelVal) * 100);
              const isZero = count === 0;

              return (
                <div key={st.key} className="flex items-center text-xs group">
                  <div className="w-32 font-medium text-slate-700 truncate">{st.label}</div>
                  <div className="flex-1 bg-slate-100 h-4 rounded-full overflow-hidden mx-3 relative">
                    <div
                      className={`h-full ${st.color} transition-all duration-500 rounded-full`}
                      style={{ width: `${Math.max(percent, isZero ? 0 : 4)}%` }}
                    />
                  </div>
                  <div className="w-16 text-right font-bold text-slate-800">
                    {count}{' '}
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({totals.totalCandidates > 0 ? Math.round((count / totals.totalCandidates) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sourcing & Campaign Secondary Summaries */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                Discovery Channels
              </span>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Deterministic Fixture:</span>
                <strong className="text-slate-800">{sourceBreakdown.fixture}</strong>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 mt-1">
                <span>CSV Ingested:</span>
                <strong className="text-slate-800">{sourceBreakdown.csv}</strong>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 mt-1">
                <span>Live Serper Search:</span>
                <strong className="text-slate-800">{sourceBreakdown.serper}</strong>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                Outreach Engine
              </span>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Campaigns Active:</span>
                <strong className="text-slate-800">
                  {campaignSummary.campaignsCount} {campaignSummary.isPaused ? '(PAUSED)' : '(ACTIVE)'}
                </strong>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 mt-1">
                <span>Sent Messages:</span>
                <strong className="text-slate-800">{campaignSummary.sentMessages}</strong>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 mt-1">
                <span>Queued Follow-ups:</span>
                <strong className="text-slate-800">{campaignSummary.queuedMessages}</strong>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 mt-1">
                <span>Cancelled Messages:</span>
                <strong className="text-slate-800">{campaignSummary.cancelledMessages ?? 0}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Token Usage & Cost Tile (1 col) */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-600" />
                AI Inference & Cost Audit
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Gemini Flash
              </span>
            </div>

            <div className="mt-4 p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-2">
              <div className="text-xs text-slate-500 font-medium">Estimated Job AI Cost</div>
              <div className="text-3xl font-extrabold text-emerald-700 flex items-center">
                <DollarSign className="w-6 h-6 text-emerald-600 inline -mr-1" />
                {tokenUsage.totalEstimatedCostUsd.toFixed(4)}
                <span className="text-xs font-semibold text-emerald-600 ml-1">USD</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Calculated dynamically from Gemini 3.1 Flash-Lite token usage ($0.075/1M input, $0.30/1M output).
              </p>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                <span className="text-slate-500">Prompt Tokens</span>
                <span className="font-semibold text-slate-800">{tokenUsage.totalPromptTokens.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                <span className="text-slate-500">Completion Tokens</span>
                <span className="font-semibold text-slate-800">{tokenUsage.totalCompletionTokens.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                <span className="text-slate-500">Total Tokens</span>
                <span className="font-bold text-slate-900">{tokenUsage.totalTokens.toLocaleString()}</span>
              </div>
            </div>

            {/* Breakdown by Caller */}
            <div className="mt-4 space-y-2">
              <div className="text-xs font-bold text-slate-700">Usage by Agent / Worker</div>
              <div className="space-y-1.5">
                {Object.keys(tokenUsage.byCaller).length === 0 ? (
                  <div className="text-xs text-slate-400 italic py-2">No LLM calls recorded yet for this role.</div>
                ) : (
                  Object.entries(tokenUsage.byCaller).map(([caller, u]) => (
                    <div key={caller} className="p-2 bg-slate-50 rounded text-xs flex items-center justify-between">
                      <span className="font-medium text-slate-700 truncate max-w-[120px]">{caller}</span>
                      <span className="text-slate-500 text-[11px]">
                        {u.totalTokens.toLocaleString()} tok &bull; ${u.estimatedCostUsd.toFixed(4)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
            Immutable token records persisted in MongoDB &bull; ADR-0015
          </div>
        </div>
      </div>

      {/* Activity Timeline Audit Panel (DEC-18) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              Activity Audit Trail (Decision DEC-18)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Recent recruitment actions and state machine transitions for this role
            </p>
          </div>
          <span className="text-xs text-slate-500">Showing {activities.length} recent events</span>
        </div>

        {activities.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs italic">
            No activity logs recorded for this job yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activities.map((act) => {
              const candidateName = act.candidateId?.fullName || act.candidateId?.name;
              return (
                <div key={act._id} className="py-2.5 flex items-start justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{act.action}</span>
                      <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {act.actor}
                      </span>
                      {candidateName && (
                        <span className="text-indigo-600 font-medium">&bull; {candidateName}</span>
                      )}
                    </div>
                    {act.previousStatus && act.newStatus && (
                      <div className="text-slate-500 text-[11px]">
                        Status transition: <span className="font-semibold">{act.previousStatus}</span> &rarr;{' '}
                        <span className="font-semibold text-emerald-700">{act.newStatus}</span>
                      </div>
                    )}
                    {act.details?.reason && (
                      <div className="text-slate-400 text-[11px] italic">{act.details.reason}</div>
                    )}
                  </div>
                  <div className="flex items-center text-slate-400 text-[11px] shrink-0 gap-1">
                    <Clock className="w-3 h-3 text-slate-300" />
                    <span>{new Date(act.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
