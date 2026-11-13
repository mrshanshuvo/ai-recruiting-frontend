import React, { useState } from 'react';
import { Check, X, Edit2, Loader2, Search, Users, Sparkles } from 'lucide-react';
import { CardWrapper } from './CardWrapper';
import { CardStatus, SourcingProgress } from '../../types/chat';
import { confirmAction, cancelAction, patchActionPayload } from '../../api/client';

interface SourcingConfirmationCardProps {
  actionId?: string;
  status: CardStatus;
  payload: {
    jobId: string;
    jobTitle: string;
    targetCount: number;
    searchQueries: string[];
  };
  progress?: SourcingProgress;
}

export const SourcingConfirmationCard: React.FC<SourcingConfirmationCardProps> = ({
  actionId,
  status,
  payload,
  progress,
}) => {
  const [targetCount, setTargetCount] = useState<number>(payload.targetCount || 10);
  const [queries, setQueries] = useState<string[]>(
    Array.isArray(payload.searchQueries) && payload.searchQueries.length > 0
      ? payload.searchQueries
      : ['']
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPending = status === 'pending';
  const isInProgress = status === 'in_progress';
  const isConfirmed = status === 'confirmed';

  const triggerAutosave = async (newCount: number, newQueries: string[]) => {
    if (!actionId || !isPending) return;
    try {
      await patchActionPayload(actionId, {
        jobId: payload.jobId,
        jobTitle: payload.jobTitle,
        targetCount: newCount,
        searchQueries: newQueries.filter((q) => q.trim().length > 0),
      });
    } catch (err) {
      console.error('[SourcingConfirmationCard] Autosave failed:', err);
    }
  };

  const handleConfirm = async () => {
    if (!actionId || !isPending || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await confirmAction(actionId, {
        jobId: payload.jobId,
        jobTitle: payload.jobTitle,
        targetCount,
        searchQueries: queries.filter((q) => q.trim().length > 0),
      });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to confirm sourcing');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!actionId || !isPending || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await cancelAction(actionId);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to cancel');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQueryChange = (index: number, val: string) => {
    const updated = [...queries];
    updated[index] = val;
    setQueries(updated);
    triggerAutosave(targetCount, updated);
  };

  const handleAddQuery = () => {
    const updated = [...queries, ''];
    setQueries(updated);
    triggerAutosave(targetCount, updated);
  };

  const handleRemoveQuery = (index: number) => {
    if (queries.length <= 1) return;
    const updated = queries.filter((_, i) => i !== index);
    setQueries(updated);
    triggerAutosave(targetCount, updated);
  };

  // Progress metrics calculation
  const found = progress?.found ?? 0;
  const scored = progress?.scored ?? 0;
  const total = progress?.total ?? targetCount;
  const progressPercent = total > 0 ? Math.min(100, Math.round((scored / total) * 100)) : 0;

  return (
    <CardWrapper title="Candidate Sourcing Proposal" status={status}>
      {errorMessage && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
          {errorMessage}
        </div>
      )}

      {/* Target Job Title */}
      <div className="mb-4">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Target Job</span>
        <h4 className="text-base font-bold text-slate-900 mt-0.5">{payload.jobTitle || 'Recruitment Role'}</h4>
      </div>

      {/* Target Count */}
      <div className="mb-4 p-3 bg-slate-50 rounded-lg flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2 text-slate-700">
          <Users className="w-4 h-4 text-indigo-600" />
          <span className="font-semibold">Target Profiles to Source:</span>
        </div>
        {isEditing && isPending ? (
          <input
            type="number"
            min={1}
            max={50}
            value={targetCount}
            onChange={(e) => {
              const count = Math.max(1, Math.min(50, Number(e.target.value) || 1));
              setTargetCount(count);
              triggerAutosave(count, queries);
            }}
            className="w-20 px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-indigo-500 font-semibold"
          />
        ) : (
          <span className="font-bold text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-200">
            {targetCount} candidates
          </span>
        )}
      </div>

      {/* Search Queries */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span>Search Queries (Boolean):</span>
          </div>
          {isEditing && isPending && (
            <button
              type="button"
              onClick={handleAddQuery}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              + Add Query
            </button>
          )}
        </div>

        <div className="space-y-2">
          {queries.map((query, index) => (
            <div key={index} className="flex items-center space-x-2">
              {isEditing && isPending ? (
                <>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => handleQueryChange(index, e.target.value)}
                    className="flex-1 px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded focus:outline-none focus:border-indigo-500"
                    placeholder='e.g. "Software Engineer" AND "React"'
                  />
                  {queries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuery(index)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              ) : (
                <div className="w-full p-2 bg-slate-50 border border-slate-200 rounded font-mono text-xs text-slate-800 break-all">
                  {query || 'No query specified'}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Live Sourcing Progress Bar per Requirement B5 */}
      {(isInProgress || isConfirmed || found > 0) && (
        <div className="mb-4 p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg">
          <div className="flex items-center justify-between text-xs font-medium text-indigo-900 mb-1.5">
            <span className="flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
              Found {found} candidates, scored {scored} / {total}
            </span>
            <span className="font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full bg-indigo-200/60 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {isPending && (
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            disabled={isSubmitting}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1" />
            {isEditing ? 'Done Editing' : 'Edit Queries'}
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded-lg shadow-sm transition"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Confirm Sourcing
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </CardWrapper>
  );
};

