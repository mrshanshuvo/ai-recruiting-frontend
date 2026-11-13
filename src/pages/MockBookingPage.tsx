import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Clock, CheckCircle2, Building, User, Mail, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../api/client';

interface BookingData {
  candidate: {
    id: string;
    fullName: string;
    email: string;
    currentTitle?: string;
  };
  job: {
    id: string;
    title: string;
    company: string;
    seniority?: string;
    location?: string;
  };
  currentSlot: string | null;
  availableSlots: string[];
}

export const MockBookingPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<BookingData | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBooking() {
      if (!token) return;
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/booking/${token}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || 'Invalid or expired booking link');
        }
        const json = await res.json();
        setData(json);
        if (json.currentSlot) {
          setSelectedSlot(json.currentSlot);
          setConfirmed(true);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load booking details');
      } finally {
        setLoading(false);
      }
    }
    fetchBooking();
  }, [token]);

  const handleSelectSlot = async (slot: string) => {
    if (!token || submitting) return;
    try {
      setSubmitting(true);
      setSelectedSlot(slot);
      const res = await fetch(`${API_BASE_URL}/api/booking/${token}/slot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot }),
      });
      if (!res.ok) {
        throw new Error('Failed to confirm meeting slot');
      }
      setConfirmed(true);
    } catch (err: any) {
      alert(err.message || 'Error booking slot');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex items-center space-x-3 text-slate-500 text-sm">
          <Clock className="w-5 h-5 animate-spin text-indigo-600" />
          <span>Loading available time slots...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800 mb-1">Booking Link Unavailable</h2>
          <p className="text-sm text-slate-500 mb-4">{error || 'This invitation is invalid or has expired.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-8 text-white">
          <div className="flex items-center space-x-2 text-indigo-100 text-xs font-semibold uppercase tracking-wider mb-2">
            <Building className="w-4 h-4" />
            <span>{data.job.company}</span>
          </div>
          <h1 className="text-2xl font-bold">{data.job.title}</h1>
          <p className="text-indigo-100 text-sm mt-1">15-Minute Introductory Conversation</p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{data.candidate.fullName}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <Mail className="w-3 h-3" />
                  {data.candidate.email}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                Invitation Active
              </span>
            </div>
          </div>

          {confirmed && selectedSlot ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-emerald-900 mb-1">Meeting Confirmed!</h3>
              <p className="text-sm text-emerald-700 mb-4">
                You are scheduled for: <span className="font-semibold">{selectedSlot}</span>
              </p>
              <div className="bg-white rounded-lg p-3 text-xs text-slate-600 border border-emerald-100 inline-block text-left">
                <p className="font-semibold text-slate-700 mb-1">Calendar Invitation Details:</p>
                <p>&bull; Video Link: <span className="text-indigo-600">meet.google.com/aironauts-interview</span></p>
                <p>&bull; Host: Aironauts Technical Recruiting Team</p>
                <p>&bull; Attendee: {data.candidate.email}</p>
              </div>
              <p className="text-xs text-emerald-600 mt-4">
                A calendar invitation with dial-in details has been sent to your email.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  Select an Available Time Slot
                </h2>
                <span className="text-xs text-slate-400">All times UTC</span>
              </div>

              <div className="space-y-2.5">
                {data.availableSlots.map((slot) => (
                  <button
                    key={slot}
                    disabled={submitting}
                    onClick={() => handleSelectSlot(slot)}
                    className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/50 hover:text-indigo-700 font-medium text-sm text-slate-700 transition flex items-center justify-between group disabled:opacity-50"
                  >
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                      {slot}
                    </span>
                    <span className="text-xs text-indigo-600 font-semibold opacity-0 group-hover:opacity-100 transition">
                      Confirm &rarr;
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 text-center text-xs text-slate-400">
          Powered by Aironauts AI Recruiting Co-Worker &bull; Autonomous Recruitment Platform
        </div>
      </div>
    </div>
  );
};

