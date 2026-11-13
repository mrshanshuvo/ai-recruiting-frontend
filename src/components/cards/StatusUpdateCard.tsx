import React, { useState } from 'react';
import { CardWrapper } from './CardWrapper';
import { ArrowRight, CheckCircle2, User, Check, X, Loader2 } from 'lucide-react';
import { CardStatus } from '../../types/chat';
import { confirmAction, cancelAction } from '../../api/client';

interface StatusUpdateCardProps {
  actionId?: string;
  status: CardStatus;
  payload: {
    candidateId: string;
    candidateName: string;
    jobTitle: string;
    previousStatus: string;
    newStatus: string;
    reason?: string;
  };
}

export const StatusUpdateCard: React.FC<StatusUpdateCardProps> = ({ actionId, status, payload }) => {
  const [currentStatus, setCurrentStatus] = useState<CardStatus>(status);
  const [isBusy, setIsBusy] = useState(false);

  const isPending = currentStatus === 'pending';

  const handleConfirm = async () => {
    if (!actionId) return;
    setIsBusy(true);
    try {
      await confirmAction(actionId);
      setCurrentStatus('confirmed');
    } catch (err: any) {
      alert(err.message || 'Failed to update candidate status');
    } finally {
      setIsBusy(false);
    }
  };

  const handleCancel = async () => {
    if (!actionId) return;
    setIsBusy(true);
    try {
      await cancelAction(actionId);
      setCurrentStatus('cancelled');
    } catch (err: any) {
      alert(err.message || 'Failed to cancel action');
    } finally {
      setIsBusy(false);
    }
  };

  const getStatusColor = (st: string) => {
    switch (st) {
      case 'Hired':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Shortlisted':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Interviewed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Rejected':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <CardWrapper title="Candidate Status Update" status={currentStatus}>
      <div className="space-y-4 text-sm">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">{payload.candidateName}</p>
              <p className="text-xs text-slate-500">{payload.jobTitle}</p>
            </div>
          </div>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-lg">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Transition</p>
          <div className="flex items-center space-x-3">
            <span
              className={`px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusColor(payload.previousStatus)}`}
            >
              {payload.previousStatus}
            </span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <span
              className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getStatusColor(payload.newStatus)}`}
            >
              {payload.newStatus}
            </span>
          </div>
          {payload.reason && (
            <p className="text-xs text-slate-600 mt-2">
              <span className="font-medium text-slate-700">Reason:</span> {payload.reason}
            </p>
          )}
        </div>

        {currentStatus === 'confirmed' && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-2 text-emerald-800 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Candidate successfully updated to <strong>{payload.newStatus}</strong>!
            </span>
          </div>
        )}

        {/* Action Buttons */}
        {isPending && (
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isBusy}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isBusy}
              className="inline-flex items-center px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded-lg shadow-sm transition"
            >
              {isBusy ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Advance to {payload.newStatus}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </CardWrapper>
  );
};
