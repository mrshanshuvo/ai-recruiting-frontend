import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Users,
  MessageSquare,
  ArrowRight,
  MapPin,
  DollarSign,
  Building2,
  Calendar,
  Loader2,
} from 'lucide-react';
import { API_BASE_URL } from '../api/client';

interface Job {
  _id: string;
  title: string;
  department?: string;
  location?: string;
  remotePolicy?: string;
  seniority?: string;
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  status: string;
  conversationId?: string;
  createdAt?: string;
}

export const JobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadJobs() {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/jobs`);
        const data = await res.json();
        if (data.success && data.jobs) {
          setJobs(data.jobs);
        }
      } catch (err) {
        console.error('Failed to load jobs:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadJobs();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            Recruiting Jobs Overview
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Active roles managed by the autonomous recruiting co-worker
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
          Create / Discuss in Chat
        </Link>
      </div>

      {isLoading ? (
        <div className="p-16 text-center text-slate-500 flex items-center justify-center space-x-2 text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          <span>Loading recruiting jobs...</span>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center max-w-xl mx-auto space-y-3">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
            <Briefcase className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Jobs Found</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Start by pasting a job description or sending a JD link in the recruiter chat. The AI will extract the parameters and create a confirmed job.
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition"
            >
              Go to Recruiter Chat
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job) => (
            <div
              key={job._id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between p-5 space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                    {job.title}
                  </h3>
                  <span
                    className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      job.status === 'OPEN'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {job.status}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{job.department || 'Engineering'} &bull; {job.seniority || 'Mid/Senior'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{job.location || 'Remote'} ({job.remotePolicy || 'Remote'})</span>
                  </div>
                  {job.salaryRange?.min && (
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        ${job.salaryRange.min.toLocaleString()} - ${job.salaryRange.max?.toLocaleString()}{' '}
                        {job.salaryRange.currency || 'USD'}
                      </span>
                    </div>
                  )}
                  {job.createdAt && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Created {new Date(job.createdAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/jobs/${job._id}`)}
                  className="inline-flex items-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition"
                >
                  <Users className="w-3.5 h-3.5 mr-1 text-slate-600" />
                  Dashboard & Pipeline
                </button>
                {job.conversationId && (
                  <Link
                    to={`/chat/${job.conversationId}`}
                    className="inline-flex items-center px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5 mr-1" />
                    Chat
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
