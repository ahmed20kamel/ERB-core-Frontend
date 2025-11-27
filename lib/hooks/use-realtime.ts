import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/auth-store';

interface RealtimeEvent {
  type: string;
  event_type: string;
  model_type: string;
  action: 'created' | 'updated' | 'deleted';
  data: any;
  timestamp?: string;
}

export function useRealtimeUpdates() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const isConnectingRef = useRef(false);
  const shouldReconnectRef = useRef(true);

  useEffect(() => {
    if (!user?.id) return;

    const connect = () => {
      if (isConnectingRef.current || (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING)) {
        return;
      }

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        return;
      }

      // Close existing connection
      if (wsRef.current) {
        try {
          wsRef.current.close(1000, 'Reconnecting');
        } catch (e) {
          // Ignore
        }
        wsRef.current = null;
      }

      isConnectingRef.current = true;

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9000/api';
      const apiHost = apiUrl.replace('/api', '').replace('http://', '').replace('https://', '');
      let wsHost = process.env.NEXT_PUBLIC_WS_URL || `${wsProtocol}//${apiHost}`;
      
      // Remove trailing /ws if present to avoid /ws/ws/ duplication
      wsHost = wsHost.replace(/\/ws\/?$/, '');
      
      const wsUrl = `${wsHost}/ws/notifications/${user.id}/`;

      try {
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('[Realtime] ✅ Connected');
          isConnectingRef.current = false;
          reconnectAttempts.current = 0;
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            
            // Handle real-time updates
            if (message.type === 'realtime_update' && message.event) {
              const realtimeEvent: RealtimeEvent = message.event;
              handleRealtimeEvent(realtimeEvent);
            }
          } catch (error) {
            console.error('[Realtime] Error parsing message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('[Realtime] WebSocket error:', error);
          isConnectingRef.current = false;
        };

        ws.onclose = (event) => {
          console.log('[Realtime] Disconnected', { code: event.code });
          isConnectingRef.current = false;

          if (event.code === 1000 || !shouldReconnectRef.current) {
            return;
          }

          if (shouldReconnectRef.current && reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current += 1;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              if (shouldReconnectRef.current) {
                connect();
              }
            }, delay);
          }
        };

        wsRef.current = ws;
      } catch (error) {
        console.error('[Realtime] Failed to create connection:', error);
        isConnectingRef.current = false;
      }
    };

    const handleRealtimeEvent = (event: RealtimeEvent) => {
      console.log('[Realtime] Event received:', event.event_type, event.action);

      // Invalidate relevant queries based on event type
      switch (event.event_type) {
        case 'purchase_request':
          // Invalidate purchase requests queries
          queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
          // If we have the specific item, update it
          if (event.action === 'updated' || event.action === 'created') {
            queryClient.setQueryData(['purchase-requests', event.data.id], event.data);
          }
          break;

        case 'quotation_request':
          queryClient.invalidateQueries({ queryKey: ['quotation-requests'] });
          if (event.action === 'updated' || event.action === 'created') {
            queryClient.setQueryData(['quotation-requests', event.data.id], event.data);
          }
          break;

        case 'purchase_quotation':
          queryClient.invalidateQueries({ queryKey: ['purchase-quotations'] });
          // Also invalidate purchase requests as they might show quotation info
          queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
          if (event.action === 'updated' || event.action === 'created') {
            queryClient.setQueryData(['purchase-quotations', event.data.id], event.data);
          }
          break;

        case 'purchase_order':
          queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
          queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
          if (event.action === 'updated' || event.action === 'created') {
            queryClient.setQueryData(['purchase-orders', event.data.id], event.data);
          }
          break;

        case 'product':
          queryClient.invalidateQueries({ queryKey: ['products'] });
          if (event.action === 'deleted') {
            queryClient.removeQueries({ queryKey: ['products', event.data.id] });
          } else if (event.action === 'updated' || event.action === 'created') {
            queryClient.setQueryData(['products', event.data.id], event.data);
          }
          break;

        case 'supplier':
          queryClient.invalidateQueries({ queryKey: ['suppliers'] });
          if (event.action === 'deleted') {
            queryClient.removeQueries({ queryKey: ['suppliers', event.data.id] });
          } else if (event.action === 'updated' || event.action === 'created') {
            queryClient.setQueryData(['suppliers', event.data.id], event.data);
          }
          break;
      }
    };

    // Small delay before connecting
    const connectTimeout = setTimeout(() => {
      if (shouldReconnectRef.current) {
        connect();
      }
    }, 500);

    return () => {
      shouldReconnectRef.current = false;
      
      if (connectTimeout) {
        clearTimeout(connectTimeout);
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (wsRef.current) {
        try {
          wsRef.current.close(1000, 'Component unmounting');
        } catch (e) {
          // Ignore
        }
        wsRef.current = null;
      }
      
      isConnectingRef.current = false;
    };
  }, [user?.id, queryClient]);
}

