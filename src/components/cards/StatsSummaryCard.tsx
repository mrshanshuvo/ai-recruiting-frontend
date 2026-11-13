import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Users, Mail, Calendar, CheckCircle2, DollarSign, ArrowUpRight } from 'lucide-react';

interface StatsSummaryPayload {
  jobId: string;
  jobTitle: string;
  totals: {
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
  funnel: Record<string, number>;
  sourceBreakdown?: {
    fixture: number;
    csv: number;
    serper: number;
  };
  campaignSummary?: {
    campaignsCount: number;
    sentMessages: number;
    queuedMessages: number;
    isPaused: boolean;
  };
  tokenUsage?: {
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalTokens: number;
    totalEstimatedCostUsd: number;
  };
}

interface StatsSummaryCardProps {
  payload: StatsSummaryPayload;
  status?: string;
  actionId?: string;
}

const FUNNEL_STAGES = [
  { key: 'Sourced', color: 'bg-slate-400' },
  { key: 'Accepted', color: 'bg-blue-400' },
  { key: 'Contacted', color: 'bg-indigo-400' },
  { key: 'Replied', color: 'bg-purple-400' },
  { key: 'Interested', color: 'bg-emerald-400' },
  { key: 'Meeting booked', color: 'bg-teal-500' },
  { key: 'Interviewed', color: 'bg-amber-400' },
  { key: 'Shortlisted', color: 'bg-orange-400' },
  { key: 'Hired', color: 'bg-emerald-600' },
];

export const StatsSummaryCard: React.FC<StatsSummaryCardProps> = ({ payload }) => {
  const totals = payload.totals || {
    totalCandidates: 0,
    contacted: 0,
    replied: 0,
    interested: 0,
    meetings: 0,
    hires: 0,
  };
  const rates = payload.rates || {
    replyRateFormatted: 'n/a',
    interestedRateFormatted: 'n/a',
  };
  const funnel = payload.funnel || {};
  const maxFunnelVal = Math.max(...Object.values(funnel), totals.totalCandidates, 1);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 my-2 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
              Live Recruiting Metrics
            </span>
            <h4 className="text-sm font-bold text-slate-800">{payload.jobTitle}</h4>
          </div>
        </div>

        {payload.jobId && (
          <Link
            to={`/jobs/${payload.jobId}/dashboard`}
            className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition group"
          >
            <span>Full Dashboard</span>
            <ArrowUpRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </Link>
        )}
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
          <div className="flex items-center text-[11px] text-slate-500 gap-1 font-medium">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>Candidates</span>
          </div>
          <div className="text-lg font-bold text-slate-800 mt-0.5">{totals.totalCandidates}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Sourced & ingested</div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
          <div className="flex items-center text-[11px] text-slate-500 gap-1 font-medium">
            <Mail className="w-3.5 h-3.5 text-indigo-500" />
            <span>Contacted</span>
          </div>
          <div className="text-lg font-bold text-slate-800 mt-0.5">{totals.contacted}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Sequence enrolled</div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
          <div className="flex items-center text-[11px] text-slate-500 gap-1 font-medium">
            <BarChart3 className="w-3.5 h-3.5 text-purple-500" />
            <span>Reply Rate</span>
          </div>
          <div className="text-lg font-bold text-slate-800 mt-0.5">{rates.replyRateFormatted}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{totals.replied} candidate replies</div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
          <div className="flex items-center text-[11px] text-slate-500 gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Interested Rate</span>
          </div>
          <div className="text-lg font-bold text-emerald-700 mt-0.5">{rates.interestedRateFormatted}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{totals.interested} positive replies</div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
          <div className="flex items-center text-[11px] text-slate-500 gap-1 font-medium">
            <Calendar className="w-3.5 h-3.5 text-teal-500" />
            <span>Meetings</span>
          </div>
          <div className="text-lg font-bold text-slate-800 mt-0.5">{totals.meetings}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Booked conversations</div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
          <div className="flex items-center text-[11px] text-slate-500 gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Hired</span>
          </div>
          <div className="text-lg font-bold text-emerald-700 mt-0.5">{totals.hires}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Final hires made</div>
        </div>
      </div>

      {/* Pure Tailwind Funnel Progress Bars */}
      <div className="space-y-2 pt-1">
        <div className="text-xs font-semibold text-slate-700">Pipeline Stage Funnel</div>
        <div className="space-y-1.5 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
          {FUNNEL_STAGES.map((st) => {
            const count = funnel[st.key] || 0;
            const percent = Math.round((count / maxFunnelVal) * 100);
            return (
              <div key={st.key} className="flex items-center text-xs">
                <span className="w-28 text-slate-600 font-medium truncate">{st.key}</span>
                <div className="flex-1 bg-slate-200/70 h-2.5 rounded-full overflow-hidden mx-2">
                  <div
                    className={`h-full ${st.color} transition-all duration-500`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="w-8 text-right font-semibold text-slate-700">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Token Usage & Cost Footer */}
      {payload.tokenUsage && (
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          <span>
            Total Tokens: <strong className="text-slate-700">{payload.tokenUsage.totalTokens.toLocaleString()}</strong>
          </span>
          <span className="flex items-center gap-0.5 text-emerald-600 font-semibold">
            <DollarSign className="w-3 h-3 text-emerald-500 inline" />
            Est. Cost: ${payload.tokenUsage.totalEstimatedCostUsd.toFixed(4)} USD
          </span>
        </div>
      )}
    </div>
  );
};
