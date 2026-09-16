import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, MapPin, Users, Ticket, CheckCircle2, AlertCircle, Sparkles, Building2, User, Mail, Phone, GraduationCap } from 'lucide-react';
import { eventApi, registrationApi } from '../lib/api';

export const PublicRegister: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    college: '',
    branch: 'Computer Science',
    year: '3rd Year',
    student_id: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [ticketResult, setTicketResult] = useState<any>(null);

  useEffect(() => {
    if (eventId) {
      loadPublicEvent();
    }
  }, [eventId]);

  const loadPublicEvent = async () => {
    setLoading(true);
    try {
      if (!eventId) return;
      const res = await eventApi.getPublicEvent(eventId);
      setEvent(res.data);
    } catch (err: any) {
      setErrorMsg('Event not found or registration is currently closed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      if (!eventId) return;
      const res = await registrationApi.registerParticipant(eventId, formData);
      setTicketResult(res.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-2xl text-center text-xs text-slate-400">
          Loading Event Details...
        </div>
      </div>
    );
  }

  if (errorMsg && !event) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-2xl text-center max-w-md space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="text-base font-bold text-white">Registration Unavailable</h2>
          <p className="text-xs text-slate-400">{errorMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl space-y-6">
        
        {/* Event Header Banner */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-blue-950 border border-blue-800 text-blue-300">
              {event.event_type}
            </span>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{event.name}</h1>
            <p className="text-xs text-slate-400">{event.description}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span className="truncate">{event.venue}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>{event.spots_remaining} spots left</span>
            </div>
          </div>
        </div>

        {/* Success Ticket View */}
        {ticketResult ? (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-emerald-500/40 space-y-6 text-center shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">Registration Confirmed!</h2>
              <p className="text-xs text-slate-400">{ticketResult.message}</p>
            </div>

            {/* Ticket Card */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-left space-y-3 font-mono">
              <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-2">
                <span className="text-slate-400">Registration Token</span>
                <span className="text-cyan-400 font-bold text-sm">{ticketResult.registration_token}</span>
              </div>
              <div className="text-xs space-y-1 text-slate-300">
                <div>Event: {ticketResult.event_name}</div>
                <div>Attendee: {formData.name} ({formData.college})</div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Show this token at the event check-in counter to confirm your attendance.
            </p>
          </div>
        ) : (
          /* Registration Form */
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-blue-400">Attendee Registration Form</h2>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Jordan Lee"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Email *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="jordan@student.edu"
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Phone Number *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 555 0192"
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">College / Institution *</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={formData.college}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                    placeholder="Institute of Technology"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Branch / Dept *</label>
                  <input
                    type="text"
                    required
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Academic Year *</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Postgraduate">Postgraduate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Student ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    placeholder="e.g. ST-2026"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
              >
                <Ticket className="w-4 h-4" />
                <span>{submitting ? 'Registering...' : 'Confirm Registration & Get Ticket'}</span>
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
