import React, { useState } from 'react';
import { Check, X, Edit2, Loader2, DollarSign, MapPin, Briefcase } from 'lucide-react';
import { CardWrapper } from './CardWrapper';
import { CardStatus } from '../../types/chat';
import { confirmAction, cancelAction, patchActionPayload } from '../../api/client';

interface JobConfirmationCardProps {
  actionId?: string;
  status: CardStatus;
  payload: Record<string, any>;
  onConfirmed?: () => void;
}

export const JobConfirmationCard: React.FC<JobConfirmationCardProps> = ({
  actionId,
  status,
  payload,
}) => {
  const [formData, setFormData] = useState({
    title: payload.title || '',
    seniority: payload.seniority || '',
    location: payload.location || '',
    remotePolicy: payload.remotePolicy || 'Remote',
    mustHaveSkills: Array.isArray(payload.mustHaveSkills) ? payload.mustHaveSkills : [],
    niceToHaveSkills: Array.isArray(payload.niceToHaveSkills) ? payload.niceToHaveSkills : [],
    salaryMin: payload.salaryRange?.min ?? '',
    salaryMax: payload.salaryRange?.max ?? '',
    salaryCurrency: payload.salaryRange?.currency || 'USD',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPending = status === 'pending';

  const triggerAutosave = async (newFormData: typeof formData) => {
    if (!actionId || !isPending) return;
    try {
      const editedPayload = {
        title: newFormData.title,
        seniority: newFormData.seniority || undefined,
        location: newFormData.location || undefined,
        remotePolicy: newFormData.remotePolicy,
        mustHaveSkills: newFormData.mustHaveSkills,
        niceToHaveSkills: newFormData.niceToHaveSkills,
        salaryRange:
          newFormData.salaryMin || newFormData.salaryMax
            ? {
                min: Number(newFormData.salaryMin) || undefined,
                max: Number(newFormData.salaryMax) || undefined,
                currency: newFormData.salaryCurrency,
              }
            : undefined,
      };
      await patchActionPayload(actionId, editedPayload);
    } catch (err) {
      console.error('[JobConfirmationCard] Autosave failed:', err);
    }
  };

  const handleConfirm = async () => {
    if (!actionId || !isPending || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const effectivePayload = {
        title: formData.title,
        seniority: formData.seniority || undefined,
        location: formData.location || undefined,
        remotePolicy: formData.remotePolicy,
        mustHaveSkills: formData.mustHaveSkills,
        niceToHaveSkills: formData.niceToHaveSkills,
        salaryRange:
          formData.salaryMin || formData.salaryMax
            ? {
                min: Number(formData.salaryMin) || undefined,
                max: Number(formData.salaryMax) || undefined,
                currency: formData.salaryCurrency,
              }
            : undefined,
      };
      await confirmAction(actionId, effectivePayload);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Confirmation failed');
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
      setErrorMessage(err instanceof Error ? err.message : 'Cancellation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CardWrapper title="Job Creation Proposal" status={status}>
      {errorMessage && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
          {errorMessage}
        </div>
      )}

      {/* Role Title */}
      <div className="mb-4">
        {isEditing && isPending ? (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Job Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => {
                const updated = { ...formData, title: e.target.value };
                setFormData(updated);
                triggerAutosave(updated);
              }}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-semibold focus:outline-none focus:border-indigo-500"
            />
          </div>
        ) : (
          <h4 className="text-base font-bold text-slate-800">{formData.title || 'Untitled Role'}</h4>
        )}
      </div>

      {/* Meta tags: Location, Policy, Seniority */}
      <div className="flex flex-wrap gap-2 mb-4">
        {isEditing && isPending ? (
          <>
            <div className="w-1/3">
              <label className="block text-xs text-slate-500 mb-1">Seniority</label>
              <input
                type="text"
                value={formData.seniority}
                onChange={(e) => {
                  const updated = { ...formData, seniority: e.target.value };
                  setFormData(updated);
                  triggerAutosave(updated);
                }}
                className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
              />
            </div>
            <div className="w-1/3">
              <label className="block text-xs text-slate-500 mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => {
                  const updated = { ...formData, location: e.target.value };
                  setFormData(updated);
                  triggerAutosave(updated);
                }}
                className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
              />
            </div>
            <div className="w-1/4">
              <label className="block text-xs text-slate-500 mb-1">Policy</label>
              <select
                value={formData.remotePolicy}
                onChange={(e) => {
                  const updated = { ...formData, remotePolicy: e.target.value };
                  setFormData(updated);
                  triggerAutosave(updated);
                }}
                className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
              >
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
            </div>
          </>
        ) : (
          <>
            {formData.seniority && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                <Briefcase className="w-3 h-3 mr-1" />
                {formData.seniority}
              </span>
            )}
            {formData.location && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                <MapPin className="w-3 h-3 mr-1" />
                {formData.location}
              </span>
            )}
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
              {formData.remotePolicy}
            </span>
          </>
        )}
      </div>

      {/* Must-Have Skills */}
      <div className="mb-3">
        <span className="text-xs font-medium text-slate-500 block mb-1">Must-Have Skills:</span>
        {isEditing && isPending ? (
          <input
            type="text"
            value={formData.mustHaveSkills.join(', ')}
            placeholder="Comma-separated skills e.g. React, TypeScript"
            onChange={(e) => {
              const skills = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
              const updated = { ...formData, mustHaveSkills: skills };
              setFormData(updated);
              triggerAutosave(updated);
            }}
            className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
          />
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {formData.mustHaveSkills.length > 0 ? (
              formData.mustHaveSkills.map((skill: string, i: number) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-medium"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">None specified</span>
            )}
          </div>
        )}
      </div>

      {/* Nice-To-Have Skills */}
      <div className="mb-4">
        <span className="text-xs font-medium text-slate-500 block mb-1">Nice-To-Have Skills:</span>
        {isEditing && isPending ? (
          <input
            type="text"
            value={formData.niceToHaveSkills.join(', ')}
            placeholder="Comma-separated skills e.g. GraphQL, Next.js"
            onChange={(e) => {
              const skills = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
              const updated = { ...formData, niceToHaveSkills: skills };
              setFormData(updated);
              triggerAutosave(updated);
            }}
            className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
          />
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {formData.niceToHaveSkills.length > 0 ? (
              formData.niceToHaveSkills.map((skill: string, i: number) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-xs"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">None specified</span>
            )}
          </div>
        )}
      </div>

      {/* Salary Range */}
      <div className="mb-5 p-3 bg-slate-50 rounded-lg flex items-center justify-between text-xs text-slate-700">
        <div className="flex items-center space-x-1.5">
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <span className="font-medium">Compensation:</span>
        </div>
        {isEditing && isPending ? (
          <div className="flex items-center space-x-1">
            <input
              type="number"
              placeholder="Min"
              value={formData.salaryMin}
              onChange={(e) => {
                const updated = { ...formData, salaryMin: e.target.value };
                setFormData(updated);
                triggerAutosave(updated);
              }}
              className="w-20 px-1 py-0.5 border border-slate-300 rounded text-xs"
            />
            <span>-</span>
            <input
              type="number"
              placeholder="Max"
              value={formData.salaryMax}
              onChange={(e) => {
                const updated = { ...formData, salaryMax: e.target.value };
                setFormData(updated);
                triggerAutosave(updated);
              }}
              className="w-20 px-1 py-0.5 border border-slate-300 rounded text-xs"
            />
            <span>USD</span>
          </div>
        ) : (
          <span className="font-semibold text-slate-900">
            {formData.salaryMin && formData.salaryMax
              ? `$${Number(formData.salaryMin).toLocaleString()} - $${Number(formData.salaryMax).toLocaleString()} ${formData.salaryCurrency}`
              : 'Not specified'}
          </span>
        )}
      </div>

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
            {isEditing ? 'Done Editing' : 'Edit Details'}
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
              disabled={isSubmitting || !formData.title.trim()}
              className="inline-flex items-center px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded-lg shadow-sm transition"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Confirm Job
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </CardWrapper>
  );
};

