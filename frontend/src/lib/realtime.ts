import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeState = 'LIVE' | 'RECONNECTING' | 'DISCONNECTED';

export function useRealtimeSubscription(
  table: string,
  eventId: string | undefined,
  onPayload: (payload: any) => void
) {
  const [connectionStatus, setConnectionStatus] = useState<RealtimeState>('DISCONNECTED');

  useEffect(() => {
    if (!eventId) {
      setConnectionStatus('DISCONNECTED');
      return;
    }

    setConnectionStatus('RECONNECTING');

    const channelName = `realtime-${table}-${eventId}`;
    const channel: RealtimeChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          onPayload(payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('LIVE');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnectionStatus('DISCONNECTED');
        } else if (status === 'CLOSED') {
          setConnectionStatus('DISCONNECTED');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, eventId]);

  return connectionStatus;
}
