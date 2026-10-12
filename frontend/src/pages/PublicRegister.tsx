import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { 
  Calendar, MapPin, Users, Ticket, CheckCircle2, AlertCircle, 
  Sparkles, Building2, User, Mail, Phone, Briefcase, 
  Search, MessageSquare, Send, X, Clock, HelpCircle
} from 'lucide-react';
import { eventApi, registrationApi, aiAgentApi } from '../lib/api';

export const PublicRegister: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const refSource = searchParams.get('ref') || '';

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Core Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // Professional / General Fields
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');

  // Student Fields
  const [college, setCollege] = useState('');
  const [branch, setBranch] = useState('Computer Science');
  const [year, setYear] = useState('3rd Year');
  const [studentId, setStudentId] = useState('');

  // Custom Answers State
  const [customAnswers, setCustomAnswers] = useState<Record<string, any>>({});

  const [submitting, setSubmitting] = useState(false);
  const [ticketResult, setTicketResult] = useState<any>(null);

  // Ticket Lookup Modal State
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [lookupResult, setLookupResult] = useState<any>(null);

  // Attendee Q&A Assistant State
  const [qaOpen, setQaOpen] = useState(false);
  const [qaQuery, setQaQuery] = useState('');
  const [qaLoading, setQaLoading] = useState(false);
  const [qaAnswer, setQaAnswer] = useState<string | null>(null);

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

  const handleCustomAnswerChange = (questionId: string, val: any) => {
    setCustomAnswers(prev => ({ ...prev, [questionId]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      if (!eventId) return;

      const isStudent = event?.audience_type === 'student';

      const payload: any = {
        name,
        email,
        phone,
        referral_source: refSource || undefined,
        custom_answers: Object.keys(customAnswers).length > 0 ? customAnswers : undefined,
      };

      if (isStudent) {
        payload.college = college;
        payload.branch = branch;
        payload.year = year;
        payload.student_id = studentId;
      } else {
        payload.company = company;
        payload.role = role;
        // Also fallback college if database schema has NOT NULL
        payload.college = company || 'Individual';
      }

      const res = await registrationApi.registerParticipant(eventId, payload);
      setTicketResult(res.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Registration failed. Please check your information and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLookupTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupEmail.trim() || !eventId) return;
    setLookupError('');
    setLookupLoading(true);
    try {
      const res = await registrationApi.lookupTicket(eventId, lookupEmail.trim());
      setLookupResult(res.data);
    } catch (err: any) {
      setLookupError(err.response?.data?.detail || 'No registration found for this email address.');
      setLookupResult(null);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleAskAssistant = async (queryText?: string) => {
    const q = queryText || qaQuery;
    if (!q.trim() || !eventId) return;
    setQaLoading(true);
    setQaAnswer(null);
    try {
      const res = await aiAgentApi.askAttendeeAssistant(eventId, q.trim());
      setQaAnswer(res.data?.answer || 'I could not find an answer. Please check with the organizer.');
      if (!queryText) setQaQuery('');
    } catch (err: any) {
      setQaAnswer('Unable to fetch answer at this moment. Please check the event details above.');
    } finally {
      setQaLoading(false);
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

  const isStudentAudience = event?.audience_type === 'student';
  const customQuestions: any[] = event?.custom_questions || [];

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl space-y-6">
        
        {/* Referral Badge if present */}
        {refSource && (
          <div className="p-2.5 rounded-xl bg-blue-950/50 border border-blue-800/80 text-blue-300 text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Special Invite via <span className="capitalize font-semibold text-white">{refSource}</span>
            </span>
            <span className="text-[10px] text-blue-400 font-mono">TRACKED</span>
          </div>
        )}

        {/* Event Header Banner */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-blue-950 border border-blue-800 text-blue-300">
                {event.event_type.replace('_', ' ')}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300">
                {isStudentAudience ? 'Student Event' : 'General & Professional'}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{event.name}</h1>
            <p className="text-xs text-slate-400 whitespace-pre-line">{event.description}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>{event.start_time} - {event.end_time}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>{event.spots_remaining} spots left</span>
            </div>
            <div className="col-span-2 sm:col-span-3 flex items-center gap-2 pt-1">
              <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span className="truncate">{event.venue}</span>
            </div>
          </div>

          {/* Quick Action: Find Existing Ticket */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Already registered?</span>
            <button
              type="button"
              onClick={() => {
                setShowLookupModal(true);
                setLookupResult(null);
                setLookupError('');
              }}
              className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Find My Ticket</span>
            </button>
          </div>
        </div>

        {/* Attendee AI Assistant Card */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
          <div 
            onClick={() => setQaOpen(!qaOpen)}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-600/10 text-blue-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-white">Have questions about this event?</span>
                <p className="text-[11px] text-slate-400">Ask the EventFlow Attendee Assistant instantly</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-blue-400">{qaOpen ? 'Close' : 'Ask AI'}</span>
          </div>

          {qaOpen && (
            <div className="pt-3 border-t border-slate-800 space-y-3">
              {/* Prompt Pills */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  'What is the schedule?',
                  'Where is the venue located?',
                  'What should I bring?',
                ].map((pill) => (
                  <button
                    key={pill}
                    type="button"
                    onClick={() => handleAskAssistant(pill)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white hover:border-blue-500 transition-colors"
                  >
                    {pill}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Is there parking available? Who can attend?"
                  value={qaQuery}
                  onChange={(e) => setQaQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskAssistant()}
                  className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  disabled={qaLoading || !qaQuery.trim()}
                  onClick={() => handleAskAssistant()}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{qaLoading ? '...' : 'Ask'}</span>
                </button>
              </div>

              {qaAnswer && (
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-blue-500/30 text-xs text-slate-200 space-y-1.5">
                  <div className="text-[10px] uppercase font-bold text-blue-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Event Assistant Response
                  </div>
                  <p className="leading-relaxed whitespace-pre-line">{qaAnswer}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Success Ticket View */}
        {ticketResult ? (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-emerald-500/40 space-y-6 text-center shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">Registration Confirmed!</h2>
              <p className="text-xs text-slate-400">{ticketResult.message || 'You are registered for this event.'}</p>
            </div>

            {/* Ticket Card */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-left space-y-3 font-mono">
              <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-2">
                <span className="text-slate-400">Registration Token</span>
                <span className="text-cyan-400 font-bold text-base">{ticketResult.registration_token}</span>
              </div>
              <div className="text-xs space-y-1 text-slate-300">
                <div>Event: {ticketResult.event_name || event.name}</div>
                <div>Attendee: {name}</div>
                {company && <div>Org: {company} {role && `(${role})`}</div>}
                {college && <div>Institution: {college}</div>}
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Save or screenshot this token. Show it at event check-in to confirm attendance.
            </p>
          </div>
        ) : (
          /* Registration Form */
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-blue-400">Attendee Registration</h2>
              <span className="text-xs text-slate-500">Free Admission</span>
            </div>

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
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jordan Lee"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jordan@example.com"
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
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 019-2831"
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Audience Fields */}
              {isStudentAudience ? (
                /* Student Fields */
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">College / University *</label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        placeholder="e.g. Stanford University, MIT, State College"
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">Major / Branch *</label>
                      <input
                        type="text"
                        required
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">Academic Year *</label>
                      <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
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
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">Student ID</label>
                      <input
                        type="text"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="Optional"
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* Professional / General Fields */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Company / Organization *</label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="e.g. Google, Stripe, Freelancer, Student"
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Role / Designation *</label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="e.g. Software Engineer, Designer, Founder"
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Questions */}
              {customQuestions.length > 0 && (
                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <h3 className="text-xs font-semibold text-slate-300">Additional Information</h3>
                  {customQuestions.map((q) => (
                    <div key={q.id}>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        {q.label} {q.required && <span className="text-rose-400">*</span>}
                      </label>
                      {q.type === 'select' ? (
                        <select
                          required={q.required}
                          value={customAnswers[q.id] || ''}
                          onChange={(e) => handleCustomAnswerChange(q.id, e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                        >
                          <option value="">Select an option</option>
                          {q.options?.map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : q.type === 'checkbox' ? (
                        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(customAnswers[q.id])}
                            onChange={(e) => handleCustomAnswerChange(q.id, e.target.checked)}
                            className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                          />
                          <span>Confirm</span>
                        </label>
                      ) : (
                        <input
                          type="text"
                          required={q.required}
                          value={customAnswers[q.id] || ''}
                          onChange={(e) => handleCustomAnswerChange(q.id, e.target.value)}
                          placeholder="Your answer"
                          className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

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

        {/* Ticket Lookup Modal */}
        {showLookupModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-md glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-bold text-white">Find Your Registered Ticket</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLookupModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Enter the email address you used during registration to recover your unique ticket token and check-in pass.
              </p>

              {lookupError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                  {lookupError}
                </div>
              )}

              <form onSubmit={handleLookupTicket} className="space-y-3">
                <input
                  type="email"
                  required
                  placeholder="Enter your registration email"
                  value={lookupEmail}
                  onChange={(e) => setLookupEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />

                <button
                  type="submit"
                  disabled={lookupLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {lookupLoading ? 'Searching Database...' : 'Recover Ticket'}
                </button>
              </form>

              {lookupResult && (
                <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 text-xs space-y-2 font-mono">
                  <div className="flex justify-between items-center text-emerald-400 font-bold border-b border-slate-800 pb-1.5">
                    <span>STATUS: {lookupResult.registration_status.toUpperCase()}</span>
                    <span>TICKET FOUND</span>
                  </div>
                  <div className="text-slate-300">Attendee: {lookupResult.participant_name}</div>
                  <div className="text-slate-300">Email: {lookupResult.participant_email}</div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-center">
                    <span className="text-slate-400 text-[10px] block">CHECK-IN TOKEN</span>
                    <span className="text-cyan-400 font-bold text-base tracking-wider">{lookupResult.registration_token}</span>
                  </div>
                  {lookupResult.attendance_status === 'present' && (
                    <div className="text-[11px] text-emerald-400 text-center">
                      ✓ Already Checked In at this event
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
