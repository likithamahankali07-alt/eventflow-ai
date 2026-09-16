import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, Printer, ArrowLeft, Calendar, MapPin, Users, CheckCircle2, Star, ShieldCheck, Sparkles } from 'lucide-react';
import { eventApi, registrationApi, feedbackApi } from '../lib/api';

export const EventReport: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();

  const [event, setEvent] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [feedbackSummary, setFeedbackSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eventId) {
      loadReportData();
    }
  }, [eventId]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      if (!eventId) return;
      const [evtRes, partRes, fbRes] = await Promise.all([
        eventApi.getEventDetails(eventId),
        registrationApi.getParticipants(eventId),
        feedbackApi.getSummary(eventId),
      ]);

      setEvent(evtRes.data);
      setParticipants(partRes.data || []);
      setFeedbackSummary(fbRes.data);
    } catch (err) {
      console.error('Error loading report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-xs text-slate-400 glass-panel rounded-2xl">
        Generating Grounded Event Operational Report...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-16 text-center glass-panel rounded-2xl space-y-3">
        <FileText className="w-8 h-8 text-rose-400 mx-auto" />
        <h2 className="text-base font-bold text-white">Report Unavailable</h2>
        <Link to="/events" className="text-xs font-semibold text-blue-400">Return to Events</Link>
      </div>
    );
  }

  const stats = event.stats || {
    total_registrations: 0,
    checked_in: 0,
    attendance_rate: 0,
    feedback_responses: 0,
    average_rating: 0,
    certificates_issued: 0,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Action Header */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          to={`/events/${event.id}`}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Command Center</span>
        </Link>

        <button
          onClick={handlePrint}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          <span>Export / Print Report</span>
        </button>
      </div>

      {/* Report Document Sheet */}
      <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-slate-800 space-y-8 bg-slate-950 text-slate-100 shadow-2xl print:border-none print:shadow-none print:bg-white print:text-black">
        
        {/* Document Title Header */}
        <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Official Event Operations Executive Report
            </span>
            <h1 className="text-2xl font-extrabold text-white">{event.name}</h1>
            <p className="text-xs text-slate-400">Type: {event.event_type} • Status: {event.status}</p>
          </div>

          <div className="text-right text-xs text-slate-400 font-mono">
            <div>Generated: {new Date().toLocaleDateString()}</div>
            <div>Event ID: {event.id.slice(0, 8)}...</div>
          </div>
        </div>

        {/* Section 1: Event Schedule & Venue */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400">1. Schedule & Venue Parameters</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <div><strong className="text-slate-400">Date:</strong> {event.date}</div>
            <div><strong className="text-slate-400">Time:</strong> {event.start_time} - {event.end_time}</div>
            <div><strong className="text-slate-400">Venue:</strong> {event.venue}</div>
          </div>
        </div>

        {/* Section 2: Registration & Attendance Metrics */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400">2. Attendance & Capacity Metrics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase">Capacity</span>
              <div className="text-lg font-bold text-white">{event.capacity}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase">Registrations</span>
              <div className="text-lg font-bold text-cyan-400">{stats.total_registrations}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase">Checked In</span>
              <div className="text-lg font-bold text-emerald-400">{stats.checked_in}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase">Check-in Rate</span>
              <div className="text-lg font-bold text-indigo-400">{stats.attendance_rate}%</div>
            </div>
          </div>
        </div>

        {/* Section 3: Feedback & Rating Summary */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400">3. Feedback Analytics</h2>
          {feedbackSummary && feedbackSummary.total_responses > 0 ? (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                <div><span className="text-slate-400">Overall:</span> <strong>{feedbackSummary.averages.overall}/5</strong></div>
                <div><span className="text-slate-400">Content:</span> <strong>{feedbackSummary.averages.content}/5</strong></div>
                <div><span className="text-slate-400">Speaker:</span> <strong>{feedbackSummary.averages.speaker}/5</strong></div>
                <div><span className="text-slate-400">Org:</span> <strong>{feedbackSummary.averages.organization}/5</strong></div>
                <div><span className="text-slate-400">Hands-on:</span> <strong>{feedbackSummary.averages.hands_on}/5</strong></div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-500">
              Zero feedback responses recorded for this event.
            </div>
          )}
        </div>

        {/* Section 4: Certificates Issued */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400">4. Issued Digital Certificates</h2>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            Total verifiable digital credentials generated: <strong>{stats.certificates_issued}</strong>
          </div>
        </div>

        {/* Document Footer */}
        <div className="pt-6 border-t border-slate-800 text-center text-[10px] text-slate-500 font-mono">
          EventFlow AI 2.5 • Verifiable Database Report • Grounded Execution
        </div>

      </div>

    </div>
  );
};
