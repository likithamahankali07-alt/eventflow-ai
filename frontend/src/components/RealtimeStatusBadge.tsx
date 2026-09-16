import React from 'react';
import { RealtimeState } from '../lib/realtime';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export const RealtimeStatusBadge: React.FC<{ status: RealtimeState }> = ({ status }) => {
  if (status === 'LIVE') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 shadow-sm shadow-emerald-950">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <Wifi className="w-3 h-3 text-emerald-400" />
        <span>REALTIME: LIVE</span>
      </div>
    );
  }

  if (status === 'RECONNECTING') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-950/80 border border-amber-800/80 text-amber-300">
        <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
        <span>RECONNECTING...</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900 border border-slate-800 text-slate-400">
      <WifiOff className="w-3 h-3 text-slate-500" />
      <span>REALTIME: STANDBY</span>
    </div>
  );
};
