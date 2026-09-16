import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QrCode, Search, CheckCircle2, AlertCircle, ArrowLeft, Camera, RefreshCw, UserCheck } from 'lucide-react';
import { eventApi, attendanceApi } from '../lib/api';
import { RealtimeStatusBadge } from '../components/RealtimeStatusBadge';
import { useRealtimeSubscription } from '../lib/realtime';

export const QRAttendance: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();

  const [event, setEvent] = useState<any>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  // Realtime subscription for attendance table
  const realtimeStatus = useRealtimeSubscription('attendance', eventId, (payload) => {
    console.log('Realtime attendance payload received:', payload);
  });

  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  const loadEvent = async () => {
    setLoading(true);
    try {
      if (!eventId) return;
      const res = await eventApi.getEventDetails(eventId);
      setEvent(res.data);
    } catch (err) {
      console.error('Failed to load event details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessCheckIn = async (tokenOrId: string) => {
    if (!tokenOrId.trim() || !eventId || submitting) return;
    setSubmitting(true);
    setScanResult(null);

    try {
      const res = await attendanceApi.checkIn(eventId, tokenOrId.trim());
      setScanResult({
        success: true,
        data: res.data,
      });
      setTokenInput('');
      loadEvent();
    } catch (err: any) {
      setScanResult({
        success: false,
        error: err.response?.data?.detail || 'Check-in failed. Registration token not found.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-xs text-slate-400 glass-panel rounded-2xl">
        Loading QR Attendance Console...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={`/events/${eventId}`}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-white">QR Attendance Scanner</h1>
            <p className="text-xs text-slate-400">{event?.name || 'Event Attendance Operations'}</p>
          </div>
        </div>

        <RealtimeStatusBadge status={realtimeStatus} />
      </div>

      {/* Main Scanner Console */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
        
        {/* Camera Simulator / Visual Target Frame */}
        <div className="relative aspect-video rounded-2xl bg-slate-950 border-2 border-dashed border-slate-800 flex flex-col items-center justify-center space-y-3 overflow-hidden">
          <div className="w-20 h-20 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 animate-pulse">
            <Camera className="w-10 h-10" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-xs font-semibold text-slate-300">Device Camera Scanner Active</p>
            <p className="text-[11px] text-slate-500">Position participant ticket QR code in frame or use manual lookup</p>
          </div>
        </div>

        {/* Manual Token Search Fallback */}
        <div className="space-y-3 pt-2">
          <label className="block text-xs font-medium text-slate-300">Manual Registration Token Search</label>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleProcessCheckIn(tokenInput);
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Enter token (e.g. EVT-A1B2C3D4)..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !tokenInput.trim()}
              className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              <span>{submitting ? 'Verifying...' : 'Check In'}</span>
            </button>
          </form>
        </div>

        {/* Result Message */}
        {scanResult && (
          <div
            className={`p-5 rounded-2xl border text-xs space-y-3 animate-in fade-in duration-200 ${
              scanResult.success
                ? 'bg-emerald-950/70 border-emerald-800 text-emerald-200'
                : 'bg-rose-950/70 border-rose-800 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              {scanResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
              <span>{scanResult.success ? scanResult.data.message : 'Check-in Error'}</span>
            </div>

            {scanResult.success && scanResult.data.participant && (
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1 text-slate-300 font-mono">
                <div>Name: {scanResult.data.participant.name}</div>
                <div>College: {scanResult.data.participant.college}</div>
                <div>Check-in Time: {new Date(scanResult.data.check_in_time).toLocaleTimeString()}</div>
              </div>
            )}

            {!scanResult.success && <div>{scanResult.error}</div>}
          </div>
        )}

      </div>

    </div>
  );
};
