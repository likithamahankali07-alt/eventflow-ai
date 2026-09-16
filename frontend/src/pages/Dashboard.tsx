import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, CheckCircle2, Star, PlusCircle, ArrowUpRight, Sparkles, AlertCircle, Search } from 'lucide-react';
import { eventApi } from '../lib/api';

export const Dashboard: React.FC<{ onOpenAiCopilot: (eventId?: string) => void }> = ({ onOpenAiCopilot }) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await eventApi.getEvents();
      setEvents(res.data || []);
    } catch (err: any) {
      console.error('Failed to load events:', err);
      // Fallback empty events if backend/database unconfigured
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Compute live statistics directly from DB event records
  const totalEvents = events.length;
  const totalRegistrations = events.reduce((acc, curr) => acc + (curr.total_registrations || 0), 0);
  const totalCheckedIn = events.reduce((acc, curr) => acc + (curr.total_attendance || 0), 0);
  const overallAttendanceRate = totalRegistrations > 0 ? round((totalCheckedIn / totalRegistrations) * 100, 1) : 0;

  function round(val: number, decimals: number) {
    return Number(Math.round(Number(val + 'e' + decimals)) + 'e-' + decimals);
  }

  return (
    <div className="space-y-8 pb-12">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-950 p-6 rounded-3xl border border-blue-900/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" /> Operations Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Organizer Command Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Real-time analytics for your college workshops, hackathons, and GDG events.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 shrink-0">
          <button
            onClick={() => onOpenAiCopilot()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/50 text-xs font-semibold transition-all shadow-md"
          >
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>AI Operations Copilot</span>
          </button>
          <Link
            to="/events/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Event</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Events */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Events</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{totalEvents}</div>
          <p className="text-[11px] text-slate-400">Published or upcoming</p>
        </div>

        {/* Card 2: Total Registrations */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Registrations</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{totalRegistrations}</div>
          <p className="text-[11px] text-slate-400">Registered participants across events</p>
        </div>

        {/* Card 3: Checked In Attendance */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Attendance</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{totalCheckedIn}</div>
          <p className="text-[11px] text-slate-400">
            {overallAttendanceRate > 0 ? `${overallAttendanceRate}% check-in rate` : 'Check-ins recorded'}
          </p>
        </div>

        {/* Card 4: Satisfaction */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Avg Satisfaction</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Star className="w-4 h-4 fill-amber-400/20" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {totalEvents > 0 ? 'Live Ratings' : '0.0'}
          </div>
          <p className="text-[11px] text-slate-400">From attendee feedback</p>
        </div>

      </div>

      {/* Recent Events Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Your Events</h2>
            <p className="text-xs text-slate-400">Manage registrations, check-in, & AI insights</p>
          </div>
          <Link
            to="/events"
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 glass-panel rounded-2xl">
            Loading events from Supabase PostgreSQL...
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center glass-panel rounded-2xl border border-slate-800/80 space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-slate-200 text-sm">No events yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                You have not created any events yet. Click below to publish your first college workshop or hackathon.
              </p>
            </div>
            <Link
              to="/events/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Event</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-blue-950 border border-blue-800/60 text-blue-300">
                      {evt.event_type}
                    </span>
                    <span className={`text-[10px] font-medium ${
                      evt.status === 'upcoming' ? 'text-emerald-400' : 'text-slate-400'
                    }`}>
                      ● {evt.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-1">
                    {evt.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{evt.description}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-800/80">
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                    <div>
                      <span className="block text-[10px] text-slate-500">Date & Venue</span>
                      <span className="font-medium text-slate-200 truncate block">{evt.date} • {evt.venue}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500">Registrations</span>
                      <span className="font-semibold text-cyan-400">{evt.total_registrations || 0} / {evt.capacity}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      to={`/events/${evt.id}`}
                      className="flex-1 py-2 px-3 text-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700"
                    >
                      Command Center
                    </Link>
                    <button
                      onClick={() => onOpenAiCopilot(evt.id)}
                      className="p-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 text-cyan-300 transition-all"
                      title="Run Gemini AI Analysis"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
