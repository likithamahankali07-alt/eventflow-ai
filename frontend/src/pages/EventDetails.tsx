import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar, MapPin, Users, CheckCircle2, Star, Sparkles, Copy, ExternalLink,
  QrCode, Award, MessageSquare, Activity, Search, ShieldCheck, RefreshCw, AlertCircle, BarChart2, FileText
} from 'lucide-react';
import { eventApi, registrationApi, attendanceApi, feedbackApi, certificateApi } from '../lib/api';
import { ProactiveMonitor } from '../components/ProactiveMonitor';
import { RealtimeStatusBadge } from '../components/RealtimeStatusBadge';
import { useRealtimeSubscription } from '../lib/realtime';

export const EventDetails: React.FC<{ onOpenAiCopilot: (eventId: string, eventName: string) => void }> = ({
  onOpenAiCopilot,
}) => {
  const { eventId } = useParams<{ eventId: string }>();

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'checkin' | 'feedback' | 'certificates'>('overview');

  // Realtime subscription for attendance table
  const realtimeStatus = useRealtimeSubscription('attendance', eventId, () => {
    loadEventData();
  });

  // Participants Tab State
  const [participants, setParticipants] = useState<any[]>([]);
  const [partSearch, setPartSearch] = useState('');
  const [partFilter, setPartFilter] = useState('all');

  // Check-in Tab State
  const [checkInToken, setCheckInToken] = useState('');
  const [checkInResult, setCheckInResult] = useState<any>(null);
  const [checkInLoading, setCheckInLoading] = useState(false);

  // Feedback Tab State
  const [feedbackSummary, setFeedbackSummary] = useState<any>(null);

  // Copy Feedback State
  const [copiedLink, setCopiedLink] = useState('');

  useEffect(() => {
    if (eventId) {
      loadEventData();
    }
  }, [eventId]);

  const loadEventData = async () => {
    setLoading(true);
    try {
      if (!eventId) return;
      const res = await eventApi.getEventDetails(eventId);
      setEvent(res.data);

      fetchParticipants();
      fetchFeedback();
    } catch (err) {
      console.error('Error loading event data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    if (!eventId) return;
    try {
      const res = await registrationApi.getParticipants(eventId, partSearch, partFilter === 'all' ? undefined : partFilter);
      setParticipants(res.data || []);
    } catch (err) {
      console.error('Error fetching participants:', err);
    }
  };

  const fetchFeedback = async () => {
    if (!eventId) return;
    try {
      const res = await feedbackApi.getSummary(eventId);
      setFeedbackSummary(res.data);
    } catch (err) {
      console.error('Error fetching feedback:', err);
    }
  };

  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInToken.trim() || !eventId) return;
    setCheckInLoading(true);
    setCheckInResult(null);

    try {
      const res = await attendanceApi.checkIn(eventId, checkInToken.trim());
      setCheckInResult({ success: true, data: res.data });
      setCheckInToken('');
      fetchParticipants();
      loadEventData();
    } catch (err: any) {
      setCheckInResult({
        success: false,
        error: err.response?.data?.detail || 'Check-in failed. Please verify registration token.',
      });
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleGenerateCertificates = async () => {
    if (!eventId) return;
    try {
      const res = await certificateApi.generateCertificates(eventId);
      alert(res.data.message);
      fetchParticipants();
      loadEventData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error generating certificates');
    }
  };

  const copyToClipboard = (url: string, type: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(type);
    setTimeout(() => setCopiedLink(''), 2000);
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-xs text-slate-400 glass-panel rounded-2xl">
        Loading Event Command Center...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-16 text-center glass-panel rounded-2xl space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
        <h2 className="text-base font-bold text-white">Event Not Found</h2>
        <Link to="/events" className="text-xs font-semibold text-blue-400">Return to Events</Link>
      </div>
    );
  }

  const publicRegisterUrl = `${window.location.origin}/register/${event.id}`;
  const publicFeedbackUrl = `${window.location.origin}/feedback/${event.id}`;

  const stats = event.stats || {
    total_registrations: 0,
    spots_remaining: event.capacity,
    checked_in: 0,
    attendance_rate: 0,
    feedback_responses: 0,
    average_rating: 0,
    certificates_issued: 0,
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Event Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase bg-blue-950 border border-blue-800 text-blue-300">
                {event.event_type}
              </span>
              <span className="text-xs text-emerald-400 font-medium">● {event.status}</span>
              <RealtimeStatusBadge status={realtimeStatus} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{event.name}</h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">{event.description}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/events/${event.id}/attendance`}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-300 hover:bg-cyan-900 text-xs font-semibold transition-all"
            >
              <QrCode className="w-4 h-4" />
              <span>QR Scanner</span>
            </Link>

            <Link
              to={`/events/${event.id}/analytics`}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-950 border border-blue-800 text-blue-300 hover:bg-blue-900 text-xs font-semibold transition-all"
            >
              <BarChart2 className="w-4 h-4" />
              <span>Analytics</span>
            </Link>

            <Link
              to={`/events/${event.id}/report`}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>Report</span>
            </Link>

            <button
              onClick={() => onOpenAiCopilot(event.id, event.name)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all shrink-0"
            >
              <Sparkles className="w-4 h-4 text-cyan-200 animate-pulse" />
              <span>AI Copilot</span>
            </button>
          </div>
        </div>

        {/* Info Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>{event.date} ({event.start_time} - {event.end_time})</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span className="truncate">{event.venue}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Capacity: {stats.total_registrations} / {event.capacity} seats</span>
          </div>
        </div>
      </div>

      {/* Proactive Agent Event Monitor */}
      <ProactiveMonitor
        stats={{ ...stats, capacity: event.capacity }}
        onSendReminder={() => onOpenAiCopilot(event.id, event.name)}
        onViewParticipants={() => setActiveTab('participants')}
      />

      {/* Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto p-1 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-semibold no-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'overview' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('participants');
            fetchParticipants();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'participants' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Participants ({participants.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('checkin')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'checkin' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Check-in Scanner</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('feedback');
            fetchFeedback();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'feedback' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Feedback & Ratings</span>
        </button>

        <button
          onClick={() => setActiveTab('certificates')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'certificates' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Certificates</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">Total Registrations</span>
              <div className="text-2xl font-bold text-white">{stats.total_registrations}</div>
              <p className="text-[11px] text-slate-500">{stats.spots_remaining} remaining spots</p>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">Attendance Check-in</span>
              <div className="text-2xl font-bold text-white">{stats.checked_in}</div>
              <p className="text-[11px] text-emerald-400">{stats.attendance_rate}% check-in rate</p>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">Feedback Submissions</span>
              <div className="text-2xl font-bold text-white">{stats.feedback_responses}</div>
              <p className="text-[11px] text-amber-400">Avg {stats.average_rating} / 5.0 rating</p>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">Certificates Issued</span>
              <div className="text-2xl font-bold text-white">{stats.certificates_issued}</div>
              <p className="text-[11px] text-indigo-400">Verified digital credentials</p>
            </div>
          </div>

          {/* Shareable Public Portals */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white">Public Links & Shareable Portals</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div>
                  <h4 className="text-xs font-semibold text-blue-400">Public Registration Page</h4>
                  <p className="text-[11px] text-slate-400">Share with attendees to register</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={publicRegisterUrl}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-300"
                  />
                  <button
                    onClick={() => copyToClipboard(publicRegisterUrl, 'register')}
                    className="p-2 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 text-xs font-semibold flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedLink === 'register' ? 'Copied!' : 'Copy'}</span>
                  </button>
                  <a
                    href={publicRegisterUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div>
                  <h4 className="text-xs font-semibold text-emerald-400">Public Feedback Page</h4>
                  <p className="text-[11px] text-slate-400">Display QR code or link at end of workshop</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={publicFeedbackUrl}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-300"
                  />
                  <button
                    onClick={() => copyToClipboard(publicFeedbackUrl, 'feedback')}
                    className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 text-xs font-semibold flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedLink === 'feedback' ? 'Copied!' : 'Copy'}</span>
                  </button>
                  <a
                    href={publicFeedbackUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PARTICIPANTS */}
      {activeTab === 'participants' && (
        <div className="space-y-4">
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={partSearch}
                onChange={(e) => setPartSearch(e.target.value)}
                placeholder="Search participant by name, email, college, token..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={fetchParticipants}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh List</span>
            </button>
          </div>

          {participants.length === 0 ? (
            <div className="p-12 text-center glass-panel rounded-2xl text-xs text-slate-400 space-y-2">
              <p>No participants registered yet for this event.</p>
              <p className="text-[11px] text-slate-500">Share the public registration link to accept signups.</p>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl border border-slate-800 overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Participant</th>
                    <th className="p-3.5">College & Branch</th>
                    <th className="p-3.5">Token</th>
                    <th className="p-3.5">Attendance</th>
                    <th className="p-3.5">Certificate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {participants.map((p) => (
                    <tr key={p.registration_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-100">{p.name}</div>
                        <div className="text-[11px] text-slate-400">{p.email}</div>
                      </td>
                      <td className="p-3.5">
                        <div>{p.college}</div>
                        <div className="text-[11px] text-slate-400">{p.branch} • Year {p.year}</div>
                      </td>
                      <td className="p-3.5 font-mono text-cyan-400 font-semibold">{p.registration_token}</td>
                      <td className="p-3.5">
                        {p.is_checked_in ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-950 border border-emerald-800 text-emerald-300">
                            Present
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {p.has_certificate ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-indigo-950 border border-indigo-800 text-indigo-300 font-mono">
                            {p.certificate_id}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">Not issued</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CHECK-IN SCANNER */}
      {activeTab === 'checkin' && (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-cyan-400" />
                Rapid Participant Check-in
              </h3>
              <p className="text-xs text-slate-400">
                Enter registration token (e.g. EVT-XXXX) or participant ID to record attendance in real-time.
              </p>
            </div>

            <form onSubmit={handleCheckInSubmit} className="space-y-3">
              <input
                type="text"
                value={checkInToken}
                onChange={(e) => setCheckInToken(e.target.value)}
                placeholder="Scan or enter token (e.g. EVT-A1B2C3D4)..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />

              <button
                type="submit"
                disabled={checkInLoading || !checkInToken.trim()}
                className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all shadow-md"
              >
                {checkInLoading ? 'Checking in...' : 'Record Check-in'}
              </button>
            </form>

            {checkInResult && (
              <div
                className={`p-4 rounded-xl border text-xs space-y-2 ${
                  checkInResult.success
                    ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
                    : 'bg-rose-950/60 border-rose-800 text-rose-200'
                }`}
              >
                <div className="font-bold">
                  {checkInResult.success ? checkInResult.data.message : 'Check-in Error'}
                </div>
                {checkInResult.success && checkInResult.data.participant && (
                  <div className="text-[11px] text-slate-300 space-y-1">
                    <div>Name: {checkInResult.data.participant.name}</div>
                    <div>College: {checkInResult.data.participant.college}</div>
                  </div>
                )}
                {!checkInResult.success && <div>{checkInResult.error}</div>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: FEEDBACK & RATINGS */}
      {activeTab === 'feedback' && (
        <div className="space-y-6">
          {feedbackSummary && feedbackSummary.total_responses > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center">
                <div className="glass-panel p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase">Overall</span>
                  <div className="text-xl font-bold text-amber-400">{feedbackSummary.averages.overall} / 5</div>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase">Content Quality</span>
                  <div className="text-xl font-bold text-blue-400">{feedbackSummary.averages.content} / 5</div>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase">Speaker</span>
                  <div className="text-xl font-bold text-cyan-400">{feedbackSummary.averages.speaker} / 5</div>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase">Organization</span>
                  <div className="text-xl font-bold text-emerald-400">{feedbackSummary.averages.organization} / 5</div>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase">Hands-on</span>
                  <div className="text-xl font-bold text-indigo-400">{feedbackSummary.averages.hands_on} / 5</div>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white">Attendee Feedback Responses</h3>
                <div className="space-y-3">
                  {feedbackSummary.responses.map((f: any) => (
                    <div key={f.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-amber-400">Overall Rating: {f.overall_rating}/5</span>
                        <span className="text-[10px] text-slate-500">{new Date(f.submitted_at).toLocaleDateString()}</span>
                      </div>
                      {f.liked && <p className="text-slate-300">👍 <span className="text-slate-400">Liked:</span> {f.liked}</p>}
                      {f.improvement && <p className="text-slate-300">💡 <span className="text-slate-400">Improvement:</span> {f.improvement}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center glass-panel rounded-2xl text-xs text-slate-400">
              No feedback received yet. Share the public feedback link with attendees at the end of the event.
            </div>
          )}
        </div>
      )}

      {/* TAB 5: CERTIFICATES */}
      {activeTab === 'certificates' && (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 text-center">
            <Award className="w-10 h-10 text-indigo-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Automated Certificate Generator</h3>
            <p className="text-xs text-slate-400">
              Generate digital verification certificates for all participants who checked in to the event.
            </p>

            <button
              onClick={handleGenerateCertificates}
              className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/20 transition-all"
            >
              Generate Certificates for Checked-In Attendees
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
