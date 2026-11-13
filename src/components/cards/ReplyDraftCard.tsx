import React, { useState } from 'react';
import { CardWrapper } from './CardWrapper';
import { MessageSquare, User, Check, X, Loader2, CheckCircle2, Edit2, ExternalLink } from 'lucide-react';
import { CardStatus } from '../../types/chat';
import { confirmAction, cancelAction, patchActionPayload } from '../../api/client';

interface ReplyDraftCardProps {
  actionId?: string;
  status: CardStatus;
  payload: {
    candidateId: string;
    candidateName: string;
    candidateEmail?: string;
    replyId?: string;
    replyClass: string;
    candidateMessage?: string;
    subject: string;
    body?: string;
    draftedBody?: string;
  };
}

export const ReplyDraftCard: React.FC<ReplyDraftCardProps> = ({ actionId, status, payload }) => {
  const [currentStatus, setCurrentStatus] = useState<CardStatus>(status);
  const [isBusy, setIsBusy] = useState(false);
  const [subject, setSubject] = useState(payload.subject || 'Re: Outreach from Aironauts Technologies');
  const [body, setBody] = useState(payload.body || payload.draftedBody || '');
  const [isEditing, setIsEditing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const isPending = currentStatus === 'pending';

  const triggerAutosave = async (newSubject: string, newBody: string) => {
    if (!actionId || !isPending) return;
    try {
      await patchActionPayload(actionId, {
        ...payload,
        subject: newSubject,
        body: newBody,
        draftedBody: newBody,
      });
    } catch (err) {
      console.error('[ReplyDraftCard] Autosave failed:', err);
    }
  };

  const handleSubjectChange = (val: string) => {
    setSubject(val);
    triggerAutosave(val, body);
  };

  const handleBodyChange = (val: string) => {
    setBody(val);
    triggerAutosave(subject, val);
  };

  const handleConfirm = async () => {
    if (!actionId) return;
    setIsBusy(true);
    try {
      const data = await confirmAction(actionId, {
        modifiedPayload: {
          ...payload,
          subject,
          body,
          draftedBody: body,
        },
      });
      setCurrentStatus('confirmed');
      setResult(data.result);
    } catch (err: any) {
      alert(err.message || 'Failed to send reply');
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
      alert(err.message || 'Failed to cancel reply draft');
    } finally {
      setIsBusy(false);
    }
  };

  const getClassBadge = (cls: string) => {
    switch (cls) {
      case 'Interested':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Wants a meeting':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'Question':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Not interested':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const previewUrl = result?.previewUrl;

  return (
    <CardWrapper title="Review Reply Draft" status={currentStatus}>
      <div className="space-y-4 text-sm">
        {/* Header Info */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">{payload.candidateName}</p>
              <p className="text-xs text-slate-500">{payload.candidateEmail || 'candidate@example.com'}</p>
            </div>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getClassBadge(payload.replyClass)}`}>
            {payload.replyClass}
          </span>
        </div>

        {/* Inbound Message Quote */}
        {payload.candidateMessage && (
          <div className="p-3 bg-slate-100/70 border-l-4 border-indigo-500 rounded-r-lg">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
              Candidate's Inbound Note
            </p>
            <p className="text-xs text-slate-700 italic">"{payload.candidateMessage}"</p>
          </div>
        )}

        {/* Draft Editor / Viewer */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Subject Line
            </label>
            {isPending && isEditing ? (
              <input
                type="text"
                value={subject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <div className="text-xs font-medium text-slate-800 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                {subject}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Response Body
            </label>
            {isPending && isEditing ? (
              <textarea
                rows={5}
                value={body}
                onChange={(e) => handleBodyChange(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-3 text-slate-800 font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 whitespace-pre-line">
                {body}
              </div>
            )}
          </div>
        </div>

        {/* Confirmed Notice */}
        {currentStatus === 'confirmed' && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1 text-emerald-800 text-xs">
            <div className="flex items-center space-x-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Reply sent to {payload.candidateEmail || payload.candidateName}!</span>
            </div>
            {previewUrl && (
              <p className="pl-6">
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:underline inline-flex items-center gap-1 font-mono text-[11px]"
                >
                  View live email in Ethereal Sandbox <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {isPending && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              disabled={isBusy}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              <Edit2 className="w-3.5 h-3.5 mr-1" />
              {isEditing ? 'Done Editing' : 'Edit Response'}
            </button>

            <div className="flex items-center space-x-2">
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
                disabled={isBusy || !body.trim()}
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
                    Approve & Send
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </CardWrapper>
  );
};
