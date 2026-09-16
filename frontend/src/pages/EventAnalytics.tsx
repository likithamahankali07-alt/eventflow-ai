import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BarChart2, Users, CheckCircle2, Star, Sparkles, ArrowLeft, RefreshCw, AlertCircle, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { eventApi, registrationApi, feedbackApi } from '../lib/api';

export const EventAnalytics: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();

  const [event, setEvent] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [feedbackSummary, setFeedbackSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eventId) {
      loadData();
    }
  }, [eventId]);

  const loadData = async () => {
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
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-xs text-slate-400 glass-panel rounded-2xl">
        Calculating Event Intelligence Metrics...
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

  const stats = event.stats || {
    total_registrations: 0,
    checked_in: 0,
    attendance_rate: 0,
    feedback_responses: 0,
    average_rating: 0,
    certificates_issued: 0,
  };

  // Compute branch breakdown from participants
  const branchCounts: Record<string, number> = {};
  participants.forEach((p) => {
    const b = p.branch || 'Unknown';
    branchCounts[b] = (branchCounts[b] || 0) + 1;
  });

  const branchData = Object.entries(branchCounts).map(([name, value]) => ({
    name,
    participants: value,
  }));

  // Rating category data
  const feedbackData = feedbackSummary?.averages
    ? [
        { category: 'Overall', score: feedbackSummary.averages.overall },
        { category: 'Content', score: feedbackSummary.averages.content },
        { category: 'Speaker', score: feedbackSummary.averages.speaker },
        { category: 'Organization', score: feedbackSummary.averages.organization },
        { category: 'Hands-on', score: feedbackSummary.averages.hands_on },
      ]
    : [];

  // Grounded AI Insight Generation
  const insights = [];
  if (stats.total_registrations >= 5 && stats.attendance_rate < 50) {
    insights.push({
      title: 'Low Attendance Check-in Pacing',
      observation: 'Attendance rate is currently below 50% threshold.',
      evidence: `Only ${stats.checked_in} of ${stats.total_registrations} registered participants have checked in (${stats.attendance_rate}% check-in rate).`,
      recommendedAction: 'Issue an automated check-in reminder to registered absentees.',
    });
  }

  if (feedbackSummary && feedbackSummary.total_responses >= 3 && feedbackSummary.averages.overall >= 4.0) {
    insights.push({
      title: 'High Participant Satisfaction',
      observation: 'Attendee satisfaction is exceptionally strong across categories.',
      evidence: `Average overall rating is ${feedbackSummary.averages.overall} / 5.0 across ${feedbackSummary.total_responses} feedback submissions.`,
      recommendedAction: 'Generate digital certificates of participation for attended attendees.',
    });
  }

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={`/events/${event.id}`}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-white">Event Intelligence & Analytics</h1>
            <p className="text-xs text-slate-400">{event.name}</p>
          </div>
        </div>

        <button
          onClick={loadData}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Total Registrations</span>
          <div className="text-2xl font-bold text-white">{stats.total_registrations} / {event.capacity}</div>
          <p className="text-[11px] text-slate-500">{event.capacity - stats.total_registrations} spots left</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Attendance Check-in</span>
          <div className="text-2xl font-bold text-white">{stats.checked_in}</div>
          <p className="text-[11px] text-emerald-400">{stats.attendance_rate}% check-in rate</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Feedback Count</span>
          <div className="text-2xl font-bold text-white">{stats.feedback_responses}</div>
          <p className="text-[11px] text-amber-400">Avg {stats.average_rating} rating</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Certificates Issued</span>
          <div className="text-2xl font-bold text-white">{stats.certificates_issued}</div>
          <p className="text-[11px] text-indigo-400">Verified credentials</p>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Branch Demographics Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-cyan-400" /> Department Breakdown
          </h3>

          {branchData.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No participant data recorded yet.</div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                  <Bar dataKey="participants" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Feedback Category Scores */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-amber-400" /> Feedback Ratings
          </h3>

          {feedbackData.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No feedback submissions received yet.</div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={feedbackData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="category" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} domain={[0, 5]} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                  <Bar dataKey="score" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

      {/* Grounded AI Insights Section */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" /> Grounded AI Intelligence Insights
        </h3>

        {insights.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-xl">
            Insufficient event activity data to generate grounded operational insights. Once more registrations, check-ins, or feedback are recorded, AI analysis will generate automatically.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((ins, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                <div className="font-bold text-cyan-300">{ins.title}</div>
                <div className="space-y-1 font-mono text-[11px] text-slate-300">
                  <div><strong className="text-slate-400">OBSERVATION:</strong> {ins.observation}</div>
                  <div><strong className="text-slate-400">EVIDENCE:</strong> {ins.evidence}</div>
                  <div><strong className="text-slate-400">RECOMMENDED ACTION:</strong> {ins.recommendedAction}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
