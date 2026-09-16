import React from 'react';
import { AlertTriangle, BellRing, Users, UserX, Star, Sparkles, Send, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface ProactiveMonitorProps {
  stats: {
    total_registrations: number;
    capacity: number;
    checked_in: number;
    attendance_rate: number;
    feedback_responses: number;
    average_rating: number;
  };
  onSendReminder: () => void;
  onViewParticipants: () => void;
}

export const ProactiveMonitor: React.FC<ProactiveMonitorProps> = ({
  stats,
  onSendReminder,
  onViewParticipants,
}) => {
  const alerts = [];

  // Alert Condition 1: High Absentee Count
  const absentees = max(0, stats.total_registrations - stats.checked_in);
  if (stats.total_registrations >= 5 && absentees >= 3) {
    alerts.push({
      id: 'high-absentee',
      type: 'warning',
      title: 'High Absentee Alert',
      evidence: `${stats.total_registrations} registered, ${stats.checked_in} checked in, ${absentees} have not checked in.`,
      recommendedAction: 'Send an attendance check-in reminder to registered absentees.',
      hasAction: true,
      actionLabel: 'Send Attendance Reminder',
      onAction: onSendReminder,
    });
  }

  // Alert Condition 2: Event Approaching Capacity
  const capacityUsage = stats.capacity > 0 ? (stats.total_registrations / stats.capacity) * 100 : 0;
  if (capacityUsage >= 80) {
    alerts.push({
      id: 'capacity-warning',
      type: 'info',
      title: 'Event Approaching Max Capacity',
      evidence: `${stats.total_registrations} of ${stats.capacity} seats filled (${round(capacityUsage, 1)}% capacity).`,
      recommendedAction: 'Review participant list or consider expanding seating venue.',
      hasAction: true,
      actionLabel: 'View Participants',
      onAction: onViewParticipants,
    });
  }

  // Alert Condition 3: Low Feedback Rating
  if (stats.feedback_responses >= 3 && stats.average_rating > 0 && stats.average_rating <= 3.5) {
    alerts.push({
      id: 'low-rating',
      type: 'danger',
      title: 'Low Feedback Rating Alert',
      evidence: `Average overall rating is ${stats.average_rating} / 5.0 across ${stats.feedback_responses} feedback submissions.`,
      recommendedAction: 'Analyze attendee feedback comments for specific areas of improvement.',
      hasAction: false,
    });
  }

  function max(a: number, b: number) {
    return a > b ? a : b;
  }
  function round(val: number, decimals: number) {
    return Number(Math.round(Number(val + 'e' + decimals)) + 'e-' + decimals);
  }

  if (alerts.length === 0) {
    return (
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <BellRing className="w-4 h-4 text-emerald-400" />
          <span>Proactive Monitor: Operations normal. Zero operational anomalies detected.</span>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded-full">
          STATUS OK
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
          <BellRing className="w-4 h-4" /> Proactive Agent Operational Alerts ({alerts.length})
        </h3>
        <span className="text-[10px] text-slate-400 font-mono">Live DB Monitoring</span>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`glass-panel p-4 rounded-2xl border text-xs space-y-3 transition-all ${
              alert.type === 'warning'
                ? 'border-amber-500/40 bg-amber-950/20 text-amber-200'
                : alert.type === 'danger'
                ? 'border-rose-500/40 bg-rose-950/20 text-rose-200'
                : 'border-blue-500/40 bg-blue-950/20 text-blue-200'
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{alert.title}</span>
              </div>
            </div>

            <div className="space-y-1 text-slate-300 text-[11px] font-mono p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <div><strong className="text-slate-400">EVIDENCE:</strong> {alert.evidence}</div>
              <div><strong className="text-slate-400">RECOMMENDED ACTION:</strong> {alert.recommendedAction}</div>
            </div>

            {alert.hasAction && (
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={alert.onAction}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{alert.actionLabel}</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
