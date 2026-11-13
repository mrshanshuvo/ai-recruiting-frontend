import React, { useState } from 'react';
import { CardWrapper } from './CardWrapper';
import { Calendar, User, Link as LinkIcon, CheckCircle2, ExternalLink, Check, X, Loader2 } from 'lucide-react';
import { CardStatus } from '../../types/chat';
import { confirmAction, cancelAction } from '../../api/client';

interface BookingLinkCardProps {
  actionId?: string;
  status: CardStatus;
  payload: {
    candidateId: string;
    candidateName: string;
    candidateEmail?: string;
    jobTitle: string;
    bookingToken?: string;
    bookingUrl?: string;
  };
}

export const BookingLinkCard: React.FC<BookingLinkCardProps> = ({ actionId, status, payload }) => {
  const [currentStatus, setCurrentStatus] = useState<CardStatus>(status);
  const [isBusy, setIsBusy] = useState(false);
  const [result, setResult] = useState<any>(null);

  const isPending = currentStatus === 'pending';

  const handleConfirm = async () => {
    if (!actionId) return;
    setIsBusy(true);
    try {
      const data = await confirmAction(actionId);
      setCurrentStatus('confirmed');
      setResult(data.result);
    } catch (err: any) {
      alert(err.message || 'Failed to confirm action');
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

  const bookingUrl = result?.bookingUrl || payload.bookingUrl;

  return (
    <CardWrapper title="Send Meeting Booking Link" status={currentStatus}>
      <div className="space-y-4 text-sm">
        <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">{payload.candidateName}</p>
              <p className="text-xs text-slate-500">{payload.jobTitle}</p>
            </div>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
            <Calendar className="w-3 h-3 mr-1" /> 15m Chat
          </span>
        </div>

        {bookingUrl && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <LinkIcon className="w-3 h-3 text-slate-400" />
              Mock Booking URL
            </p>
            <a
              href={bookingUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 font-mono break-all"
            >
              {bookingUrl}
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>
        )}

        {currentStatus === 'confirmed' && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-2 text-emerald-800 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Booking invitation sent! Candidate status transitioned to <strong>Meeting booked</strong>.
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
                  Sending...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Send Booking Link
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </CardWrapper>
  );
};
