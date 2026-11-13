import React, { useState } from 'react';
import {
  Check,
  X,
  ExternalLink,
  Loader2,
  AlertCircle,
  Database,
  MailX,
  MessageSquare,
  Send,
} from 'lucide-react';
import { CardWrapper } from './CardWrapper';
import { CardStatus } from '../../types/chat';
import { confirmAction, cancelAction, updateCandidateStatus, simulateReply } from '../../api/client';

export interface CandidateRow {
  candidateId: string;
  fullName: string;
  currentTitle?: string;
  currentCompany?: string;
  score?: number | null;
  scoreStatus?: 'pending' | 'scored' | 'failed';
  scoreReason?: string;
  profileUrl?: string | null;
  status: string;
  sourceMode?: string;
  email?: string | null;
  emailStatus?: string;
}

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

interface CandidateTableCardProps {
  actionId?: string;
  status: CardStatus;
  payload: {
    jobId?: string;
    jobTitle?: string;
    decision?: 'accept' | 'reject';
    targetStatus?: string;
    candidateIds?: string[];
    reason?: string;
    candidates?: CandidateRow[];
  };
}

export const CandidateTableCard: React.FC<CandidateTableCardProps> = ({
  actionId,
  status,
  payload,
}) => {
  const [candidates, setCandidates] = useState<CandidateRow[]>(payload.candidates || []);
  const [rowLoading, setRowLoading] = useState<Record<string, boolean>>({});
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Simulation modal state (DEC-15 / F4)
  const [simulatingCandidate, setSimulatingCandidate] = useState<CandidateRow | null>(null);
  const [simulateText, setSimulateText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const isPending = status === 'pending';
  const decision = payload.decision || 'accept';
  const jobTitle = payload.jobTitle || 'Role';

  const handleOpenSimulate = (cand: CandidateRow) => {
    setSimulatingCandidate(cand);
    setSimulateText(PRESET_REPLIES[0].text);
  };

  const handleSubmitSimulateReply = async () => {
    if (!simulatingCandidate || !simulateText.trim()) return;
    setIsSubmittingReply(true);
    try {
      await simulateReply({
        candidateId: simulatingCandidate.candidateId,
        message: simulateText.trim(),
      });
      setSimulatingCandidate(null);
    } catch (err: any) {
      alert(err.message || 'Failed to simulate candidate reply');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Direct row action (DEC-16): Recruiter clicks Accept or Reject on a candidate
  const handleRowStatusChange = async (candidateId: string, newStatus: string) => {
    setRowLoading((prev) => ({ ...prev, [candidateId]: true }));
    setErrorMessage(null);

    try {
      await updateCandidateStatus(candidateId, newStatus, 'Direct recruiter table review');
      // Update local row status state
      setCandidates((prev) =>
        prev.map((c) => (c.candidateId === candidateId ? { ...c, status: newStatus } : c))
      );
    } catch (err: any) {
      console.error(`[CandidateTableCard] Failed to update candidate ${candidateId}:`, err);
      setErrorMessage(err.message || 'Failed to update candidate status');
    } finally {
      setRowLoading((prev) => ({ ...prev, [candidateId]: false }));
    }
  };

  // Card-level bulk confirm action
  const handleBulkConfirm = async () => {
    if (!actionId || !isPending) return;
    setIsConfirming(true);
    setErrorMessage(null);

    try {
      const res = await confirmAction(actionId);
      if (res.success) {
        const updatedStatus = decision === 'accept' ? 'Accepted' : 'Rejected';
        setCandidates((prev) => prev.map((c) => ({ ...c, status: updatedStatus })));
      }
    } catch (err: any) {
      console.error('[CandidateTableCard] Confirm failed:', err);
      setErrorMessage(err.message || 'Failed to confirm bulk review');
    } finally {
      setIsConfirming(false);
    }
  };

  // Card-level bulk cancel action
  const handleBulkCancel = async () => {
    if (!actionId || !isPending) return;
    setIsCancelling(true);
    setErrorMessage(null);

    try {
      await cancelAction(actionId, 'Recruiter cancelled bulk review proposal');
    } catch (err: any) {
      console.error('[CandidateTableCard] Cancel failed:', err);
      setErrorMessage(err.message || 'Failed to cancel bulk review');
    } finally {
      setIsCancelling(false);
    }
  };

  const getScoreBadge = (score?: number | null, scoreStatus?: string) => {
    if (scoreStatus === 'failed' || score === null || score === undefined) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          Could not score
        </span>
      );
    }
    if (score >= 80) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          {score} / 100
        </span>
      );
    }
    if (score >= 60) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          {score} / 100
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
        {score} / 100
      </span>
    );
  };

  const getStatusBadge = (candStatus: string) => {
    switch (candStatus) {
      case 'Accepted':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            Accepted
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            Rejected
          </span>
        );
      case 'Contacted':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            Contacted
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {candStatus}
          </span>
        );
    }
  };

  return (
    <CardWrapper
      title={
        actionId
          ? `Bulk Candidate Review: ${decision.toUpperCase()} (${candidates.length})`
          : `Candidates: ${jobTitle}`
      }
      status={status}
      badgeLabel={!actionId ? 'Browse Mode' : undefined}
    >
      <div className="space-y-4">
        {payload.reason && (
          <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="font-semibold text-slate-700">Proposal reason:</span> {payload.reason}
          </p>
        )}

        {errorMessage && (
          <div className="flex items-center text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
            <AlertCircle className="w-4 h-4 mr-1.5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-3 py-2.5">Candidate</th>
                <th className="px-3 py-2.5">Fit Score</th>
                <th className="px-3 py-2.5">Reasoning</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {candidates.map((cand) => {
                const isLoading = rowLoading[cand.candidateId];
                const isFixture = cand.sourceMode === 'fixture';
                const hasNoEmail = cand.emailStatus === 'missing' || !cand.email;

                return (
                  <tr key={cand.candidateId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        {cand.fullName}
                        {cand.profileUrl && (
                          <a
                            href={cand.profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800"
                            title="View public profile"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        {cand.currentTitle} {cand.currentCompany ? `@ ${cand.currentCompany}` : ''}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        {isFixture && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                            <Database className="w-2.5 h-2.5 mr-0.5" />
                            demo data
                          </span>
                        )}
                        {hasNoEmail && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-orange-50 text-orange-700 border border-orange-200">
                            <MailX className="w-2.5 h-2.5 mr-0.5" />
                            no email
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {getScoreBadge(cand.score, cand.scoreStatus)}
                    </td>

                    <td className="px-3 py-2.5 text-slate-600 max-w-xs text-[11px]">
                      {cand.scoreReason || 'Evaluated against job criteria'}
                    </td>

                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {getStatusBadge(cand.status)}
                    </td>

                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        {/* Simulate reply button for Contacted candidates (F4 / DEC-15) */}
                        {cand.status === 'Contacted' && (
                          <button
                            type="button"
                            onClick={() => handleOpenSimulate(cand)}
                            className="inline-flex items-center px-2 py-1 rounded text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition"
                            title="Simulate Inbound Candidate Reply"
                          >
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Simulate reply
                          </button>
                        )}

                        {/* Accept button: valid next action only from 'Sourced' */}
                        {cand.status === 'Sourced' ? (
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleRowStatusChange(cand.candidateId, 'Accepted')}
                            className="p-1.5 rounded transition-colors text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                            title="Accept Candidate"
                          >
                            {isLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                          </button>
                        ) : cand.status === 'Accepted' ? (
                          <span
                            className="p-1.5 rounded text-emerald-600 bg-emerald-50 cursor-default"
                            title="Accepted"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : null}

                        {/* Reject button: valid next action except from terminal states */}
                        {!['Rejected', 'Hired', 'Unsubscribed'].includes(cand.status) ? (
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleRowStatusChange(cand.candidateId, 'Rejected')}
                            className="p-1.5 rounded transition-colors text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                            title="Reject Candidate"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        ) : cand.status === 'Rejected' ? (
                          <span
                            className="p-1.5 rounded text-rose-600 bg-rose-50 cursor-default"
                            title="Rejected"
                          >
                            <X className="w-3.5 h-3.5" />
                          </span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Card-level Confirmation Footer (when actionId exists and is pending) */}
        {actionId && isPending && (
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              disabled={isConfirming || isCancelling}
              onClick={handleBulkCancel}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {isCancelling ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
              Cancel
            </button>
            <button
              type="button"
              disabled={isConfirming || isCancelling}
              onClick={handleBulkConfirm}
              className={`inline-flex items-center px-3.5 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors ${
                decision === 'reject'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isConfirming ? (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5 mr-1" />
              )}
              Confirm {decision === 'reject' ? 'Reject' : 'Accept'} ({candidates.length})
            </button>
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
    </CardWrapper>
  );
};
