import React, { useState, useRef } from 'react';
import { Check, Loader2, AlertCircle, Users, Sparkles, Clock, Send } from 'lucide-react';
import { CardWrapper } from './CardWrapper';
import { CardStatus } from '../../types/chat';
import { confirmAction, cancelAction, patchActionPayload } from '../../api/client';

export interface CampaignStepData {
  stepIndex: number;
  delayDays: number;
  label?: string;
  subject: string;
  bodyTemplate: string;
}

interface CampaignPreviewCardProps {
  actionId?: string;
  status: CardStatus;
  payload: {
    jobId: string;
    jobTitle: string;
    name?: string;
    recipientCount: number;
    candidateIds?: string[];
    candidateNames?: string[];
    steps: CampaignStepData[];
    sampleCandidate?: {
      fullName?: string;
      currentTitle?: string;
      currentCompany?: string;
    };
  };
}

export const CampaignPreviewCard: React.FC<CampaignPreviewCardProps> = ({
  actionId,
  status: initialStatus,
  payload,
}) => {
  const [status, setStatus] = useState<CardStatus>(initialStatus);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [steps, setSteps] = useState<CampaignStepData[]>(payload.steps || []);
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const isPending = status === 'pending';
  const activeStep = steps[activeStepIndex] || steps[0] || {
    stepIndex: 0,
    delayDays: 0,
    label: 'Initial Outreach',
    subject: '',
    bodyTemplate: '',
  };

  const sampleCand = payload.sampleCandidate || {
    fullName: (payload.candidateNames && payload.candidateNames[0]) || 'Alex Rivera',
    currentTitle: 'Senior Software Engineer',
    currentCompany: 'Tech Corp',
  };

  // Debounced autosave per DEC-17
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleStepFieldChange = (field: 'subject' | 'bodyTemplate', value: string) => {
    if (!isPending) return;

    const updatedSteps = steps.map((s, idx) =>
      idx === activeStepIndex ? { ...s, [field]: value } : s
    );
    setSteps(updatedSteps);

    if (!actionId) return;

    setSaveStatus('saving');
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(async () => {
      try {
        await patchActionPayload(actionId, {
          ...payload,
          steps: updatedSteps,
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err: any) {
        console.error('[CampaignPreviewCard] Autosave failed:', err);
        setSaveStatus('idle');
      }
    }, 600);
  };

  // Confirm campaign per DEC-21 ("Approve & Send")
  const handleApproveAndSend = async () => {
    if (!actionId || !isPending) return;
    setIsConfirming(true);
    setErrorMessage(null);

    try {
      const res = await confirmAction(actionId, {
        ...payload,
        steps,
      });
      if (res.success) {
        setStatus('confirmed');
      }
    } catch (err: any) {
      console.error('[CampaignPreviewCard] Confirm error:', err);
      setErrorMessage(err.message || 'Failed to approve and launch campaign');
    } finally {
      setIsConfirming(false);
    }
  };

  // Cancel campaign proposal
  const handleCancel = async () => {
    if (!actionId || !isPending) return;
    setIsCancelling(true);
    setErrorMessage(null);

    try {
      const res = await cancelAction(actionId, 'Recruiter cancelled outreach proposal');
      if (res.success) {
        setStatus('cancelled');
      }
    } catch (err: any) {
      console.error('[CampaignPreviewCard] Cancel error:', err);
      setErrorMessage(err.message || 'Failed to cancel outreach proposal');
    } finally {
      setIsCancelling(false);
    }
  };

  // Render preview interpolation
  const getRenderedPreview = (text: string) => {
    const firstName = sampleCand.fullName?.split(' ')[0] || sampleCand.fullName || 'Candidate';
    return text
      .replace(/\{\{candidateName\}\}/g, sampleCand.fullName || 'Candidate')
      .replace(/\{\{firstName\}\}/g, firstName)
      .replace(/\{\{jobTitle\}\}/g, payload.jobTitle || 'Role')
      .replace(/\{\{companyName\}\}/g, sampleCand.currentCompany || 'your team')
      .replace(/\{\{currentTitle\}\}/g, sampleCand.currentTitle || 'Engineer');
  };

  return (
    <CardWrapper
      title={`Outreach Campaign: ${payload.jobTitle || 'Campaign'}`}
      status={status}
    >
      <div className="space-y-4 text-xs">
        {/* Recipient summary banner */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100 text-indigo-900">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold">
              {payload.recipientCount} Accepted candidate{payload.recipientCount === 1 ? '' : 's'} enrolled
            </span>
          </div>
          <div className="flex items-center gap-2">
            {saveStatus === 'saving' && (
              <span className="text-[11px] text-slate-500 animate-pulse">Saving edits...</span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-[11px] text-emerald-600 font-medium">Autosaved</span>
            )}
            <button
              type="button"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white text-indigo-700 font-medium border border-indigo-200 hover:bg-indigo-50 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              {isPreviewMode ? 'Edit Template' : 'Sample Preview'}
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="flex items-center p-2.5 bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
            <AlertCircle className="w-4 h-4 mr-1.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Step Tabs */}
        <div className="flex border-b border-slate-200 gap-1">
          {steps.map((s, idx) => (
            <button
              key={s.stepIndex}
              type="button"
              onClick={() => setActiveStepIndex(idx)}
              className={`px-3 py-2 font-medium border-b-2 transition -mb-px flex items-center gap-1.5 ${
                activeStepIndex === idx
                  ? 'border-indigo-600 text-indigo-700 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Clock className="w-3 h-3 text-slate-400" />
              {s.label || `Step ${idx + 1} (${s.delayDays === 0 ? 'Day 0' : `Day ${s.delayDays}`})`}
            </button>
          ))}
        </div>

        {/* Editor or Preview Pane */}
        {!isPreviewMode ? (
          <div className="space-y-3 bg-white p-3 rounded-lg border border-slate-200">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Subject Line
              </label>
              <input
                type="text"
                disabled={!isPending}
                value={activeStep.subject}
                onChange={(e) => handleStepFieldChange('subject', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                placeholder="Email subject line..."
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Body Template (supports &#123;&#123;firstName&#125;&#125;, &#123;&#123;jobTitle&#125;&#125;, &#123;&#123;companyName&#125;&#125;)
              </label>
              <textarea
                rows={6}
                disabled={!isPending}
                value={activeStep.bodyTemplate}
                onChange={(e) => handleStepFieldChange('bodyTemplate', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed font-sans"
                placeholder="Email body template..."
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-500 font-medium">
              Sample preview for <span className="font-semibold text-slate-700">{sampleCand.fullName}</span> ({sampleCand.currentTitle} @ {sampleCand.currentCompany})
            </div>
            <div className="p-2.5 bg-white rounded border border-slate-200">
              <div className="font-semibold text-slate-800 mb-2 pb-1.5 border-b border-slate-100">
                Subject: {getRenderedPreview(activeStep.subject)}
              </div>
              <div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-sans">
                {getRenderedPreview(activeStep.bodyTemplate)}
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Footer */}
        {actionId && isPending && (
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              disabled={isConfirming || isCancelling}
              onClick={handleCancel}
              className="inline-flex items-center px-3 py-1.5 font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
              {isCancelling ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
              Cancel
            </button>
            <button
              type="button"
              disabled={isConfirming || isCancelling}
              onClick={handleApproveAndSend}
              className="inline-flex items-center px-4 py-1.5 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
            >
              {isConfirming ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5 mr-1.5" />
              )}
              Approve &amp; Send
            </button>
          </div>
        )}

        {status === 'confirmed' && (
          <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">
              Outreach sequence approved and launched! Initial emails dispatched in background.
            </span>
          </div>
        )}
      </div>
    </CardWrapper>
  );
};
